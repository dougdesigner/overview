export interface StockExposure {
  id: string
  ticker: string
  name: string
  sector?: string // Company sector from Alpha Vantage
  industry?: string // Company industry from Alpha Vantage
  directShares: number
  etfExposure: number // Total shares held through ETFs
  totalShares: number // directShares + etfExposure
  lastPrice: number
  directValue: number
  etfValue: number
  totalValue: number
  percentOfPortfolio: number
  exposureSources: ExposureSource[]
  subRows?: StockExposure[] // For grouped display
  isETFBreakdown?: boolean // True for ETF contribution rows
}

export interface ExposureSource {
  etfSymbol: string
  etfName: string
  sharesViaETF: number // How many shares of the stock we own through this ETF
  percentOfETF: number // What % this stock represents in the ETF
  valueViaETF: number
}

export interface ETFHolding {
  symbol: string
  name: string
  weight: number // Percentage weight in the ETF
  shares?: number // Optional: actual share count in the ETF
}

export interface ETFProfile {
  symbol: string
  name: string
  holdings: ETFHolding[]
  lastUpdated: Date
}

export interface PortfolioHolding {
  id: string
  accountId: string
  accountName: string
  ticker?: string
  name: string
  quantity: number
  lastPrice: number
  marketValue: number
  type: "stock" | "fund" | "cash"
}

export interface ExposureTableProps {
  holdings: PortfolioHolding[]
  onRefresh?: () => void
  lastUpdated?: Date
}

export interface ExposureCalculationResult {
  exposures: StockExposure[]
  totalPortfolioValue: number
  etfProfiles: Map<string, ETFProfile>
  lastCalculated: Date
}