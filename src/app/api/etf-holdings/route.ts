import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

interface ETFHolding {
  symbol: string
  name: string
  weight: string
  shares?: string
}

interface ProcessedETFHolding {
  symbol: string
  name: string
  weight: number  // Processed weight as number
  shares?: number // Processed shares as number
}

interface ETFProfile {
  symbol: string
  name: string
  holdings: ProcessedETFHolding[]  // Use processed type
  lastUpdated: string
  cachedAt?: string
  source?: string
  error?: string
}

// Cache ETF data for 24 hours to avoid hitting API limits
const ETF_CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
const etfCache = new Map<string, { data: ETFProfile; timestamp: number }>()

// File-based cache directory
const CACHE_DIR = path.join(process.cwd(), "src", "data", "etf-profiles")

interface AlphaVantageETFResponse {
  symbol: string
  name: string
  description?: string
  holdings?: ETFHolding[]
}

// Helper function to read cached ETF profile from file
async function readCachedProfile(symbol: string): Promise<ETFProfile | null> {
  try {
    const filePath = path.join(CACHE_DIR, `${symbol}.json`)
    const fileContent = await fs.readFile(filePath, "utf-8")
    const data = JSON.parse(fileContent)
    console.log(`Loaded cached profile for ${symbol} from file with ${data.holdings?.length || 0} holdings`)
    return data
  } catch {
    // File doesn't exist or can't be read
    return null
  }
}

// Helper function to write ETF profile to cache file
async function writeCachedProfile(symbol: string, data: ETFProfile): Promise<void> {
  try {
    // Ensure directory exists
    await fs.mkdir(CACHE_DIR, { recursive: true })

    const filePath = path.join(CACHE_DIR, `${symbol}.json`)
    const dataToCache = {
      ...data,
      cachedAt: new Date().toISOString(),
      source: "Alpha Vantage API"
    }

    await fs.writeFile(filePath, JSON.stringify(dataToCache, null, 2))
    console.log(`Saved ${symbol} profile to cache file with ${data.holdings?.length || 0} holdings`)
  } catch (error) {
    console.error(`Failed to cache ${symbol} profile:`, error)
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

    // If no API key, try to load from file cache
    if (!apiKey) {
      console.warn("ALPHA_VANTAGE_API_KEY not configured, using cached data only...")
      const results: Record<string, ETFProfile> = {}

      for (const symbol of symbols) {
        const fileCached = await readCachedProfile(symbol)
        if (fileCached) {
          results[symbol] = fileCached
        } else {
          // Return empty data if no cache exists
          console.log(`No cached file for ${symbol}, no data available without API key`)
          results[symbol] = {
            symbol,
            name: `${symbol} ETF`,
            holdings: [],
            lastUpdated: new Date().toISOString(),
            error: "No cached data available. API key required for initial fetch."
          }
        }
      }

      return NextResponse.json(results)
    }

    const results: Record<string, ETFProfile> = {}

    for (const symbol of symbols) {
      // Check file-based cache first
      const fileCached = await readCachedProfile(symbol)
      if (fileCached) {
        results[symbol] = fileCached
        // Also store in memory cache for faster access
        etfCache.set(symbol, {
          data: fileCached,
          timestamp: Date.now()
        })
        continue
      }

      // Check memory cache
      const cached = etfCache.get(symbol)
      if (cached && Date.now() - cached.timestamp < ETF_CACHE_DURATION) {
        console.log(`Using memory cached data for ${symbol}`)
        results[symbol] = cached.data
        continue
      }

      try {
        // Fetch from Alpha Vantage
        const url = `https://www.alphavantage.co/query?function=ETF_PROFILE&symbol=${symbol}&apikey=${apiKey}`
        console.log(`Fetching ETF profile for ${symbol} from API...`)

        const response = await fetch(url)
        const data: AlphaVantageETFResponse = await response.json()

        if (!response.ok) {
          console.error(`Failed to fetch ${symbol}: ${response.statusText}`)
          // Try to use cached data if API fails
          const cachedData = await readCachedProfile(symbol)
          if (cachedData) {
            console.log(`Using cached data for ${symbol} due to API failure`)
            results[symbol] = cachedData
          } else {
            results[symbol] = {
              symbol,
              name: `${symbol} ETF`,
              holdings: [],
              lastUpdated: new Date().toISOString(),
              error: `API request failed: ${response.statusText}`
            }
          }
          continue
        }

        // Check for API limit message
        if ('Note' in data || 'Information' in data) {
          console.warn(`API limit reached for ${symbol}, checking cache...`)
          const cachedData = await readCachedProfile(symbol)
          if (cachedData) {
            console.log(`Using cached data for ${symbol} due to API limit`)
            results[symbol] = cachedData
          } else {
            results[symbol] = {
              symbol,
              name: `${symbol} ETF`,
              holdings: [],
              lastUpdated: new Date().toISOString(),
              error: "API limit reached. No cached data available."
            }
          }
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

        // Cache the processed data in memory
        etfCache.set(symbol, {
          data: processedData,
          timestamp: Date.now()
        })

        // Save to file cache for persistence
        await writeCachedProfile(symbol, processedData)

        results[symbol] = processedData
        console.log(`Fetched ${processedData.holdings.length} holdings for ${symbol} and saved to cache`)

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))

      } catch (fetchError) {
        console.error(`Error fetching ${symbol}:`, fetchError)
        // Try to use cached data on any error
        const cachedData = await readCachedProfile(symbol)
        if (cachedData) {
          console.log(`Using cached data for ${symbol} due to error`)
          results[symbol] = cachedData
        } else {
          results[symbol] = {
            symbol,
            name: `${symbol} ETF`,
            holdings: [],
            lastUpdated: new Date().toISOString(),
            error: `Error fetching data: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`
          }
        }
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
