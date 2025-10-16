"use client"

import AccountCard from "@/components/AccountCard"
import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { Divider } from "@/components/Divider"
import { SankeyChartHighcharts } from "@/components/SankeyChartHighchartsWrapper"
import {
  AccountDrawer,
  type AccountFormData,
} from "@/components/ui/AccountDrawer"
import {
  accountTypeLabels,
  institutionLabels,
  usePortfolioStore,
} from "@/hooks/usePortfolioStore"
import { RiAddLine } from "@remixicon/react"
import { useRouter } from "next/navigation"
import React from "react"

export default function AccountsPage() {
  const router = useRouter()
  const [isOpen, setIsOpen] = React.useState(false)
  const [drawerMode, setDrawerMode] = React.useState<"create" | "edit">(
    "create",
  )
  const [editingAccount, setEditingAccount] = React.useState<
    ReturnType<typeof usePortfolioStore>["accounts"][0] | null
  >(null)

  // Use the portfolio store for accounts data
  const {
    accounts,
    holdings,
    isLoading,
    error,
    addAccount,
    updateAccount,
    deleteAccount,
  } = usePortfolioStore()

  // Handle adding or editing account from the drawer
  const handleAccountSubmit = (formData: AccountFormData) => {
    if (drawerMode === "edit" && editingAccount) {
      // Update existing account
      updateAccount(editingAccount.id, {
        name:
          formData.accountName ||
          accountTypeLabels[formData.accountType] ||
          formData.accountType,
        accountType: formData.accountType,
        accountTypeLabel:
          accountTypeLabels[formData.accountType] || formData.accountType,
        institution: formData.institution,
        institutionLabel:
          institutionLabels[formData.institution] || formData.institution,
      })
    } else {
      // Create new account
      addAccount({
        name:
          formData.accountName ||
          accountTypeLabels[formData.accountType] ||
          formData.accountType,
        accountType: formData.accountType,
        accountTypeLabel:
          accountTypeLabels[formData.accountType] || formData.accountType,
        institution: formData.institution,
        institutionLabel:
          institutionLabels[formData.institution] || formData.institution,
      })
    }

    // Reset state
    setEditingAccount(null)
    setDrawerMode("create")
  }

  // Sort accounts alphabetically by name
  const sortedAccounts = React.useMemo(() => {
    return [...accounts].sort((a, b) => a.name.localeCompare(b.name))
  }, [accounts])

  // Handlers for edit and delete actions
  const handleEdit = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId)
    if (account) {
      setEditingAccount(account)
      setDrawerMode("edit")
      setIsOpen(true)
    }
  }

  const handleDelete = (accountId: string) => {
    deleteAccount(accountId)
  }

  const handleAccountClick = (accountId: string) => {
    router.push(`/holdings?account=${accountId}`)
  }

  // Handle drawer close
  const handleDrawerClose = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      // Reset to create mode when closing
      setEditingAccount(null)
      setDrawerMode("create")
    }
  }

  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <main>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
              Accounts
            </h1>
            <p className="text-gray-500 dark:text-gray-400 sm:text-sm/6">
              Loading your portfolio data...
            </p>
          </div>
        </div>
        <Divider />
        <div className="animate-pulse py-8">
          <div className="mb-4 h-48 rounded-lg bg-gray-100 dark:bg-gray-800"></div>
          <div className="space-y-4">
            <div className="h-24 rounded-lg bg-gray-100 dark:bg-gray-800"></div>
            <div className="h-24 rounded-lg bg-gray-100 dark:bg-gray-800"></div>
          </div>
        </div>
      </main>
    )
  }

  // Show error state if there's an error (but continue to show data if available)
  const errorMessage =
    error && !accounts.length ? (
      <div className="mb-4 rounded-lg bg-red-50 p-4 dark:bg-red-900/10">
        <p className="text-sm text-red-800 dark:text-red-200">
          {error} - Using default data
        </p>
      </div>
    ) : null

  return (
    <main>
      {errorMessage}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
            Accounts
          </h1>
          <p className="text-gray-500 dark:text-gray-400 sm:text-sm/6">
            Organize your holdings by account for clearer insights
          </p>
        </div>
        <Button
          onClick={() => {
            setDrawerMode("create")
            setEditingAccount(null)
            setIsOpen(true)
          }}
          className="hidden items-center gap-2 text-base sm:flex sm:text-sm"
        >
          Add Account
          <RiAddLine className="-mr-0.5 size-5 shrink-0" aria-hidden="true" />
        </Button>
        <AccountDrawer
          open={isOpen}
          onOpenChange={handleDrawerClose}
          onSubmit={handleAccountSubmit}
          mode={drawerMode}
          initialData={
            editingAccount
              ? {
                  institution: editingAccount.institution,
                  accountType: editingAccount.accountType,
                  accountName: editingAccount.name,
                }
              : undefined
          }
        />
      </div>
      <Divider />

      {/* Account Flow Sankey Chart - only show when there are holdings */}
      {accounts.length > 0 && holdings.length > 0 && (
        <Card className="mt-8">
          <p className="py-1.5 text-base font-medium text-gray-900 dark:text-gray-50">
            Account flow
          </p>
          <SankeyChartHighcharts
            data={{
              nodes: [
                // Account nodes (left side) - dynamically generated from accounts
                ...accounts.map((account) => ({ id: account.name })),
                // Portfolio Total (center)
                { id: "Portfolio Total" },
                // Asset type nodes (right side)
                { id: "U.S. Stocks" },
                { id: "Non-U.S. Stocks" },
                { id: "Fixed Income" },
                { id: "Cash" },
              ],
              links: [
                // Accounts to Portfolio Total
                ...accounts.map((account) => ({
                  source: account.name,
                  target: "Portfolio Total",
                  value: account.totalValue,
                })),
                // Portfolio Total to Asset Types - calculate from account allocations
                {
                  source: "Portfolio Total",
                  target: "U.S. Stocks",
                  value: accounts.reduce(
                    (sum, acc) =>
                      sum +
                      (acc.totalValue * acc.assetAllocation.usStocks) / 100,
                    0,
                  ),
                },
                {
                  source: "Portfolio Total",
                  target: "Non-U.S. Stocks",
                  value: accounts.reduce(
                    (sum, acc) =>
                      sum +
                      (acc.totalValue * acc.assetAllocation.nonUsStocks) / 100,
                    0,
                  ),
                },
                {
                  source: "Portfolio Total",
                  target: "Fixed Income",
                  value: accounts.reduce(
                    (sum, acc) =>
                      sum +
                      (acc.totalValue * acc.assetAllocation.fixedIncome) / 100,
                    0,
                  ),
                },
                {
                  source: "Portfolio Total",
                  target: "Cash",
                  value: accounts.reduce(
                    (sum, acc) =>
                      sum + (acc.totalValue * acc.assetAllocation.cash) / 100,
                    0,
                  ),
                },
              ],
            }}
            colors={["blue", "cyan", "amber", "emerald"]}
            accountColors={["violet", "fuchsia", "pink", "sky", "lime"]}
            height={350}
          />
        </Card>
      )}

      {/* Account Cards */}
      <div className="mt-8">
        <div className="space-y-4">
          {sortedAccounts.map((account) => (
            <AccountCard
              key={account.id}
              name={account.name}
              accountType={
                account.accountTypeLabel as
                  | "Traditional 401(k)"
                  | "Roth IRA"
                  | "Personal Investment"
                  | "Checking"
                  | "Savings"
              }
              institution={
                account.institutionLabel as
                  | "Fidelity Investments"
                  | "Chase"
                  | "American Express"
                  | "Wealthfront"
                  | "Vanguard"
              }
              totalValue={account.totalValue}
              holdingsCount={account.holdingsCount}
              assetAllocation={account.assetAllocation}
              onEdit={() => handleEdit(account.id)}
              onDelete={() => handleDelete(account.id)}
              onClick={() => handleAccountClick(account.id)}
            />
          ))}
        </div>

        {/* Mobile Add Account Button */}
        {accounts.length > 0 && (
          <div className="mt-6 sm:hidden">
            <Button
              onClick={() => {
                setDrawerMode("create")
                setEditingAccount(null)
                setIsOpen(true)
              }}
              className="flex w-full items-center justify-center gap-2 text-base"
            >
              Add Account
              <RiAddLine
                className="-mr-0.5 size-5 shrink-0"
                aria-hidden="true"
              />
            </Button>
          </div>
        )}

        {/* Empty state */}
        {accounts.length === 0 && (
          <div className="py-12 text-center">
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-50">
              Welcome to your portfolio dashboard
            </h3>
            <p className="mb-4 text-gray-500 dark:text-gray-400">
              Start by adding your first account to begin tracking your
              investments.
            </p>
            <Button
              onClick={() => {
                setDrawerMode("create")
                setEditingAccount(null)
                setIsOpen(true)
              }}
              className="inline-flex items-center gap-2"
            >
              Add Your First Account
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}
