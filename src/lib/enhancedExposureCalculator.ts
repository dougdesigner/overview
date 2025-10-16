import {
  ETFProfile,
  ExposureCalculationResult,
  ExposureSource,
  PortfolioHolding,
  StockExposure,
} from "@/components/ui/data-table-exposure/types"
import { getETFHoldings } from "@/data/etf-holdings/etfHoldingsData"
import mutualFundMappings from "@/data/mutual-fund-mappings.json"
import assetClassifications from "@/data/asset-classifications.json"

export interface AssetClassBreakdown {
  class: string
  className: string
  percentage: number
  marketValue: number
  color: string
}

export interface EnhancedExposureResult extends ExposureCalculationResult {
  assetClassBreakdown: AssetClassBreakdown[]
  sectorBreakdown: { sector: string; value: number; percentage: number }[]
}

interface MutualFundMapping {
  etf: string
  percentage: number
  notes: string
}

interface MutualFundData {
  name: string
  description: string
  mappings: MutualFundMapping[]
}

export class EnhancedExposureCalculator {
  private etfProfiles: Map<string, ETFProfile> = new Map()
  private companyOverviews: Map<string, { sector: string; industry: string }> = new Map()
  private mutualFunds: Record<string, MutualFundData> = mutualFundMappings as Record<string, MutualFundData>
  private assetClasses = assetClassifications

  async calculateExposures(
    holdings: PortfolioHolding[],
  ): Promise<EnhancedExposureResult> {
    console.log("Starting enhanced exposure calculation with holdings:", holdings.length)

    // Step 1: Identify and process mutual funds
    const { etfHoldings, mutualFundHoldings, directStockHoldings } = this.categorizeHoldings(holdings)
    console.log(`Holdings breakdown - ETFs: ${etfHoldings.length}, Mutual Funds: ${mutualFundHoldings.length}, Stocks: ${directStockHoldings.length}`)

    // Step 2: Convert mutual funds to ETF equivalents
    const equivalentETFHoldings = this.convertMutualFundsToETFs(mutualFundHoldings)
    const allETFHoldings = [...etfHoldings, ...equivalentETFHoldings]

    // Step 3: Fetch ETF profiles for all ETFs
    await this.fetchETFProfiles(allETFHoldings)
    console.log("ETF profiles fetched:", this.etfProfiles.size)

    // Step 4: Fetch company overviews for sector/industry data
    await this.fetchCompanyOverviews([...directStockHoldings, ...allETFHoldings])

    // Step 5: Calculate exposures WITHOUT individual stock prices
    const exposureMap = new Map<string, StockExposure>()

    // Process direct stock holdings
    this.processDirectHoldings(directStockHoldings, exposureMap)

    // Process ETF holdings (including mutual fund equivalents)
    await this.processETFHoldingsWithoutPrices(allETFHoldings, exposureMap)

    // Step 6: Calculate total portfolio value and percentages
    const totalPortfolioValue = holdings.reduce(
      (sum, h) => sum + h.marketValue,
      0,
    )

    // Step 7: Calculate asset class breakdown
    const assetClassBreakdown = this.calculateAssetClassBreakdown(holdings, totalPortfolioValue)

    // Step 8: Calculate sector breakdown
    const sectorBreakdown = this.calculateSectorBreakdown(exposureMap, totalPortfolioValue)

    // Step 9: Finalize exposures
    const exposures = this.finalizeExposures(exposureMap, totalPortfolioValue)
    console.log(`Final exposures count: ${exposures.length}`)

    return {
      exposures,
      totalPortfolioValue,
      etfProfiles: this.etfProfiles,
      lastCalculated: new Date(),
      assetClassBreakdown,
      sectorBreakdown,
    }
  }

  private categorizeHoldings(holdings: PortfolioHolding[]) {
    const etfHoldings: PortfolioHolding[] = []
    const mutualFundHoldings: PortfolioHolding[] = []
    const directStockHoldings: PortfolioHolding[] = []

    holdings.forEach(holding => {
      if (!holding.ticker) return

      if (holding.type === "stock") {
        directStockHoldings.push(holding)
      } else if (holding.type === "fund") {
        // Check if it's a mutual fund we have mappings for
        if (this.mutualFunds[holding.ticker]) {
          mutualFundHoldings.push(holding)
        } else {
          etfHoldings.push(holding)
        }
      }
    })

    return { etfHoldings, mutualFundHoldings, directStockHoldings }
  }

