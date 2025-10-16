// Service for fetching and caching stock/ETF prices from Alpha Vantage
import { getFromStorage, setToStorage } from "@/lib/localStorage"

interface PriceData {
  symbol: string
  lastPrice: number
  previousClose: number
  changePercent: number
  volume: number
  lastUpdated: Date
}

interface CachedPriceData {
  data: PriceData
  timestamp: number
}

// Cache keys
const PRICE_CACHE_KEY = 'stock_prices'
const PRICE_CACHE_DURATION = 15 * 60 * 1000 // 15 minutes for price data

// Popular ETFs to pre-cache
const POPULAR_ETFS = ['QQQ', 'QQQM', 'SPY', 'VOO', 'VTI', 'VXUS', 'IVV', 'BND', 'AGG', 'VEA', 'VWO']

class StockPriceService {
  private priceCache: Map<string, PriceData> = new Map()
  private initialized = false

  /**
   * Initialize the service and load cached prices
   */
  private async initialize() {
    if (this.initialized) return

    const cached = getFromStorage<Record<string, CachedPriceData>>(PRICE_CACHE_KEY)
    if (cached) {
      const now = Date.now()
      Object.entries(cached).forEach(([symbol, item]) => {
        // Only load prices that are still fresh
        if (now - item.timestamp < PRICE_CACHE_DURATION) {
          this.priceCache.set(symbol, {
            ...item.data,
            lastUpdated: new Date(item.data.lastUpdated)
          })
        }
      })
    }

    this.initialized = true
  }

  /**
   * Get current price for a ticker
   */
  async getPrice(symbol: string): Promise<PriceData | null> {
    await this.initialize()

    const upperSymbol = symbol.toUpperCase()

    // Check cache first
    const cached = this.priceCache.get(upperSymbol)
    if (cached && this.isPriceCacheFresh(cached.lastUpdated)) {
      return cached
    }

    // Fetch from API
    return this.fetchPrice(upperSymbol)
  }

  /**
   * Get prices for multiple symbols
   */
  async getPrices(symbols: string[]): Promise<Map<string, PriceData>> {
    await this.initialize()

    const results = new Map<string, PriceData>()
    const symbolsToFetch: string[] = []

    // Check cache for each symbol
    for (const symbol of symbols) {
      const upperSymbol = symbol.toUpperCase()
      const cached = this.priceCache.get(upperSymbol)

      if (cached && this.isPriceCacheFresh(cached.lastUpdated)) {
        results.set(upperSymbol, cached)
      } else {
        symbolsToFetch.push(upperSymbol)
      }
    }

    // Fetch missing prices
    if (symbolsToFetch.length > 0) {
      const fetched = await this.fetchPriceBatch(symbolsToFetch)
      fetched.forEach((price, symbol) => {
        results.set(symbol, price)
      })
    }

    return results
  }

  /**
   * Fetch price from API
   */
  private async fetchPrice(symbol: string): Promise<PriceData | null> {
    try {
      const response = await fetch('/api/stock-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: [symbol] })
      })

      if (response.ok) {
        const data = await response.json()
        if (data[symbol]) {
          const priceData: PriceData = {
            symbol,
            lastPrice: data[symbol].lastPrice,
            previousClose: data[symbol].previousClose,
            changePercent: data[symbol].changePercent,
            volume: data[symbol].volume,
            lastUpdated: new Date()
          }

          this.cachePriceData(symbol, priceData)
          return priceData
        }
      }
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error)
    }

    return null
  }

  /**
   * Fetch prices for multiple symbols
   */
  private async fetchPriceBatch(symbols: string[]): Promise<Map<string, PriceData>> {
    const results = new Map<string, PriceData>()

    try {
      const response = await fetch('/api/stock-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols })
      })

      if (response.ok) {
        const data = await response.json()

        for (const symbol of symbols) {
          if (data[symbol]) {
            const priceData: PriceData = {
              symbol,
              lastPrice: data[symbol].lastPrice,
              previousClose: data[symbol].previousClose,
              changePercent: data[symbol].changePercent,
              volume: data[symbol].volume,
              lastUpdated: new Date()
            }

            this.cachePriceData(symbol, priceData)
            results.set(symbol, priceData)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching price batch:', error)
    }

    return results
  }

  /**
   * Cache price data
   */
  private cachePriceData(symbol: string, priceData: PriceData) {
    this.priceCache.set(symbol, priceData)
    this.saveCache()
  }

  /**
   * Save price cache to localStorage
   */
  private saveCache() {
    const cacheData: Record<string, CachedPriceData> = {}
    this.priceCache.forEach((price, symbol) => {
      cacheData[symbol] = {
        data: price,
        timestamp: Date.now()
      }
    })
    setToStorage(PRICE_CACHE_KEY, cacheData)
  }

  /**
   * Check if price cache is still fresh (15 minutes)
   */
  private isPriceCacheFresh(lastUpdated: Date): boolean {
    return Date.now() - lastUpdated.getTime() < PRICE_CACHE_DURATION
  }

  /**
   * Pre-fetch popular ETF prices
   */
  async prefetchPopularETFs(): Promise<void> {
    await this.getPrices(POPULAR_ETFS)
  }

  /**
   * Clear price cache
   */
  clearCache() {
    this.priceCache.clear()
    localStorage.removeItem(PRICE_CACHE_KEY)
  }
}

// Export singleton instance
export const stockPriceService = new StockPriceService()

// Export convenience functions
export async function getStockPrice(symbol: string): Promise<number | null> {
  const priceData = await stockPriceService.getPrice(symbol)
  return priceData?.lastPrice || null
}

export async function getStockPrices(symbols: string[]): Promise<Map<string, number>> {
  const priceData = await stockPriceService.getPrices(symbols)
  const results = new Map<string, number>()

  priceData.forEach((data, symbol) => {
    results.set(symbol, data.lastPrice)
  })

  return results
}