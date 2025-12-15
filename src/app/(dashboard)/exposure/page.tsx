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
import { Icon } from "@iconify/react"
import React, { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react"

export default function ExposurePage() {
  // Use portfolio store for holdings and accounts data
  const {
    holdings,
    accounts,
    isLoading: holdingsLoading,
    dataVersion,
    hasViewedStocksPage,
    markStocksPageViewed,
  } = usePortfolioStore()

  // Mark stocks page as viewed for onboarding
  useEffect(() => {
    if (!hasViewedStocksPage && holdings.length > 0) {
      markStocksPageViewed()
    }
  }, [hasViewedStocksPage, holdings.length, markStocksPageViewed])

  // Get exposure calculations
  const { exposures, totalValue, error } = useExposureCalculations()

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
      isManualEntry: holding.isManualEntry,
      sector: holding.sector,
      industry: holding.industry,
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

  // Account filter state (multi-select)
  const [selectedAccounts, setSelectedAccounts] = React.useState<string[]>([
    "all",
  ])

  // Holdings filter state (All, Magnificent 7, Top 10)
  const [holdingsFilter, setHoldingsFilter] = useState<HoldingsFilter>("all")

  // Combine GOOG/GOOGL toggle state
  const [combineGoogleShares, setCombineGoogleShares] = useState(true)

  // Show other assets (cash + funds) toggle state
  const [showOtherAssets, setShowOtherAssets] = useState(false)

  // Display value state (moved from chart)
  const [displayValue, setDisplayValue] =
    useState<ExposureDisplayValue>("pct-stocks")

  // Reset key to force child components to remount and reset their local state
  const [resetKey, setResetKey] = useState(0)

  // Sticky filter state
  const [isFilterSticky, setIsFilterSticky] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

  // State for filtered data reported by ExposureTable
  const [tableFilteredCount, setTableFilteredCount] = useState(0)
  const [tableFilteredValue, setTableFilteredValue] = useState(0)

  // Track ExposureTable's internal loading state
  const [tableLoading, setTableLoading] = useState(true)

  // Callback for ExposureTable to report filtered data
  const handleFilteredDataChange = useCallback(
    (count: number, value: number) => {
      setTableFilteredCount(count)
      setTableFilteredValue(value)
    },
    [],
  )

  // Callback for ExposureTable to report loading state
  const handleLoadingChange = useCallback((loading: boolean) => {
    setTableLoading(loading)
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
  }, [accounts.length, holdings.length, holdingsLoading])

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
    !selectedAccounts.includes("all") ||
    holdingsFilter !== "all" ||
    displayValue !== "pct-stocks" ||
    combineGoogleShares !== true ||
    showOtherAssets !== false

  // Reset all filters to defaults
  const resetFilters = () => {
    setSelectedAccounts(["all"])
    setHoldingsFilter("all")
    setDisplayValue("pct-stocks")
    setCombineGoogleShares(true)
    setShowOtherAssets(false)
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
      <main className="min-h-[calc(100vh-180px)] pb-20 sm:pb-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
              Stocks
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

  // Determine if we should show loading skeleton
  // Show skeleton only during initial portfolio data load
  // ExposureTable handles its own loading state internally
  const showLoadingSkeleton = holdingsLoading

  // Full-page loading skeleton
  if (showLoadingSkeleton) {
    return (
      <main className="min-h-[calc(100vh-180px)] pb-20 sm:pb-0">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 h-8 w-32 rounded bg-gray-100 dark:bg-gray-800"></div>
              <div className="h-4 w-64 rounded bg-gray-100 dark:bg-gray-800"></div>
            </div>
          </div>
          {/* Divider */}
          <div className="my-6 h-px bg-gray-200 dark:bg-gray-800"></div>
          {/* Filter bar skeleton */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="mb-1 h-6 w-24 rounded bg-gray-100 dark:bg-gray-800"></div>
              <div className="h-4 w-16 rounded bg-gray-100 dark:bg-gray-800"></div>
            </div>
            <div className="h-10 w-32 rounded-lg bg-gray-100 dark:bg-gray-800"></div>
          </div>
          {/* Chart skeleton */}
          <div className="mb-6 h-80 rounded-lg bg-gray-100 dark:bg-gray-800"></div>
          {/* Table skeleton */}
          <div className="space-y-3">
            <div className="h-12 rounded-lg bg-gray-100 dark:bg-gray-800"></div>
            <div className="h-16 rounded-lg bg-gray-100 dark:bg-gray-800"></div>
            <div className="h-16 rounded-lg bg-gray-100 dark:bg-gray-800"></div>
            <div className="h-16 rounded-lg bg-gray-100 dark:bg-gray-800"></div>
            <div className="h-16 rounded-lg bg-gray-100 dark:bg-gray-800"></div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-180px)] pb-20 sm:pb-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-900 dark:text-gray-50">
            Stocks
            {exposures.length > 0 && (
              <Badge variant="neutral">
                {exposures.length.toLocaleString()}
              </Badge>
            )}
          </h1>
          <p className="text-gray-500 dark:text-gray-500 sm:text-sm/6">
            Stock exposure across all ETFs and direct holdings
          </p>
        </div>
        {/* <Button onClick={handleFullRefresh} variant="secondary" className="text-sm">
          Refresh
        </Button> */}
      </div>
      <Divider />

      {/* Sticky Account Filter - Bottom positioned, narrower */}
      {accounts.length > 0 && holdings.length > 0 && (
        <>
          {/* Bottom gradient - fades content behind filter (mobile only) */}
          <div
            className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 h-40 bg-gradient-to-t from-white via-white/80 to-transparent transition-opacity duration-300 sm:hidden dark:from-gray-950 dark:via-gray-950/80 ${
              isFilterSticky ? "opacity-100" : "opacity-0"
            }`}
          />
          <div
            className={`fixed inset-x-0 bottom-20 z-50 mx-2 transition-[transform,opacity] duration-300 ease-out sm:left-1/2 sm:right-auto sm:mx-0 sm:w-full sm:max-w-2xl sm:-translate-x-1/2 sm:bottom-6 sm:px-6 ${
              isFilterSticky
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-4 opacity-0"
            }`}
          >
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/95">
            <div className="text-left">
              <div className="flex items-center gap-2 text-base font-medium text-gray-900 dark:text-gray-50">
                {formatCurrency(tableFilteredValue)}
                {totalValue > 0 && (
                  <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-sm font-medium tabular-nums text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {((tableFilteredValue / totalValue) * 100).toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {tableFilteredCount.toLocaleString()}{" "}
                {tableFilteredCount === 1 ? "stock" : "stocks"}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Account filter pill (multi-select) */}
              {!selectedAccounts.includes("all") && (
                <Badge
                  variant="default"
                  className="flex h-9 items-center gap-1.5 px-3 text-sm"
                >
                  {selectedAccounts.length === 1 ? (
                    <>
                      <InstitutionLogo
                        institution={
                          exposureAccounts.find(
                            (a) => a.id === selectedAccounts[0],
                          )?.institution || ""
                        }
                        className="size-5"
                      />
                      <span className="hidden sm:inline">
                        {
                          exposureAccounts.find(
                            (a) => a.id === selectedAccounts[0],
                          )?.name
                        }
                      </span>
                    </>
                  ) : (
                    <span>{selectedAccounts.length} accounts</span>
                  )}
                  <button
                    onClick={() => setSelectedAccounts(["all"])}
                    className="rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-500/30"
                  >
                    <Icon icon="carbon:close" className="size-4" />
                  </button>
                </Badge>
              )}
              {/* Holdings filter pill */}
              {holdingsFilter !== "all" && (
                <Badge
                  variant="default"
                  className="flex h-9 items-center gap-1.5 px-3 text-sm"
                >
                  {getFilterLabel(holdingsFilter)}
                  <button
                    onClick={() => setHoldingsFilter("all")}
                    className="rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-500/30"
                  >
                    <Icon icon="carbon:close" className="size-4" />
                  </button>
                </Badge>
              )}
              <DashboardSettingsDropdown
                accounts={exposureAccounts}
                selectedAccounts={selectedAccounts}
                onAccountsChange={setSelectedAccounts}
                holdingsFilter={holdingsFilter}
                onHoldingsFilterChange={setHoldingsFilter}
                displayValue={displayValue}
                onDisplayValueChange={setDisplayValue}
                combineGoogleShares={combineGoogleShares}
                onCombineGoogleSharesChange={setCombineGoogleShares}
                showOtherAssets={showOtherAssets}
                onShowOtherAssetsChange={setShowOtherAssets}
                onReset={resetFilters}
                hideTextOnMobile
                compactWhenActive
              />
            </div>
          </div>
        </div>
        </>
      )}

      {/* Account Filter and Summary - Only show when there are accounts and holdings */}
      {accounts.length > 0 && holdings.length > 0 && (
        <div ref={filterRef} className="flex items-center justify-between">
          <div className="text-left">
            <div className="flex items-center gap-2 text-base font-medium text-gray-900 dark:text-gray-50">
              {formatCurrency(tableFilteredValue)}
              {totalValue > 0 && (
                <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-sm font-medium tabular-nums text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {((tableFilteredValue / totalValue) * 100).toFixed(1)}%
                </span>
              )}
            </div>
            <div className="text-sm font-normal text-gray-500 dark:text-gray-400">
              {tableFilteredCount.toLocaleString()}{" "}
              {tableFilteredCount === 1 ? "stock" : "stocks"}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Account filter pill (multi-select) */}
            {!selectedAccounts.includes("all") && (
              <Badge
                variant="default"
                className="flex h-9 items-center gap-1.5 px-3 text-sm"
              >
                {selectedAccounts.length === 1 ? (
                  <>
                    <InstitutionLogo
                      institution={
                        exposureAccounts.find(
                          (a) => a.id === selectedAccounts[0],
                        )?.institution || ""
                      }
                      className="size-5"
                    />
                    <span className="hidden sm:inline">
                      {
                        exposureAccounts.find(
                          (a) => a.id === selectedAccounts[0],
                        )?.name
                      }
                    </span>
                  </>
                ) : (
                  <span>{selectedAccounts.length} accounts</span>
                )}
                <button
                  onClick={() => setSelectedAccounts(["all"])}
                  className="rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-500/30"
                >
                  <Icon icon="carbon:close" className="size-4" />
                </button>
              </Badge>
            )}
            {/* Holdings filter pill */}
            {holdingsFilter !== "all" && (
              <Badge
                variant="default"
                className="flex h-9 items-center gap-1.5 px-3 text-sm"
              >
                {getFilterLabel(holdingsFilter)}
                <button
                  onClick={() => setHoldingsFilter("all")}
                  className="rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-500/30"
                >
                  <Icon icon="carbon:close" className="size-4" />
                </button>
              </Badge>
            )}
            <DashboardSettingsDropdown
              accounts={exposureAccounts}
              selectedAccounts={selectedAccounts}
              onAccountsChange={setSelectedAccounts}
              holdingsFilter={holdingsFilter}
              onHoldingsFilterChange={setHoldingsFilter}
              displayValue={displayValue}
              onDisplayValueChange={setDisplayValue}
              combineGoogleShares={combineGoogleShares}
              onCombineGoogleSharesChange={setCombineGoogleShares}
              showOtherAssets={showOtherAssets}
              onShowOtherAssetsChange={setShowOtherAssets}
              onReset={resetFilters}
            />
          </div>
        </div>
      )}

      {/* Exposure Table */}
      <div className="mt-6" id="exposure-section">
        {portfolioHoldings.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center py-12 text-center">
            {accounts.length === 0 ? (
              // No accounts at all
              <>
                <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-gray-800">
                  <Icon
                    icon="carbon:sankey-diagram-alt"
                    className="size-8 text-gray-400 dark:text-gray-500"
                    aria-hidden="true"
                  />
                </div>
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
                <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-gray-800">
                  <Icon
                    icon="carbon:chart-ring"
                    className="size-8 text-gray-400 dark:text-gray-500"
                    aria-hidden="true"
                  />
                </div>
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
                  Add holdings
                </Button>
              </>
            ) : (
              // Has holdings but no portfolio holdings (shouldn't happen, but just in case)
              <>
                <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-gray-800">
                  <Icon
                    icon="carbon:chart-treemap"
                    className="size-8 text-gray-400 dark:text-gray-500"
                    aria-hidden="true"
                  />
                </div>
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
            selectedAccounts={selectedAccounts}
            holdingsFilter={holdingsFilter}
            combineGoogleShares={combineGoogleShares}
            showOtherAssets={showOtherAssets}
            displayValue={displayValue}
            onFilteredDataChange={handleFilteredDataChange}
            onLoadingChange={handleLoadingChange}
          />
        )}
      </div>
    </main>
  )
}
