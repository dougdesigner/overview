// Shared utilities for institution-related functionality

// Map institutions to labels (must be defined first for use in other functions)
export const institutionLabels: Record<string, string> = {
  ally: "Ally Bank",
  amex: "American Express",
  betterment: "Betterment",
  bofa: "Bank of America",
  "capital-one": "Capital One",
  carta: "Carta",
  chase: "Chase",
  citi: "Citibank",
  etrade: "E*TRADE",
  fidelity: "Fidelity Investments",
  merrill: "Merrill Edge",
  pnc: "PNC Bank",
  robinhood: "Robinhood",
  schwab: "Charles Schwab",
  "td-ameritrade": "TD Ameritrade",
  vanguard: "Vanguard",
  wealthfront: "Wealthfront",
  "wells-fargo": "Wells Fargo",
  other: "Other",
}

/**
 * Convert kebab-case or snake_case to Title Case
 * e.g., "capital-one" → "Capital One", "wells_fargo" → "Wells Fargo"
 */
export const toTitleCase = (str: string): string => {
  return str
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

/**
 * Get the display label for an institution
 * Tries the lookup table first, falls back to converting to title case
 */
export const getInstitutionDisplayLabel = (institution: string): string => {
  return institutionLabels[institution] || toTitleCase(institution)
}

// Get institution brand color
export const getInstitutionBrandColor = (institution: string): string => {
  const brandColors: Record<string, string> = {
    ally: "bg-purple-600",
    fidelity: "bg-emerald-600",
    chase: "bg-blue-600",
    vanguard: "bg-red-600",
    wealthfront: "bg-purple-600",
    amex: "bg-blue-700",
    schwab: "bg-orange-600",
    etrade: "bg-purple-700",
    "td-ameritrade": "bg-green-600",
    merrill: "bg-blue-600",
    betterment: "bg-blue-500",
    robinhood: "bg-green-500",
    bofa: "bg-red-700",
    "wells-fargo": "bg-red-600",
    citi: "bg-blue-600",
    carta: "bg-blue-600",
    pnc: "bg-orange-600",
    "capital-one": "bg-red-600",
  }
  return brandColors[institution] || "bg-gray-500"
}

// Get institution initials for logo fallback
export const getInstitutionInitials = (institutionLabel: string): string => {
  const words = institutionLabel.split(" ")
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase()
  }
  return words
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase()
}