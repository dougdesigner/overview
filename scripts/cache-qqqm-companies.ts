#!/usr/bin/env tsx

/**
 * Script to fetch and cache company overview data for all QQQM holdings
 * This ensures we have sector/industry data for treemap visualization
 */

import fs from "fs/promises"
import path from "path"

const QQQM_FILE = path.join(process.cwd(), "src", "data", "etf-profiles", "QQQM.json")
const CACHE_DIR = path.join(process.cwd(), "src", "data", "company-profiles")
const API_URL = "http://localhost:3000/api/company-overview"
const BATCH_SIZE = 25 // Process 25 symbols at a time
const BATCH_DELAY = 1000 // 1 second delay between batches

interface QQQMHolding {
  symbol: string
  weight: number
}

interface QQQMProfile {
  symbol: string
  name: string
  holdings: QQQMHolding[]
}

async function main() {
  console.log("🚀 Starting QQQM company data caching process...")
  console.log()

  // Read QQQM holdings
  const qqqmData = JSON.parse(await fs.readFile(QQQM_FILE, "utf-8")) as QQQMProfile

  // Extract unique stock symbols (filter out n/a and money market funds)
  const allSymbols = qqqmData.holdings
    .map(h => h.symbol)
    .filter(s => s !== "n/a" && s !== "AGPXX") // Filter out non-stocks

  console.log(`📊 Found ${allSymbols.length} stock symbols in QQQM`)

  // Check which symbols are already cached
  const cachedSymbols: string[] = []
  const uncachedSymbols: string[] = []

  for (const symbol of allSymbols) {
    const cacheFile = path.join(CACHE_DIR, `${symbol}.json`)
    try {
      await fs.access(cacheFile)
      cachedSymbols.push(symbol)
    } catch {
      uncachedSymbols.push(symbol)
    }
  }

  console.log(`✅ Already cached: ${cachedSymbols.length} symbols`)
  console.log(`⏳ Need to fetch: ${uncachedSymbols.length} symbols`)
  console.log()

  if (uncachedSymbols.length === 0) {
    console.log("🎉 All symbols already cached! Nothing to do.")
    return
  }

  // Process in batches to respect rate limits
  const batches: string[][] = []
  for (let i = 0; i < uncachedSymbols.length; i += BATCH_SIZE) {
    batches.push(uncachedSymbols.slice(i, i + BATCH_SIZE))
  }

  console.log(`🔄 Processing ${batches.length} batch(es) of up to ${BATCH_SIZE} symbols each`)
  console.log()

  let totalFetched = 0
  let totalErrors = 0

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    console.log(`📦 Batch ${i + 1}/${batches.length}: Fetching ${batch.length} symbols...`)
    console.log(`   Symbols: ${batch.join(", ")}`)

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols: batch })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const fetchedCount = Object.keys(data).length
      totalFetched += fetchedCount

      console.log(`   ✅ Successfully fetched ${fetchedCount} companies`)

      // Check for any symbols that didn't return data
      const missingSymbols = batch.filter(s => !data[s])
      if (missingSymbols.length > 0) {
        console.log(`   ⚠️  No data returned for: ${missingSymbols.join(", ")}`)
        totalErrors += missingSymbols.length
      }
    } catch (error) {
      console.error(`   ❌ Error fetching batch:`, error)
      totalErrors += batch.length
    }

    // Delay between batches (except for the last one)
    if (i < batches.length - 1) {
      console.log(`   ⏸️  Waiting ${BATCH_DELAY}ms before next batch...`)
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY))
    }

    console.log()
  }

  // Final summary
  console.log("=" .repeat(60))
  console.log("📈 SUMMARY")
  console.log("=" .repeat(60))
  console.log(`Total symbols in QQQM: ${allSymbols.length}`)
  console.log(`Already cached before: ${cachedSymbols.length}`)
  console.log(`Newly fetched: ${totalFetched}`)
  console.log(`Errors/Missing: ${totalErrors}`)
  console.log(`Total cached now: ${cachedSymbols.length + totalFetched}`)
  console.log()

  if (totalErrors > 0) {
    console.log("⚠️  Some symbols failed to fetch. You may need to run this script again.")
  } else {
    console.log("🎉 All QQQM holdings successfully cached!")
  }

  console.log()
  console.log("💡 Next steps:")
  console.log("   1. Check the treemap visualization for proper sector groupings")
  console.log("   2. Run this script for other ETFs (VOO, SPY, etc.) if needed")
}

main().catch(error => {
  console.error("Fatal error:", error)
  process.exit(1)
})
