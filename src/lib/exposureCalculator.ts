import {
  StockExposure,
  ExposureSource,
  ETFProfile,
  PortfolioHolding,
  ExposureCalculationResult
} from "@/components/ui/data-table-exposure/types"

export class ExposureCalculator {
  private etfProfiles: Map<string, ETFProfile> = new Map()
  private stockPrices: Map<string, number> = new Map()

  async calculateExposures(holdings: PortfolioHolding[]): Promise<ExposureCalculationResult> {
    // Step 1: Fetch ETF profiles for all ETFs in portfolio
    await this.fetchETFProfiles(holdings)

    // Step 2: Extract stock prices from direct holdings
    this.extractStockPrices(holdings)

    // Step 3: Calculate exposures
    const exposureMap = new Map<string, StockExposure>()

    // Process direct stock holdings
    this.processDirectHoldings(holdings, exposureMap)

    // Process ETF holdings to calculate indirect exposure
    await this.processETFHoldings(holdings, exposureMap)

    // Step 4: Calculate total portfolio value and percentages
    const totalPortfolioValue = holdings.reduce((sum, h) => sum + h.marketValue, 0)

    // Step 5: Finalize exposures with percentages and create subrows
    const exposures = this.finalizeExposures(exposureMap, totalPortfolioValue)

    return {
      exposures,
      totalPortfolioValue,
      etfProfiles: this.etfProfiles,
      lastCalculated: new Date()
    }
  }

