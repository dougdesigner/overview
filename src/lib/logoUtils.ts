// Logo utility functions for fetching institution and ticker logos

// Map institution names to their domain names for logo.dev API
const institutionDomains: Record<string, string | null> = {
  "Ally Bank": "ally.com",
  "American Express": "americanexpress.com",
  "Bank of America": "bankofamerica.com",
  Betterment: "betterment.com",
  "Capital One": "capitalone.com",
  "Charles Schwab": "schwab.com",
  Chase: "chase.com",
  Citibank: "citi.com",
  "E*TRADE": "etrade.com",
  "Fidelity Investments": "fidelity.com",
  "Merrill Edge": "ml.com",
  "PNC Bank": "pnc.com",
  Robinhood: "robinhood.com",
  "TD Ameritrade": "tdameritrade.com",
  Vanguard: "vanguard.com",
  Wealthfront: "wealthfront.com",
  "Wells Fargo": "wellsfargo.com",
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
  return `https://img.logo.dev/${ticker.toLowerCase()}?token=${token}&retina=true&fallback=monogram&format=webp&size=600`
}
