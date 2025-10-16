import { NextRequest, NextResponse } from "next/server"

// Cache ETF data for 24 hours to avoid hitting API limits
const ETF_CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
const etfCache = new Map<string, { data: any; timestamp: number }>()

interface ETFHolding {
  symbol: string
  name: string
  weight: string
  shares?: string
}

interface AlphaVantageETFResponse {
  symbol: string
  name: string
  description?: string
  holdings?: ETFHolding[]
}

export async function POST(request: NextRequest) {
  try {
    const { symbols } = await request.json()

    if (!symbols || !Array.isArray(symbols)) {
      return NextResponse.json(
        { error: "Invalid request. Expected array of symbols." },
        { status: 400 }
      )
    }

    const apiKey = process.env.ALPHA_VANTAGE_API_KEY
    if (!apiKey) {
      console.warn("ALPHA_VANTAGE_API_KEY not configured, returning mock data")
      return NextResponse.json(getMockData(symbols))
    }

    const results: Record<string, any> = {}

    for (const symbol of symbols) {
      // Check cache first
      const cached = etfCache.get(symbol)
      if (cached && Date.now() - cached.timestamp < ETF_CACHE_DURATION) {
        console.log(`Using cached data for ${symbol}`)
        results[symbol] = cached.data
        continue
      }

      try {
        // Fetch from Alpha Vantage
        const url = `https://www.alphavantage.co/query?function=ETF_PROFILE&symbol=${symbol}&apikey=${apiKey}`
        console.log(`Fetching ETF profile for ${symbol}...`)

        const response = await fetch(url)
        const data: AlphaVantageETFResponse = await response.json()

        if (!response.ok) {
          console.error(`Failed to fetch ${symbol}: ${response.statusText}`)
          results[symbol] = getMockDataForSymbol(symbol)
          continue
        }

        // Check for API limit message
        if ('Note' in data || 'Information' in data) {
          console.warn(`API limit reached for ${symbol}, using mock data`)
          results[symbol] = getMockDataForSymbol(symbol)
          continue
        }

        // Process and structure the holdings data
        const processedData = {
          symbol: data.symbol || symbol,
          name: data.name || `${symbol} ETF`,
          holdings: (data.holdings || []).map(holding => ({
            symbol: holding.symbol,
            name: holding.name,
            weight: parseFloat(holding.weight.replace('%', '')) || 0,
            shares: holding.shares ? parseInt(holding.shares.replace(/,/g, '')) : undefined
          })),
          lastUpdated: new Date().toISOString()
        }

        // Cache the processed data
        etfCache.set(symbol, {
          data: processedData,
          timestamp: Date.now()
        })

        results[symbol] = processedData
        console.log(`Fetched ${processedData.holdings.length} holdings for ${symbol}`)

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))

      } catch (error) {
        console.error(`Error fetching ${symbol}:`, error)
        results[symbol] = getMockDataForSymbol(symbol)
      }
    }

    return NextResponse.json(results)

  } catch (error) {
    console.error("Error in ETF holdings API:", error)
    return NextResponse.json(
      { error: "Failed to fetch ETF holdings" },
      { status: 500 }
    )
  }
}

// Mock data fallback when API is not available
function getMockData(symbols: string[]): Record<string, any> {
  const results: Record<string, any> = {}
  for (const symbol of symbols) {
    results[symbol] = getMockDataForSymbol(symbol)
  }
  return results
}

