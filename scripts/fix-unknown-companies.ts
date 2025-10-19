#!/usr/bin/env tsx

/**
 * Script to fix company profiles that have "Unknown" sector/industry
 * These are companies where the initial API call failed or returned no data
 *
 * Usage:
 *   pnpm exec tsx scripts/fix-unknown-companies.ts        # Start from beginning
 *   pnpm exec tsx scripts/fix-unknown-companies.ts A      # Start from letter A
 *   pnpm exec tsx scripts/fix-unknown-companies.ts M      # Start from letter M
 */

import fs from "fs/promises"
import path from "path"

const CACHE_DIR = path.join(process.cwd(), "src", "data", "company-profiles")
const API_KEY = "4ZD7C2SAXMYRALJ8" // Using the API key from user's example
const BATCH_SIZE = 25 // Process 25 symbols at a time
const BATCH_DELAY = 1000 // 1 second delay between batches
const API_DELAY = 850 // 850ms between API calls to stay under 75 req/min limit

// Get starting letter from command line argument
const startingLetter = process.argv[2]?.toUpperCase() || null

interface CompanyProfile {
  symbol: string
  name: string
  sector: string
  industry: string
  officialSite?: string
  cachedAt?: string
  source?: string
}

async function fetchCompanyOverview(symbol: string): Promise<CompanyProfile | null> {
  const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${API_KEY}`

  try {
    console.log(`  Fetching ${symbol}...`)
    const response = await fetch(url)

    if (!response.ok) {
      console.error(`    ❌ HTTP error for ${symbol}: ${response.status}`)
      return null
    }

    const data = await response.json()

    // Check if we got valid data
    if (!data.Symbol || data.Note || data.Information) {
      // API limit or error message
      if (data.Note) {
        console.error(`    ⚠️  API limit reached: ${data.Note}`)
        throw new Error("API_LIMIT")
      }
      if (data.Information) {
        console.error(`    ⚠️  API info: ${data.Information}`)
        throw new Error("API_LIMIT")
      }
      console.log(`    ❌ No data returned for ${symbol}`)
      return null
    }

    // Extract the data we need
    const profile: CompanyProfile = {
      symbol: data.Symbol || symbol,
      name: data.Name || `${symbol} Company`,
      sector: data.Sector || "Unknown",
      industry: data.Industry || "Unknown",
      officialSite: data.OfficialSite,
      cachedAt: new Date().toISOString(),
      source: "Alpha Vantage API (fixed)"
    }

    // Log what we found
    console.log(`    ✅ ${profile.name}`)
    console.log(`       Sector: ${profile.sector}`)
    console.log(`       Industry: ${profile.industry}`)

    return profile
  } catch (error) {
    if (error instanceof Error && error.message === "API_LIMIT") {
      throw error // Re-throw API limit errors to stop processing
    }
    console.error(`    ❌ Error fetching ${symbol}:`, error instanceof Error ? error.message : String(error))
    return null
  }
}

async function updateCompanyProfile(symbol: string, profile: CompanyProfile): Promise<void> {
  const filePath = path.join(CACHE_DIR, `${symbol}.json`)
  await fs.writeFile(filePath, JSON.stringify(profile, null, 2))
}

async function main() {
  console.log("🔧 Fixing company profiles with Unknown sectors...")
  if (startingLetter) {
    console.log(`📍 Starting from letter: ${startingLetter}`)
  }
  console.log()

  // Get all JSON files in the cache directory
  const files = await fs.readdir(CACHE_DIR)
  const jsonFiles = files.filter(f => f.endsWith('.json'))

  console.log(`📁 Found ${jsonFiles.length} total company profiles`)

  // Find companies with Unknown sector
  let unknownCompanies: string[] = []

  for (const file of jsonFiles) {
    const filePath = path.join(CACHE_DIR, file)
    const content = await fs.readFile(filePath, 'utf-8')
    const data = JSON.parse(content) as CompanyProfile

    if (data.sector === "Unknown" || data.industry === "Unknown") {
      const symbol = file.replace('.json', '')
      unknownCompanies.push(symbol)
    }
  }

  console.log(`❓ Found ${unknownCompanies.length} companies with Unknown sector/industry`)

  // Filter by starting letter if provided
  if (startingLetter) {
    // Sort alphabetically first
    unknownCompanies.sort()

    // Find the index of the first symbol that starts with the specified letter or comes after it
    const startIndex = unknownCompanies.findIndex(symbol =>
      symbol.charAt(0).toUpperCase() >= startingLetter
    )

    if (startIndex === -1) {
      console.log(`❌ No companies found starting with ${startingLetter} or later`)
      return
    }

    unknownCompanies = unknownCompanies.slice(startIndex)
    console.log(`🔤 Filtered to ${unknownCompanies.length} companies starting from ${startingLetter}`)
  }

  console.log()

  // Ask user to confirm before proceeding with large batch
  if (unknownCompanies.length > 100) {
    console.log("⚠️  This will make many API calls. Starting with first 100 companies.")
    console.log("   Run the script again to continue with the next batch.")
    unknownCompanies.splice(100) // Limit to 100 for safety
  }

  // Process in batches
  const batches: string[][] = []
  for (let i = 0; i < unknownCompanies.length; i += BATCH_SIZE) {
    batches.push(unknownCompanies.slice(i, i + BATCH_SIZE))
  }

  console.log(`🔄 Processing ${batches.length} batch(es) of up to ${BATCH_SIZE} symbols each`)
  console.log()

  let totalFixed = 0
  let totalFailed = 0
  let totalSkipped = 0

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    console.log(`📦 Batch ${i + 1}/${batches.length}: ${batch.length} companies`)

    for (const symbol of batch) {
      try {
        // Fetch new data from API
        const profile = await fetchCompanyOverview(symbol)

        if (profile && profile.sector !== "Unknown") {
          // Update the file
          await updateCompanyProfile(symbol, profile)
          totalFixed++
        } else if (profile) {
          // Still unknown after API call
          console.log(`    ⚠️  ${symbol} still has Unknown sector`)
          totalSkipped++
        } else {
          totalFailed++
        }

        // Delay between API calls
        await new Promise(resolve => setTimeout(resolve, API_DELAY))

      } catch (error) {
        if (error instanceof Error && error.message === "API_LIMIT") {
          console.error("\n🛑 API rate limit reached. Please wait and run the script again.")
          break
        }
        console.error(`   ❌ Failed to process ${symbol}:`, error instanceof Error ? error.message : String(error))
        totalFailed++
      }
    }

    // Delay between batches
    if (i < batches.length - 1) {
      console.log(`   ⏸️  Waiting ${BATCH_DELAY}ms before next batch...`)
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY))
    }

    console.log()
  }

  // Final summary
  console.log("=".repeat(60))
  console.log("📈 SUMMARY")
  console.log("=".repeat(60))
  console.log(`Companies processed: ${totalFixed + totalFailed + totalSkipped}`)
  console.log(`✅ Fixed: ${totalFixed}`)
  console.log(`⚠️  Still unknown: ${totalSkipped}`)
  console.log(`❌ Failed: ${totalFailed}`)
  console.log()

  if (unknownCompanies.length === 100) {
    console.log("ℹ️  Only processed first 100 companies. Run again to continue.")
  }
}

main().catch(error => {
  console.error("Fatal error:", error)
  process.exit(1)
})