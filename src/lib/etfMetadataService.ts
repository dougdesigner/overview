// Service for fetching and caching ETF metadata (name, description)
// This is separate from holdings data to keep things lightweight

import { getFromStorage, setToStorage } from "@/lib/localStorage"
import { KNOWN_ETF_NAMES, getKnownETFName } from "@/lib/knownETFNames"

interface ETFMetadata {
  symbol: string
  name: string
  description?: string
  lastPrice?: number
  previousClose?: number
  changePercent?: number
  volume?: number
  lastPriceUpdate?: Date
  lastUpdated: Date
}

// Cache key for ETF metadata
const CACHE_KEY = 'etf_metadata'
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

class ETFMetadataService {
  private metadataCache: Map<string, ETFMetadata> = new Map()
  private initialized = false

  /**
   * Initialize the service by loading cached metadata
   */
  private async initialize() {
    if (this.initialized) return

    const cached = getFromStorage<Record<string, ETFMetadata>>(CACHE_KEY)
    if (cached) {
      Object.entries(cached).forEach(([symbol, metadata]) => {
        this.metadataCache.set(symbol, {
          ...metadata,
          lastUpdated: new Date(metadata.lastUpdated)
        })
      })
    }

    this.initialized = true
  }

  /**
   * Get ETF name for a ticker symbol
   */
  async getETFName(symbol: string): Promise<string> {
    await this.initialize()

    const upperSymbol = symbol.toUpperCase()

    // First, check if we have a known name locally
    const knownName = getKnownETFName(upperSymbol)
    if (knownName) {
      // Cache the known name for consistency
      const metadata: ETFMetadata = {
        symbol: upperSymbol,
        name: knownName,
        lastUpdated: new Date()
      }
      this.metadataCache.set(upperSymbol, metadata)
      this.saveCache()
      return knownName
    }

    // Check cache for API-fetched names
    const cached = this.metadataCache.get(upperSymbol)
    if (cached && this.isCacheValid(cached.lastUpdated)) {
      return cached.name
    }

    // Try to fetch from API for unknown ETFs
    const metadata = await this.fetchETFMetadata(upperSymbol)
    if (metadata) {
      return metadata.name
    }

    // Final fallback
    return `${upperSymbol} ETF`
  }

  /**
   * Get ETF metadata for multiple symbols
   */
  async getETFMetadataBatch(symbols: string[]): Promise<Map<string, ETFMetadata>> {
    await this.initialize()

    const results = new Map<string, ETFMetadata>()
    const symbolsToFetch: string[] = []

    // Check for known names and cache for each symbol
    for (const symbol of symbols) {
      const upperSymbol = symbol.toUpperCase()

      // First, check if we have a known name locally
      const knownName = getKnownETFName(upperSymbol)
      if (knownName) {
        const metadata: ETFMetadata = {
          symbol: upperSymbol,
          name: knownName,
          lastUpdated: new Date()
        }
        this.metadataCache.set(upperSymbol, metadata)
        results.set(upperSymbol, metadata)
        continue
      }

      // Check cache for API-fetched names
      const cached = this.metadataCache.get(upperSymbol)
      if (cached && this.isCacheValid(cached.lastUpdated)) {
        results.set(upperSymbol, cached)
      } else {
        symbolsToFetch.push(upperSymbol)
      }
    }

    // Fetch missing metadata for unknown ETFs
    if (symbolsToFetch.length > 0) {
      const fetched = await this.fetchETFMetadataBatch(symbolsToFetch)
      fetched.forEach((metadata, symbol) => {
        results.set(symbol, metadata)
      })
    }

    // Save cache after batch operation
    this.saveCache()

    return results
  }

  /**
   * Fetch ETF metadata from API
   */
  private async fetchETFMetadata(symbol: string): Promise<ETFMetadata | null> {
    try {
      const response = await fetch('/api/etf-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: [symbol] })
      })

      if (response.ok) {
        const data = await response.json()
        if (data[symbol]) {
          const metadata: ETFMetadata = {
            symbol,
            name: data[symbol].name || KNOWN_ETF_NAMES[symbol] || `${symbol} ETF`,
            description: data[symbol].description,
            lastUpdated: new Date()
          }

          // Cache the result
          this.metadataCache.set(symbol, metadata)
          this.saveCache()

          return metadata
        }
      }
    } catch (error) {
      console.error(`Error fetching metadata for ${symbol}:`, error)
    }

    // Fallback to known names
    const fallbackName = KNOWN_ETF_NAMES[symbol]
    if (fallbackName) {
      const metadata: ETFMetadata = {
        symbol,
        name: fallbackName,
        lastUpdated: new Date()
      }

      this.metadataCache.set(symbol, metadata)
      this.saveCache()
      return metadata
    }

    return null
  }

  /**
   * Fetch ETF metadata for multiple symbols
   */
  private async fetchETFMetadataBatch(symbols: string[]): Promise<Map<string, ETFMetadata>> {
    const results = new Map<string, ETFMetadata>()

    try {
      const response = await fetch('/api/etf-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols })
      })

      if (response.ok) {
        const data = await response.json()

        for (const symbol of symbols) {
          if (data[symbol]) {
            const metadata: ETFMetadata = {
              symbol,
              name: data[symbol].name || KNOWN_ETF_NAMES[symbol] || `${symbol} ETF`,
              description: data[symbol].description,
              lastUpdated: new Date()
            }

            this.metadataCache.set(symbol, metadata)
            results.set(symbol, metadata)
          } else {
            // Use fallback for this symbol
            const fallbackName = KNOWN_ETF_NAMES[symbol] || `${symbol} ETF`
            const metadata: ETFMetadata = {
              symbol,
              name: fallbackName,
              lastUpdated: new Date()
            }

            this.metadataCache.set(symbol, metadata)
            results.set(symbol, metadata)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching ETF metadata batch:', error)

      // Use fallbacks for all symbols
      for (const symbol of symbols) {
        const fallbackName = KNOWN_ETF_NAMES[symbol] || `${symbol} ETF`
        const metadata: ETFMetadata = {
          symbol,
          name: fallbackName,
          lastUpdated: new Date()
        }

        this.metadataCache.set(symbol, metadata)
        results.set(symbol, metadata)
      }
    }

    this.saveCache()
    return results
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(lastUpdated: Date): boolean {
    return Date.now() - lastUpdated.getTime() < CACHE_DURATION
  }

  /**
   * Save metadata cache to localStorage
   */
  private saveCache(): void {
    const cacheData: Record<string, ETFMetadata> = {}
    this.metadataCache.forEach((metadata, symbol) => {
      cacheData[symbol] = metadata
    })
    setToStorage(CACHE_KEY, cacheData)
  }

  /**
   * Clear the metadata cache
   */
  clearCache(): void {
    this.metadataCache.clear()
    localStorage.removeItem(CACHE_KEY)
  }
}

// Export singleton instance
export const etfMetadataService = new ETFMetadataService()

// Export for direct use in components
export async function getETFName(symbol: string): Promise<string> {
  return etfMetadataService.getETFName(symbol)
}