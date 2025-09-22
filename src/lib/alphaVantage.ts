interface ETFProfileResponse {
  symbol: string
  name: string
  assetType: string
  holdings?: {
    data: Array<{
      symbol: string
      name: string
      weight: string
      shares?: string
    }>
  }
}

interface CacheEntry {
  data: ETFProfileResponse
  timestamp: number
}

class AlphaVantageClient {
  private baseURL = "https://www.alphavantage.co/query"
  private cache: Map<string, CacheEntry> = new Map()
  private cacheDuration: number

  constructor() {
    this.cacheDuration = parseInt(process.env.ALPHA_VANTAGE_CACHE_DURATION || "86400") * 1000
  }

  private getCacheKey(symbol: string, func: string): string {
    return `${func}:${symbol}`
  }

  private getFromCache(key: string): ETFProfileResponse | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > this.cacheDuration) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  private setCache(key: string, data: ETFProfileResponse): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  async getETFProfile(symbol: string): Promise<ETFProfileResponse | null> {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY

    if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
      console.warn("Alpha Vantage API key not configured. Using mock data.")
      return this.getMockETFProfile(symbol)
    }

    const cacheKey = this.getCacheKey(symbol, "ETF_PROFILE")
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      console.log(`Using cached data for ${symbol}`)
      return cached
    }

    try {
      const url = new URL(this.baseURL)
      url.searchParams.append("function", "ETF_PROFILE")
      url.searchParams.append("symbol", symbol)
      url.searchParams.append("apikey", apiKey)

      const response = await fetch(url.toString())

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()

      if (data["Error Message"] || data["Note"]) {
        console.error("Alpha Vantage API error:", data["Error Message"] || data["Note"])
        return this.getMockETFProfile(symbol)
      }

      this.setCache(cacheKey, data)
      return data as ETFProfileResponse
    } catch (error) {
      console.error(`Error fetching ETF profile for ${symbol}:`, error)
      return this.getMockETFProfile(symbol)
    }
  }

  private getMockETFProfile(symbol: string): ETFProfileResponse {
    const mockData: Record<string, ETFProfileResponse> = {
      VOO: {
        symbol: "VOO",
        name: "Vanguard S&P 500 ETF",
        assetType: "ETF",
        holdings: {
          data: [
            { symbol: "AAPL", name: "Apple Inc.", weight: "7.28" },
            { symbol: "MSFT", name: "Microsoft Corporation", weight: "7.03" },
            { symbol: "AMZN", name: "Amazon.com Inc.", weight: "3.51" },
            { symbol: "NVDA", name: "NVIDIA Corporation", weight: "3.12" },
            { symbol: "GOOGL", name: "Alphabet Inc. Class A", weight: "2.15" },
            { symbol: "META", name: "Meta Platforms Inc.", weight: "2.38" },
            { symbol: "GOOG", name: "Alphabet Inc. Class C", weight: "1.84" },
            { symbol: "BRK.B", name: "Berkshire Hathaway Inc. Class B", weight: "1.69" },
            { symbol: "TSLA", name: "Tesla Inc.", weight: "1.62" },
            { symbol: "JPM", name: "JPMorgan Chase & Co.", weight: "1.27" }
          ]
        }
      },
      VTI: {
        symbol: "VTI",
        name: "Vanguard Total Stock Market ETF",
        assetType: "ETF",
        holdings: {
          data: [
            { symbol: "AAPL", name: "Apple Inc.", weight: "6.52" },
            { symbol: "MSFT", name: "Microsoft Corporation", weight: "6.31" },
            { symbol: "AMZN", name: "Amazon.com Inc.", weight: "3.15" },
            { symbol: "NVDA", name: "NVIDIA Corporation", weight: "2.81" },
            { symbol: "GOOGL", name: "Alphabet Inc. Class A", weight: "1.93" },
            { symbol: "META", name: "Meta Platforms Inc.", weight: "2.14" },
            { symbol: "GOOG", name: "Alphabet Inc. Class C", weight: "1.65" },
            { symbol: "BRK.B", name: "Berkshire Hathaway Inc. Class B", weight: "1.52" },
            { symbol: "TSLA", name: "Tesla Inc.", weight: "1.46" },
            { symbol: "UNH", name: "UnitedHealth Group Inc.", weight: "1.14" }
          ]
        }
      },
      QQQ: {
        symbol: "QQQ",
        name: "Invesco QQQ Trust",
        assetType: "ETF",
        holdings: {
          data: [
            { symbol: "AAPL", name: "Apple Inc.", weight: "8.94" },
            { symbol: "MSFT", name: "Microsoft Corporation", weight: "8.64" },
            { symbol: "AMZN", name: "Amazon.com Inc.", weight: "5.42" },
            { symbol: "NVDA", name: "NVIDIA Corporation", weight: "4.85" },
            { symbol: "META", name: "Meta Platforms Inc.", weight: "4.78" },
            { symbol: "GOOGL", name: "Alphabet Inc. Class A", weight: "2.64" },
            { symbol: "GOOG", name: "Alphabet Inc. Class C", weight: "2.54" },
            { symbol: "TSLA", name: "Tesla Inc.", weight: "2.51" },
            { symbol: "AVGO", name: "Broadcom Inc.", weight: "2.34" },
            { symbol: "PEP", name: "PepsiCo Inc.", weight: "1.45" }
          ]
        }
      },
      QQQM: {
        symbol: "QQQM",
        name: "Invesco NASDAQ 100 ETF",
        assetType: "ETF",
        holdings: {
          data: [
            { symbol: "AAPL", name: "Apple Inc.", weight: "8.94" },
            { symbol: "MSFT", name: "Microsoft Corporation", weight: "8.64" },
            { symbol: "AMZN", name: "Amazon.com Inc.", weight: "5.42" },
            { symbol: "NVDA", name: "NVIDIA Corporation", weight: "4.85" },
            { symbol: "META", name: "Meta Platforms Inc.", weight: "4.78" },
            { symbol: "GOOGL", name: "Alphabet Inc. Class A", weight: "2.64" },
            { symbol: "GOOG", name: "Alphabet Inc. Class C", weight: "2.54" },
            { symbol: "TSLA", name: "Tesla Inc.", weight: "2.51" },
            { symbol: "AVGO", name: "Broadcom Inc.", weight: "2.34" },
            { symbol: "COST", name: "Costco Wholesale Corporation", weight: "1.33" }
          ]
        }
      },
      SPY: {
        symbol: "SPY",
        name: "SPDR S&P 500 ETF Trust",
        assetType: "ETF",
        holdings: {
          data: [
            { symbol: "AAPL", name: "Apple Inc.", weight: "7.27" },
            { symbol: "MSFT", name: "Microsoft Corporation", weight: "7.02" },
            { symbol: "AMZN", name: "Amazon.com Inc.", weight: "3.50" },
            { symbol: "NVDA", name: "NVIDIA Corporation", weight: "3.11" },
            { symbol: "GOOGL", name: "Alphabet Inc. Class A", weight: "2.14" },
            { symbol: "META", name: "Meta Platforms Inc.", weight: "2.37" },
            { symbol: "GOOG", name: "Alphabet Inc. Class C", weight: "1.83" },
            { symbol: "BRK.B", name: "Berkshire Hathaway Inc. Class B", weight: "1.68" },
            { symbol: "TSLA", name: "Tesla Inc.", weight: "1.61" },
            { symbol: "JPM", name: "JPMorgan Chase & Co.", weight: "1.26" }
          ]
        }
      },
      IWM: {
        symbol: "IWM",
        name: "iShares Russell 2000 ETF",
        assetType: "ETF",
        holdings: {
          data: [
            { symbol: "SMCI", name: "Super Micro Computer Inc.", weight: "0.68" },
            { symbol: "MU", name: "Micron Technology Inc.", weight: "0.44" },
            { symbol: "VRT", name: "Vertiv Holdings Co", weight: "0.42" },
            { symbol: "FTNT", name: "Fortinet Inc.", weight: "0.40" },
            { symbol: "GDDY", name: "GoDaddy Inc.", weight: "0.38" },
            { symbol: "CHRD", name: "Chord Energy Corporation", weight: "0.37" },
            { symbol: "ATI", name: "ATI Inc.", weight: "0.34" },
            { symbol: "TXRH", name: "Texas Roadhouse Inc.", weight: "0.33" },
            { symbol: "ONTO", name: "Onto Innovation Inc.", weight: "0.31" },
            { symbol: "TPG", name: "TPG Inc.", weight: "0.30" }
          ]
        }
      }
    }

    return mockData[symbol] || {
      symbol,
      name: `${symbol} ETF`,
      assetType: "ETF",
      holdings: { data: [] }
    }
  }

  clearCache(): void {
    this.cache.clear()
  }
}

export const alphaVantageClient = new AlphaVantageClient()
export type { ETFProfileResponse }