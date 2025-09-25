"use client"

import AccountCard from "@/components/AccountCard"
import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { Divider } from "@/components/Divider"
import SankeyChart from "@/components/SankeyChart"
import {
  AccountDrawer,
  type AccountFormData,
} from "@/components/ui/AccountDrawer"
import { RiAddLine } from "@remixicon/react"
import { useRouter } from "next/navigation"
import React from "react"

// Map account types to labels for display
const accountTypeLabels: Record<string, string> = {
  // Cash accounts
  bank: "Bank Account",
  checking: "Checking Account",
  savings: "Savings Account",
  cash: "Cash",
  rewards: "Rewards Account",

  // Investment accounts
  investment: "Investment Account",
  "personal-investment": "Personal Investment",
  individual: "Individual Brokerage", // keeping for backward compatibility
  "joint-investment": "Joint Investment",
  joint: "Joint Brokerage", // keeping for backward compatibility
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
const institutionLabels: Record<string, string> = {
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

interface Account {
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

export default function AccountsPage() {
  const router = useRouter()
  const [isOpen, setIsOpen] = React.useState(false)
  const [drawerMode, setDrawerMode] = React.useState<"create" | "edit">(
    "create",
  )
  const [editingAccount, setEditingAccount] = React.useState<Account | null>(
    null,
  )

  // Initialize with example accounts
  const [accounts, setAccounts] = React.useState<Account[]>([
    {
      id: "1",
      name: "Retirement Fund",
      accountType: "traditional-401k",
      accountTypeLabel: "Traditional 401(k)",
      institution: "fidelity",
      institutionLabel: "Fidelity Investments",
      totalValue: 98987,
      holdingsCount: 12,
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
      holdingsCount: 8,
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
      holdingsCount: 6,
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
  ])

  // Handle adding or editing account from the drawer
  const handleAccountSubmit = (formData: AccountFormData) => {
    if (drawerMode === "edit" && editingAccount) {
      // Update existing account
      setAccounts((prev) =>
        prev.map((account) =>
          account.id === editingAccount.id
            ? {
                ...account,
                name:
                  formData.accountName ||
                  accountTypeLabels[formData.accountType] ||
                  formData.accountType,
                accountType: formData.accountType,
                accountTypeLabel:
                  accountTypeLabels[formData.accountType] ||
                  formData.accountType,
                institution: formData.institution,
                institutionLabel:
                  institutionLabels[formData.institution] ||
                  formData.institution,
              }
            : account,
        ),
      )
    } else {
      // Create new account
      const newAccount: Account = {
        id: Date.now().toString(), // Simple ID generation
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
        totalValue: 0, // Will be calculated from holdings later
        holdingsCount: 0, // Will be updated when holdings are added
        assetAllocation: {
          usStocks: 0,
          nonUsStocks: 0,
          fixedIncome: 0,
          cash: 0,
        },
      }
      setAccounts((prev) => [...prev, newAccount])
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
    setAccounts((prev) => prev.filter((account) => account.id !== accountId))
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

  return (
    <main>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
            Accounts
          </h1>
          <p className="text-gray-500 sm:text-sm/6 dark:text-gray-400">
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

      {/* Account Flow Sankey Chart */}
      {accounts.length > 0 && (
        <Card className="mt-8">
          <p className="py-1.5 text-base font-medium text-gray-900 dark:text-gray-50">
            Account flow
          </p>
          <SankeyChart
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
              accountType={account.accountTypeLabel}
              institution={account.institutionLabel}
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
            <p className="text-gray-500 dark:text-gray-400">
              No accounts yet. Click "Add Account" to get started.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
