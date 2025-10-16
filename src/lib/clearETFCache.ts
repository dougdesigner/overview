/**
 * Utility to clear ETF cache from localStorage
 * Can be called from browser console or integrated into UI
 */
export function clearETFCache() {
  if (typeof window === "undefined") {
    console.log("This function must be run in the browser")
    return
  }

  const keys = Object.keys(localStorage)
  const etfKeys = keys.filter(k => k.startsWith("etf_holdings_"))

  etfKeys.forEach(key => {
    localStorage.removeItem(key)
    console.log(`Removed ${key} from localStorage`)
  })

  console.log(`Cleared ${etfKeys.length} ETF cache entries from localStorage`)
  console.log("Please refresh the page to fetch new data")
}

// Make it available globally in browser
if (typeof window !== "undefined") {
  (window as any).clearETFCache = clearETFCache
}