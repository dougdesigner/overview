"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { getFromStorage, setToStorage, STORAGE_KEYS, isStorageAvailable } from "@/lib/localStorage"

// Account type definitions
export interface Account {
  id: string
  name: string
  accountType: string
  accountTypeLabel: string
  institution: string
  institutionLabel: string
  totalValue: number
  holdingsCount: number
  assetAllocation: {
    usStocks: number
    nonUsStocks: number
    fixedIncome: number
    cash: number
  }
}

// Holding type definitions
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

// Map account types to labels for display
export const accountTypeLabels: Record<string, string> = {
  // Cash accounts
  bank: "Bank Account",
  checking: "Checking Account",
  savings: "Savings Account",
  cash: "Cash",
  rewards: "Rewards Account",

  // Investment accounts
  investment: "Investment Account",
  "personal-investment": "Personal Investment",
  individual: "Individual Brokerage",
  "joint-investment": "Joint Investment",
  joint: "Joint Brokerage",
  "brokerage-corporate-non-taxable": "Brokerage Corporate Non-Taxable",
  "brokerage-corporate-taxable": "Brokerage Corporate Taxable",
  "brokerage-stock-plan": "Brokerage Stock Plan",
  "brokerage-pension": "Brokerage Pension",
  "brokerage-variable-annuity": "Brokerage Variable Annuity",
  "other-non-taxable": "Other Non-Taxable",
  "other-taxable": "Other Taxable",
  cryptocurrency: "Cryptocurrency",

  // Asset accounts - Retirement
  "traditional-ira": "Traditional IRA",
  "roth-ira": "Roth IRA",
  "sep-ira": "SEP IRA",
  "simple-ira": "SIMPLE IRA",
  "401a": "401(a)",
  "traditional-401k": "Traditional 401(k)",
  "roth-401k": "Roth 401(k)",
  "403b": "403(b)",
  "457b": "457(b)",
  "thrift-savings-plan": "Thrift Savings Plan",

  // Asset accounts - Education & Health
  "529": "529 Education Savings",
  hsa: "Health Savings Account",
  "coverdell-esa": "Coverdell ESA",

  // Asset accounts - Insurance & Annuities
  insurance: "Insurance",
  "fixed-annuity": "Fixed Annuity",
  annuity: "Annuity",

  // Asset accounts - Tangible
  art: "Art",
  wine: "Wine",
  jewelry: "Jewelry",
  collectible: "Collectible",
  car: "Car",
  "other-asset": "Other Asset",

  // Asset accounts - Trust & Specialized
  trust: "Trust Account",

  // Liability accounts
  "credit-card": "Credit Card",
  heloc: "HELOC",
  loan: "Loan",
  "student-loan": "Student Loan",
  "auto-loan": "Auto Loan",
  mortgage: "Mortgage",
  "other-liability": "Other Liability",
}

// Map institutions to labels
export const institutionLabels: Record<string, string> = {
  fidelity: "Fidelity Investments",
  vanguard: "Vanguard",
  schwab: "Charles Schwab",
  etrade: "E*TRADE",
  "td-ameritrade": "TD Ameritrade",
  merrill: "Merrill Edge",
  wealthfront: "Wealthfront",
  betterment: "Betterment",
  robinhood: "Robinhood",
  chase: "Chase",
  bofa: "Bank of America",
  "wells-fargo": "Wells Fargo",
  citi: "Citibank",
  amex: "American Express",
  other: "Other",
}

// Default example data for new users
const defaultAccounts: Account[] = [
  {
    id: "1",
    name: "Retirement Fund",
    accountType: "traditional-401k",
    accountTypeLabel: "Traditional 401(k)",
    institution: "fidelity",
    institutionLabel: "Fidelity Investments",
    totalValue: 98987,
    holdingsCount: 3,
    assetAllocation: {
      usStocks: 45,
      nonUsStocks: 25,
      fixedIncome: 20,
      cash: 10,
    },
  },
  {
    id: "2",
    name: "Personal Investment",
    accountType: "individual",
    accountTypeLabel: "Individual Brokerage",
    institution: "wealthfront",
    institutionLabel: "Wealthfront",
    totalValue: 74240,
    holdingsCount: 2,
    assetAllocation: {
      usStocks: 55,
      nonUsStocks: 30,
      fixedIncome: 10,
      cash: 5,
    },
  },
  {
    id: "3",
    name: "Tax-Free Growth",
    accountType: "roth-ira",
    accountTypeLabel: "Roth IRA",
    institution: "vanguard",
    institutionLabel: "Vanguard",
    totalValue: 49494,
    holdingsCount: 2,
    assetAllocation: {
      usStocks: 60,
      nonUsStocks: 25,
      fixedIncome: 10,
      cash: 5,
    },
  },
  {
    id: "4",
    name: "Emergency Fund",
    accountType: "savings",
    accountTypeLabel: "Savings Account",
    institution: "chase",
    institutionLabel: "Chase",
    totalValue: 24747,
    holdingsCount: 1,
    assetAllocation: {
      usStocks: 0,
      nonUsStocks: 0,
      fixedIncome: 0,
      cash: 100,
    },
  },
]

