"use client"

import { Badge } from "@/components/Badge"
import { Button } from "@/components/Button"
import { Divider } from "@/components/Divider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select"
import { AccountSelector } from "@/components/ui/AccountSelector"
import { ExposureTable } from "@/components/ui/data-table-exposure/ExposureTable"
import { useExposureCalculations } from "@/hooks/useExposureCalculations"
import { usePortfolioStore } from "@/hooks/usePortfolioStore"
import React, { useMemo, useRef, useState, useEffect } from "react"

// Display value type for the exposure visualization
export type ExposureDisplayValue = "market-value" | "pct-stocks" | "pct-portfolio"

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

  // Display value filter state
  const [displayValue, setDisplayValue] = useState<ExposureDisplayValue>("pct-portfolio")

  // Sticky filter state
  const [isFilterSticky, setIsFilterSticky] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

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

  // Filter holdings by selected account
  const filteredHoldings = useMemo(() => {
    return selectedAccount === "all"
      ? portfolioHoldings
      : portfolioHoldings.filter((h) => h.accountId === selectedAccount)
  }, [portfolioHoldings, selectedAccount])

  // Calculate total value of filtered holdings
  const filteredTotalValue = useMemo(() => {
    return filteredHoldings.reduce((sum, h) => sum + h.marketValue, 0)
  }, [filteredHoldings])

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
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
          className={`fixed bottom-6 left-1/2 z-50 w-full max-w-3xl -translate-x-1/2 px-4 transition-all duration-300 ease-out sm:px-6 ${
            isFilterSticky
              ? "translate-y-0 opacity-100"
              : "translate-y-4 pointer-events-none opacity-0"
          }`}
        >
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/95">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Account
                </label>
                <AccountSelector
                  accounts={exposureAccounts}
                  value={selectedAccount}
                  onValueChange={setSelectedAccount}
                  showAllOption={true}
                  className="w-[200px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Display
                </label>
                <Select
                  value={displayValue}
                  onValueChange={(value) => setDisplayValue(value as ExposureDisplayValue)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="market-value">Market value</SelectItem>
                    <SelectItem value="pct-stocks">Stock %</SelectItem>
                    <SelectItem value="pct-portfolio">Portfolio %</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-medium text-gray-900 dark:text-gray-50">
                {formatCurrency(filteredTotalValue)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {filteredHoldings.length}{" "}
                {filteredHoldings.length === 1 ? "holding" : "holdings"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Filter and Summary - Only show when there are accounts and holdings */}
      {accounts.length > 0 && holdings.length > 0 && (
        <div ref={filterRef} className="flex items-center justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
              <label
                htmlFor="account-filter"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Account
              </label>
              <AccountSelector
                accounts={exposureAccounts}
                value={selectedAccount}
                onValueChange={setSelectedAccount}
                showAllOption={true}
                className="w-full sm:w-[200px]"
                id="account-filter"
              />
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
              <label
                htmlFor="display-filter"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Display
              </label>
              <Select
                value={displayValue}
                onValueChange={(value) => setDisplayValue(value as ExposureDisplayValue)}
              >
                <SelectTrigger className="w-full sm:w-[140px]" id="display-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market-value">Market value</SelectItem>
                  <SelectItem value="pct-stocks">Stock %</SelectItem>
                  <SelectItem value="pct-portfolio">Portfolio %</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="text-right">
            <div className="text-base font-medium text-gray-900 dark:text-gray-50">
              {formatCurrency(filteredTotalValue)}
            </div>
            <div className="text-sm font-normal text-gray-500 dark:text-gray-400">
              {filteredHoldings.length}{" "}
              {filteredHoldings.length === 1 ? "holding" : "holdings"}
            </div>
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
            holdings={portfolioHoldings}
            accounts={exposureAccounts}
            onRefresh={handleRefresh}
            dataVersion={dataVersion}
            selectedAccount={selectedAccount}
            displayValue={displayValue}
          />
        )}
      </div>
    </main>
  )
}
