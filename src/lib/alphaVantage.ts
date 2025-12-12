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

interface CompanyOverview {
  Symbol: string
  Name: string
  Sector: string
  Industry: string
  MarketCapitalization?: string
  Exchange?: string
  Currency?: string
  Country?: string
  OfficialSite?: string
}

interface SymbolSearchMatch {
  symbol: string
  name: string
  type: string      // "Equity", "ETF", etc.
  region: string
  matchScore: string
}

interface SymbolSearchResponse {
  bestMatches?: Array<{
    "1. symbol": string
    "2. name": string
    "3. type": string
    "4. region": string
    "5. marketOpen": string
    "6. marketClose": string
    "7. timezone": string
    "8. currency": string
    "9. matchScore": string
  }>
}

interface CacheEntry<T = ETFProfileResponse | CompanyOverview | SymbolSearchMatch[]> {
  data: T
  timestamp: number
}

class AlphaVantageClient {
  private baseURL = "https://www.alphavantage.co/query"
  private cache: Map<string, CacheEntry<ETFProfileResponse | CompanyOverview | SymbolSearchMatch[]>> = new Map()
  private cacheDuration: number

  constructor() {
    this.cacheDuration = parseInt(process.env.ALPHA_VANTAGE_CACHE_DURATION || "86400") * 1000
  }

  private getCacheKey(symbol: string, func: string): string {
    return `${func}:${symbol}`
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > this.cacheDuration) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  private setCache(key: string, data: ETFProfileResponse | CompanyOverview | SymbolSearchMatch[]): void {
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
    const cached = this.getFromCache<ETFProfileResponse>(cacheKey)
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

  async getCompanyOverview(symbol: string): Promise<CompanyOverview | null> {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY

    if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
      console.warn("Alpha Vantage API key not configured. Using mock data.")
      return this.getMockCompanyOverview(symbol)
    }

    const cacheKey = this.getCacheKey(symbol, "OVERVIEW")
    const cached = this.getFromCache<CompanyOverview>(cacheKey)
    if (cached) {
      console.log(`Using cached company overview for ${symbol}`)
      return cached
    }

    try {
      const url = new URL(this.baseURL)
      url.searchParams.append("function", "OVERVIEW")
      url.searchParams.append("symbol", symbol)
      url.searchParams.append("apikey", apiKey)

      const response = await fetch(url.toString())

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()

      if (data["Error Message"] || data["Note"] || !data.Symbol) {
        console.error("Alpha Vantage API error:", data["Error Message"] || data["Note"] || "No data returned")
        return this.getMockCompanyOverview(symbol)
      }

      this.setCache(cacheKey, data)
      return data as CompanyOverview
    } catch (error) {
      console.error(`Error fetching company overview for ${symbol}:`, error)
      return this.getMockCompanyOverview(symbol)
    }
  }

  private getMockCompanyOverview(symbol: string): CompanyOverview {
    const mockData: Record<string, CompanyOverview> = {
      AAPL: {
        Symbol: "AAPL",
        Name: "Apple Inc.",
        Sector: "Technology",
        Industry: "Consumer Electronics",
        MarketCapitalization: "3000000000000",
        Exchange: "NASDAQ",
        Currency: "USD",
        Country: "USA"
      },
      MSFT: {
        Symbol: "MSFT",
        Name: "Microsoft Corporation",
        Sector: "Technology",
        Industry: "Software—Infrastructure",
        MarketCapitalization: "2800000000000",
        Exchange: "NASDAQ",
        Currency: "USD",
        Country: "USA"
      },
      AMZN: {
        Symbol: "AMZN",
        Name: "Amazon.com Inc.",
        Sector: "Consumer Cyclical",
        Industry: "Internet Retail",
        MarketCapitalization: "1700000000000",
        Exchange: "NASDAQ",
        Currency: "USD",
        Country: "USA"
      },
      GOOGL: {
        Symbol: "GOOGL",
        Name: "Alphabet Inc. Class A",
        Sector: "Communication Services",
        Industry: "Internet Content & Information",
        MarketCapitalization: "1800000000000",
        Exchange: "NASDAQ",
        Currency: "USD",
        Country: "USA"
      },
      GOOG: {
        Symbol: "GOOG",
        Name: "Alphabet Inc. Class C",
        Sector: "Communication Services",
        Industry: "Internet Content & Information",
        MarketCapitalization: "1800000000000",
        Exchange: "NASDAQ",
        Currency: "USD",
        Country: "USA"
      },
      NVDA: {
        Symbol: "NVDA",
        Name: "NVIDIA Corporation",
        Sector: "Technology",
        Industry: "Semiconductors",
        MarketCapitalization: "1100000000000",
        Exchange: "NASDAQ",
        Currency: "USD",
        Country: "USA"
      },
      META: {
        Symbol: "META",
        Name: "Meta Platforms Inc.",
        Sector: "Communication Services",
        Industry: "Internet Content & Information",
        MarketCapitalization: "900000000000",
        Exchange: "NASDAQ",
        Currency: "USD",
        Country: "USA"
      },
      TSLA: {
        Symbol: "TSLA",
        Name: "Tesla Inc.",
        Sector: "Consumer Cyclical",
        Industry: "Auto Manufacturers",
        MarketCapitalization: "800000000000",
        Exchange: "NASDAQ",
        Currency: "USD",
        Country: "USA"
      },
      BRK: {
        Symbol: "BRK.B",
        Name: "Berkshire Hathaway Inc.",
        Sector: "Financial Services",
        Industry: "Insurance—Diversified",
        MarketCapitalization: "780000000000",
        Exchange: "NYSE",
        Currency: "USD",
        Country: "USA"
      },
      "BRK.B": {
        Symbol: "BRK.B",
        Name: "Berkshire Hathaway Inc. Class B",
        Sector: "Financial Services",
        Industry: "Insurance—Diversified",
        MarketCapitalization: "780000000000",
        Exchange: "NYSE",
        Currency: "USD",
        Country: "USA"
      },
      JPM: {
        Symbol: "JPM",
        Name: "JPMorgan Chase & Co.",
        Sector: "Financial Services",
        Industry: "Banks—Diversified",
        MarketCapitalization: "500000000000",
        Exchange: "NYSE",
        Currency: "USD",
        Country: "USA"
      },
      UNH: {
        Symbol: "UNH",
        Name: "UnitedHealth Group Inc.",
        Sector: "Healthcare",
        Industry: "Healthcare Plans",
        MarketCapitalization: "450000000000",
        Exchange: "NYSE",
        Currency: "USD",
        Country: "USA"
      },
      AVGO: {
        Symbol: "AVGO",
        Name: "Broadcom Inc.",
        Sector: "Technology",
        Industry: "Semiconductors",
        MarketCapitalization: "600000000000",
        Exchange: "NASDAQ",
        Currency: "USD",
        Country: "USA"
      },
      PEP: {
        Symbol: "PEP",
        Name: "PepsiCo Inc.",
        Sector: "Consumer Defensive",
        Industry: "Beverages—Non-Alcoholic",
        MarketCapitalization: "230000000000",
        Exchange: "NASDAQ",
        Currency: "USD",
        Country: "USA"
      },
      COST: {
        Symbol: "COST",
        Name: "Costco Wholesale Corporation",
        Sector: "Consumer Defensive",
        Industry: "Discount Stores",
        MarketCapitalization: "350000000000",
        Exchange: "NASDAQ",
        Currency: "USD",
        Country: "USA"
      }
    }

    // Return generic data for unknown symbols
    return mockData[symbol] || {
      Symbol: symbol,
      Name: `${symbol} Company`,
      Sector: "Unknown",
      Industry: "Unknown",
      MarketCapitalization: "0",
      Exchange: "UNKNOWN",
      Currency: "USD",
      Country: "USA"
    }
  }

