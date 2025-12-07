"use client"

import { Badge } from "@/components/Badge"
import { Button } from "@/components/Button"
import { Divider } from "@/components/Divider"
import { HoldingsSunburst } from "@/components/HoldingsSunburstWrapper"
import { AccountSelector } from "@/components/ui/AccountSelector"
import {
  HoldingsDrawer,
  type HoldingFormData,
} from "@/components/ui/HoldingsDrawer"
import { HoldingsTable } from "@/components/ui/data-table-holdings/HoldingsTable"
import { Holding } from "@/components/ui/data-table-holdings/types"
import mutualFundMappings from "@/data/mutual-fund-mappings.json"
import { usePortfolioStore } from "@/hooks/usePortfolioStore"
import { getETFName } from "@/lib/etfMetadataService"
import { getKnownETFName } from "@/lib/knownETFNames"
import { extractDomainsFromCompanyName } from "@/lib/logoUtils"
import { getStockPrice } from "@/lib/stockPriceService"
import { RiAddLine } from "@remixicon/react"
import { useSearchParams } from "next/navigation"
import React, { Suspense, useMemo } from "react"

function HoldingsContent() {
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = React.useState(false)
  const [editingHolding, setEditingHolding] = React.useState<Holding | null>(
    null,
  )
  const [currentAccountFilter, setCurrentAccountFilter] =
    React.useState<string>(searchParams.get("account") || "all")
  const [isFilterSticky, setIsFilterSticky] = React.useState(false)
  const filterRef = React.useRef<HTMLDivElement>(null)

  // Use portfolio store for accounts and holdings data
  const {
    accounts: storeAccounts,
    holdings,
    addHolding,
    updateHolding,
    deleteHolding,
    refreshETFNames,
  } = usePortfolioStore()

  // Convert accounts to the format expected by components
  const accounts = useMemo(
    () =>
      storeAccounts.map((acc) => ({
        id: acc.id,
        name: acc.name,
        institution: acc.institution,
      })),
    [storeAccounts],
  )

  // Refresh ETF names on mount if needed
  React.useEffect(() => {
    // Check if any holdings have QQQM with non-detailed name
    const hasQQQMWithBasicName = holdings.some(
      (h) => h.ticker?.toUpperCase() === "QQQM" && !h.name.includes("Invesco"),
    )

    if (hasQQQMWithBasicName) {
      console.log("Detected QQQM with basic name, refreshing ETF names...")
      refreshETFNames()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  // Calculate allocations for all holdings
  const holdingsWithAllocations = useMemo(() => {
    const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0)
    return holdings.map((h) => ({
      ...h,
      allocation: totalValue > 0 ? (h.marketValue / totalValue) * 100 : 0,
    }))
  }, [holdings])

  // Filter holdings by selected account for summary display
  const filteredHoldings = useMemo(() => {
    return currentAccountFilter === "all"
      ? holdingsWithAllocations
      : holdingsWithAllocations.filter(
          (h) => h.accountId === currentAccountFilter,
        )
  }, [holdingsWithAllocations, currentAccountFilter])

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

  // Intersection Observer for sticky filter
  React.useEffect(() => {
    const filterElement = filterRef.current
    if (!filterElement) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFilterSticky(!entry.isIntersecting)
      },
      {
        root: null,
        rootMargin: "-100px 0px 0px 0px",
        threshold: 0,
      },
    )

    observer.observe(filterElement)
    return () => observer.disconnect()
  }, [accounts.length, holdings.length])

  const handleHoldingSubmit = async (holding: HoldingFormData) => {
    if (editingHolding) {
      // Update existing holding
      if (holding.isManualEntry) {
        // Manual entry update
        const domains = holding.companyName
          ? extractDomainsFromCompanyName(holding.companyName)
          : []
        updateHolding(editingHolding.id, {
          ticker: holding.ticker,
          name: holding.companyName || holding.ticker || "",
          quantity: holding.shares || 0,
          lastPrice: holding.pricePerShare || editingHolding.lastPrice,
          marketValue:
            (holding.shares || 0) *
            (holding.pricePerShare || editingHolding.lastPrice),
          isUSStock: holding.isUSStock ?? true,
          isManualEntry: true,
          domain: domains[0],
        })
      } else {
        // Predefined ticker update
        updateHolding(editingHolding.id, {
          ticker: holding.ticker,
          name: holding.ticker || holding.description || "",
          quantity: holding.shares || holding.amount || 0,
          // Market value will be recalculated automatically by the store
        })
      }
    } else {
      // Add new holding
      const account = accounts.find((a) => a.id === holding.accountId)
      if (!account) {
        console.error("Account not found:", holding.accountId)
        return
      }

      // Determine if it's an ETF/Fund and get proper name
      let name = holding.ticker || holding.description || ""
      let type: "stock" | "fund" | "cash" = "stock"
      let lastPrice = 100 // Default price
      let isUSStock: boolean | undefined = undefined
      let isManualEntry: boolean | undefined = undefined
      let domain: string | undefined = undefined

      if (holding.holdingType === "cash") {
        type = "cash"
        name = holding.description || "Cash"
        lastPrice = 1
      } else if (holding.isManualEntry && holding.ticker) {
        // Manual entry - use provided values directly, skip API lookups
        name = holding.companyName || holding.ticker
        lastPrice = holding.pricePerShare || 100
        isUSStock = holding.isUSStock ?? true
        isManualEntry = true

        // Extract domain from company name for logo lookup
        if (holding.companyName) {
          const domains = extractDomainsFromCompanyName(holding.companyName)
          domain = domains[0]
          console.log(
            `Manual entry - extracted domains from "${holding.companyName}":`,
            domains,
          )
        }

        console.log(
          `Manual entry: ${holding.ticker} - ${name} at $${lastPrice} (${isUSStock ? "US" : "Non-US"})`,
        )
      } else if (holding.ticker) {
        // Predefined ticker - use existing logic
        // First, check if it's a mutual fund
        const mutualFund =
          mutualFundMappings[holding.ticker as keyof typeof mutualFundMappings]

        if (mutualFund) {
          // It's a mutual fund
          name = mutualFund.name
          type = "fund"
          console.log(`Using mutual fund name for ${holding.ticker}: ${name}`)
        } else {
          // Check if we have a known ETF name locally
          const knownName = getKnownETFName(holding.ticker)

          if (knownName) {
            // We have a known name - use it immediately
            name = knownName
            type = "fund"
            console.log(
              `Using known ETF name for ${holding.ticker}: ${knownName}`,
            )
          } else {
            // Check if it's likely an ETF based on ticker format
            const isLikelyETF =
              holding.ticker.length >= 2 &&
              holding.ticker.length <= 5 &&
              holding.ticker === holding.ticker.toUpperCase()

            if (isLikelyETF) {
              // Try to fetch from API for unknown ETFs
              const etfNameResult = await getETFName(holding.ticker)
              if (etfNameResult && etfNameResult !== `${holding.ticker} ETF`) {
                name = etfNameResult
                type = "fund"
                console.log(
                  `Fetched ETF name for ${holding.ticker}: ${etfNameResult}`,
                )
              } else {
                // Default name for unknown ETFs
                name = holding.ticker
              }
            } else {
              // Not an ETF, just use ticker as name
              name = holding.ticker
            }
          }
        }

        // Fetch price (always needed regardless of ETF status)
        try {
          const price = await getStockPrice(holding.ticker)
          if (price) {
            lastPrice = price
            console.log(`Fetched price for ${holding.ticker}: $${lastPrice}`)
          } else {
            console.log(`Using default price for ${holding.ticker}`)
          }
        } catch {
          console.log(
            `Error fetching price for ${holding.ticker}, using default`,
          )
        }
      }

      const quantity = holding.shares || holding.amount || 0
      const marketValue = quantity * lastPrice

      addHolding({
        accountId: holding.accountId,
        accountName: account.name,
        ticker: holding.ticker,
        name: name,
        quantity: quantity,
        lastPrice: lastPrice,
        marketValue: marketValue,
        type: type,
        isUSStock: isUSStock,
        isManualEntry: isManualEntry,
        domain: domain,
      })
    }
    setEditingHolding(null)
    setIsOpen(false)
  }

  const handleEdit = (holding: Holding) => {
    setEditingHolding(holding)
    setIsOpen(true)
  }

  // Convert Holding to HoldingFormData for editing
  const convertHoldingToFormData = (holding: Holding): HoldingFormData => {
    if (holding.type === "cash") {
      return {
        id: holding.id,
        accountId: holding.accountId,
        holdingType: "cash",
        amount: holding.marketValue, // For cash, marketValue is the amount
        description: holding.name,
      }
    } else {
      return {
        id: holding.id,
        accountId: holding.accountId,
        holdingType: "stocks-funds",
        ticker: holding.ticker,
        shares: holding.quantity,
        // Manual entry fields
        isManualEntry: holding.isManualEntry || false,
        companyName: holding.isManualEntry ? holding.name : undefined,
        pricePerShare: holding.isManualEntry ? holding.lastPrice : undefined,
        isUSStock: holding.isUSStock ?? true,
      }
    }
  }

  const handleDelete = (holdingId: string) => {
    deleteHolding(holdingId)
  }

  // Show loading state
  // Remove loading state check to prevent stuck loading screen
  // The empty state will show immediately for new users

  return (
    <main className="min-h-[calc(100vh-180px)] pb-24 sm:pb-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-900 dark:text-gray-50">
            Holdings
            {holdings.length > 0 && (
              <Badge variant="neutral">{holdings.length}</Badge>
            )}
          </h1>
          <p className="text-gray-500 dark:text-gray-500 sm:text-sm/6">
            All investments in one place, across every account
          </p>
        </div>
        {accounts.length > 0 && (
          <div className="flex gap-2">
            {/* {holdings.length > 0 && (
              <Button
                onClick={handleRefreshPrices}
                variant="secondary"
                disabled={isRefreshing}
                className="flex items-center gap-2 text-base sm:text-sm"
              >
                {isRefreshing ? "Refreshing..." : "Refresh Prices"}
                <RiRefreshLine className={`-mr-0.5 size-5 shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
              </Button>
            )} */}
            <Button
              onClick={() => setIsOpen(true)}
              className="hidden items-center gap-2 sm:flex sm:text-sm"
            >
              Add Holdings
              <RiAddLine
                className="-mr-0.5 size-5 shrink-0"
                aria-hidden="true"
              />
            </Button>
          </div>
        )}
        <HoldingsDrawer
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open)
            if (!open) {
              setEditingHolding(null)
            }
          }}
          accounts={accounts}
          onSubmit={handleHoldingSubmit}
          mode={editingHolding ? "edit" : "create"}
          initialData={
            editingHolding
              ? convertHoldingToFormData(editingHolding)
              : currentAccountFilter !== "all"
                ? {
                    accountId: currentAccountFilter,
                    holdingType: "stocks-funds",
                  }
                : undefined
          }
        />
      </div>
      <Divider />

      {/* Sticky Account Filter - Bottom positioned, narrower */}
      {accounts.length > 0 && holdings.length > 0 && (
        <div
          className={`fixed bottom-20 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2 px-4 transition-[transform,opacity] duration-300 ease-out sm:bottom-6 sm:px-6 ${
            isFilterSticky
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-4 opacity-0"
          }`}
        >
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/95">
            <div className="text-left">
              <div className="text-base font-medium text-gray-900 dark:text-gray-50">
                {formatCurrency(filteredTotalValue)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {filteredHoldings.length}{" "}
                {filteredHoldings.length === 1 ? "holding" : "holdings"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="hidden text-sm font-medium text-gray-700 dark:text-gray-300 sm:block">
                Account
              </label>
              <AccountSelector
                accounts={accounts}
                value={currentAccountFilter}
                onValueChange={setCurrentAccountFilter}
                showAllOption={true}
                className="w-auto sm:w-[200px]"
                compactOnMobile={true}
              />
              {/* Add button - mobile only */}
              <Button
                onClick={() => setIsOpen(true)}
                className="size-9 p-0 sm:hidden"
              >
                <RiAddLine className="size-5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Account Filter and Summary - Only show when there are accounts and holdings */}
      {accounts.length > 0 && holdings.length > 0 && (
        <div ref={filterRef} className="mt-0 flex items-center justify-between">
          <div className="text-left">
            <div className="text-base font-medium text-gray-900 dark:text-gray-50">
              {formatCurrency(filteredTotalValue)}
            </div>
            <div className="text-sm font-normal text-gray-500 dark:text-gray-400">
              {filteredHoldings.length}{" "}
              {filteredHoldings.length === 1 ? "holding" : "holdings"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label
              htmlFor="account-filter"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Account
            </label>
            <AccountSelector
              accounts={accounts}
              value={currentAccountFilter}
              onValueChange={setCurrentAccountFilter}
              showAllOption={true}
              className="w-[200px]"
              id="account-filter"
            />
          </div>
        </div>
      )}

      {/* Hero Visualization - Sunburst Chart - Only show when there are holdings */}
      {holdings.length > 0 && (
        <div className="pt-6" id="holdings-section">
          <HoldingsSunburst
            holdings={holdingsWithAllocations}
            accounts={accounts}
            selectedAccountId={currentAccountFilter}
            onAccountChange={setCurrentAccountFilter}
            height={500}
          />
        </div>
      )}

      {/* Holdings Table */}
      <div className="mt-6">
        {accounts.length === 0 ? (
          <div className="py-12 text-center">
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-50">
              No accounts yet
            </h3>
            <p className="mb-4 text-gray-500 dark:text-gray-400">
              Please add an account first before adding holdings.
            </p>
            <Button
              onClick={() => (window.location.href = "/accounts")}
              className="inline-flex items-center gap-2"
            >
              Go to Accounts
            </Button>
          </div>
        ) : holdings.length === 0 ? (
          <div className="py-12 text-center">
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-50">
              No holdings yet
            </h3>
            <p className="mb-4 text-gray-500 dark:text-gray-400">
              Add your first holding to start tracking your investments.
            </p>
            <Button
              onClick={() => setIsOpen(true)}
              className="inline-flex items-center gap-2"
            >
              Add Your First Holding
              <RiAddLine
                className="-mr-0.5 size-5 shrink-0"
                aria-hidden="true"
              />
            </Button>
          </div>
        ) : (
          <HoldingsTable
            holdings={holdingsWithAllocations}
            accounts={accounts}
            onEdit={handleEdit}
            onDelete={handleDelete}
            selectedAccount={currentAccountFilter}
          />
        )}
      </div>

      {/* Mobile Add Holdings Button - Only show on mobile when accounts exist */}
      {accounts.length > 0 && (
        <div className="mt-6 sm:hidden">
          <Button
            onClick={() => setIsOpen(true)}
            className="flex w-full items-center justify-center gap-2 text-base"
          >
            Add Holdings
            <RiAddLine className="-mr-0.5 size-5 shrink-0" aria-hidden="true" />
          </Button>
        </div>
      )}
    </main>
  )
}

export default function HoldingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <div className="text-sm text-gray-500">Loading...</div>
        </div>
      }
    >
      <HoldingsContent />
    </Suspense>
  )
}