const defaultHoldings: Holding[] = [
  // Retirement Fund holdings
  {
    id: "h1",
    accountId: "1",
    accountName: "Retirement Fund",
    ticker: "VTI",
    name: "Vanguard Total Stock Market ETF",
    quantity: 200,
    lastPrice: 218.90,
    marketValue: 43780,
    allocation: 44.3,
    type: "fund",
  },
  {
    id: "h2",
    accountId: "1",
    accountName: "Retirement Fund",
    ticker: "VXUS",
    name: "Vanguard Total International Stock ETF",
    quantity: 400,
    lastPrice: 62.03,
    marketValue: 24812,
    allocation: 25.1,
    type: "fund",
  },
  {
    id: "h3",
    accountId: "1",
    accountName: "Retirement Fund",
    ticker: "BND",
    name: "Vanguard Total Bond Market ETF",
    quantity: 250,
    lastPrice: 121.56,
    marketValue: 30395,
    allocation: 30.6,
    type: "fund",
  },

  // Personal Investment holdings
  {
    id: "h4",
    accountId: "2",
    accountName: "Personal Investment",
    ticker: "QQQ",
    name: "Invesco QQQ Trust",
    quantity: 100,
    lastPrice: 453.59,
    marketValue: 45359,
    allocation: 61.1,
    type: "fund",
  },
  {
    id: "h5",
    accountId: "2",
    accountName: "Personal Investment",
    ticker: "AAPL",
    name: "Apple Inc.",
    quantity: 150,
    lastPrice: 193.60,
    marketValue: 28881,
    allocation: 38.9,
    type: "stock",
  },

  // Tax-Free Growth holdings
  {
    id: "h6",
    accountId: "3",
    accountName: "Tax-Free Growth",
    ticker: "VOO",
    name: "Vanguard S&P 500 ETF",
    quantity: 75,
    lastPrice: 432.91,
    marketValue: 32468,
    allocation: 65.6,
    type: "fund",
  },
  {
    id: "h7",
    accountId: "3",
    accountName: "Tax-Free Growth",
    ticker: "MSFT",
    name: "Microsoft Corporation",
    quantity: 50,
    lastPrice: 340.54,
    marketValue: 17026,
    allocation: 34.4,
    type: "stock",
  },

  // Emergency Fund holding (Cash)
  {
    id: "h8",
    accountId: "4",
    accountName: "Emergency Fund",
    name: "Cash",
    quantity: 24747,
    lastPrice: 1,
    marketValue: 24747,
    allocation: 100,
    type: "cash",
  },
]