  async searchSymbols(keywords: string): Promise<SymbolSearchMatch[]> {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY

    if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
      console.warn("Alpha Vantage API key not configured. Using mock data.")
      return this.getMockSymbolSearch(keywords)
    }

    const cacheKey = this.getCacheKey(keywords, "SYMBOL_SEARCH")
    const cached = this.getFromCache<SymbolSearchMatch[]>(cacheKey)
    if (cached) {
      console.log(`Using cached symbol search for ${keywords}`)
      return cached
    }

    try {
      const url = new URL(this.baseURL)
      url.searchParams.append("function", "SYMBOL_SEARCH")
      url.searchParams.append("keywords", keywords)
      url.searchParams.append("apikey", apiKey)

      const response = await fetch(url.toString())

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data: SymbolSearchResponse = await response.json()

      if (!data.bestMatches) {
        console.error("Alpha Vantage API error: No matches returned")
        return this.getMockSymbolSearch(keywords)
      }

      // Normalize the response
      const matches: SymbolSearchMatch[] = data.bestMatches.map((match) => ({
        symbol: match["1. symbol"],
        name: match["2. name"],
        type: match["3. type"],
        region: match["4. region"],
        matchScore: match["9. matchScore"]
      }))

      this.setCache(cacheKey, matches)
      return matches
    } catch (error) {
      console.error(`Error searching symbols for ${keywords}:`, error)
      return this.getMockSymbolSearch(keywords)
    }
  }

  private getMockSymbolSearch(keywords: string): SymbolSearchMatch[] {
    // Mock data for common stock searches
    const mockSymbols: Record<string, SymbolSearchMatch[]> = {
      "APP": [
        { symbol: "AAPL", name: "Apple Inc.", type: "Equity", region: "United States", matchScore: "0.8000" },
        { symbol: "APP", name: "Applovin Corporation", type: "Equity", region: "United States", matchScore: "1.0000" }
      ],
      "GOO": [
        { symbol: "GOOGL", name: "Alphabet Inc. Class A", type: "Equity", region: "United States", matchScore: "0.8000" },
        { symbol: "GOOG", name: "Alphabet Inc. Class C", type: "Equity", region: "United States", matchScore: "0.7500" }
      ],
      "MIC": [
        { symbol: "MSFT", name: "Microsoft Corporation", type: "Equity", region: "United States", matchScore: "0.6000" }
      ],
      "TES": [
        { symbol: "TSLA", name: "Tesla Inc.", type: "Equity", region: "United States", matchScore: "0.8000" }
      ],
      "AMZ": [
        { symbol: "AMZN", name: "Amazon.com Inc.", type: "Equity", region: "United States", matchScore: "0.9000" }
      ],
      "NVI": [
        { symbol: "NVDA", name: "NVIDIA Corporation", type: "Equity", region: "United States", matchScore: "0.8500" }
      ]
    }

    // Check if any mock key starts with the keywords (case insensitive)
    const keywordsUpper = keywords.toUpperCase()
    for (const [key, matches] of Object.entries(mockSymbols)) {
      if (keywordsUpper.startsWith(key) || key.startsWith(keywordsUpper)) {
        return matches
      }
    }

    // Return empty array for unknown searches
    return []
  }

  clearCache(): void {
    this.cache.clear()
  }
}

export const alphaVantageClient = new AlphaVantageClient()
export type { ETFProfileResponse, CompanyOverview, SymbolSearchMatch }