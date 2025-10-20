import { NextRequest, NextResponse } from "next/server"
import { getTickerLogoUrl, extractDomainsFromCompanyName } from "@/lib/logoUtils"
import { getCompanyProfile, extractDomainFromUrl } from "@/lib/companyProfileService"
import fs from "fs/promises"
import path from "path"

// File-based cache directory
const CACHE_DIR = path.join(process.cwd(), "src", "data", "logo-cache")

interface LogoCache {
  ticker: string
  logoUrl: string | null
  domain?: string
  companyName?: string
  source?: 'override' | 'providedDomain' | 'officialSite' | 'companyName' | 'etf' | 'mutualFund'
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
async function writeCachedLogo(
  ticker: string,
  logoUrl: string | null,
  domain?: string,
  companyName?: string,
  source?: LogoCache['source']
): Promise<void> {
  try {
    // Ensure directory exists
    await fs.mkdir(CACHE_DIR, { recursive: true })

    const filePath = path.join(CACHE_DIR, `${ticker}.json`)
    const dataToCache: LogoCache = {
      ticker,
      logoUrl,
      domain,
      companyName,
      source,
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
    const token = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN

    for (let i = 0; i < tickers.length; i++) {
      const ticker = tickers[i]
      const upperTicker = ticker.toUpperCase()
      const providedDomain = domains?.[i]

      // Check file-based cache first
      const fileCached = await readCachedLogo(upperTicker)
      if (fileCached && fileCached.logoUrl) {
        results[upperTicker] = fileCached.logoUrl
        continue
      }

      let logoUrl: string | null = null
      let usedDomain: string | undefined
      let companyName: string | undefined
      let source: LogoCache['source'] | undefined

      // Try existing logic first (checks overrides, provided domain, ETF/mutual fund domains)
      logoUrl = getTickerLogoUrl(upperTicker, providedDomain)

      if (logoUrl) {
        // We got a logo from overrides or provided domain
        source = providedDomain ? 'providedDomain' : 'override'
        usedDomain = providedDomain
      } else if (token) {
        // No logo yet - try company profile data
        const profile = await getCompanyProfile(upperTicker)

        if (profile) {
          companyName = profile.name

          // Strategy 1: Try officialSite from Alpha Vantage
          if (profile.officialSite) {
            const officialDomain = extractDomainFromUrl(profile.officialSite)
            if (officialDomain) {
              logoUrl = `https://img.logo.dev/${officialDomain}?token=${token}&retina=true&fallback=monogram&format=webp&size=400`
              usedDomain = officialDomain
              source = 'officialSite'
            }
          }

          // Strategy 2: Try extracting domain from company name
          if (!logoUrl && profile.name) {
            const potentialDomains = extractDomainsFromCompanyName(profile.name)
            if (potentialDomains.length > 0) {
              // Try the first potential domain (most likely to work)
              const firstDomain = potentialDomains[0]
              logoUrl = `https://img.logo.dev/${firstDomain}?token=${token}&retina=true&fallback=monogram&format=webp&size=400`
              usedDomain = firstDomain
              source = 'companyName'
            }
          }
        }
      }

      // Cache the result (even if null)
      await writeCachedLogo(upperTicker, logoUrl, usedDomain, companyName, source)

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
