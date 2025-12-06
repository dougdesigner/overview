"use client"

import { Badge } from "@/components/Badge"
import { Button } from "@/components/Button"
import { Divider } from "@/components/Divider"
import { DashboardSettingsDropdown } from "@/components/ui/DashboardSettingsDropdown"
import { InstitutionLogo } from "@/components/ui/InstitutionLogo"
import { ExposureTable } from "@/components/ui/data-table-exposure/ExposureTable"
import {
  ExposureDisplayValue,
  HoldingsFilter,
} from "@/components/ui/data-table-exposure/types"
import { useExposureCalculations } from "@/hooks/useExposureCalculations"
import { usePortfolioStore } from "@/hooks/usePortfolioStore"
import { RiCloseLine } from "@remixicon/react"
import React, { useMemo, useRef, useState, useEffect, useCallback } from "react"

export default function ExposurePage() {
  // Use portfolio store for holdings and accounts data
  const {
    holdings,
    accounts,
    isLoading: holdingsLoading,
    dataVersion,
  } = usePortfolioStore()

  // Get exposure calculations
  const {
    exposures,
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

  // Account filter state
  const [selectedAccount, setSelectedAccount] = React.useState<string>("all")

  // Holdings filter state (All, Magnificent 7, Top 10)
  const [holdingsFilter, setHoldingsFilter] = useState<HoldingsFilter>("all")

  // Combine GOOG/GOOGL toggle state
  const [combineGoogleShares, setCombineGoogleShares] = useState(false)

  // Display value state (moved from chart)
  const [displayValue, setDisplayValue] =
    useState<ExposureDisplayValue>("pct-portfolio")

  // Reset key to force child components to remount and reset their local state
  const [resetKey, setResetKey] = useState(0)

  // Sticky filter state
  const [isFilterSticky, setIsFilterSticky] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

  // State for filtered data reported by ExposureTable
  const [tableFilteredCount, setTableFilteredCount] = useState(0)
  const [tableFilteredValue, setTableFilteredValue] = useState(0)

  // Callback for ExposureTable to report filtered data
  const handleFilteredDataChange = useCallback((count: number, value: number) => {
    setTableFilteredCount(count)
    setTableFilteredValue(value)
  }, [])

  // Intersection Observer for sticky filter
  useEffect(() => {
    const filterElement = filterRef.current
    if (!filterElement) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When the original filter is not intersecting (scrolled out), show sticky
        setIsFilterSticky(!entry.isIntersecting)
      },
      {
        root: null,
        // Trigger when element goes under the sticky nav (~100px from top)
        rootMargin: "-100px 0px 0px 0px",
        threshold: 0,
      },
    )

    observer.observe(filterElement)
    return () => observer.disconnect()
  }, [accounts.length, holdings.length])

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Get display label for holdings filter
  const getFilterLabel = (filter: HoldingsFilter): string => {
    switch (filter) {
      case "mag7":
        return "Magnificent 7"
      case "top7":
        return "Top 7"
      case "top10":
        return "Top 10"
      default:
        return ""
    }
  }

  // Check if any filter has changed from default
  const hasFilterChanges =
    selectedAccount !== "all" ||
    holdingsFilter !== "all" ||
    displayValue !== "pct-portfolio" ||
    combineGoogleShares !== false

  // Reset all filters to defaults
  const resetFilters = () => {
    setSelectedAccount("all")
    setHoldingsFilter("all")
    setDisplayValue("pct-portfolio")
    setCombineGoogleShares(false)
    setResetKey((k) => k + 1) // Force child remount to reset chart settings
  }

  const handleRefresh = () => {
    // This will trigger recalculation through the hook
    // In a real app, you might also refresh prices from an API
    console.log("Refreshing exposure data...")
  }

  // Show loading state check removed to prevent stuck loading screen
  // The empty state will show immediately for new users
  // Combined loading state available from: holdingsLoading || isCalculating

  // Show error if there's one
  if (error && !holdings.length) {
    return (
      <main className="min-h-[calc(100vh-180px)]">
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
        {/* <Divider /> */}
        <div className="mt-8 rounded-lg bg-red-50 p-4 dark:bg-red-900/10">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-180px)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-900 dark:text-gray-50">
            Exposure
            {exposures.length > 0 && <Badge variant="neutral">{exposures.length.toLocaleString()}</Badge>}
          </h1>
          <p className="text-gray-500 dark:text-gray-500 sm:text-sm/6">
            See your true stock exposure across all ETFs and direct holdings
          </p>
        </div>
        {/* <Button onClick={handleFullRefresh} variant="secondary" className="text-sm">
          Refresh
        </Button> */}
      </div>
      <Divider />

      {/* Sticky Account Filter - Bottom positioned, narrower */}
      {accounts.length > 0 && holdings.length > 0 && (
        <div
          className={`fixed bottom-6 left-1/2 z-50 w-full max-w-3xl -translate-x-1/2 px-4 transition-[transform,opacity] duration-300 ease-out sm:px-6 ${
            isFilterSticky
              ? "translate-y-0 opacity-100"
              : "translate-y-4 pointer-events-none opacity-0"
          }`}
        >
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/95">
            <div className="text-left">
              <div className="text-base font-medium text-gray-900 dark:text-gray-50">
                {formatCurrency(tableFilteredValue)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {tableFilteredCount.toLocaleString()}{" "}
                {tableFilteredCount === 1 ? "stock" : "stocks"}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Account filter pill */}
              {selectedAccount !== "all" && (
                <Badge variant="default" className="flex h-9 items-center gap-1.5 px-3 text-sm">
                  <InstitutionLogo
                    institution={exposureAccounts.find((a) => a.id === selectedAccount)?.institution || ""}
                    className="size-5"
                  />
                  <span className="hidden sm:inline">
                    {exposureAccounts.find((a) => a.id === selectedAccount)?.name}
                  </span>
                  <button
                    onClick={() => setSelectedAccount("all")}
                    className="rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-500/30"
                  >
                    <RiCloseLine className="size-4" />
                  </button>
                </Badge>
              )}
              {/* Holdings filter pill */}
              {holdingsFilter !== "all" && (
                <Badge variant="default" className="flex h-9 items-center gap-1.5 px-3 text-sm">
                  {getFilterLabel(holdingsFilter)}
                  <button
                    onClick={() => setHoldingsFilter("all")}
                    className="rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-500/30"
                  >
                    <RiCloseLine className="size-4" />
                  </button>
                </Badge>
              )}
              <DashboardSettingsDropdown
                accounts={exposureAccounts}
                selectedAccount={selectedAccount}
                onAccountChange={setSelectedAccount}
                holdingsFilter={holdingsFilter}
                onHoldingsFilterChange={setHoldingsFilter}
                displayValue={displayValue}
                onDisplayValueChange={setDisplayValue}
                combineGoogleShares={combineGoogleShares}
                onCombineGoogleSharesChange={setCombineGoogleShares}
                onReset={resetFilters}
              />
            </div>
          </div>
        </div>
      )}

      {/* Account Filter and Summary - Only show when there are accounts and holdings */}
      {accounts.length > 0 && holdings.length > 0 && (
        <div ref={filterRef} className="flex items-center justify-between">
          <div className="text-left">
            <div className="text-base font-medium text-gray-900 dark:text-gray-50">
              {formatCurrency(tableFilteredValue)}
            </div>
            <div className="text-sm font-normal text-gray-500 dark:text-gray-400">
              {tableFilteredCount.toLocaleString()}{" "}
              {tableFilteredCount === 1 ? "stock" : "stocks"}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Account filter pill */}
            {selectedAccount !== "all" && (
              <Badge variant="default" className="flex h-9 items-center gap-1.5 px-3 text-sm">
                <InstitutionLogo
                  institution={exposureAccounts.find((a) => a.id === selectedAccount)?.institution || ""}
                  className="size-5"
                />
                <span className="hidden sm:inline">
                  {exposureAccounts.find((a) => a.id === selectedAccount)?.name}
                </span>
                <button
                  onClick={() => setSelectedAccount("all")}
                  className="rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-500/30"
                >
                  <RiCloseLine className="size-4" />
                </button>
              </Badge>
            )}
            {/* Holdings filter pill */}
            {holdingsFilter !== "all" && (
              <Badge variant="default" className="flex h-9 items-center gap-1.5 px-3 text-sm">
                {getFilterLabel(holdingsFilter)}
                <button
                  onClick={() => setHoldingsFilter("all")}
                  className="rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-500/30"
                >
                  <RiCloseLine className="size-4" />
                </button>
              </Badge>
            )}
            <DashboardSettingsDropdown
              accounts={exposureAccounts}
              selectedAccount={selectedAccount}
              onAccountChange={setSelectedAccount}
              holdingsFilter={holdingsFilter}
              onHoldingsFilterChange={setHoldingsFilter}
              displayValue={displayValue}
              onDisplayValueChange={setDisplayValue}
              combineGoogleShares={combineGoogleShares}
              onCombineGoogleSharesChange={setCombineGoogleShares}
              onReset={resetFilters}
            />
          </div>
        </div>
      )}

      {/* Exposure Table */}
      <div className="mt-6">
        {holdingsLoading ? null : portfolioHoldings.length === 0 ? ( // Loading state is already handled above
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
            key={resetKey}
            holdings={portfolioHoldings}
            accounts={exposureAccounts}
            onRefresh={handleRefresh}
            dataVersion={dataVersion}
            selectedAccount={selectedAccount}
            holdingsFilter={holdingsFilter}
            combineGoogleShares={combineGoogleShares}
            displayValue={displayValue}
            onFilteredDataChange={handleFilteredDataChange}
          />
        )}
      </div>
    </main>
  )
}
