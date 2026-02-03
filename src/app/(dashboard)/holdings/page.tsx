"use client"

import { Badge } from "@/components/Badge"
import { Button } from "@/components/Button"
import { Divider } from "@/components/Divider"
import { HoldingsSunburst } from "@/components/HoldingsSunburstWrapper"
import { AccountFilterDropdown } from "@/components/ui/AccountFilterDropdown"
import {
  HoldingsDrawer,
  type HoldingFormData,
} from "@/components/ui/HoldingsDrawer"
import { InstitutionLogo } from "@/components/ui/InstitutionLogo"
import { HoldingsCardList } from "@/components/ui/data-table-holdings/HoldingsCardList"
import { HoldingsTable } from "@/components/ui/data-table-holdings/HoldingsTable"
import { Holding } from "@/components/ui/data-table-holdings/types"
import { ViewToggle, ViewMode } from "@/components/ui/ViewToggle"
import mutualFundMappings from "@/data/mutual-fund-mappings.json"
import { usePortfolioStore } from "@/hooks/usePortfolioStore"
import { getETFName } from "@/lib/etfMetadataService"
import { getKnownETFName, getKnownStockName } from "@/lib/knownETFNames"
import { extractDomainsFromCompanyName } from "@/lib/logoUtils"
import { getStockPrice } from "@/lib/stockPriceService"
import { Icon } from "@iconify/react"
import { useRouter, useSearchParams } from "next/navigation"
import React, { Suspense, useMemo } from "react"

function HoldingsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isOpen, setIsOpen] = React.useState(false)

  // Auto-open drawer when ?add=true is in URL
  React.useEffect(() => {
    if (searchParams.get("add") === "true") {
      setIsOpen(true)
      setEditingHolding(null) // Ensure create mode
      // Clean up URL param
      router.replace("/holdings")
    }
  }, [searchParams, router])
  const [editingHolding, setEditingHolding] = React.useState<Holding | null>(
    null,
  )
  const [currentAccountFilter, setCurrentAccountFilter] =
    React.useState<string>(searchParams.get("account") || "all")
  const [isFilterSticky, setIsFilterSticky] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("holdings_view_mode") as ViewMode) || "table"
    }
    return "table"
  })

  // Persist view mode preference
  React.useEffect(() => {
    localStorage.setItem("holdings_view_mode", viewMode)
  }, [viewMode])
  const filterRef = React.useRef<HTMLDivElement>(null)

  // Use portfolio store for accounts and holdings data
  const {
    accounts: storeAccounts,
    holdings,
    addHolding,
    updateHolding,
    deleteHolding,
    toggleHoldingIgnored,
    refreshETFNames,
  } = usePortfolioStore()

  // Debug logging
  console.log("[Holdings] storeAccounts:", storeAccounts.length, storeAccounts)
  console.log("[Holdings] holdings:", holdings.length)

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

  // Calculate allocations for all holdings (excluding ignored holdings from total)
  const holdingsWithAllocations = useMemo(() => {
    // Only count non-ignored holdings in the total value for allocation calculation
    const activeHoldings = holdings.filter((h) => !h.isIgnored)
    const totalValue = activeHoldings.reduce((sum, h) => sum + h.marketValue, 0)
    return holdings.map((h) => ({
      ...h,
      // Ignored holdings show 0% allocation since they're excluded from calculations
      allocation: h.isIgnored ? 0 : (totalValue > 0 ? (h.marketValue / totalValue) * 100 : 0),
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

  // Calculate total value of filtered holdings (excluding ignored)
  const filteredTotalValue = useMemo(() => {
    return filteredHoldings
      .filter((h) => !h.isIgnored)
      .reduce((sum, h) => sum + h.marketValue, 0)
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
        // Manual entry update - derive domain from company name
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
          sector: holding.sector || undefined,
          industry: holding.industry || undefined,
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
      let lastPrice = 0 // Default to 0 (will show "-" in UI)
      let isUSStock: boolean | undefined = undefined
      let isManualEntry: boolean | undefined = undefined
      let domain: string | undefined = undefined
      let sector: string | undefined = undefined
      let industry: string | undefined = undefined

      if (holding.holdingType === "cash") {
        type = "cash"
        name = holding.description || "Cash"
        lastPrice = 1
      } else if (holding.isManualEntry && holding.ticker) {
        // Manual entry - use provided values directly
        name = holding.companyName || holding.ticker
        isUSStock = holding.isUSStock ?? true
        isManualEntry = true
        sector = holding.sector || undefined
        industry = holding.industry || undefined

        // Derive domain from company name for logo lookup
        if (holding.companyName) {
          const domains = extractDomainsFromCompanyName(holding.companyName)
          domain = domains[0]
          console.log(
            `Manual entry - extracted domains from "${holding.companyName}":`,
            domains,
          )
        }

        // Try to fetch price from Alpha Vantage (works even without company overview)
        if (holding.pricePerShare && holding.pricePerShare > 0) {
          // User provided explicit price - use it
          lastPrice = holding.pricePerShare
        } else {
          // Attempt to fetch from API
          try {
            const fetchedPrice = await getStockPrice(holding.ticker)
            if (fetchedPrice && fetchedPrice > 0) {
              lastPrice = fetchedPrice
              console.log(
                `Fetched price for manual entry ${holding.ticker}: $${fetchedPrice}`,
              )
            } else {
              // API returned no data - leave at 0 (will show as missing)
              lastPrice = 0
              console.warn(`No price data available for ${holding.ticker}`)
            }
          } catch (error) {
            console.error(`Failed to fetch price for ${holding.ticker}:`, error)
            lastPrice = 0 // Leave blank rather than fake $100
          }
        }

        console.log(
          `Manual entry: ${holding.ticker} - ${name} at $${lastPrice || "N/A"} (${isUSStock ? "US" : "Non-US"}, sector: ${sector || "N/A"})`,
        )
      } else if (holding.ticker) {
        // Predefined ticker - use existing logic
        // If the ticker search already identified the type, use it
        if (holding.tickerType === "etf" || holding.tickerType === "mutual-fund") {
          type = "fund"
        }

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
            // Check for canonical stock name from asset-classifications first
            const knownStockName = getKnownStockName(holding.ticker)
            if (knownStockName) {
              name = knownStockName
              console.log(
                `Using canonical stock name for ${holding.ticker}: ${name}`,
              )
            } else if (holding.companyName) {
              // Fall back to Alpha Vantage name
              name = holding.companyName
              console.log(
                `Using Alpha Vantage name for ${holding.ticker}: ${name}`,
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
                if (
                  etfNameResult &&
                  etfNameResult !== `${holding.ticker} ETF`
                ) {
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
                // No company name provided - use ticker as fallback
                name = holding.ticker
              }
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

        // For API-searched stocks, derive domain from company name for logo lookup
        if (holding.companyName && !domain) {
          const domains = extractDomainsFromCompanyName(holding.companyName)
          domain = domains[0]
          console.log(
            `API stock - extracted domain from "${holding.companyName}":`,
            domain,
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
        sector: sector,
        industry: industry,
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
        sector: holding.sector,
        industry: holding.industry,
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-900 dark:text-gray-50">
            Holdings
            {holdings.length > 0 && (
              <Badge variant="neutral">{holdings.length}</Badge>
            )}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 sm:text-sm/6">
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
              Add holdings
              <Icon
                icon="carbon:add"
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
        <>
          {/* Bottom gradient - fades content behind filter (mobile only) */}
          <div
            className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 h-40 bg-gradient-to-t from-white via-white/80 to-transparent transition-opacity duration-300 dark:from-gray-950 dark:via-gray-950/80 sm:hidden ${
              isFilterSticky ? "opacity-100" : "opacity-0"
            }`}
          />
          <div
            className={`fixed inset-x-0 bottom-20 z-50 mx-2 transition-[transform,opacity] duration-300 ease-out sm:bottom-6 sm:left-1/2 sm:right-auto sm:mx-0 sm:w-full sm:max-w-2xl sm:-translate-x-1/2 sm:px-6 ${
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
                {currentAccountFilter !== "all" && (
                  <Badge
                    variant="default"
                    className="flex h-9 items-center gap-1.5 px-3 text-sm"
                  >
                    <InstitutionLogo
                      institution={
                        accounts.find((a) => a.id === currentAccountFilter)
                          ?.institution || ""
                      }
                      className="size-5"
                    />
                    <span className="hidden sm:inline">
                      {
                        accounts.find((a) => a.id === currentAccountFilter)
                          ?.name
                      }
                    </span>
                    <button
                      onClick={() => setCurrentAccountFilter("all")}
                      className="rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-500/30"
                    >
                      <Icon icon="carbon:close" className="size-4" />
                    </button>
                  </Badge>
                )}
                <AccountFilterDropdown
                  accounts={accounts}
                  selectedAccount={currentAccountFilter}
                  onAccountChange={setCurrentAccountFilter}
                  hideTextOnMobile
                  compactWhenActive
                />
                <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
              </div>
            </div>
          </div>
        </>
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
            {currentAccountFilter !== "all" && (
              <Badge
                variant="default"
                className="flex h-9 items-center gap-1.5 px-3 text-sm"
              >
                <InstitutionLogo
                  institution={
                    accounts.find((a) => a.id === currentAccountFilter)
                      ?.institution || ""
                  }
                  className="size-5"
                />
                <span className="hidden sm:inline">
                  {accounts.find((a) => a.id === currentAccountFilter)?.name}
                </span>
                <button
                  onClick={() => setCurrentAccountFilter("all")}
                  className="rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-500/30"
                >
                  <Icon icon="carbon:close" className="size-4" />
                </button>
              </Badge>
            )}
            <AccountFilterDropdown
              accounts={accounts}
              selectedAccount={currentAccountFilter}
              onAccountChange={setCurrentAccountFilter}
            />
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
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
            height={350}
          />
        </div>
      )}

      {/* Holdings Table */}
      <div className="mt-6">
        {accounts.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
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
          <div className="flex flex-col items-center py-12 text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-gray-800">
              <Icon
                icon="carbon:chart-ring"
                className="size-8 text-gray-400 dark:text-gray-500"
                aria-hidden="true"
              />
            </div>
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
              Add your first holding
              <Icon
                icon="carbon:add"
                className="-mr-0.5 size-5 shrink-0"
                aria-hidden="true"
              />
            </Button>
          </div>
        ) : viewMode === "table" ? (
          <HoldingsTable
            holdings={holdingsWithAllocations}
            accounts={accounts}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleIgnored={toggleHoldingIgnored}
            selectedAccount={currentAccountFilter}
          />
        ) : (
          <HoldingsCardList
            holdings={holdingsWithAllocations}
            accounts={accounts}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleIgnored={toggleHoldingIgnored}
            selectedAccount={currentAccountFilter}
          />
        )}
      </div>

      {/* Mobile Add Holdings Button - Only show on mobile when holdings exist */}
      {accounts.length > 0 && holdings.length > 0 && (
        <div className="mt-6 sm:hidden">
          <Button
            onClick={() => setIsOpen(true)}
            className="flex w-full items-center justify-center gap-2 text-base"
          >
            Add holdings
            <Icon
              icon="carbon:add"
              className="-mr-0.5 size-5 shrink-0"
              aria-hidden="true"
            />
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
        <div className="animate-pulse">
          {/* Chart area skeleton */}
          <div className="mb-6 h-80 rounded-lg bg-gray-100 dark:bg-gray-800"></div>
          {/* Table skeleton - header + rows */}
          <div className="space-y-3">
            <div className="h-12 rounded-lg bg-gray-100 dark:bg-gray-800"></div>
            <div className="h-16 rounded-lg bg-gray-100 dark:bg-gray-800"></div>
            <div className="h-16 rounded-lg bg-gray-100 dark:bg-gray-800"></div>
            <div className="h-16 rounded-lg bg-gray-100 dark:bg-gray-800"></div>
            <div className="h-16 rounded-lg bg-gray-100 dark:bg-gray-800"></div>
          </div>
        </div>
      }
    >
      <HoldingsContent />
    </Suspense>
  )
}
