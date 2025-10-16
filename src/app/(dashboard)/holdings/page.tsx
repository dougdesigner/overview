"use client"

import { Button } from "@/components/Button"
import { Divider } from "@/components/Divider"
import { HoldingsSunburst } from "@/components/HoldingsSunburstWrapper"
import {
  HoldingsDrawer,
  type HoldingFormData,
} from "@/components/ui/HoldingsDrawer"
import { HoldingsTable } from "@/components/ui/data-table-holdings/HoldingsTable"
import { Holding } from "@/components/ui/data-table-holdings/types"
import { RiAddLine } from "@remixicon/react"
import { useSearchParams } from "next/navigation"
import React, { Suspense, useMemo } from "react"
import { usePortfolioStore } from "@/hooks/usePortfolioStore"

function HoldingsContent() {
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = React.useState(false)
  const [editingHolding, setEditingHolding] = React.useState<Holding | null>(null)
  const [currentAccountFilter, setCurrentAccountFilter] = React.useState<string>(
    searchParams.get("account") || "all"
  )

  // Use portfolio store for accounts and holdings data
  const {
    accounts: storeAccounts,
    holdings,
    isLoading,
    error,
    addHolding,
    updateHolding,
    deleteHolding
  } = usePortfolioStore()

  // Convert accounts to the format expected by components
  const accounts = useMemo(() =>
    storeAccounts.map(acc => ({
      id: acc.id,
      name: acc.name,
      institution: acc.institution
    })),
    [storeAccounts]
  )

  // Calculate allocations for all holdings
  const holdingsWithAllocations = useMemo(() => {
    const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0)
    return holdings.map(h => ({
      ...h,
      allocation: totalValue > 0 ? (h.marketValue / totalValue) * 100 : 0
    }))
  }, [holdings])

  const handleHoldingSubmit = (holding: HoldingFormData) => {
    if (editingHolding) {
      // Update existing holding
      updateHolding(editingHolding.id, {
        ticker: holding.ticker,
        name: holding.ticker || holding.description || "",
        quantity: holding.shares || holding.amount || 0,
        // Market value will be recalculated automatically by the store
      })
    } else {
      // Add new holding
      const account = accounts.find(a => a.id === holding.accountId)
      if (!account) {
        console.error("Account not found:", holding.accountId)
        return
      }

      addHolding({
        accountId: holding.accountId,
        accountName: account.name,
        ticker: holding.ticker,
        name: holding.ticker || holding.description || "",
        quantity: holding.shares || holding.amount || 0,
        lastPrice: holding.holdingType === "cash" ? 1 : 100, // In real app, would fetch from API
        marketValue: (holding.shares || holding.amount || 0) * (holding.holdingType === "cash" ? 1 : 100),
        type: holding.holdingType === "cash" ? "cash" : holding.holdingType === "stocks-funds" && holding.ticker?.includes("ETF") ? "fund" : "stock",
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
      }
    }
  }

  const handleDelete = (holdingId: string) => {
    deleteHolding(holdingId)
  }

  // Show loading state
  if (isLoading) {
    return (
      <main>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
              Holdings
            </h1>
            <p className="text-gray-500 sm:text-sm/6 dark:text-gray-500">
              Loading your portfolio holdings...
            </p>
          </div>
        </div>
        <Divider />
        <div className="animate-pulse py-8">
          <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4"></div>
          <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
        </div>
      </main>
    )
  }

  return (
    <main>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
            Holdings
          </h1>
          <p className="text-gray-500 sm:text-sm/6 dark:text-gray-500">
            See all your investments in one place, across every account
          </p>
        </div>
        <Button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 text-base sm:text-sm"
        >
          Add Holdings
          <RiAddLine className="-mr-0.5 size-5 shrink-0" aria-hidden="true" />
        </Button>
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
                ? { accountId: currentAccountFilter, holdingType: "stocks-funds" }
                : undefined
          }
        />
      </div>
      <Divider />

      {/* Hero Visualization - Sunburst Chart - Only show when there are holdings */}
      {holdings.length > 0 && (
        <div className="mt-8">
          <HoldingsSunburst holdings={holdingsWithAllocations} />
        </div>
      )}

      {/* Holdings Table */}
      <div className="mt-8">
        {accounts.length === 0 ? (
          <div className="py-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-2">
              No accounts yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Please add an account first before adding holdings.
            </p>
            <Button
              onClick={() => window.location.href = '/accounts'}
              className="inline-flex items-center gap-2"
            >
              Go to Accounts
            </Button>
          </div>
        ) : holdings.length === 0 ? (
          <div className="py-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-2">
              No holdings yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Add your first holding to start tracking your investments.
            </p>
            <Button
              onClick={() => setIsOpen(true)}
              className="inline-flex items-center gap-2"
            >
              Add Your First Holding
              <RiAddLine className="-mr-0.5 size-5 shrink-0" aria-hidden="true" />
            </Button>
          </div>
        ) : (
          <HoldingsTable
            holdings={holdingsWithAllocations}
            accounts={accounts}
            onEdit={handleEdit}
            onDelete={handleDelete}
            initialAccountFilter={searchParams.get("account") || "all"}
            onAccountFilterChange={setCurrentAccountFilter}
          />
        )}
      </div>
    </main>
  )
}

export default function HoldingsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full items-center justify-center">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    }>
      <HoldingsContent />
    </Suspense>
  )
}
