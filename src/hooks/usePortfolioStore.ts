"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { getFromStorage, setToStorage, STORAGE_KEYS, isStorageAvailable, exportPortfolioData as exportData } from "@/lib/localStorage"
import { etfMetadataService } from "@/lib/etfMetadataService"
import { stockPriceService } from "@/lib/stockPriceService"
import { isKnownETF, getKnownETFName } from "@/lib/knownETFNames"
import { enhancedExposureCalculator } from "@/lib/enhancedExposureCalculator"
import {
  saveBackupToIndexedDB,
  getLatestBackupFromIndexedDB,
  getBackupAge
} from "@/lib/indexedDBBackup"
import { clearETFCache } from "@/lib/etfCacheUtils"

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
  // For manual entries
  isUSStock?: boolean // True for US stocks, false for international
  isManualEntry?: boolean // True if manually entered
  domain?: string // Company domain for logo lookup
  sector?: string // Company sector (e.g., "Technology", "Healthcare")
  industry?: string // Company industry (e.g., "Software", "Semiconductors")
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
  carta: "Carta",
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
  const [dataVersion, setDataVersion] = useState(0)

  // Load data from localStorage on mount
  useEffect(() => {
    if (hasInitialized) return

    const loadData = async () => {
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
          // First time user or cleared storage - try to recover from IndexedDB
          try {
            const backup = await getLatestBackupFromIndexedDB()
            if (backup && backup.accounts.length > 0) {
              // Restore from IndexedDB backup
              console.log(`📦 Restoring from IndexedDB backup (${getBackupAge(backup.timestamp)})`)
              setAccountsState(backup.accounts)
              setToStorage(STORAGE_KEYS.accounts, backup.accounts)

              // Clear ETF cache to ensure fresh data after recovery
              clearETFCache()

              // Increment data version to invalidate component caches
              setDataVersion(prev => prev + 1)

              // Show recovery message in console
              console.log(`✅ Recovered ${backup.accounts.length} accounts from backup`)
            } else {
              // No backup available - start with empty data
              setAccountsState([])
              setToStorage(STORAGE_KEYS.accounts, [])
            }
          } catch (err) {
            console.error("Failed to recover from IndexedDB:", err)
            setAccountsState([])
            setToStorage(STORAGE_KEYS.accounts, [])
          }
          localStorage.setItem('portfolio_initialized', 'true')
        }

        // Load holdings
        const storedHoldings = getFromStorage<Holding[]>(STORAGE_KEYS.holdings)
        if (storedHoldings !== null) {
          // User has saved data (even if empty)
          // Migrate ETF names if needed
          const migratedHoldings = await migrateETFNames(storedHoldings)
          setHoldingsState(migratedHoldings)

          // Save migrated holdings back to storage if they changed
          if (JSON.stringify(migratedHoldings) !== JSON.stringify(storedHoldings)) {
            setToStorage(STORAGE_KEYS.holdings, migratedHoldings)
          }
        } else {
          // First time user or cleared storage - try to recover from IndexedDB
          try {
            const backup = await getLatestBackupFromIndexedDB()
            if (backup && backup.holdings.length > 0) {
              // Restore from IndexedDB backup
              const migratedHoldings = await migrateETFNames(backup.holdings)
              setHoldingsState(migratedHoldings)
              setToStorage(STORAGE_KEYS.holdings, migratedHoldings)
              // Show recovery message in console
              console.log(`✅ Recovered ${backup.holdings.length} holdings from backup`)
            } else {
              // No backup available - start with empty data
              setHoldingsState([])
              setToStorage(STORAGE_KEYS.holdings, [])
            }
          } catch (err) {
            console.error("Failed to recover from IndexedDB:", err)
            setHoldingsState([])
            setToStorage(STORAGE_KEYS.holdings, [])
          }
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

  // Migrate ETF names for existing holdings
  const migrateETFNames = async (holdings: Holding[]): Promise<Holding[]> => {
    // First pass: Update all holdings with known ETF names immediately
    let updatedHoldings = holdings.map(holding => {
      if (!holding.ticker) return holding

      const upperTicker = holding.ticker.toUpperCase()
      const knownName = getKnownETFName(upperTicker)

      // If we have a known name and it's different from current name, update it
      if (knownName && holding.name !== knownName) {
        console.log(`Updating ${upperTicker} from "${holding.name}" to known name "${knownName}"`)
        return { ...holding, name: knownName, type: 'fund' as const }
      }

      return holding
    })

    // Second pass: Get tickers that still might need API updates
    const etfTickersNeedingApiUpdate = updatedHoldings
      .filter(h => {
        if (!h.ticker) return false

        // Skip if we already have a good name from known ETFs
        const knownName = getKnownETFName(h.ticker.toUpperCase())
        if (knownName) return false

        // Check if it's marked as a fund
        if (h.type === "fund") return true

        // Check if the name is just the ticker (needs update)
        if (h.name === h.ticker || h.name === `${h.ticker} ETF`) return true

        // Check if it looks like an ETF ticker (2-5 uppercase letters)
        const upperTicker = h.ticker.toUpperCase()
        if (h.ticker === upperTicker && h.ticker.length >= 2 && h.ticker.length <= 5) {
          // Check against known ETF patterns
          const knownETFPatterns = [
            'ETF', 'QQQ', 'SPY', 'ARK', 'SCH', 'XL', 'SPDR', 'GDX', 'SMH', 'GLD',
            'SLV', 'TAN', 'ICLN', 'HACK', 'ROBO', 'JEPI', 'JEPQ', 'BOTZ', 'CLOU'
          ]
          return knownETFPatterns.some(pattern => upperTicker.includes(pattern))
        }

        return false
      })
      .map(h => h.ticker!)

    // If there are ETFs that need API updates, fetch their metadata
    if (etfTickersNeedingApiUpdate.length > 0) {
      try {
        console.log(`Fetching API metadata for unknown ETFs: ${etfTickersNeedingApiUpdate.join(', ')}`)

        // Fetch metadata for unknown ETFs
        const metadata = await etfMetadataService.getETFMetadataBatch(etfTickersNeedingApiUpdate)

        // Update holdings with API-fetched names
        updatedHoldings = updatedHoldings.map(holding => {
          if (holding.ticker && metadata.has(holding.ticker.toUpperCase())) {
            const etfMeta = metadata.get(holding.ticker.toUpperCase())!

            if (etfMeta.name && etfMeta.name !== `${holding.ticker} ETF` && etfMeta.name !== holding.name) {
              console.log(`Updating ${holding.ticker} name from "${holding.name}" to API name "${etfMeta.name}"`)
              return { ...holding, name: etfMeta.name, type: 'fund' as const }
            }
          }
          return holding
        })
      } catch (error) {
        console.error("Error fetching ETF metadata from API:", error)
      }
    }

    return updatedHoldings
  }

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

  // Auto-backup to IndexedDB whenever accounts or holdings change
  useEffect(() => {
    if (!hasInitialized || isLoading) return

    const backupToIndexedDB = async () => {
      try {
        await saveBackupToIndexedDB(accounts, holdings, "1.0.0")
      } catch (err) {
        console.error("Error backing up to IndexedDB:", err)
        // Don't set error state - this is a silent backup
      }
    }

    backupToIndexedDB()
  }, [accounts, holdings, hasInitialized, isLoading])

  // Storage event listener - detect when localStorage is cleared from other tabs/windows
  useEffect(() => {
    if (typeof window === "undefined") return

    const handleStorageChange = async (e: StorageEvent) => {
      // Check if portfolio data was cleared
      if (
        e.key === STORAGE_KEYS.accounts ||
        e.key === STORAGE_KEYS.holdings ||
        e.key === null // null means localStorage.clear() was called
      ) {
        // Check if data was actually cleared (newValue is null)
        if (e.newValue === null) {
          console.warn("⚠️ Portfolio data was cleared externally")

          // Try to recover from IndexedDB
          try {
            const backup = await getLatestBackupFromIndexedDB()
            if (backup) {
              const shouldRestore = confirm(
                `Portfolio data was cleared. Restore from backup?\n\n` +
                `Backup from: ${getBackupAge(backup.timestamp)}\n` +
                `${backup.accounts.length} accounts, ${backup.holdings.length} holdings`
              )

              if (shouldRestore) {
                // Restore accounts
                setAccountsState(backup.accounts)
                setToStorage(STORAGE_KEYS.accounts, backup.accounts)

                // Restore holdings
                setHoldingsState(backup.holdings)
                setToStorage(STORAGE_KEYS.holdings, backup.holdings)

                // Clear ETF cache to ensure fresh data
                clearETFCache()

                // Increment data version to invalidate component caches
                setDataVersion(prev => prev + 1)

                console.log("✅ Portfolio restored from IndexedDB backup")
                alert("Portfolio data has been restored successfully!")
              }
            } else {
              console.error("No backup available to restore from")
              alert("Portfolio data was cleared and no backup is available.")
            }
          } catch (err) {
            console.error("Failed to restore from backup:", err)
            alert("Failed to restore portfolio data from backup.")
          }
        }
      }
    }

    // Add storage event listener
    window.addEventListener("storage", handleStorageChange)

    // Cleanup
    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [setAccountsState, setHoldingsState])

  // Recalculate account totals when holdings change
  useEffect(() => {
    if (!hasInitialized || isLoading) return

    const updateAccounts = async () => {
      const updatedAccounts = await Promise.all(accounts.map(async (account) => {
        const accountHoldings = holdings.filter(h => h.accountId === account.id)
        const totalValue = accountHoldings.reduce((sum, h) => sum + h.marketValue, 0)
        const holdingsCount = accountHoldings.length

        // Convert holdings to format expected by enhanced calculator
        const portfolioHoldings = accountHoldings.map(h => ({
          id: h.id,
          accountId: h.accountId,
          accountName: h.accountName,
          ticker: h.ticker,
          name: h.name,
          quantity: h.quantity,
          lastPrice: h.lastPrice,
          marketValue: h.marketValue,
          type: h.type as "stock" | "fund" | "cash",
        }))

        // Calculate asset allocation using enhanced calculator
        let assetAllocation = {
          usStocks: 0,
          nonUsStocks: 0,
          fixedIncome: 0,
          cash: 0,
        }

        if (totalValue > 0) {
          try {
            const assetBreakdown = enhancedExposureCalculator.calculateAssetClassBreakdownOnly(portfolioHoldings)

            // Map asset classes to account allocation structure
            assetBreakdown.forEach(item => {
              switch (item.class) {
                case "us_equity":
                  assetAllocation.usStocks += item.percentage
                  break
                case "intl_equity":
                  assetAllocation.nonUsStocks += item.percentage
                  break
                case "fixed_income":
                  assetAllocation.fixedIncome += item.percentage
                  break
                case "cash":
                  assetAllocation.cash += item.percentage
                  break
                // Handle other asset classes by defaulting to US equity
                case "real_estate":
                case "commodity":
                default:
                  assetAllocation.usStocks += item.percentage
                  break
              }
            })
          } catch (error) {
            console.error("Error calculating asset allocation:", error)
            // Fallback to simple calculation on error
            accountHoldings.forEach(holding => {
              if (holding.type === "cash") {
                assetAllocation.cash += (holding.marketValue / totalValue) * 100
              } else if (holding.type === "fund") {
                if (holding.ticker === "BND" || holding.ticker?.includes("BOND")) {
                  assetAllocation.fixedIncome += (holding.marketValue / totalValue) * 100
                } else if (holding.ticker === "VXUS" || holding.ticker?.includes("INTL")) {
                  assetAllocation.nonUsStocks += (holding.marketValue / totalValue) * 100
                } else {
                  assetAllocation.usStocks += (holding.marketValue / totalValue) * 100
                }
              } else {
                assetAllocation.usStocks += (holding.marketValue / totalValue) * 100
              }
            })
          }
        }

        return {
          ...account,
          totalValue,
          holdingsCount,
          assetAllocation,
        }
      }))

      // Only update if values actually changed
      const hasChanged = JSON.stringify(updatedAccounts) !== JSON.stringify(accounts)
      if (hasChanged) {
        setAccountsState(updatedAccounts)
      }
    }

    updateAccounts()
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
    // Clear all ETF-related caches (localStorage, memory, and service caches)
    clearETFCache()
    // Increment data version to invalidate component caches
    setDataVersion(prev => prev + 1)
  }, [])

  // Reset to default data
  const resetToDefaults = useCallback(() => {
    setAccountsState(defaultAccounts)
    setHoldingsState(defaultHoldings)
    setToStorage(STORAGE_KEYS.accounts, defaultAccounts)
    setToStorage(STORAGE_KEYS.holdings, defaultHoldings)
  }, [])

  // Update prices for all holdings
  const updatePrices = useCallback(async () => {
    // Use functional update to get current holdings without dependency
    setHoldingsState(prevHoldings => {
      const tickersToUpdate = prevHoldings
        .filter(h => h.ticker && h.type !== "cash" && !h.isManualEntry)
        .map(h => h.ticker!)

      if (tickersToUpdate.length === 0) return prevHoldings

      // Fetch prices asynchronously
      stockPriceService.getPrices(tickersToUpdate).then(prices => {
        setHoldingsState(currentHoldings => {
          let hasChanges = false

          // Update holdings with new prices and price change data
          const updatedHoldings = currentHoldings.map(holding => {
            if (holding.ticker && prices.has(holding.ticker.toUpperCase())) {
              const priceData = prices.get(holding.ticker.toUpperCase())!

              // Check if price actually changed
              if (holding.lastPrice !== priceData.lastPrice) {
                hasChanges = true
                const newMarketValue = holding.quantity * priceData.lastPrice
                const changeAmount = priceData.lastPrice - priceData.previousClose
                const marketValueChange = holding.quantity * changeAmount

                return {
                  ...holding,
                  lastPrice: priceData.lastPrice,
                  previousClose: priceData.previousClose,
                  changePercent: priceData.changePercent,
                  changeAmount: changeAmount,
                  marketValue: newMarketValue,
                  marketValueChange: marketValueChange,
                  priceUpdatedAt: new Date().toISOString()
                }
              }
            }
            return holding
          })

          // Only update if prices actually changed
          if (hasChanges) {
            // Save to localStorage
            setToStorage(STORAGE_KEYS.holdings, updatedHoldings)
            return updatedHoldings
          }

          return currentHoldings
        })
      }).catch(error => {
        console.error("Error updating prices:", error)
      })

      return prevHoldings
    })
  }, [])

  // Force refresh ETF names
  const refreshETFNames = useCallback(async () => {
    console.log("Refreshing ETF names...")
    // Get current holdings from state without creating dependency
    setHoldingsState(prevHoldings => {
      migrateETFNames(prevHoldings).then(migratedHoldings => {
        if (JSON.stringify(migratedHoldings) !== JSON.stringify(prevHoldings)) {
          setHoldingsState(migratedHoldings)
          setToStorage(STORAGE_KEYS.holdings, migratedHoldings)
          console.log("ETF names refreshed and saved")
        }
      }).catch(error => {
        console.error("Error refreshing ETF names:", error)
      })
      return prevHoldings
    })
  }, [])

  // Export portfolio data wrapper
  const exportPortfolioData = useCallback(() => {
    exportData()
  }, [])

  // Import portfolio data wrapper
  const importPortfolioData = useCallback((data: { accounts: Account[], holdings: Holding[] }) => {
    setAccountsState(data.accounts)
    setHoldingsState(data.holdings)
    setToStorage(STORAGE_KEYS.accounts, data.accounts)
    setToStorage(STORAGE_KEYS.holdings, data.holdings)
    // Increment data version to invalidate component caches
    setDataVersion(prev => prev + 1)
  }, [])

  // Auto-update prices on mount and periodically
  useEffect(() => {
    if (!hasInitialized || isLoading || holdings.length === 0) return

    // Update prices immediately
    updatePrices()

    // Update prices every 5 minutes
    const interval = setInterval(() => {
      updatePrices()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [hasInitialized, isLoading, holdings.length, updatePrices])

  return {
    // State
    accounts,
    holdings,
    isLoading,
    error,
    dataVersion,

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
    updatePrices,
    refreshETFNames,
    exportPortfolioData,
    importPortfolioData,
  }
}