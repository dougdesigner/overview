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
  accountId?: string // For subRows that come from a single account
  accountName?: string // For subRows that come from a single account
}

export interface ExposureSource {
  etfSymbol: string
  etfName: string
  sharesViaETF: number // How many shares of the stock we own through this ETF
  percentOfETF: number // What % this stock represents in the ETF
  valueViaETF: number
  accountId: string // Which account holds this ETF
  accountName: string // Name of the account holding this ETF
}

export interface ETFHolding {
  symbol: string
  name: string
  weight: number // Percentage weight in the ETF
  shares?: number // Optional: actual share count in the ETF
  sector?: string // Optional: sector classification
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

export interface Account {
  id: string
  name: string
  institution: string
}

// Display value type for exposure visualization
export type ExposureDisplayValue = "market-value" | "pct-stocks" | "pct-portfolio" | "none"

// Holdings filter type for quick views
export type HoldingsFilter = "all" | "mag7" | "top7" | "top10"

// Grouping mode for exposure visualization
export type GroupingMode = "none" | "sector" | "sector-industry" | "mag7" | "top10"

export interface ExposureTableProps {
  holdings: PortfolioHolding[]
  accounts: Account[]
  onRefresh?: () => void
  lastUpdated?: Date
  dataVersion?: number
  selectedAccount?: string
  holdingsFilter?: HoldingsFilter
  combineGoogleShares?: boolean
  displayValue?: ExposureDisplayValue
  groupingMode?: GroupingMode
}

export interface ExposureCalculationResult {
  exposures: StockExposure[]
  totalPortfolioValue: number
  etfProfiles: Map<string, ETFProfile>
  lastCalculated: Date
}