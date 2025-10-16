import { NextRequest, NextResponse } from "next/server"
import { KNOWN_ETF_NAMES } from "@/lib/knownETFNames"

// Cache ETF metadata for 7 days
const METADATA_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days
const metadataCache = new Map<string, { data: any; timestamp: number }>()

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
      // Check cache first
      const cached = metadataCache.get(symbol)
      if (cached && Date.now() - cached.timestamp < METADATA_CACHE_DURATION) {
        results[symbol] = cached.data
        continue
      }

      // If no API key, return basic metadata with known names
      if (!apiKey) {
        const upperSymbol = symbol.toUpperCase()
        results[symbol] = {
          symbol,
          name: KNOWN_ETF_NAMES[upperSymbol] || `${symbol} ETF`,
          description: null
        }
        continue
      }

      try {
        // Fetch just the profile info from Alpha Vantage (lighter than full holdings)
        const url = `https://www.alphavantage.co/query?function=ETF_PROFILE&symbol=${symbol}&apikey=${apiKey}`
        const response = await fetch(url)

        if (response.ok) {
          const data = await response.json()

          // Check for API limits
          if ('Note' in data || 'Information' in data) {
            console.warn(`API limit for ${symbol} metadata`)
            const upperSymbol = symbol.toUpperCase()
            results[symbol] = {
              symbol,
              name: KNOWN_ETF_NAMES[upperSymbol] || `${symbol} ETF`,
              description: null
            }
            continue
          }

          // Extract just the metadata (not holdings)
          const upperSymbol = symbol.toUpperCase()
          const metadata = {
            symbol: data.symbol || symbol,
            name: data.name || KNOWN_ETF_NAMES[upperSymbol] || `${symbol} ETF`,
            description: data.description || null,
            assetClass: data.asset_class,
            netExpenseRatio: data.net_expense_ratio,
            portfolioDate: data.portfolio_date,
            totalNetAssets: data.total_net_assets,
            yearToDateReturn: data.year_to_date_return,
            threeYearReturn: data.three_year_return,
            fiveYearReturn: data.five_year_return
          }

          // Cache the metadata
          metadataCache.set(symbol, {
            data: metadata,
            timestamp: Date.now()
          })

          results[symbol] = metadata
        } else {
          const upperSymbol = symbol.toUpperCase()
          results[symbol] = {
            symbol,
            name: KNOWN_ETF_NAMES[upperSymbol] || `${symbol} ETF`,
            description: null
          }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`Error fetching metadata for ${symbol}:`, error)
        const upperSymbol = symbol.toUpperCase()
        results[symbol] = {
          symbol,
          name: KNOWN_ETF_NAMES[upperSymbol] || `${symbol} ETF`,
          description: null
        }
      }
    }

    return NextResponse.json(results)

  } catch (error) {
    console.error("Error in ETF metadata API:", error)
    return NextResponse.json(
      { error: "Failed to fetch ETF metadata" },
      { status: 500 }
    )
  }
}