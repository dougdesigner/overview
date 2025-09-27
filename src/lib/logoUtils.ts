// Logo utility functions for fetching institution and ticker logos

// Map institution names to their domain names for logo.dev API
const institutionDomains: Record<string, string | null> = {
  "Fidelity Investments": "fidelity.com",
  Chase: "chase.com",
  Vanguard: "vanguard.com",
  Wealthfront: "wealthfront.com",
  "American Express": "americanexpress.com",
  "Charles Schwab": "schwab.com",
  "E*TRADE": "etrade.com",
  "TD Ameritrade": "tdameritrade.com",
  "Merrill Edge": "ml.com",
  Betterment: "betterment.com",
  Robinhood: "robinhood.com",
  "Bank of America": "bankofamerica.com",
  "Wells Fargo": "wellsfargo.com",
  Citibank: "citi.com",
  Other: null, // No logo for "Other"
}

/**
 * Get the logo URL for an institution using the logo.dev API
 * @param institution - The name of the institution
 * @returns The logo URL or null if not available
 */
export function getInstitutionLogoUrl(institution: string): string | null {
  const domain = institutionDomains[institution]
  const token = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN

  if (!domain || !token) return null

  // Logo.dev API with optimized parameters
  return `https://img.logo.dev/${domain}?token=${token}&retina=true&fallback=monogram&format=webp&size=128`
}

/**
 * Get the logo URL for a stock ticker using the logo.dev API
 * @param ticker - The stock ticker symbol
 * @returns The logo URL
 */
export function getTickerLogoUrl(ticker: string): string | null {
  const token = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN

  if (!ticker || !token) return null

  // Logo.dev API supports tickers directly with optimized parameters
  return `https://img.logo.dev/${ticker.toLowerCase()}?token=${token}&retina=true&fallback=monogram&format=webp&size=400`
}
