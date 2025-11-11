"use client"

import AccountCard from "@/components/AccountCard"
import type {
  AccountDisplayValue,
  AccountGrouping,
} from "@/components/AccountTreemap"
import { AccountTreemap } from "@/components/AccountTreemapWrapper"
import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { Divider } from "@/components/Divider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/DropdownMenu"
import { SankeyChartHighcharts } from "@/components/SankeyChartHighchartsWrapper"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select"
import { Tooltip } from "@/components/Tooltip"
import {
  AccountDrawer,
  type AccountFormData,
} from "@/components/ui/AccountDrawer"
import { InstitutionLogo } from "@/components/ui/InstitutionLogo"
import {
  accountTypeLabels,
  institutionLabels,
  usePortfolioStore,
} from "@/hooks/usePortfolioStore"
import {
  RiAddLine,
  RiArrowUpDownLine,
  RiDownloadLine,
  RiExpandUpDownLine,
  RiEyeOffLine,
  RiFlowChart,
  RiFullscreenLine,
  RiNodeTree,
  RiPercentLine,
} from "@remixicon/react"
import HighchartsReact from "highcharts-react-official"
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

  // Chart view state
  const [chartType, setChartType] = React.useState<"sankey" | "treemap">(
    "sankey",
  )
  const [selectedAccountFilter, setSelectedAccountFilter] =
    React.useState<string>("all")
  const [groupBy, setGroupBy] = React.useState<AccountGrouping>("institution")
  const [displayValue, setDisplayValue] =
    React.useState<AccountDisplayValue>("value")

  // Chart refs for export functionality
  const sankeyChartRef = React.useRef<HighchartsReact.RefObject>(null)
  const treemapChartRef = React.useRef<HighchartsReact.RefObject>(null)

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

  // Export handlers for chart
  const handleExport = (type: string) => {
    const chartRef = chartType === "sankey" ? sankeyChartRef : treemapChartRef
    const chart = chartRef.current?.chart
    if (!chart) return

    switch (type) {
      case "fullscreen":
        chart.fullscreen?.open()
        break
      case "print":
        chart.print()
        break
      case "png":
        chart.exportChart({ type: "image/png" })
        break
      case "jpeg":
        chart.exportChart({ type: "image/jpeg" })
        break
      case "pdf":
        chart.exportChart({ type: "application/pdf" })
        break
      case "svg":
        chart.exportChart({ type: "image/svg+xml" })
        break
      case "csv":
        chart.downloadCSV()
        break
      case "xls":
        chart.downloadXLS()
        break
    }
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

  // Remove loading state check to prevent stuck loading screen
  // The empty state will show immediately for new users

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

      {/* Account Flow Chart - only show when there are holdings */}
      {accounts.length > 0 && holdings.length > 0 && (
        <Card className="mt-8">
          <div className="flex flex-col gap-4">
            {/* Title and Controls Row */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-base font-medium text-gray-900 dark:text-gray-50">
                Account Flow
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {/* Chart Type Toggle */}
                <DropdownMenu>
                  <Tooltip content="Switch chart type" triggerAsChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="secondary"
                        className="flex h-9 items-center gap-2 px-3 text-sm"
                      >
                        {chartType === "sankey" ? (
                          <>
                            <RiFlowChart className="size-4 shrink-0" />
                            Sankey
                          </>
                        ) : (
                          <>
                            <RiNodeTree className="size-4 shrink-0" />
                            Treemap
                          </>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                  </Tooltip>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuRadioGroup
                      value={chartType}
                      onValueChange={(value) =>
                        setChartType(value as "sankey" | "treemap")
                      }
                    >
                      <DropdownMenuRadioItem value="sankey">
                        <RiFlowChart className="mr-2 size-4" />
                        Sankey
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="treemap">
                        <RiNodeTree className="mr-2 size-4" />
                        Treemap
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Account Filter (for Treemap) */}
                {chartType === "treemap" && (
                  <DropdownMenu>
                    <Tooltip triggerAsChild content="Select account to view">
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          className="h-9 w-[280px] justify-between"
                        >
                          <span className="flex items-center gap-2">
                            {selectedAccountFilter === "all" ? (
                              "All Accounts"
                            ) : (
                              <>
                                <InstitutionLogo
                                  institution={
                                    accounts.find(
                                      (a) => a.id === selectedAccountFilter,
                                    )?.institution || ""
                                  }
                                  className="size-4"
                                />
                                <span className="truncate">
                                  {accounts.find(
                                    (a) => a.id === selectedAccountFilter,
                                  )?.name || "Select account"}
                                </span>
                              </>
                            )}
                          </span>
                          <RiExpandUpDownLine
                            className="size-4 text-gray-400 dark:text-gray-600"
                            aria-hidden="true"
                          />
                        </Button>
                      </DropdownMenuTrigger>
                    </Tooltip>
                    <DropdownMenuContent align="start" className="w-[280px]">
                      <DropdownMenuLabel>ACCOUNT</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuRadioGroup
                        value={selectedAccountFilter}
                        onValueChange={setSelectedAccountFilter}
                      >
                        <DropdownMenuRadioItem value="all" iconType="check">
                          All Accounts
                        </DropdownMenuRadioItem>
                        {accounts.map((account) => (
                          <DropdownMenuRadioItem
                            key={account.id}
                            value={account.id}
                            iconType="check"
                          >
                            <div className="flex items-center gap-2">
                              <InstitutionLogo
                                institution={account.institution}
                                className="size-4"
                              />
                              <span className="truncate">{account.name}</span>
                            </div>
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* Group By (for Treemap) */}
                {chartType === "treemap" && (
                  <Select
                    value={groupBy}
                    onValueChange={(value) =>
                      setGroupBy(value as AccountGrouping)
                    }
                  >
                    <SelectTrigger className="h-9 w-[180px] text-sm">
                      <SelectValue placeholder="Group by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="institution">Institution</SelectItem>
                        <SelectItem value="type">Account Type</SelectItem>
                        <SelectItem value="institution-type">
                          Institution & Type
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}

                {/* Display Settings (for Treemap) */}
                {chartType === "treemap" && (
                  <DropdownMenu>
                    <Tooltip content="Display value settings" triggerAsChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          className="flex h-9 items-center gap-2 px-3 text-sm"
                        >
                          {displayValue === "value" ? (
                            <RiArrowUpDownLine className="size-4 shrink-0" />
                          ) : displayValue === "allocation" ? (
                            <RiPercentLine className="size-4 shrink-0" />
                          ) : (
                            <RiEyeOffLine className="size-4 shrink-0" />
                          )}
                          <span className="hidden sm:inline">Display</span>
                        </Button>
                      </DropdownMenuTrigger>
                    </Tooltip>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuRadioGroup
                        value={displayValue}
                        onValueChange={(value) =>
                          setDisplayValue(value as AccountDisplayValue)
                        }
                      >
                        <DropdownMenuRadioItem value="value">
                          <RiArrowUpDownLine className="mr-2 size-4" />
                          Market Value
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="allocation">
                          <RiPercentLine className="mr-2 size-4" />
                          Allocation %
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="none">
                          <RiEyeOffLine className="mr-2 size-4" />
                          None
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* Export Button */}
                <DropdownMenu>
                  <Tooltip
                    triggerAsChild
                    content="Export chart as image or data file"
                  >
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" className="h-9">
                        <RiDownloadLine className="size-4" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                  </Tooltip>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>EXPORT OPTIONS</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleExport("print")}>
                      Print chart
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleExport("png")}>
                      Download PNG image
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("jpeg")}>
                      Download JPEG image
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("pdf")}>
                      Download PDF document
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("svg")}>
                      Download SVG vector
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleExport("csv")}>
                      Download CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("xls")}>
                      Download XLS
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Fullscreen Button */}
                <Tooltip triggerAsChild content="View chart in fullscreen mode">
                  <Button
                    variant="secondary"
                    className="h-9"
                    onClick={() => handleExport("fullscreen")}
                  >
                    <RiFullscreenLine className="size-4" aria-hidden="true" />
                  </Button>
                </Tooltip>
              </div>
            </div>

            {/* Chart */}
            <div>
              {chartType === "sankey" ? (
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
                            (acc.totalValue * acc.assetAllocation.usStocks) /
                              100,
                          0,
                        ),
                      },
                      {
                        source: "Portfolio Total",
                        target: "Non-U.S. Stocks",
                        value: accounts.reduce(
                          (sum, acc) =>
                            sum +
                            (acc.totalValue * acc.assetAllocation.nonUsStocks) /
                              100,
                          0,
                        ),
                      },
                      {
                        source: "Portfolio Total",
                        target: "Fixed Income",
                        value: accounts.reduce(
                          (sum, acc) =>
                            sum +
                            (acc.totalValue * acc.assetAllocation.fixedIncome) /
                              100,
                          0,
                        ),
                      },
                      {
                        source: "Portfolio Total",
                        target: "Cash",
                        value: accounts.reduce(
                          (sum, acc) =>
                            sum +
                            (acc.totalValue * acc.assetAllocation.cash) / 100,
                          0,
                        ),
                      },
                    ],
                  }}
                  colors={["blue", "cyan", "amber", "emerald"]}
                  accountColors={["violet", "fuchsia", "pink", "sky", "lime"]}
                  height={350}
                  chartRef={sankeyChartRef}
                />
              ) : (
                <AccountTreemap
                  accounts={accounts}
                  selectedAccounts={
                    selectedAccountFilter === "all"
                      ? []
                      : [selectedAccountFilter]
                  }
                  groupBy={groupBy}
                  displayValue={displayValue}
                  height={350}
                  chartRef={treemapChartRef}
                />
              )}
            </div>
          </div>
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