function getMockDataForSymbol(symbol: string): any {
  // Import existing mock data if available
  const mockProfiles: Record<string, any> = {
    QQQ: {
      symbol: "QQQ",
      name: "Invesco QQQ Trust",
      holdings: [
        { symbol: "NVDA", name: "NVIDIA Corp", weight: 9.507 },
        { symbol: "MSFT", name: "Microsoft Corp", weight: 8.347 },
        { symbol: "AAPL", name: "Apple Inc", weight: 8.324 },
        { symbol: "AVGO", name: "Broadcom Inc", weight: 5.714 },
        { symbol: "AMZN", name: "Amazon.com Inc", weight: 5.146 },
        { symbol: "META", name: "Meta Platforms Inc", weight: 3.542 },
        { symbol: "TSLA", name: "Tesla Inc", weight: 3.524 },
        { symbol: "GOOGL", name: "Alphabet Inc Class A", weight: 3.149 },
        { symbol: "GOOG", name: "Alphabet Inc Class C", weight: 2.947 },
        { symbol: "NFLX", name: "Netflix Inc", weight: 2.779 },
        // Add more as needed
      ],
      lastUpdated: new Date().toISOString()
    },
    QQQM: {
      symbol: "QQQM",
      name: "Invesco NASDAQ 100 ETF",
      holdings: [
        // Same holdings as QQQ but with slightly different weights
        { symbol: "NVDA", name: "NVIDIA Corp", weight: 9.507 },
        { symbol: "MSFT", name: "Microsoft Corp", weight: 8.347 },
        { symbol: "AAPL", name: "Apple Inc", weight: 8.324 },
        { symbol: "AVGO", name: "Broadcom Inc", weight: 5.714 },
        { symbol: "AMZN", name: "Amazon.com Inc", weight: 5.146 },
        { symbol: "META", name: "Meta Platforms Inc", weight: 3.542 },
        { symbol: "TSLA", name: "Tesla Inc", weight: 3.524 },
        { symbol: "GOOGL", name: "Alphabet Inc Class A", weight: 3.149 },
        { symbol: "GOOG", name: "Alphabet Inc Class C", weight: 2.947 },
        { symbol: "NFLX", name: "Netflix Inc", weight: 2.779 },
        // Add more as needed
      ],
      lastUpdated: new Date().toISOString()
    },
    VTI: {
      symbol: "VTI",
      name: "Vanguard Total Stock Market ETF",
      holdings: [
        { symbol: "AAPL", name: "Apple Inc", weight: 6.52 },
        { symbol: "MSFT", name: "Microsoft Corporation", weight: 6.31 },
        { symbol: "AMZN", name: "Amazon.com Inc", weight: 3.15 },
        { symbol: "NVDA", name: "NVIDIA Corporation", weight: 2.81 },
        { symbol: "GOOGL", name: "Alphabet Inc Class A", weight: 1.93 },
        { symbol: "TSLA", name: "Tesla Inc", weight: 1.46 },
        { symbol: "BRK.B", name: "Berkshire Hathaway Inc Class B", weight: 1.40 },
        { symbol: "META", name: "Meta Platforms Inc", weight: 1.30 },
        { symbol: "JNJ", name: "Johnson & Johnson", weight: 1.08 },
        { symbol: "XOM", name: "Exxon Mobil Corporation", weight: 1.03 },
        // This would have 4000+ holdings from API
      ],
      lastUpdated: new Date().toISOString()
    },
    VXUS: {
      symbol: "VXUS",
      name: "Vanguard Total International Stock ETF",
      holdings: [
        { symbol: "TSM", name: "Taiwan Semiconductor", weight: 1.45 },
        { symbol: "NVS", name: "Novartis AG", weight: 0.89 },
        { symbol: "NESN", name: "Nestle SA", weight: 0.85 },
        { symbol: "ASML", name: "ASML Holding NV", weight: 0.82 },
        { symbol: "SAP", name: "SAP SE", weight: 0.71 },
        { symbol: "TM", name: "Toyota Motor Corp", weight: 0.68 },
        { symbol: "SHEL", name: "Shell PLC", weight: 0.65 },
        { symbol: "AZN", name: "AstraZeneca PLC", weight: 0.62 },
        { symbol: "HSBAS", name: "HSBC Holdings PLC", weight: 0.58 },
        { symbol: "UL", name: "Unilever PLC", weight: 0.52 },
        // This would have 7000+ holdings from API
      ],
      lastUpdated: new Date().toISOString()
    },
    VOO: {
      symbol: "VOO",
      name: "Vanguard S&P 500 ETF",
      holdings: [
        { symbol: "AAPL", name: "Apple Inc", weight: 7.28 },
        { symbol: "MSFT", name: "Microsoft Corporation", weight: 7.03 },
        { symbol: "AMZN", name: "Amazon.com Inc", weight: 3.51 },
        { symbol: "NVDA", name: "NVIDIA Corporation", weight: 3.12 },
        { symbol: "GOOGL", name: "Alphabet Inc Class A", weight: 2.15 },
        { symbol: "TSLA", name: "Tesla Inc", weight: 1.62 },
        { symbol: "BRK.B", name: "Berkshire Hathaway Inc Class B", weight: 1.55 },
        { symbol: "META", name: "Meta Platforms Inc", weight: 1.45 },
        { symbol: "JNJ", name: "Johnson & Johnson", weight: 1.20 },
        { symbol: "XOM", name: "Exxon Mobil Corporation", weight: 1.15 },
      ],
      lastUpdated: new Date().toISOString()
    },
    SPY: {
      symbol: "SPY",
      name: "SPDR S&P 500 ETF Trust",
      holdings: [
        { symbol: "AAPL", name: "Apple Inc", weight: 7.27 },
        { symbol: "MSFT", name: "Microsoft Corporation", weight: 7.02 },
        { symbol: "AMZN", name: "Amazon.com Inc", weight: 3.50 },
        { symbol: "NVDA", name: "NVIDIA Corporation", weight: 3.11 },
        { symbol: "GOOGL", name: "Alphabet Inc Class A", weight: 2.14 },
        { symbol: "TSLA", name: "Tesla Inc", weight: 1.61 },
        { symbol: "BRK.B", name: "Berkshire Hathaway Inc Class B", weight: 1.54 },
        { symbol: "META", name: "Meta Platforms Inc", weight: 1.44 },
        { symbol: "JNJ", name: "Johnson & Johnson", weight: 1.19 },
        { symbol: "XOM", name: "Exxon Mobil Corporation", weight: 1.14 },
      ],
      lastUpdated: new Date().toISOString()
    },
    BND: {
      symbol: "BND",
      name: "Vanguard Total Bond Market ETF",
      holdings: [
        { symbol: "UST-10Y", name: "US Treasury 10 Year", weight: 15.2 },
        { symbol: "UST-30Y", name: "US Treasury 30 Year", weight: 12.8 },
        { symbol: "UST-5Y", name: "US Treasury 5 Year", weight: 10.5 },
        { symbol: "MBS", name: "Mortgage Backed Securities", weight: 25.3 },
        { symbol: "CORP-AAA", name: "AAA Corporate Bonds", weight: 18.6 },
        { symbol: "CORP-AA", name: "AA Corporate Bonds", weight: 8.4 },
        { symbol: "MUNI", name: "Municipal Bonds", weight: 5.2 },
        { symbol: "INTL-BOND", name: "International Bonds", weight: 4.0 },
      ],
      lastUpdated: new Date().toISOString()
    }
  }

  return mockProfiles[symbol] || {
    symbol,
    name: `${symbol} ETF`,
    holdings: [],
    lastUpdated: new Date().toISOString()
  }
}