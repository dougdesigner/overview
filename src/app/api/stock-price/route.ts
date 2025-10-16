import { NextRequest, NextResponse } from "next/server"

// Cache for 15 minutes
const PRICE_CACHE_DURATION = 15 * 60 * 1000
const priceCache = new Map<string, { data: any; timestamp: number }>()

// Mock prices for development/fallback
const MOCK_PRICES: Record<string, any> = {
  // Popular ETFs with realistic prices
  QQQ: { lastPrice: 512.45, previousClose: 509.32, changePercent: 0.61, volume: 45678900 },
  QQQM: { lastPrice: 247.88, previousClose: 246.21, changePercent: 0.68, volume: 5317494 },
  SPY: { lastPrice: 589.23, previousClose: 586.45, changePercent: 0.47, volume: 78234567 },
  VOO: { lastPrice: 543.67, previousClose: 541.23, changePercent: 0.45, volume: 34567890 },
  VTI: { lastPrice: 287.45, previousClose: 285.89, changePercent: 0.55, volume: 23456789 },
  VXUS: { lastPrice: 65.34, previousClose: 65.12, changePercent: 0.34, volume: 12345678 },
  BND: { lastPrice: 71.23, previousClose: 71.45, changePercent: -0.31, volume: 9876543 },

  // Popular stocks
  AAPL: { lastPrice: 234.56, previousClose: 232.89, changePercent: 0.72, volume: 67890123 },
  MSFT: { lastPrice: 432.10, previousClose: 429.34, changePercent: 0.64, volume: 45678901 },
  NVDA: { lastPrice: 145.67, previousClose: 142.34, changePercent: 2.34, volume: 234567890 },
  GOOGL: { lastPrice: 178.90, previousClose: 177.45, changePercent: 0.82, volume: 34567890 },
  AMZN: { lastPrice: 189.45, previousClose: 187.23, changePercent: 1.19, volume: 56789012 },
  META: { lastPrice: 567.89, previousClose: 562.34, changePercent: 0.99, volume: 23456789 },
  TSLA: { lastPrice: 245.67, previousClose: 241.23, changePercent: 1.84, volume: 123456789 },
}

interface AlphaVantageTimeSeriesResponse {
  "Meta Data": {
    "1. Information": string
    "2. Symbol": string
    "3. Last Refreshed": string
    "4. Output Size": string
    "5. Time Zone": string
  }
  "Time Series (Daily)": {
    [date: string]: {
      "1. open": string
      "2. high": string
      "3. low": string
      "4. close": string
      "5. adjusted close": string
      "6. volume": string
      "7. dividend amount": string
      "8. split coefficient": string
    }
  }
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
    const results: Record<string, any> = {}

    for (const symbol of symbols) {
      const upperSymbol = symbol.toUpperCase()

      // Check cache first
      const cached = priceCache.get(upperSymbol)
      if (cached && Date.now() - cached.timestamp < PRICE_CACHE_DURATION) {
        results[upperSymbol] = cached.data
        continue
      }

      // If no API key, use mock data
      if (!apiKey) {
        const mockPrice = MOCK_PRICES[upperSymbol] || {
          lastPrice: 100 + Math.random() * 100,
          previousClose: 100,
          changePercent: (Math.random() - 0.5) * 5,
          volume: Math.floor(Math.random() * 10000000)
        }
        results[upperSymbol] = mockPrice
        continue
      }

      try {
        // Fetch daily adjusted prices from Alpha Vantage
        const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${upperSymbol}&outputsize=compact&apikey=${apiKey}`
        const response = await fetch(url)

        if (response.ok) {
          const data: AlphaVantageTimeSeriesResponse = await response.json()

          // Check for API limits
          if ('Note' in data || 'Information' in data) {
            console.warn(`API limit for ${upperSymbol} price`)
            // Use mock data as fallback
            const mockPrice = MOCK_PRICES[upperSymbol] || {
              lastPrice: 100,
              previousClose: 100,
              changePercent: 0,
              volume: 0
            }
            results[upperSymbol] = mockPrice
            continue
          }

          // Extract price data from the time series
          const timeSeries = data["Time Series (Daily)"]
          if (timeSeries) {
            const dates = Object.keys(timeSeries).sort((a, b) => b.localeCompare(a))

            if (dates.length >= 2) {
              const todayData = timeSeries[dates[0]]
              const yesterdayData = timeSeries[dates[1]]

              const lastPrice = parseFloat(todayData["5. adjusted close"])
              const previousClose = parseFloat(yesterdayData["5. adjusted close"])
              const changePercent = ((lastPrice - previousClose) / previousClose) * 100

              const priceData = {
                lastPrice,
                previousClose,
                changePercent,
                volume: parseInt(todayData["6. volume"]),
                open: parseFloat(todayData["1. open"]),
                high: parseFloat(todayData["2. high"]),
                low: parseFloat(todayData["3. low"]),
                close: parseFloat(todayData["4. close"]),
                dividendAmount: parseFloat(todayData["7. dividend amount"]),
                lastUpdated: dates[0]
              }

              // Cache the result
              priceCache.set(upperSymbol, {
                data: priceData,
                timestamp: Date.now()
              })

              results[upperSymbol] = priceData
            }
          }
        } else {
          // Use mock data on API failure
          const mockPrice = MOCK_PRICES[upperSymbol] || {
            lastPrice: 100,
            previousClose: 100,
            changePercent: 0,
            volume: 0
          }
          results[upperSymbol] = mockPrice
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`Error fetching price for ${upperSymbol}:`, error)

        // Use mock data on error
        const mockPrice = MOCK_PRICES[upperSymbol] || {
          lastPrice: 100,
          previousClose: 100,
          changePercent: 0,
          volume: 0
        }
        results[upperSymbol] = mockPrice
      }
    }

    return NextResponse.json(results)

  } catch (error) {
    console.error("Error in stock price API:", error)
    return NextResponse.json(
      { error: "Failed to fetch stock prices" },
      { status: 500 }
    )
  }
}