  private convertMutualFundsToETFs(mutualFundHoldings: PortfolioHolding[]): PortfolioHolding[] {
    const equivalentETFHoldings: PortfolioHolding[] = []

    mutualFundHoldings.forEach(mfHolding => {
      const mfData = this.mutualFunds[mfHolding.ticker!]
      if (!mfData) return

      console.log(`Converting mutual fund ${mfHolding.ticker} (${mfData.name}) to ETF equivalents`)

      mfData.mappings.forEach(mapping => {
        const equivalentValue = mfHolding.marketValue * (mapping.percentage / 100)

        // Create a virtual ETF holding for this portion
        equivalentETFHoldings.push({
          id: `${mfHolding.id}-${mapping.etf}`,
          accountId: mfHolding.accountId,
          accountName: mfHolding.accountName,
          ticker: mapping.etf,
          name: `${mapping.etf} (via ${mfHolding.ticker})`,
          quantity: 0, // We don't calculate equivalent shares anymore
          lastPrice: 0, // Not needed
          marketValue: equivalentValue,
          type: "fund" as const,
          originalMutualFund: mfHolding.ticker,
          mappingNotes: mapping.notes
        } as PortfolioHolding & { originalMutualFund?: string; mappingNotes?: string })

        console.log(`  - ${mapping.percentage}% → ${mapping.etf}: $${equivalentValue.toFixed(2)}`)
      })
    })

    return equivalentETFHoldings
  }

