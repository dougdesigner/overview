#!/usr/bin/env tsx

/**
 * Test script to fix just NKE company profile
 */

import fs from "fs/promises"
import path from "path"

const CACHE_DIR = path.join(process.cwd(), "src", "data", "company-profiles")
const API_KEY = "4ZD7C2SAXMYRALJ8"

async function main() {
  console.log("🔧 Testing fix for NKE...")
  console.log()

  // Read current NKE data
  const filePath = path.join(CACHE_DIR, "NKE.json")
  const currentData = JSON.parse(await fs.readFile(filePath, 'utf-8'))
  console.log("Current NKE data:")
  console.log(JSON.stringify(currentData, null, 2))
  console.log()

  // Fetch new data from Alpha Vantage
  const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=NKE&apikey=${API_KEY}`
  console.log("Fetching from Alpha Vantage...")

  const response = await fetch(url)
  const data = await response.json()

  if (data.Symbol) {
    const newProfile = {
      symbol: data.Symbol || "NKE",
      name: data.Name || "Nike Inc",
      sector: data.Sector || "Unknown",
      industry: data.Industry || "Unknown",
      officialSite: data.OfficialSite,
      cachedAt: new Date().toISOString(),
      source: "Alpha Vantage API (fixed)"
    }

    console.log("\nNew NKE data:")
    console.log(JSON.stringify(newProfile, null, 2))

    // Update the file
    await fs.writeFile(filePath, JSON.stringify(newProfile, null, 2))
    console.log("\n✅ NKE profile updated successfully!")
  } else {
    console.error("\n❌ Failed to fetch NKE data:")
    console.log(JSON.stringify(data, null, 2))
  }
}

main().catch(error => {
  console.error("Error:", error)
  process.exit(1)
})