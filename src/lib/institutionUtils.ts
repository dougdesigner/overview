// Shared utilities for institution-related functionality

// Get institution brand color
export const getInstitutionBrandColor = (institution: string): string => {
  const brandColors: Record<string, string> = {
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

// Map institutions to labels (matching the names in logoUtils)
export const institutionLabels: Record<string, string> = {
  fidelity: "Fidelity Investments",
  vanguard: "Vanguard",
  schwab: "Charles Schwab",
  etrade: "E*TRADE",
  "td-ameritrade": "TD Ameritrade",
  merrill: "Merrill Edge",
  wealthfront: "Wealthfront",
  betterment: "Betterment",
  robinhood: "Robinhood",
  chase: "Chase",
  bofa: "Bank of America",
  "wells-fargo": "Wells Fargo",
  citi: "Citibank",
  amex: "American Express",
  other: "Other",
}