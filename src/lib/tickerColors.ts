// Ticker color mapping for consistent brand colors across the app

// Get color for ticker/symbol - returns Tailwind color class
export const getTickerColor = (ticker: string, type?: string | "stock" | "fund" | "cash"): string => {
  // Stock colors based on company brand
  const stockColors: Record<string, string> = {
    // Tech companies
    AAPL: "bg-gray-900", // Apple
    MSFT: "bg-blue-600", // Microsoft
    GOOGL: "bg-blue-600", // Google
    GOOG: "bg-blue-600", // Google
    AMZN: "bg-orange-600", // Amazon
    META: "bg-blue-600", // Meta/Facebook
    TSLA: "bg-red-600", // Tesla
    NVDA: "bg-green-600", // NVIDIA

    // Financial
    BRK: "bg-blue-700", // Berkshire
    "BRK.A": "bg-blue-700", // Berkshire A
    "BRK.B": "bg-blue-700", // Berkshire B
    JPM: "bg-blue-700", // JPMorgan Chase
    V: "bg-blue-600", // Visa
    MA: "bg-red-600", // Mastercard

    // Healthcare & Consumer
    JNJ: "bg-red-500", // Johnson & Johnson
    WMT: "bg-blue-500", // Walmart
    PG: "bg-blue-600", // Procter & Gamble
    HD: "bg-orange-600", // Home Depot
    DIS: "bg-blue-500", // Disney

    // Entertainment & Tech
    NFLX: "bg-red-600", // Netflix
    ADBE: "bg-red-600", // Adobe
    CRM: "bg-blue-500", // Salesforce
    ORCL: "bg-red-600", // Oracle
    INTC: "bg-blue-600", // Intel
    AMD: "bg-gray-900", // AMD
    PYPL: "bg-blue-600", // PayPal
    CSCO: "bg-blue-700", // Cisco
  }

  // ETF/Fund colors based on provider
  const fundColors: Record<string, string> = {
    // Vanguard funds - use Vanguard red
    VOO: "bg-red-600", // Vanguard S&P 500
    VTI: "bg-red-600", // Vanguard Total Market
    VTV: "bg-red-600", // Vanguard Value
    VUG: "bg-red-600", // Vanguard Growth
    VIG: "bg-red-600", // Vanguard Dividend
    VYM: "bg-red-600", // Vanguard High Dividend
    BND: "bg-red-600", // Vanguard Bond
    VXUS: "bg-red-600", // Vanguard International
    VNQ: "bg-red-600", // Vanguard REIT

    // SPDR funds - use gray
    SPY: "bg-gray-700", // SPDR S&P 500

    // iShares/BlackRock funds - use black
    IVV: "bg-gray-900", // iShares S&P 500
    IWM: "bg-gray-900", // iShares Russell 2000
    EFA: "bg-gray-900", // iShares MSCI EAFE
    AGG: "bg-gray-900", // iShares Core Aggregate Bond

    // Invesco funds
    QQQ: "bg-teal-600", // Invesco QQQ

    // ARK funds
    ARKK: "bg-purple-600", // ARK Innovation
    ARKG: "bg-purple-600", // ARK Genomic

    // Other
    GLD: "bg-yellow-600", // SPDR Gold
  }

  if (type === "stock" && stockColors[ticker]) {
    return stockColors[ticker]
  }

  if (type === "fund" && fundColors[ticker]) {
    return fundColors[ticker]
  }

  // Check both if type not specified
  if (!type) {
    return stockColors[ticker] || fundColors[ticker] || "bg-gray-500"
  }

  // Default colors
  return type === "stock" ? "bg-blue-500" : "bg-gray-500"
}

// Helper to determine if a ticker is a stock or fund
export const getTickerType = (ticker: string): "stock" | "fund" | "other" => {
  // Common fund patterns
  const fundPatterns = [
    /^V[A-Z]{2}$/, // Vanguard (VOO, VTI, etc.)
    /^SPY$/, /^SPD/, // SPDR
    /^I[A-Z]{2}$/, // iShares (IVV, IWM, etc.)
    /^QQQ$/, // Invesco
    /^ARK/, // ARK Invest
    /^GLD$/, /^SLV$/, // Commodity ETFs
    /^BND$/, /^AGG$/, // Bond ETFs
  ]

  if (fundPatterns.some(pattern => pattern.test(ticker))) {
    return "fund"
  }

  // If 3-4 letters and not identified as fund, likely a stock
  if (/^[A-Z]{1,5}$/.test(ticker)) {
    return "stock"
  }

  return "other"
}