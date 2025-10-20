import fs from "fs/promises"
import path from "path"

// Company profile data structure from Alpha Vantage
export interface CompanyProfile {
  symbol: string
  name: string
  sector?: string
  industry?: string
  officialSite?: string
  cachedAt?: string
  source?: string
}

// Directory containing cached company profiles
const PROFILES_DIR = path.join(
  process.cwd(),
  "src",
  "data",
  "company-profiles"
)

/**
 * Load a company profile from the cached JSON file
 * @param ticker - Stock ticker symbol
 * @returns CompanyProfile or null if not found
 */
export async function getCompanyProfile(
  ticker: string
): Promise<CompanyProfile | null> {
  try {
    const upperTicker = ticker.toUpperCase()
    const filePath = path.join(PROFILES_DIR, `${upperTicker}.json`)
    const fileContent = await fs.readFile(filePath, "utf-8")
    const profile = JSON.parse(fileContent) as CompanyProfile
    return profile
  } catch (error) {
    // File doesn't exist or can't be read
    return null
  }
}

/**
 * Extract domain from officialSite URL
 * @param officialSite - URL from company profile
 * @returns Clean domain or null
 */
export function extractDomainFromUrl(officialSite?: string): string | null {
  if (!officialSite) return null

  try {
    // Extract domain from full URL (e.g., "https://www.apple.com" → "apple.com")
    const cleanDomain = officialSite
      .replace(/^https?:\/\/(www\.)?/, "")
      .replace(/\/$/, "")
      .split("/")[0] // Take only the domain part, remove any paths

    return cleanDomain || null
  } catch (error) {
    return null
  }
}