// Hook for managing portfolio data
export function usePortfolioStore() {
  const [accounts, setAccountsState] = useState<Account[]>([])
  const [holdings, setHoldingsState] = useState<Holding[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasInitialized, setHasInitialized] = useState(false)

  // Load data from localStorage on mount
  useEffect(() => {
    if (hasInitialized) return

    const loadData = () => {
      try {
        if (!isStorageAvailable()) {
          setError("Local storage is not available")
          setAccountsState(defaultAccounts)
          setHoldingsState(defaultHoldings)
          setIsLoading(false)
          setHasInitialized(true)
          return
        }

        // Check if this is a first-time user
        const hasBeenInitialized = localStorage.getItem('portfolio_initialized') === 'true'

        // Load accounts
        const storedAccounts = getFromStorage<Account[]>(STORAGE_KEYS.accounts)
        if (storedAccounts !== null) {
          // User has saved data (even if empty)
          setAccountsState(storedAccounts)
        } else {
          // First time user or cleared storage - start with empty data
          setAccountsState([])
          setToStorage(STORAGE_KEYS.accounts, [])
          localStorage.setItem('portfolio_initialized', 'true')
        }

        // Load holdings
        const storedHoldings = getFromStorage<Holding[]>(STORAGE_KEYS.holdings)
        if (storedHoldings !== null) {
          // User has saved data (even if empty)
          setHoldingsState(storedHoldings)
        } else {
          // First time user or cleared storage - start with empty data
          setHoldingsState([])
          setToStorage(STORAGE_KEYS.holdings, [])
        }

        setError(null)
      } catch (err) {
        console.error("Error loading portfolio data:", err)
        setError("Failed to load portfolio data")
        // Fallback to default data
        setAccountsState(defaultAccounts)
        setHoldingsState(defaultHoldings)
      } finally {
        setIsLoading(false)
        setHasInitialized(true)
      }
    }

    loadData()
  }, [hasInitialized])

  // Auto-save accounts whenever they change
  useEffect(() => {
    if (!hasInitialized || isLoading) return

    const saveAccounts = () => {
      try {
        setToStorage(STORAGE_KEYS.accounts, accounts)
        setToStorage(STORAGE_KEYS.lastUpdated, Date.now())
      } catch (err) {
        console.error("Error saving accounts:", err)
        setError("Failed to save accounts")
      }
    }

    saveAccounts()
  }, [accounts, hasInitialized, isLoading])

  // Auto-save holdings whenever they change
  useEffect(() => {
    if (!hasInitialized || isLoading) return

    const saveHoldings = () => {
      try {
        setToStorage(STORAGE_KEYS.holdings, holdings)
        setToStorage(STORAGE_KEYS.lastUpdated, Date.now())
      } catch (err) {
        console.error("Error saving holdings:", err)
        setError("Failed to save holdings")
      }
    }

    saveHoldings()
  }, [holdings, hasInitialized, isLoading])

  // Recalculate account totals when holdings change
  useEffect(() => {
    if (!hasInitialized || isLoading) return

    const updatedAccounts = accounts.map(account => {
      const accountHoldings = holdings.filter(h => h.accountId === account.id)
      const totalValue = accountHoldings.reduce((sum, h) => sum + h.marketValue, 0)
      const holdingsCount = accountHoldings.length

      // Calculate asset allocation
      let usStocks = 0
      let nonUsStocks = 0
      let fixedIncome = 0
      let cash = 0

      accountHoldings.forEach(holding => {
        if (holding.type === "cash") {
          cash += holding.marketValue
        } else if (holding.type === "fund") {
          // Simple allocation based on fund type (could be enhanced with actual fund data)
          if (holding.ticker === "BND" || holding.ticker?.includes("BOND")) {
            fixedIncome += holding.marketValue
          } else if (holding.ticker === "VXUS" || holding.ticker?.includes("INTL")) {
            nonUsStocks += holding.marketValue
          } else {
            usStocks += holding.marketValue
          }
        } else {
          // Stocks default to US stocks (could be enhanced with actual company data)
          usStocks += holding.marketValue
        }
      })

      const assetAllocation = totalValue > 0 ? {
        usStocks: (usStocks / totalValue) * 100,
        nonUsStocks: (nonUsStocks / totalValue) * 100,
        fixedIncome: (fixedIncome / totalValue) * 100,
        cash: (cash / totalValue) * 100,
      } : {
        usStocks: 0,
        nonUsStocks: 0,
        fixedIncome: 0,
        cash: 0,
      }

      return {
        ...account,
        totalValue,
        holdingsCount,
        assetAllocation,
      }
    })

    // Only update if values actually changed
    const hasChanged = JSON.stringify(updatedAccounts) !== JSON.stringify(accounts)
    if (hasChanged) {
      setAccountsState(updatedAccounts)
    }
  }, [holdings, hasInitialized, isLoading]) // Note: intentionally not including accounts to avoid infinite loop

  // Account CRUD operations
  const addAccount = useCallback((account: Omit<Account, "id" | "totalValue" | "holdingsCount" | "assetAllocation">) => {
    const newAccount: Account = {
      ...account,
      id: Date.now().toString(),
      totalValue: 0,
      holdingsCount: 0,
      assetAllocation: {
        usStocks: 0,
        nonUsStocks: 0,
        fixedIncome: 0,
        cash: 0,
      },
    }
    setAccountsState(prev => [...prev, newAccount])
    return newAccount
  }, [])

  const updateAccount = useCallback((id: string, updates: Partial<Account>) => {
    setAccountsState(prev =>
      prev.map(account =>
        account.id === id ? { ...account, ...updates } : account
      )
    )
  }, [])

  const deleteAccount = useCallback((id: string) => {
    // Delete account and its holdings
    setAccountsState(prev => prev.filter(account => account.id !== id))
    setHoldingsState(prev => prev.filter(holding => holding.accountId !== id))
  }, [])

  // Holding CRUD operations
  const addHolding = useCallback((holding: Omit<Holding, "id" | "allocation">) => {
    const account = accounts.find(a => a.id === holding.accountId)
    if (!account) {
      setError(`Account with id ${holding.accountId} not found`)
      return null
    }

    const newHolding: Holding = {
      ...holding,
      id: Date.now().toString(),
      accountName: account.name,
      allocation: 0, // Will be calculated
    }
    setHoldingsState(prev => [...prev, newHolding])
    return newHolding
  }, [accounts])

  const updateHolding = useCallback((id: string, updates: Partial<Holding>) => {
    setHoldingsState(prev =>
      prev.map(holding => {
        if (holding.id === id) {
          const updated = { ...holding, ...updates }
          // Recalculate market value if quantity or price changed
          if (updates.quantity !== undefined || updates.lastPrice !== undefined) {
            updated.marketValue = updated.quantity * updated.lastPrice
          }
          return updated
        }
        return holding
      })
    )
  }, [])

  const deleteHolding = useCallback((id: string) => {
    setHoldingsState(prev => prev.filter(holding => holding.id !== id))
  }, [])

  // Get holdings for a specific account
  const getHoldingsByAccount = useCallback((accountId: string) => {
    return holdings.filter(h => h.accountId === accountId)
  }, [holdings])

  // Calculate total portfolio value
  const totalPortfolioValue = useMemo(() => {
    return accounts.reduce((sum, account) => sum + account.totalValue, 0)
  }, [accounts])

  // Calculate portfolio allocations
  const portfolioAllocation = useMemo(() => {
    if (totalPortfolioValue === 0) {
      return {
        usStocks: 0,
        nonUsStocks: 0,
        fixedIncome: 0,
        cash: 0,
      }
    }

    const totalAllocations = accounts.reduce(
      (totals, account) => {
        const accountValue = account.totalValue
        return {
          usStocks: totals.usStocks + (accountValue * account.assetAllocation.usStocks) / 100,
          nonUsStocks: totals.nonUsStocks + (accountValue * account.assetAllocation.nonUsStocks) / 100,
          fixedIncome: totals.fixedIncome + (accountValue * account.assetAllocation.fixedIncome) / 100,
          cash: totals.cash + (accountValue * account.assetAllocation.cash) / 100,
        }
      },
      { usStocks: 0, nonUsStocks: 0, fixedIncome: 0, cash: 0 }
    )

    return {
      usStocks: (totalAllocations.usStocks / totalPortfolioValue) * 100,
      nonUsStocks: (totalAllocations.nonUsStocks / totalPortfolioValue) * 100,
      fixedIncome: (totalAllocations.fixedIncome / totalPortfolioValue) * 100,
      cash: (totalAllocations.cash / totalPortfolioValue) * 100,
    }
  }, [accounts, totalPortfolioValue])

  // Clear all data
  const clearAllData = useCallback(() => {
    setAccountsState([])
    setHoldingsState([])
    setToStorage(STORAGE_KEYS.accounts, [])
    setToStorage(STORAGE_KEYS.holdings, [])
    // Keep the initialized flag so we don't re-add default data
    localStorage.setItem('portfolio_initialized', 'true')
  }, [])

  // Reset to default data
  const resetToDefaults = useCallback(() => {
    setAccountsState(defaultAccounts)
    setHoldingsState(defaultHoldings)
    setToStorage(STORAGE_KEYS.accounts, defaultAccounts)
    setToStorage(STORAGE_KEYS.holdings, defaultHoldings)
  }, [])

  return {
    // State
    accounts,
    holdings,
    isLoading,
    error,

    // Account operations
    addAccount,
    updateAccount,
    deleteAccount,

    // Holding operations
    addHolding,
    updateHolding,
    deleteHolding,
    getHoldingsByAccount,

    // Calculated values
    totalPortfolioValue,
    portfolioAllocation,

    // Utility functions
    clearAllData,
    resetToDefaults,
  }
}