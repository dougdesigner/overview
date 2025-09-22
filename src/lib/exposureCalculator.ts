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
  private companyOverviews: Map<string, { sector: string; industry: string }> = new Map()

  async calculateExposures(holdings: PortfolioHolding[]): Promise<ExposureCalculationResult> {
    console.log("Starting exposure calculation with holdings:", holdings.length)

    // Step 1: Fetch ETF profiles for all ETFs in portfolio
    await this.fetchETFProfiles(holdings)
    console.log("ETF profiles fetched:", this.etfProfiles.size)

    // Step 2: Extract stock prices from direct holdings
    this.extractStockPrices(holdings)
    console.log("Stock prices extracted:", this.stockPrices.size)

    // Step 3: Fetch company overviews for sector/industry data
    await this.fetchCompanyOverviews(holdings)
    console.log("Company overviews fetched:", this.companyOverviews.size)

    // Step 4: Calculate exposures
    const exposureMap = new Map<string, StockExposure>()

    // Process direct stock holdings
    this.processDirectHoldings(holdings, exposureMap)

    // Process ETF holdings to calculate indirect exposure
    await this.processETFHoldings(holdings, exposureMap)

    // Step 5: Calculate total portfolio value and percentages
    const totalPortfolioValue = holdings.reduce((sum, h) => sum + h.marketValue, 0)

    // Step 6: Finalize exposures with percentages and create subrows
    const exposures = this.finalizeExposures(exposureMap, totalPortfolioValue)
    console.log(`Final exposures count: ${exposures.length}`)

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

    // First, initialize with mock data to ensure we always have something
    console.log("Initializing ETF profiles with mock data")
    for (const symbol of etfSymbols) {
      const mockProfile = this.getMockETFProfile(symbol)
      if (mockProfile && mockProfile.holdings.length > 0) {
        this.etfProfiles.set(symbol, mockProfile)
        console.log(`Set mock ETF profile for ${symbol} with ${mockProfile.holdings.length} holdings`)
      }
    }

    // Then try to fetch real data and override if available
    try {
      const response = await fetch("/api/etf-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols: etfSymbols })
      })

      if (!response.ok) {
        console.log("API response not OK, keeping mock data")
        return
      }

      const profiles = await response.json()
      console.log("ETF API response:", profiles)

      for (const symbol of etfSymbols) {
        const profile = profiles[symbol]
        if (profile && profile.holdings?.data) {
          console.log(`Setting ETF profile for ${symbol} with ${profile.holdings.data.length} holdings`)
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
        } else {
          // Keep the mock data that was already set
          console.log(`No API data for ${symbol}, keeping mock data`)
        }
      }
    } catch (error) {
      console.error("Error fetching ETF profiles:", error)
      // Mock data is already set, so we're good
      console.log("API error, keeping mock ETF data")
    }
  }

  private extractStockPrices(holdings: PortfolioHolding[]): void {
    holdings.forEach(holding => {
      if (holding.ticker && holding.type === "stock") {
        this.stockPrices.set(holding.ticker, holding.lastPrice)
      }
    })
  }

  private async fetchCompanyOverviews(holdings: PortfolioHolding[]): Promise<void> {
    // Collect all unique stock symbols from direct holdings and ETF holdings
    const stockSymbols = new Set<string>()

    // Add direct stock holdings
    holdings.forEach(holding => {
      if (holding.ticker && holding.type === "stock") {
        stockSymbols.add(holding.ticker)
      }
    })

    // Add stocks from ETF holdings
    this.etfProfiles.forEach(etfProfile => {
      etfProfile.holdings.forEach(holding => {
        stockSymbols.add(holding.symbol)
      })
    })

    if (stockSymbols.size === 0) return

    try {
      const response = await fetch("/api/company-overview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols: Array.from(stockSymbols) })
      })

      if (!response.ok) {
        throw new Error("Failed to fetch company overviews")
      }

      const overviews = await response.json()

      // Store the overviews in our map
      for (const [symbol, overview] of Object.entries(overviews)) {
        this.companyOverviews.set(symbol, overview as { sector: string; industry: string })
      }
    } catch (error) {
      console.error("Error fetching company overviews:", error)
      // Continue without sector/industry data
    }
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
        const overview = this.companyOverviews.get(ticker)

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
            sector: overview?.sector,
            industry: overview?.industry,
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
    console.log(`Processing ${etfHoldings.length} ETF holdings`)

    for (const etfHolding of etfHoldings) {
      const etfSymbol = etfHolding.ticker!
      const etfProfile = this.etfProfiles.get(etfSymbol)

      if (!etfProfile) {
        console.log(`No ETF profile found for ${etfSymbol}`)
        continue
      }

      console.log(`Processing ETF ${etfSymbol} with ${etfProfile.holdings.length} holdings`)
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
        const overview = this.companyOverviews.get(stockSymbol)

        if (existing) {
          console.log(`Adding ETF exposure to existing ${stockSymbol}: +${sharesViaETF} shares via ${etfSymbol}`)
          existing.etfExposure += sharesViaETF
          existing.etfValue += stockValueViaETF
          existing.totalShares = existing.directShares + existing.etfExposure
          existing.totalValue = existing.directValue + existing.etfValue
          existing.exposureSources.push(exposureSource)
        } else {
          console.log(`Creating new exposure for ${stockSymbol}: ${sharesViaETF} shares via ${etfSymbol}`)
          exposureMap.set(stockSymbol, {
            id: `stock-${stockSymbol}`,
            ticker: stockSymbol,
            name: stockInETF.name,
            sector: overview?.sector,
            industry: overview?.industry,
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
    console.log(`Finalizing ${exposureMap.size} exposures`)

    exposureMap.forEach(exposure => {
      // Calculate percentage of portfolio
      exposure.percentOfPortfolio = (exposure.totalValue / totalPortfolioValue) * 100

      // Log stocks with ETF exposure
      if (exposure.etfExposure > 0) {
        console.log(`${exposure.ticker}: Direct=${exposure.directShares}, ETF=${exposure.etfExposure}, Sources=${exposure.exposureSources.length}`)
      }

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

  private getMockETFProfile(symbol: string): ETFProfile {
    const mockProfiles: Record<string, ETFProfile> = {
      VOO: {
        symbol: "VOO",
        name: "Vanguard S&P 500 ETF",
        holdings: [
          { symbol: "AAPL", name: "Apple Inc.", weight: 7.28 },
          { symbol: "MSFT", name: "Microsoft Corporation", weight: 7.03 },
          { symbol: "AMZN", name: "Amazon.com Inc.", weight: 3.51 },
          { symbol: "NVDA", name: "NVIDIA Corporation", weight: 3.12 },
          { symbol: "GOOGL", name: "Alphabet Inc. Class A", weight: 2.15 },
          { symbol: "TSLA", name: "Tesla Inc.", weight: 1.62 }
        ],
        lastUpdated: new Date()
      },
      SPY: {
        symbol: "SPY",
        name: "SPDR S&P 500 ETF Trust",
        holdings: [
          { symbol: "AAPL", name: "Apple Inc.", weight: 7.27 },
          { symbol: "MSFT", name: "Microsoft Corporation", weight: 7.02 },
          { symbol: "AMZN", name: "Amazon.com Inc.", weight: 3.50 },
          { symbol: "NVDA", name: "NVIDIA Corporation", weight: 3.11 },
          { symbol: "GOOGL", name: "Alphabet Inc. Class A", weight: 2.14 },
          { symbol: "TSLA", name: "Tesla Inc.", weight: 1.61 }
        ],
        lastUpdated: new Date()
      },
      QQQ: {
        symbol: "QQQ",
        name: "Invesco QQQ Trust",
        holdings: [
          { symbol: "AAPL", name: "Apple Inc.", weight: 8.94 },
          { symbol: "MSFT", name: "Microsoft Corporation", weight: 8.64 },
          { symbol: "AMZN", name: "Amazon.com Inc.", weight: 5.42 },
          { symbol: "NVDA", name: "NVIDIA Corporation", weight: 4.85 },
          { symbol: "GOOGL", name: "Alphabet Inc. Class A", weight: 2.64 },
          { symbol: "TSLA", name: "Tesla Inc.", weight: 2.51 }
        ],
        lastUpdated: new Date()
      },
      VTI: {
        symbol: "VTI",
        name: "Vanguard Total Stock Market ETF",
        holdings: [
          { symbol: "AAPL", name: "Apple Inc.", weight: 6.52 },
          { symbol: "MSFT", name: "Microsoft Corporation", weight: 6.31 },
          { symbol: "AMZN", name: "Amazon.com Inc.", weight: 3.15 },
          { symbol: "NVDA", name: "NVIDIA Corporation", weight: 2.81 },
          { symbol: "GOOGL", name: "Alphabet Inc. Class A", weight: 1.93 },
          { symbol: "TSLA", name: "Tesla Inc.", weight: 1.46 }
        ],
        lastUpdated: new Date()
      }
    }

    return mockProfiles[symbol] || {
      symbol,
      name: `${symbol} ETF`,
      holdings: [],
      lastUpdated: new Date()
    }
  }

  // Helper method to fetch real stock prices (optional enhancement)
  async fetchStockPrices(_symbols: string[]): Promise<void> {
    // This would fetch real stock prices from an API
    // For now, we use prices from direct holdings or defaults
  }
}

export const exposureCalculator = new ExposureCalculator()