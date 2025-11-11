/**
 * ETF Cache Utilities
 * Manages ETF holdings cache in localStorage and service memory caches
 */

import { etfDataService } from "./etfDataService"
import { enhancedExposureCalculator } from "./enhancedExposureCalculator"

const ETF_CACHE_PREFIX = "etf_holdings_"

/**
 * Clear all ETF-related caches
 * - Clears localStorage ETF cache entries
 * - Clears ETFDataService memory cache
 * - Clears EnhancedExposureCalculator internal state
 */
export function clearETFCache(): void {
  try {
    // Clear localStorage ETF cache
    const keysToRemove: string[] = []

    // Find all keys that start with the ETF cache prefix
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(ETF_CACHE_PREFIX)) {
        keysToRemove.push(key)
      }
    }

    // Remove all ETF cache keys
    keysToRemove.forEach((key) => {
      localStorage.removeItem(key)
    })

    console.log(`🗑️ Cleared ${keysToRemove.length} ETF localStorage cache entries`)

    // Clear service memory caches
    etfDataService.clearCache()
    enhancedExposureCalculator.clearCache()
  } catch (error) {
    console.error("Failed to clear ETF cache:", error)
  }
}

/**
 * Get count of ETF cache entries in localStorage
 */
export function getETFCacheCount(): number {
  try {
    let count = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(ETF_CACHE_PREFIX)) {
        count++
      }
    }
    return count
  } catch (error) {
    console.error("Failed to get ETF cache count:", error)
    return 0
  }
}

/**
 * Check if ETF cache has any entries
 */
export function hasETFCache(): boolean {
  return getETFCacheCount() > 0
}
