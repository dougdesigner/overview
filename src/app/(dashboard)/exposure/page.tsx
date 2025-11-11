"use client"

import { Button } from "@/components/Button"
import { Divider } from "@/components/Divider"
import { ExposureTable } from "@/components/ui/data-table-exposure/ExposureTable"
import { useExposureCalculations } from "@/hooks/useExposureCalculations"
import { usePortfolioStore } from "@/hooks/usePortfolioStore"
import { clearIndexedDBBackups } from "@/lib/indexedDBBackup"
import { useMemo } from "react"

export default function ExposurePage() {
  // Use portfolio store for holdings and accounts data
  const { holdings, accounts, isLoading: holdingsLoading, dataVersion, clearAllData } = usePortfolioStore()

  // Get exposure calculations
  const {
    exposures,
    assetClassBreakdown,
    sectorBreakdown,
    isCalculating,
    error,
  } = useExposureCalculations()

  // Convert holdings to the format expected by ExposureTable
  const portfolioHoldings = useMemo(() => {
    return holdings.map((holding) => ({
      id: holding.id,
      accountId: holding.accountId,
      accountName: holding.accountName,
      ticker: holding.ticker,
      name: holding.name,
      quantity: holding.quantity,
      lastPrice: holding.lastPrice,
      marketValue: holding.marketValue,
      type: holding.type,
    }))
  }, [holdings])

  // Convert accounts to the format expected by ExposureTable
  const exposureAccounts = useMemo(() => {
    return accounts.map((acc) => ({
      id: acc.id,
      name: acc.name,
      institution: acc.institution,
    }))
  }, [accounts])

  const handleRefresh = () => {
    // This will trigger recalculation through the hook
    // In a real app, you might also refresh prices from an API
    console.log("Refreshing exposure data...")
  }

  const handleFullRefresh = async () => {
    const confirmed = confirm(
      "This will clear all portfolio data, including:\n\n" +
      "• All accounts and holdings\n" +
      "• All ETF cache data\n" +
      "• All IndexedDB backups\n\n" +
      "This action cannot be undone. Continue?"
    )

    if (!confirmed) return

    try {
      // Clear all portfolio data and ETF caches
      clearAllData()

      // Clear IndexedDB backups
      await clearIndexedDBBackups()

      console.log("✅ All data cleared successfully")

      // Reload the page to fetch fresh data
      window.location.reload()
    } catch (error) {
      console.error("Error clearing data:", error)
      alert("Failed to clear all data. Please try again.")
    }
  }

  // Show loading state
  const isLoading = holdingsLoading || isCalculating

  // Remove loading state check to prevent stuck loading screen
  // The empty state will show immediately for new users

  // Show error if there's one
  if (error && !holdings.length) {
    return (
      <main>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
              Exposure
            </h1>
            <p className="text-gray-500 dark:text-gray-500 sm:text-sm/6">
              Error loading exposure data
            </p>
          </div>
        </div>
        <Divider />
        <div className="mt-8 rounded-lg bg-red-50 p-4 dark:bg-red-900/10">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      </main>
    )
  }

  return (
    <main>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
            Exposure
          </h1>
          <p className="text-gray-500 dark:text-gray-500 sm:text-sm/6">
            See your true stock exposure across all ETFs and direct holdings
          </p>
        </div>
        <Button onClick={handleFullRefresh} variant="secondary" className="text-sm">
          Refresh
        </Button>
      </div>
      <Divider />

      {/* Exposure Table */}
      <div className="mt-8">
        {holdingsLoading ? // Loading state is already handled above
        null : portfolioHoldings.length === 0 ? (
          // Empty state
          <div className="py-12 text-center">
            {accounts.length === 0 ? (
              // No accounts at all
              <>
                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-50">
                  No accounts yet
                </h3>
                <p className="mb-4 text-gray-500 dark:text-gray-400">
                  Please add an account first to start tracking your portfolio
                  exposure.
                </p>
                <Button
                  onClick={() => (window.location.href = "/accounts")}
                  className="inline-flex items-center gap-2"
                >
                  Go to Accounts
                </Button>
              </>
            ) : holdings.length === 0 ? (
              // Has accounts but no holdings
              <>
                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-50">
                  No holdings to analyze
                </h3>
                <p className="mb-4 text-gray-500 dark:text-gray-400">
                  Add holdings to your accounts to see exposure analysis.
                </p>
                <Button
                  onClick={() => (window.location.href = "/holdings")}
                  className="inline-flex items-center gap-2"
                >
                  Add Holdings
                </Button>
              </>
            ) : (
              // Has holdings but no portfolio holdings (shouldn't happen, but just in case)
              <>
                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-50">
                  No exposure data available
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Unable to calculate exposures for your current holdings.
                </p>
              </>
            )}
          </div>
        ) : (
          // Show the exposure table with data
          <ExposureTable
            holdings={portfolioHoldings}
            accounts={exposureAccounts}
            onRefresh={handleRefresh}
            dataVersion={dataVersion}
          />
        )}
      </div>
    </main>
  )
}
