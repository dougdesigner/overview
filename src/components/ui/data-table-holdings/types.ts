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
  // For nested rows
  subRows?: Holding[]
  isGroup?: boolean // True for parent rows that aggregate multiple holdings
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
  initialAccountFilter?: string
  onAccountFilterChange?: (accountId: string) => void
}