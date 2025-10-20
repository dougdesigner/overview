import { NextRequest, NextResponse } from "next/server"
import { getTickerLogoUrl } from "@/lib/logoUtils"
import fs from "fs/promises"
import path from "path"

// File-based cache directory
const CACHE_DIR = path.join(process.cwd(), "src", "data", "logo-cache")

interface LogoCache {
  ticker: string
  logoUrl: string | null
  domain?: string
  cachedAt: string
}

// Helper function to read cached logo URL from file
async function readCachedLogo(ticker: string): Promise<LogoCache | null> {
  try {
    const filePath = path.join(CACHE_DIR, `${ticker}.json`)
    const fileContent = await fs.readFile(filePath, "utf-8")
    const data = JSON.parse(fileContent)
    return data
  } catch (error) {
    // File doesn't exist or can't be read
    return null
  }
}

// Helper function to write logo URL to cache file
async function writeCachedLogo(ticker: string, logoUrl: string | null, domain?: string): Promise<void> {
  try {
    // Ensure directory exists
    await fs.mkdir(CACHE_DIR, { recursive: true })

    const filePath = path.join(CACHE_DIR, `${ticker}.json`)
    const dataToCache: LogoCache = {
      ticker,
      logoUrl,
      domain,
      cachedAt: new Date().toISOString()
    }

    await fs.writeFile(filePath, JSON.stringify(dataToCache, null, 2))
  } catch (error) {
    console.error(`Failed to cache logo for ${ticker}:`, error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tickers, domains } = body

    if (!tickers || !Array.isArray(tickers)) {
      return NextResponse.json(
        { error: "Tickers array is required" },
        { status: 400 }
      )
    }

    const results: Record<string, string | null> = {}

    for (let i = 0; i < tickers.length; i++) {
      const ticker = tickers[i]
      const upperTicker = ticker.toUpperCase()
      const domain = domains?.[i]

      // Check file-based cache first
      const fileCached = await readCachedLogo(upperTicker)
      if (fileCached && fileCached.logoUrl) {
        results[upperTicker] = fileCached.logoUrl
        continue
      }

      // Generate logo URL using existing logic
      const logoUrl = getTickerLogoUrl(upperTicker, domain)

      // Cache the result (even if null)
      await writeCachedLogo(upperTicker, logoUrl, domain)

      results[upperTicker] = logoUrl
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Error in logo URL API route:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
