export interface Holding {
  id: string
  accountId: string
  accountName: string
  ticker?: string // Empty for cash
  name: string // Company name for stocks/funds, description for cash
  quantity: number
  lastPrice: number
  marketValue: number
  allocation: number // Percentage
  type: "stock" | "fund" | "cash"
  // Price change data
  previousClose?: number
  changePercent?: number // Day change percentage
  changeAmount?: number // Day change in dollars
  marketValueChange?: number // Position value change in dollars
  priceUpdatedAt?: string // ISO timestamp of last price update
  // For nested rows
  subRows?: Holding[]
  isGroup?: boolean // True for parent rows that aggregate multiple holdings
  // For manual entries
  isUSStock?: boolean // True for US stocks, false for international
  isManualEntry?: boolean // True if manually entered (not from predefined list)
  domain?: string // Company domain for logo lookup
}

export interface Account {
  id: string
  name: string
  institution: string
}

export interface HoldingsTableProps {
  holdings: Holding[]
  accounts: Account[]
  onEdit: (holding: Holding) => void
  onDelete: (holdingId: string) => void
  selectedAccount?: string
}