  private async fetchETFProfiles(holdings: PortfolioHolding[]): Promise<void> {
    const etfSymbols = holdings
      .filter((h) => h.ticker)
      .map((h) => h.ticker as string)

    if (etfSymbols.length === 0) return

    // Initialize with mock/hardcoded data
    for (const symbol of etfSymbols) {
      const mockProfile = this.getMockETFProfile(symbol)
      if (mockProfile && mockProfile.holdings.length > 0) {
        this.etfProfiles.set(symbol, mockProfile)
        console.log(`Set ETF profile for ${symbol} with ${mockProfile.holdings.length} holdings`)
      }
    }

    // Try to fetch real data if API is available
    try {
      const response = await fetch("/api/etf-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols: etfSymbols }),
      })

      if (response.ok) {
        const profiles = await response.json()
        for (const symbol of etfSymbols) {
          const profile = profiles[symbol]
          if (profile?.holdings?.data) {
            this.etfProfiles.set(symbol, {
              symbol: profile.symbol,
              name: profile.name,
              holdings: profile.holdings.data.map(
                (h: any) => ({
                  symbol: h.symbol,
                  name: h.name,
                  weight: parseFloat(h.weight) || 0,
                  sector: h.sector,
                }),
              ),
              lastUpdated: new Date(),
            })
          }
        }
      }
    } catch (error) {
      console.log("Using cached/mock ETF data")
    }
  }

  private async fetchCompanyOverviews(holdings: PortfolioHolding[]): Promise<void> {
    // Collect all unique stock symbols
    const stockSymbols = new Set<string>()

    // Add direct stock holdings
    holdings.forEach((holding) => {
      if (holding.ticker && holding.type === "stock") {
        stockSymbols.add(holding.ticker)
      }
    })

    // Add stocks from ETF holdings
    this.etfProfiles.forEach((etfProfile) => {
      etfProfile.holdings.forEach((holding) => {
        stockSymbols.add(holding.symbol)
      })
    })

    // Use cached sector data from asset classifications
    stockSymbols.forEach(symbol => {
      const stockData = this.assetClasses.stocks[symbol as keyof typeof assetClassifications.stocks]
      if (stockData) {
        this.companyOverviews.set(symbol, {
          sector: stockData.sector || "Unknown",
          industry: stockData.industry || "Unknown",
        })
      }
    })

    // Only fetch data for symbols we don't have
    const missingSymbols = Array.from(stockSymbols).filter(s => !this.companyOverviews.has(s))

    if (missingSymbols.length > 0) {
      try {
        const response = await fetch("/api/company-overview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbols: missingSymbols }),
        })

        if (response.ok) {
          const overviews = await response.json()
          for (const [symbol, overview] of Object.entries(overviews)) {
            this.companyOverviews.set(symbol, overview as { sector: string; industry: string })
          }
        }
      } catch (error) {
        console.log("Using cached company data")
      }
    }
  }

  private processDirectHoldings(
    holdings: PortfolioHolding[],
    exposureMap: Map<string, StockExposure>,
  ): void {
    holdings.forEach((holding) => {
      const ticker = holding.ticker!
      const existing = exposureMap.get(ticker)
      const overview = this.companyOverviews.get(ticker)

      if (existing) {
        // Aggregate multiple holdings of the same stock
        existing.directValue += holding.marketValue
        existing.totalValue = existing.directValue + existing.etfValue
      } else {
        exposureMap.set(ticker, {
          id: `stock-${ticker}`,
          ticker,
          name: holding.name,
          sector: overview?.sector,
          industry: overview?.industry,
          directShares: 0, // Not calculating shares anymore
          etfExposure: 0,
          totalShares: 0,
          lastPrice: 0,
          directValue: holding.marketValue,
          etfValue: 0,
          totalValue: holding.marketValue,
          percentOfPortfolio: 0,
          exposureSources: [],
        })
      }
    })
  }

  private async processETFHoldingsWithoutPrices(
    holdings: PortfolioHolding[],
    exposureMap: Map<string, StockExposure>,
  ): Promise<void> {
    for (const etfHolding of holdings) {
      const etfSymbol = etfHolding.ticker!
      const etfProfile = this.etfProfiles.get(etfSymbol)

      if (!etfProfile) {
        console.log(`No ETF profile found for ${etfSymbol}`)
        continue
      }

      console.log(`Processing ETF ${etfSymbol} with ${etfProfile.holdings.length} holdings`)
      const etfValue = etfHolding.marketValue

      // Check if this is a mutual fund equivalent
      const originalMF = (etfHolding as any).originalMutualFund
      const etfName = originalMF ?
        `${etfProfile.name} (via ${originalMF})` :
        etfProfile.name

      // Process each stock within the ETF
      for (const stockInETF of etfProfile.holdings) {
        const stockSymbol = stockInETF.symbol
        const weightInETF = stockInETF.weight / 100 // Convert percentage to decimal

        // Calculate market value exposure (NOT equivalent shares)
        const stockValueViaETF = etfValue * weightInETF

        // Create exposure source
        const exposureSource: ExposureSource = {
          etfSymbol: originalMF || etfSymbol,
          etfName: originalMF ?
            `${this.mutualFunds[originalMF]?.name || originalMF} → ${etfSymbol}` :
            etfName,
          sharesViaETF: 0, // Not calculating equivalent shares
          percentOfETF: stockInETF.weight,
          valueViaETF: stockValueViaETF,
        }

        // Update or create exposure
        const existing = exposureMap.get(stockSymbol)
        const overview = this.companyOverviews.get(stockSymbol)
        const sector = stockInETF.sector || overview?.sector

        if (existing) {
          existing.etfValue += stockValueViaETF
          existing.totalValue = existing.directValue + existing.etfValue
          existing.exposureSources.push(exposureSource)
          if (!existing.sector && sector) {
            existing.sector = sector
          }
        } else {
          exposureMap.set(stockSymbol, {
            id: `stock-${stockSymbol}`,
            ticker: stockSymbol,
            name: stockInETF.name,
            sector: sector,
            industry: overview?.industry,
            directShares: 0,
            etfExposure: 0,
            totalShares: 0,
            lastPrice: 0,
            directValue: 0,
            etfValue: stockValueViaETF,
            totalValue: stockValueViaETF,
            percentOfPortfolio: 0,
            exposureSources: [exposureSource],
          })
        }
      }
    }
  }

  private calculateAssetClassBreakdown(
    holdings: PortfolioHolding[],
    totalPortfolioValue: number
  ): AssetClassBreakdown[] {
    const assetClassMap = new Map<string, number>()

    holdings.forEach(holding => {
      if (!holding.ticker) {
        // Handle cash positions
        if (holding.type === "cash") {
          const current = assetClassMap.get("cash") || 0
          assetClassMap.set("cash", current + holding.marketValue)
        }
        return
      }

      // Check if it's a mutual fund
      const mfData = this.mutualFunds[holding.ticker]
      if (mfData) {
        // Process mutual fund mappings
        mfData.mappings.forEach(mapping => {
          const etfData = this.assetClasses.etfs[mapping.etf as keyof typeof assetClassifications.etfs]
          if (etfData) {
            etfData.breakdown.forEach(breakdown => {
              const value = holding.marketValue * (mapping.percentage / 100) * (breakdown.percentage / 100)
              const current = assetClassMap.get(breakdown.class) || 0
              assetClassMap.set(breakdown.class, current + value)
            })
          }
        })
      }
      // Check if it's an ETF
      else if (holding.type === "fund") {
        const etfData = this.assetClasses.etfs[holding.ticker as keyof typeof assetClassifications.etfs]
        if (etfData) {
          etfData.breakdown.forEach(breakdown => {
            const value = holding.marketValue * (breakdown.percentage / 100)
            const current = assetClassMap.get(breakdown.class) || 0
            assetClassMap.set(breakdown.class, current + value)
          })
        } else {
          // Default to US equity if unknown ETF
          const current = assetClassMap.get("us_equity") || 0
          assetClassMap.set("us_equity", current + holding.marketValue)
        }
      }
      // It's a direct stock holding
      else if (holding.type === "stock") {
        const stockData = this.assetClasses.stocks[holding.ticker as keyof typeof assetClassifications.stocks]
        const assetClass = stockData?.class || "us_equity" // Default to US equity
        const current = assetClassMap.get(assetClass) || 0
        assetClassMap.set(assetClass, current + holding.marketValue)
      }
    })

    // Convert to array and add metadata
    const breakdown: AssetClassBreakdown[] = []
    assetClassMap.forEach((value, className) => {
      const classData = this.assetClasses.assetClasses[className as keyof typeof assetClassifications.assetClasses]
      breakdown.push({
        class: className,
        className: classData?.name || className,
        percentage: (value / totalPortfolioValue) * 100,
        marketValue: value,
        color: classData?.color || "#6B7280",
      })
    })

    // Sort by value descending
    return breakdown.sort((a, b) => b.marketValue - a.marketValue)
  }

  private calculateSectorBreakdown(
    exposureMap: Map<string, StockExposure>,
    totalPortfolioValue: number
  ): { sector: string; value: number; percentage: number }[] {
    const sectorMap = new Map<string, number>()

    exposureMap.forEach(exposure => {
      const sector = exposure.sector || "Unknown"
      const current = sectorMap.get(sector) || 0
      sectorMap.set(sector, current + exposure.totalValue)
    })

    const sectors: { sector: string; value: number; percentage: number }[] = []
    sectorMap.forEach((value, sector) => {
      sectors.push({
        sector,
        value,
        percentage: (value / totalPortfolioValue) * 100,
      })
    })

    return sectors.sort((a, b) => b.value - a.value)
  }

  private finalizeExposures(
    exposureMap: Map<string, StockExposure>,
    totalPortfolioValue: number,
  ): StockExposure[] {
    const exposures: StockExposure[] = []

    exposureMap.forEach((exposure) => {
      // Calculate percentage of portfolio
      exposure.percentOfPortfolio = (exposure.totalValue / totalPortfolioValue) * 100

      // Create subrows for ETF breakdown if there are ETF sources
      if (exposure.exposureSources.length > 0) {
        exposure.subRows = exposure.exposureSources.map((source, index) => ({
          id: `${exposure.id}-etf-${index}`,
          ticker: source.etfSymbol,
          name: source.etfName,
          directShares: 0,
          etfExposure: 0,
          totalShares: 0,
          lastPrice: 0,
          directValue: 0,
          etfValue: source.valueViaETF,
          totalValue: source.valueViaETF,
          percentOfPortfolio: (source.valueViaETF / totalPortfolioValue) * 100,
          exposureSources: [],
          isETFBreakdown: true,
        }))

        // Add direct holding row if applicable
        if (exposure.directValue > 0) {
          exposure.subRows.unshift({
            id: `${exposure.id}-direct`,
            ticker: exposure.ticker,
            name: `Direct holding`,
            directShares: 0,
            etfExposure: 0,
            totalShares: 0,
            lastPrice: 0,
            directValue: exposure.directValue,
            etfValue: 0,
            totalValue: exposure.directValue,
            percentOfPortfolio: (exposure.directValue / totalPortfolioValue) * 100,
            exposureSources: [],
            isETFBreakdown: true,
          })
        }
      }

      exposures.push(exposure)
    })

    // Sort by total value descending
    return exposures.sort((a, b) => b.totalValue - a.totalValue)
  }

  private getMockETFProfile(symbol: string): ETFProfile {
    // Try to get comprehensive hardcoded data first
    const hardcodedProfile = getETFHoldings(symbol)
    if (hardcodedProfile) {
      console.log(`Using hardcoded data for ${symbol} with ${hardcodedProfile.holdings.length} holdings`)
      return hardcodedProfile
    }

    // Fallback for unknown ETFs
    return {
      symbol,
      name: `${symbol} ETF`,
      holdings: [],
      lastUpdated: new Date(),
    }
  }
}

export const enhancedExposureCalculator = new EnhancedExposureCalculator()