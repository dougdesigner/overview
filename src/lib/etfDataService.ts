import { ETFProfile } from "@/components/ui/data-table-exposure/types"

// Local storage keys for caching
const CACHE_PREFIX = 'etf_holdings_'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

interface CachedETFData {
  data: ETFProfile
  timestamp: number
}

/**
 * Service for fetching and caching ETF holdings data
 */
export class ETFDataService {
  private memoryCache: Map<string, ETFProfile> = new Map()

  /**
   * Fetch ETF holdings for multiple symbols
   * Uses local storage cache and falls back to API
   */
  async fetchETFHoldings(symbols: string[]): Promise<Map<string, ETFProfile>> {
    const results = new Map<string, ETFProfile>()
    const symbolsToFetch: string[] = []

    // Check cache first
    for (const symbol of symbols) {
      const cached = this.getCachedData(symbol)
      if (cached) {
        results.set(symbol, cached)
        console.log(`Using cached data for ${symbol} (${cached.holdings.length} holdings)`)
      } else {
        symbolsToFetch.push(symbol)
      }
    }

    // Fetch missing data from API
    if (symbolsToFetch.length > 0) {
      console.log(`Fetching ETF data for: ${symbolsToFetch.join(', ')}`)

      try {
        const response = await fetch('/api/etf-holdings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbols: symbolsToFetch })
        })

        if (response.ok) {
          const data = await response.json()

          for (const symbol of symbolsToFetch) {
            if (data[symbol]) {
              const profile = this.parseETFData(data[symbol])
              results.set(symbol, profile)
              this.setCachedData(symbol, profile)
              console.log(`Fetched ${profile.holdings.length} holdings for ${symbol}`)
            }
          }
        } else {
          console.error('Failed to fetch ETF data:', response.statusText)
        }
      } catch (error) {
        console.error('Error fetching ETF holdings:', error)
      }
    }

    return results
  }

  /**
   * Parse API response into ETFProfile format
   */
  private parseETFData(data: any): ETFProfile {
    return {
      symbol: data.symbol,
      name: data.name,
      holdings: (data.holdings || []).map((h: any) => ({
        symbol: h.symbol,
        name: h.name,
        weight: typeof h.weight === 'number' ? h.weight : parseFloat(h.weight) || 0,
        sector: h.sector,
        shares: h.shares
      })),
      lastUpdated: new Date(data.lastUpdated || Date.now())
    }
  }

  /**
   * Get cached data from local storage
   */
  private getCachedData(symbol: string): ETFProfile | null {
    // Check memory cache first
    if (this.memoryCache.has(symbol)) {
      return this.memoryCache.get(symbol)!
    }

    // Check local storage
    try {
      const key = `${CACHE_PREFIX}${symbol}`
      const cached = localStorage.getItem(key)

      if (cached) {
        const parsed: CachedETFData = JSON.parse(cached)

        // Check if cache is still valid
        if (Date.now() - parsed.timestamp < CACHE_DURATION) {
          const profile = {
            ...parsed.data,
            lastUpdated: new Date(parsed.data.lastUpdated)
          }

          // Store in memory cache for faster access
          this.memoryCache.set(symbol, profile)
          return profile
        } else {
          // Cache expired, remove it
          localStorage.removeItem(key)
        }
      }
    } catch (error) {
      console.error(`Error reading cache for ${symbol}:`, error)
    }

    return null
  }

  /**
   * Store data in local storage cache
   */
  private setCachedData(symbol: string, profile: ETFProfile): void {
    try {
      const key = `${CACHE_PREFIX}${symbol}`
      const cacheData: CachedETFData = {
        data: profile,
        timestamp: Date.now()
      }

      localStorage.setItem(key, JSON.stringify(cacheData))

      // Also store in memory cache
      this.memoryCache.set(symbol, profile)
    } catch (error) {
      console.error(`Error caching data for ${symbol}:`, error)
      // If localStorage is full, clear old ETF data
      this.clearOldCache()
    }
  }

  /**
   * Clear old cached ETF data
   */
  private clearOldCache(): void {
    try {
      const keys = Object.keys(localStorage)
      const etfKeys = keys.filter(k => k.startsWith(CACHE_PREFIX))

      // Remove oldest entries (keep last 10)
      if (etfKeys.length > 10) {
        const toRemove = etfKeys.slice(0, etfKeys.length - 10)
        toRemove.forEach(key => localStorage.removeItem(key))
        console.log(`Cleared ${toRemove.length} old ETF cache entries`)
      }
    } catch (error) {
      console.error('Error clearing cache:', error)
    }
  }

  /**
   * Clear all ETF cache
   */
  clearCache(): void {
    // Clear memory cache
    this.memoryCache.clear()

    // Clear localStorage
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key)
        }
      })
      console.log('Cleared all ETF cache')
    } catch (error) {
      console.error('Error clearing cache:', error)
    }
  }

  /**
   * Get statistics about cached data
   */
  getCacheStats(): { cached: string[], totalHoldings: number } {
    const cached: string[] = []
    let totalHoldings = 0

    for (const [symbol, profile] of this.memoryCache) {
      cached.push(symbol)
      totalHoldings += profile.holdings.length
    }

    return { cached, totalHoldings }
  }
}

// Export singleton instance
export const etfDataService = new ETFDataService()