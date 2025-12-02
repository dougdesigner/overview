import { NextRequest, NextResponse } from "next/server"
import { alphaVantageClient } from "@/lib/alphaVantage"
import fs from "fs/promises"
import path from "path"

// Cache company data for 24 hours to avoid hitting API limits
const COMPANY_CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
const companyCache = new Map<string, { data: CompanyProfile; timestamp: number }>()

// File-based cache directory
const CACHE_DIR = path.join(process.cwd(), "src", "data", "company-profiles")

interface CompanyProfile {
  symbol: string
  name: string
  sector: string
  industry: string
  officialSite?: string
  cachedAt?: string
  source?: string
}

// Helper function to read cached company profile from file
async function readCachedProfile(symbol: string): Promise<CompanyProfile | null> {
  try {
    const filePath = path.join(CACHE_DIR, `${symbol}.json`)
    const fileContent = await fs.readFile(filePath, "utf-8")
    const data = JSON.parse(fileContent)
    console.log(`Loaded cached profile for ${symbol} from file`)
    return data
  } catch {
    // File doesn't exist or can't be read
    return null
  }
}

// Helper function to write company profile to cache file
async function writeCachedProfile(symbol: string, data: CompanyProfile): Promise<void> {
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
    console.log(`Saved ${symbol} profile to cache file`)
  } catch (error) {
    console.error(`Failed to cache ${symbol} profile:`, error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { symbols } = body

    if (!symbols || !Array.isArray(symbols)) {
      return NextResponse.json(
        { error: "Symbols array is required" },
        { status: 400 }
      )
    }

    const apiKey = process.env.ALPHA_VANTAGE_API_KEY

    // If no API key, try to load from file cache only
    if (!apiKey) {
      console.warn("ALPHA_VANTAGE_API_KEY not configured, using cached data only...")
      const results: Record<string, { name: string; sector: string; industry: string; officialSite?: string }> = {}

      for (const symbol of symbols) {
        const upperSymbol = symbol.toUpperCase()
        const fileCached = await readCachedProfile(upperSymbol)
        if (fileCached) {
          results[upperSymbol] = {
            name: fileCached.name,
            sector: fileCached.sector,
            industry: fileCached.industry,
            officialSite: fileCached.officialSite
          }
        } else {
          console.log(`No cached file for ${upperSymbol}, no data available without API key`)
        }
      }

      return NextResponse.json(results)
    }

    const results: Record<string, { name: string; sector: string; industry: string; officialSite?: string }> = {}

    for (const symbol of symbols) {
      const upperSymbol = symbol.toUpperCase()

      // Check file-based cache first
      const fileCached = await readCachedProfile(upperSymbol)
      if (fileCached) {
        results[upperSymbol] = {
          name: fileCached.name,
          sector: fileCached.sector,
          industry: fileCached.industry,
          officialSite: fileCached.officialSite
        }
        // Also store in memory cache for faster access
        companyCache.set(upperSymbol, {
          data: fileCached,
          timestamp: Date.now()
        })
        continue
      }

      // Check memory cache
      const cached = companyCache.get(upperSymbol)
      if (cached && Date.now() - cached.timestamp < COMPANY_CACHE_DURATION) {
        console.log(`Using memory cached data for ${upperSymbol}`)
        results[upperSymbol] = {
          name: cached.data.name,
          sector: cached.data.sector,
          industry: cached.data.industry,
          officialSite: cached.data.officialSite
        }
        continue
      }

      try {
        // Fetch from Alpha Vantage
        console.log(`Fetching company overview for ${upperSymbol} from API...`)
        const overview = await alphaVantageClient.getCompanyOverview(upperSymbol)

        if (!overview || !overview.Symbol) {
          console.warn(`No data returned for ${upperSymbol}`)
          const cachedData = await readCachedProfile(upperSymbol)
          if (cachedData) {
            console.log(`Using cached data for ${upperSymbol} due to API failure`)
            results[upperSymbol] = {
              name: cachedData.name,
              sector: cachedData.sector,
              industry: cachedData.industry,
              officialSite: cachedData.officialSite
            }
          }
          continue
        }

        const profile: CompanyProfile = {
          symbol: overview.Symbol || upperSymbol,
          name: overview.Name || upperSymbol,
          sector: overview.Sector || "Unknown",
          industry: overview.Industry || "Unknown",
          officialSite: overview.OfficialSite
        }

        // Cache the data in memory
        companyCache.set(upperSymbol, {
          data: profile,
          timestamp: Date.now()
        })

        // Save to file cache for persistence
        await writeCachedProfile(upperSymbol, profile)

        results[upperSymbol] = {
          name: profile.name,
          sector: profile.sector,
          industry: profile.industry,
          officialSite: profile.officialSite
        }

        console.log(`Fetched and cached company overview for ${upperSymbol}`)

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))

      } catch (_error) {
        console.error(`Error fetching ${upperSymbol}:`, _error)
        // Try to use cached data on any error
        const cachedData = await readCachedProfile(upperSymbol)
        if (cachedData) {
          console.log(`Using cached data for ${upperSymbol} due to error`)
          results[upperSymbol] = {
            name: cachedData.name,
            sector: cachedData.sector,
            industry: cachedData.industry,
            officialSite: cachedData.officialSite
          }
        }
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Error in company overview API route:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}