  private async fetchETFProfiles(holdings: PortfolioHolding[]): Promise<void> {
    const etfSymbols = holdings
      .filter(h => h.type === "fund" && h.ticker)
      .map(h => h.ticker as string)

    if (etfSymbols.length === 0) return

    try {
      const response = await fetch("/api/etf-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols: etfSymbols })
      })

      if (!response.ok) {
        throw new Error("Failed to fetch ETF profiles")
      }

      const profiles = await response.json()

      for (const symbol of etfSymbols) {
        const profile = profiles[symbol]
        if (profile && profile.holdings?.data) {
          this.etfProfiles.set(symbol, {
            symbol: profile.symbol,
            name: profile.name,
            holdings: profile.holdings.data.map((h: {
              symbol: string
              name: string
              weight: string
              shares?: string
            }) => ({
              symbol: h.symbol,
              name: h.name,
              weight: parseFloat(h.weight) || 0,
              shares: h.shares ? parseFloat(h.shares) : undefined
            })),
            lastUpdated: new Date()
          })
        }
      }
    } catch (error) {
      console.error("Error fetching ETF profiles:", error)
      // Continue with empty ETF profiles - will show only direct holdings
    }
  }

  private extractStockPrices(holdings: PortfolioHolding[]): void {
    holdings.forEach(holding => {
      if (holding.ticker && holding.type === "stock") {
        this.stockPrices.set(holding.ticker, holding.lastPrice)
      }
    })
  }

  private processDirectHoldings(
    holdings: PortfolioHolding[],
    exposureMap: Map<string, StockExposure>
  ): void {
    holdings
      .filter(h => h.type === "stock" && h.ticker)
      .forEach(holding => {
        const ticker = holding.ticker!
        const existing = exposureMap.get(ticker)

        if (existing) {
          // Aggregate multiple holdings of the same stock
          existing.directShares += holding.quantity
          existing.directValue += holding.marketValue
          existing.totalShares = existing.directShares + existing.etfExposure
          existing.totalValue = existing.directValue + existing.etfValue
        } else {
          exposureMap.set(ticker, {
            id: `stock-${ticker}`,
            ticker,
            name: holding.name,
            directShares: holding.quantity,
            etfExposure: 0,
            totalShares: holding.quantity,
            lastPrice: holding.lastPrice,
            directValue: holding.marketValue,
            etfValue: 0,
            totalValue: holding.marketValue,
            percentOfPortfolio: 0,
            exposureSources: []
          })
        }
      })
  }

  private async processETFHoldings(
    holdings: PortfolioHolding[],
    exposureMap: Map<string, StockExposure>
  ): Promise<void> {
    const etfHoldings = holdings.filter(h => h.type === "fund" && h.ticker)

    for (const etfHolding of etfHoldings) {
      const etfSymbol = etfHolding.ticker!
      const etfProfile = this.etfProfiles.get(etfSymbol)

      if (!etfProfile) continue

      const etfValue = etfHolding.marketValue

      // Process each stock within the ETF
      for (const stockInETF of etfProfile.holdings) {
        const stockSymbol = stockInETF.symbol
        const weightInETF = stockInETF.weight / 100 // Convert percentage to decimal

        // Calculate how much of this stock we own through the ETF
        const stockValueViaETF = etfValue * weightInETF

        // Get or estimate stock price
        let stockPrice = this.stockPrices.get(stockSymbol)
        if (!stockPrice) {
          // Estimate stock price if we don't have it
          // This is a simplification - in production you'd fetch real prices
          stockPrice = 100 // Default price
          this.stockPrices.set(stockSymbol, stockPrice)
        }

        const sharesViaETF = stockValueViaETF / stockPrice

        // Create exposure source
        const exposureSource: ExposureSource = {
          etfSymbol,
          etfName: etfProfile.name,
          sharesViaETF,
          percentOfETF: stockInETF.weight,
          valueViaETF: stockValueViaETF
        }

        // Update or create exposure
        const existing = exposureMap.get(stockSymbol)
        if (existing) {
          existing.etfExposure += sharesViaETF
          existing.etfValue += stockValueViaETF
          existing.totalShares = existing.directShares + existing.etfExposure
          existing.totalValue = existing.directValue + existing.etfValue
          existing.exposureSources.push(exposureSource)
        } else {
          exposureMap.set(stockSymbol, {
            id: `stock-${stockSymbol}`,
            ticker: stockSymbol,
            name: stockInETF.name,
            directShares: 0,
            etfExposure: sharesViaETF,
            totalShares: sharesViaETF,
            lastPrice: stockPrice,
            directValue: 0,
            etfValue: stockValueViaETF,
            totalValue: stockValueViaETF,
            percentOfPortfolio: 0,
            exposureSources: [exposureSource]
          })
        }
      }
    }
  }

  private finalizeExposures(
    exposureMap: Map<string, StockExposure>,
    totalPortfolioValue: number
  ): StockExposure[] {
    const exposures: StockExposure[] = []

    exposureMap.forEach(exposure => {
      // Calculate percentage of portfolio
      exposure.percentOfPortfolio = (exposure.totalValue / totalPortfolioValue) * 100

      // Create subrows for ETF breakdown if there are ETF sources
      if (exposure.exposureSources.length > 0) {
        exposure.subRows = exposure.exposureSources.map((source, index) => ({
          id: `${exposure.id}-etf-${index}`,
          ticker: source.etfSymbol,
          name: `via ${source.etfName}`,
          directShares: 0,
          etfExposure: source.sharesViaETF,
          totalShares: source.sharesViaETF,
          lastPrice: exposure.lastPrice,
          directValue: 0,
          etfValue: source.valueViaETF,
          totalValue: source.valueViaETF,
          percentOfPortfolio: (source.valueViaETF / totalPortfolioValue) * 100,
          exposureSources: [],
          isETFBreakdown: true
        }))

        // Add direct holding row if applicable
        if (exposure.directShares > 0) {
          exposure.subRows.unshift({
            id: `${exposure.id}-direct`,
            ticker: exposure.ticker,
            name: "Direct Holding",
            directShares: exposure.directShares,
            etfExposure: 0,
            totalShares: exposure.directShares,
            lastPrice: exposure.lastPrice,
            directValue: exposure.directValue,
            etfValue: 0,
            totalValue: exposure.directValue,
            percentOfPortfolio: (exposure.directValue / totalPortfolioValue) * 100,
            exposureSources: [],
            isETFBreakdown: true
          })
        }
      }

      exposures.push(exposure)
    })

    // Sort by total value descending
    return exposures.sort((a, b) => b.totalValue - a.totalValue)
  }

  // Helper method to fetch real stock prices (optional enhancement)
  async fetchStockPrices(_symbols: string[]): Promise<void> {
    // This would fetch real stock prices from an API
    // For now, we use prices from direct holdings or defaults
  }
}

export const exposureCalculator = new ExposureCalculator()