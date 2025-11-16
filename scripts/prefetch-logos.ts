#!/usr/bin/env tsx

/**
 * Logo Prefetch Script
 *
 * This script pre-fetches and caches logos for the top 80 S&P 500 companies
 * to improve initial load performance. It uses the existing logo caching
 * infrastructure in src/data/logo-cache/.
 *
 * Usage: pnpm run prefetch:logos
 */

import * as fs from "fs/promises"
import * as path from "path"
import sp500Data from "../src/data/sp500-top-80.json"
import { getTickerLogoUrl } from "../src/lib/logoUtils"

// File-based cache directory
const CACHE_DIR = path.join(process.cwd(), "src", "data", "logo-cache")

interface LogoCache {
  ticker: string
  logoUrl: string | null
  domain?: string
  companyName?: string
  source?: 'override' | 'providedDomain' | 'officialSite' | 'companyName' | 'etf' | 'mutualFund' | 'prefetch'
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
async function writeCachedLogo(data: {
  ticker: string
  logoUrl: string | null
  domain?: string
  companyName?: string
  source?: LogoCache['source']
}): Promise<void> {
  try {
    // Ensure directory exists
    await fs.mkdir(CACHE_DIR, { recursive: true })

    const filePath = path.join(CACHE_DIR, `${data.ticker}.json`)
    const dataToCache: LogoCache = {
      ticker: data.ticker,
      logoUrl: data.logoUrl,
      domain: data.domain,
      companyName: data.companyName,
      source: data.source,
      cachedAt: new Date().toISOString()
    }

    await fs.writeFile(filePath, JSON.stringify(dataToCache, null, 2))
  } catch (error) {
    console.error(`Failed to cache logo for ${data.ticker}:`, error)
  }
}

interface SP500Company {
  symbol: string
  name: string
  marketCap: number
}

interface PrefetchResult {
  ticker: string
  success: boolean
  logoUrl: string | null
  source: string
  error?: string
}

async function prefetchLogos() {
  console.log("🚀 Starting logo prefetch for top 80 S&P 500 companies...\n")

  const companies = sp500Data as SP500Company[]
  const results: PrefetchResult[] = []
  let successCount = 0
  let cacheHitCount = 0
  let cacheMissCount = 0
  let errorCount = 0

  // Process logos in batches to avoid overwhelming the API
  const batchSize = 10
  for (let i = 0; i < companies.length; i += batchSize) {
    const batch = companies.slice(i, Math.min(i + batchSize, companies.length))

    console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(companies.length / batchSize)} (${batch.length} companies)`)

    // Process batch in parallel
    const batchPromises = batch.map(async (company) => {
      const ticker = company.symbol.toUpperCase()

      try {
        // Check if logo is already cached
        const cached = await readCachedLogo(ticker)

        if (cached) {
          console.log(`  ✓ ${ticker.padEnd(6)} - Cache hit`)
          cacheHitCount++
          return {
            ticker,
            success: true,
            logoUrl: cached.logoUrl,
            source: "cache",
          }
        }

        // Not cached, fetch it
        console.log(`  ⏳ ${ticker.padEnd(6)} - Fetching...`)
        const logoUrl = await getTickerLogoUrl(ticker)

        if (logoUrl) {
          // Write to cache
          await writeCachedLogo({
            ticker,
            logoUrl,
            source: "prefetch",
            companyName: company.name,
          })

          console.log(`  ✓ ${ticker.padEnd(6)} - Cached successfully`)
          cacheMissCount++
          successCount++
          return {
            ticker,
            success: true,
            logoUrl,
            source: "fetched",
          }
        } else {
          console.log(`  ⚠️  ${ticker.padEnd(6)} - No logo URL found`)

          // Still write to cache with null to prevent repeated lookups
          await writeCachedLogo({
            ticker,
            logoUrl: null,
            source: "prefetch",
            companyName: company.name,
          })

          return {
            ticker,
            success: false,
            logoUrl: null,
            source: "not_found",
          }
        }
      } catch (error) {
        console.error(`  ❌ ${ticker.padEnd(6)} - Error: ${error instanceof Error ? error.message : String(error)}`)
        errorCount++
        return {
          ticker,
          success: false,
          logoUrl: null,
          source: "error",
          error: error instanceof Error ? error.message : String(error),
        }
      }
    })

    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)

    // Small delay between batches to be nice to the API
    if (i + batchSize < companies.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(60))
  console.log("📊 PREFETCH SUMMARY")
  console.log("=".repeat(60))
  console.log(`Total companies:     ${companies.length}`)
  console.log(`Cache hits:          ${cacheHitCount} (already cached)`)
  console.log(`Newly fetched:       ${cacheMissCount}`)
  console.log(`Successful:          ${successCount + cacheHitCount}`)
  console.log(`Not found:           ${results.filter(r => r.source === "not_found").length}`)
  console.log(`Errors:              ${errorCount}`)
  console.log("=".repeat(60))

  // Show companies without logos
  const missingLogos = results.filter(r => !r.logoUrl)
  if (missingLogos.length > 0) {
    console.log("\n⚠️  Companies without logos:")
    missingLogos.forEach(r => {
      console.log(`   - ${r.ticker}`)
    })
  }

  console.log("\n✅ Logo prefetch complete!\n")
}

// Run the prefetch
prefetchLogos().catch((error) => {
  console.error("❌ Fatal error during prefetch:", error)
  process.exit(1)
})
