"use client"

import AccountCard from "@/components/AccountCard"
import type {
  AccountDisplayValue,
  AccountGrouping,
} from "@/components/AccountTreemap"
import { AccountTreemap } from "@/components/AccountTreemapWrapper"
import { Badge } from "@/components/Badge"
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
import { InstitutionFilterDropdown } from "@/components/ui/InstitutionFilterDropdown"
import { InstitutionLogo } from "@/components/ui/InstitutionLogo"
import {
  accountTypeLabels,
  institutionLabels,
  usePortfolioStore,
} from "@/hooks/usePortfolioStore"
import { Icon } from "@iconify/react"
import {
  RiArrowUpDownLine,
  RiExpandUpDownLine,
  RiEyeOffLine,
  RiFullscreenLine,
  RiPercentLine,
} from "@remixicon/react"
import HighchartsReact from "highcharts-react-official"
import { useRouter, useSearchParams } from "next/navigation"
import React, { Suspense } from "react"

function AccountsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = React.useState(false)

  // Auto-open drawer when ?add=true is in URL
  React.useEffect(() => {
    if (searchParams.get("add") === "true") {
      setIsOpen(true)
      setDrawerMode("create")
      // Clean up URL param
      router.replace("/accounts")
    }
  }, [searchParams, router])
  const [drawerMode, setDrawerMode] = React.useState<"create" | "edit">(
    "create",
  )
  const [editingAccount, setEditingAccount] = React.useState<
    ReturnType<typeof usePortfolioStore>["accounts"][0] | null
  >(null)

  // Chart view state
  const [chartType] = React.useState<"sankey" | "treemap">("sankey")
  const [selectedAccountFilter, setSelectedAccountFilter] =
    React.useState<string>("all")
  const [groupBy, setGroupBy] = React.useState<AccountGrouping>("institution")
  const [displayValue, setDisplayValue] =
    React.useState<AccountDisplayValue>("value")

  // Institution filter state
  const [selectedInstitution, setSelectedInstitution] =
    React.useState<string>("all")
  const [isFilterSticky, setIsFilterSticky] = React.useState(false)
  const filterRef = React.useRef<HTMLDivElement>(null)

  // Chart refs for export functionality - proper typing for Highcharts React
  const sankeyChartRef = React.useRef<HighchartsReact.RefObject>(null!)
  const treemapChartRef = React.useRef<HighchartsReact.RefObject>(null!)

  // Use the portfolio store for accounts data
  const {
    accounts,
    holdings,
    error,
    addAccount,
    updateAccount,
    deleteAccount,
  } = usePortfolioStore()

  // Debug logging
  console.log('[Accounts] accounts:', accounts.length, accounts)
  console.log('[Accounts] holdings:', holdings.length)

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

  // Calculate total portfolio value for allocation percentages
  const totalPortfolioValue = React.useMemo(() => {
    return accounts.reduce((sum, acc) => sum + acc.totalValue, 0)
  }, [accounts])

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Sort accounts by highest value (highest allocation first)
  const sortedAccounts = React.useMemo(() => {
    return [...accounts].sort((a, b) => b.totalValue - a.totalValue)
  }, [accounts])

  // Get unique institutions from accounts
  const uniqueInstitutions = React.useMemo(() => {
    const institutions = [...new Set(accounts.map((a) => a.institution))]
    return institutions.map((inst) => ({
      id: inst,
      label: institutionLabels[inst] || inst,
    }))
  }, [accounts])

  // Filter accounts by selected institution
  const filteredAccounts = React.useMemo(() => {
    if (selectedInstitution === "all") return sortedAccounts
    return sortedAccounts.filter((a) => a.institution === selectedInstitution)
  }, [sortedAccounts, selectedInstitution])

  // Calculate total value of filtered accounts
  const filteredTotalValue = React.useMemo(() => {
    return filteredAccounts.reduce((sum, acc) => sum + acc.totalValue, 0)
  }, [filteredAccounts])

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
  }, [accounts.length])

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
    const chart = chartRef.current?.chart as Highcharts.Chart & {
      print?: () => void
      exportChart?: (options: { type: string }) => void
      downloadCSV?: () => void
      downloadXLS?: () => void
    }
    if (!chart) return

    switch (type) {
      case "fullscreen":
        chart.fullscreen?.open()
        break
      case "print":
        chart.print?.()
        break
      case "png":
        chart.exportChart?.({ type: "image/png" })
        break
      case "jpeg":
        chart.exportChart?.({ type: "image/jpeg" })
        break
      case "pdf":
        chart.exportChart?.({ type: "application/pdf" })
        break
      case "svg":
        chart.exportChart?.({ type: "image/svg+xml" })
        break
      case "csv":
        chart.downloadCSV?.()
        break
      case "xls":
        chart.downloadXLS?.()
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
    <main className="min-h-[calc(100vh-180px)] pb-24 sm:pb-0">
      {errorMessage}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-900 dark:text-gray-50">
            Accounts
            {accounts.length > 0 && (
              <Badge variant="neutral">{accounts.length}</Badge>
            )}
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
          Add account
          <Icon icon="carbon:add" className="-mr-0.5 size-5 shrink-0" aria-hidden="true" />
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

      {/* Sticky Institution Filter - Bottom positioned */}
      {accounts.length > 0 && (
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
              <div className="text-base font-medium text-gray-900 dark:text-gray-50">
                {formatCurrency(filteredTotalValue)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {filteredAccounts.length}{" "}
                {filteredAccounts.length === 1 ? "account" : "accounts"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedInstitution !== "all" && (
                <Badge
                  variant="default"
                  className="flex h-9 items-center gap-1.5 px-3 text-sm"
                >
                  <InstitutionLogo
                    institution={selectedInstitution}
                    className="size-5"
                  />
                  <span className="hidden sm:inline">
                    {institutionLabels[selectedInstitution] ||
                      selectedInstitution}
                  </span>
                  <button
                    onClick={() => setSelectedInstitution("all")}
                    className="rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-500/30"
                  >
                    <Icon icon="carbon:close" className="size-4" />
                  </button>
                </Badge>
              )}
              <InstitutionFilterDropdown
                institutions={uniqueInstitutions.map((inst) => inst.id)}
                selectedInstitution={selectedInstitution}
                onInstitutionChange={setSelectedInstitution}
                totalCount={uniqueInstitutions.length}
                hideTextOnMobile
                compactWhenActive
              />
            </div>
          </div>
        </div>
        </>
      )}

      {/* Portfolio Summary and Filter - Only show when there are accounts */}
      {accounts.length > 0 && (
        <div ref={filterRef} className="flex items-center justify-between">
          <div className="text-left">
            <div className="text-base font-medium text-gray-900 dark:text-gray-50">
              {formatCurrency(filteredTotalValue)}
            </div>
            <div className="text-sm font-normal text-gray-500 dark:text-gray-400">
              {filteredAccounts.length}{" "}
              {filteredAccounts.length === 1 ? "account" : "accounts"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedInstitution !== "all" && (
              <Badge
                variant="default"
                className="flex h-9 items-center gap-1.5 px-3 text-sm"
              >
                <InstitutionLogo
                  institution={selectedInstitution}
                  className="size-5"
                />
                <span className="hidden sm:inline">
                  {institutionLabels[selectedInstitution] || selectedInstitution}
                </span>
                <button
                  onClick={() => setSelectedInstitution("all")}
                  className="rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-500/30"
                >
                  <Icon icon="carbon:close" className="size-4" />
                </button>
              </Badge>
            )}
            <InstitutionFilterDropdown
              institutions={uniqueInstitutions.map((inst) => inst.id)}
              selectedInstitution={selectedInstitution}
              onInstitutionChange={setSelectedInstitution}
              totalCount={uniqueInstitutions.length}
            />
          </div>
        </div>
      )}

      {/* Account Flow Chart - only show when there are holdings */}
      {accounts.length > 0 && holdings.length > 0 && (
        <div className="pt-6" id="accounts-section">
          <Card data-chart="account-flow">
            <div className="flex flex-col gap-4">
              {/* Title and Controls Row */}
              <div className="flex items-center justify-between">
                <p
                  className="cursor-pointer text-base font-medium text-gray-900 transition-colors hover:text-blue-600 dark:text-gray-50 dark:hover:text-blue-400"
                  onClick={() => {
                    document
                      .getElementById("accounts-section")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }}
                >
                  Account flow
                </p>
                <div className="flex items-center gap-2">
                  {/* Chart Type Toggle */}
                  {/* <DropdownMenu>
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
                </DropdownMenu> */}

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
                                <>
                                  All{" "}
                                  <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-sm font-medium tabular-nums text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                    {accounts.length}
                                  </span>
                                </>
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
                            All{" "}
                            <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-sm font-medium tabular-nums text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                              {accounts.length}
                            </span>
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
                          <SelectItem value="institution">
                            Institution
                          </SelectItem>
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
                          <Icon
                            icon="carbon:download"
                            className="size-4"
                            aria-hidden="true"
                          />
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
                  <Tooltip
                    triggerAsChild
                    content="View chart in fullscreen mode"
                  >
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
                  (() => {
                    // Get unique institutions for the first level (from filtered accounts)
                    const sankeyInstitutions = [
                      ...new Set(filteredAccounts.map((a) => a.institution)),
                    ]
                    // Convert institution IDs to display labels
                    const institutionDisplayNames = sankeyInstitutions.map(
                      (inst) => institutionLabels[inst] || inst,
                    )

                    // Calculate total value for each asset class and sort by value descending
                    const assetClassTotals = [
                      {
                        id: "U.S. Stocks",
                        value: filteredAccounts.reduce(
                          (sum, acc) =>
                            sum +
                            (acc.totalValue * acc.assetAllocation.usStocks) /
                              100,
                          0,
                        ),
                      },
                      {
                        id: "Non-U.S. Stocks",
                        value: filteredAccounts.reduce(
                          (sum, acc) =>
                            sum +
                            (acc.totalValue * acc.assetAllocation.nonUsStocks) /
                              100,
                          0,
                        ),
                      },
                      {
                        id: "Fixed Income",
                        value: filteredAccounts.reduce(
                          (sum, acc) =>
                            sum +
                            (acc.totalValue * acc.assetAllocation.fixedIncome) /
                              100,
                          0,
                        ),
                      },
                      {
                        id: "Cash",
                        value: filteredAccounts.reduce(
                          (sum, acc) =>
                            sum +
                            (acc.totalValue * acc.assetAllocation.cash) / 100,
                          0,
                        ),
                      },
                    ]
                      .filter((asset) => asset.value > 0)
                      .sort((a, b) => b.value - a.value)

                    // Calculate institution totals for legend
                    const institutionTotals = sankeyInstitutions
                      .map((inst) => ({
                        key: inst,
                        label: institutionLabels[inst] || inst,
                        value: filteredAccounts
                          .filter((acc) => acc.institution === inst)
                          .reduce((sum, acc) => sum + acc.totalValue, 0),
                      }))
                      .sort((a, b) => b.value - a.value)

                    // Asset class colors (matches Sankey colors prop order)
                    const assetClassColors = [
                      "#3b82f6", // blue-500
                      "#06b6d4", // cyan-500
                      "#f59e0b", // amber-500
                      "#10b981", // emerald-500
                    ]

                    // Format currency for legend
                    const formatLegendValue = (value: number) => {
                      if (value >= 1000000)
                        return `$${(value / 1000000).toFixed(1)}M`
                      if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
                      return `$${value.toFixed(0)}`
                    }

                    return (
                      <>
                        <SankeyChartHighcharts
                          data={{
                            nodes: [
                              // Portfolio Total (leftmost)
                              { id: "Portfolio Total" },
                              // Institution nodes (second level) - use display names
                              ...institutionDisplayNames.map((name) => ({
                                id: name,
                              })),
                              // Account nodes (third level)
                              ...filteredAccounts.map((account) => ({
                                id: account.name,
                              })),
                              // Asset type nodes (rightmost) - sorted by value descending with offset for ordering
                              ...assetClassTotals.map((asset, index) => ({
                                id: asset.id,
                                offset: index, // Forces vertical ordering: 0 = top, 1 = second, etc.
                              })),
                            ],
                            links: [
                              // Portfolio Total to Institutions - aggregate by institution
                              ...sankeyInstitutions.map((inst) => {
                                const instTotal = filteredAccounts
                                  .filter((acc) => acc.institution === inst)
                                  .reduce((sum, acc) => sum + acc.totalValue, 0)
                                return {
                                  source: "Portfolio Total",
                                  target: institutionLabels[inst] || inst,
                                  value: instTotal,
                                }
                              }),
                              // Institutions to Accounts
                              ...filteredAccounts.map((account) => ({
                                source:
                                  institutionLabels[account.institution] ||
                                  account.institution,
                                target: account.name,
                                value: account.totalValue,
                              })),
                              // Accounts to Asset Types - based on each account's allocation
                              ...filteredAccounts.flatMap((account) => {
                                const links = []
                                const usStocksValue =
                                  (account.totalValue *
                                    account.assetAllocation.usStocks) /
                                  100
                                const nonUsStocksValue =
                                  (account.totalValue *
                                    account.assetAllocation.nonUsStocks) /
                                  100
                                const fixedIncomeValue =
                                  (account.totalValue *
                                    account.assetAllocation.fixedIncome) /
                                  100
                                const cashValue =
                                  (account.totalValue *
                                    account.assetAllocation.cash) /
                                  100

                                if (usStocksValue > 0) {
                                  links.push({
                                    source: account.name,
                                    target: "U.S. Stocks",
                                    value: usStocksValue,
                                  })
                                }
                                if (nonUsStocksValue > 0) {
                                  links.push({
                                    source: account.name,
                                    target: "Non-U.S. Stocks",
                                    value: nonUsStocksValue,
                                  })
                                }
                                if (fixedIncomeValue > 0) {
                                  links.push({
                                    source: account.name,
                                    target: "Fixed Income",
                                    value: fixedIncomeValue,
                                  })
                                }
                                if (cashValue > 0) {
                                  links.push({
                                    source: account.name,
                                    target: "Cash",
                                    value: cashValue,
                                  })
                                }
                                return links
                              }),
                            ],
                          }}
                          colors={["blue", "cyan", "amber", "emerald"]}
                          accountColors={[
                            "violet",
                            "fuchsia",
                            "pink",
                            "sky",
                            "lime",
                          ]}
                          institutions={institutionDisplayNames}
                          height={350}
                          chartRef={sankeyChartRef}
                        />

                        {/* Legend */}
                        <div className="mt-4">
                          {/* Asset Allocation */}
                          <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Asset Allocation
                          </p>
                          <ul className="flex flex-wrap gap-x-10 gap-y-4 text-sm">
                            {assetClassTotals.map((asset, index) => (
                              <li key={asset.id}>
                                <span className="text-base font-semibold text-gray-900 dark:text-gray-50">
                                  {formatLegendValue(asset.value)}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span
                                    className="size-2.5 shrink-0 rounded-sm"
                                    style={{
                                      backgroundColor: assetClassColors[index],
                                    }}
                                    aria-hidden="true"
                                  />
                                  <span className="text-sm">{asset.id}</span>
                                </div>
                              </li>
                            ))}
                          </ul>

                          {/* Institutions */}
                          <p className="mb-1 mt-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Institutions
                          </p>
                          <ul className="flex flex-wrap gap-x-10 gap-y-4 text-sm">
                            {institutionTotals.map((inst) => (
                              <li key={inst.key}>
                                <span className="text-base font-semibold text-gray-900 dark:text-gray-50">
                                  {formatLegendValue(inst.value)}
                                </span>
                                <div className="flex items-center gap-2">
                                  <InstitutionLogo
                                    institution={inst.key}
                                    className="size-5"
                                  />
                                  <span className="text-sm">{inst.label}</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )
                  })()
                ) : (
                  <AccountTreemap
                    accounts={filteredAccounts}
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
        </div>
      )}

      {/* Account Cards */}
      <div className="mt-6">
        <div className="space-y-4">
          {filteredAccounts.map((account) => (
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
              institution={account.institution}
              totalValue={account.totalValue}
              holdingsCount={account.holdingsCount}
              assetAllocation={account.assetAllocation}
              allocation={
                totalPortfolioValue > 0
                  ? (account.totalValue / totalPortfolioValue) * 100
                  : 0
              }
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
              Add account
              <Icon
                icon="carbon:add"
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

export default function AccountsPage() {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse">
          {/* Chart area skeleton */}
          <div className="mb-6 h-80 rounded-lg bg-gray-100 dark:bg-gray-800"></div>
          {/* Account cards grid skeleton */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="h-48 rounded-lg bg-gray-100 dark:bg-gray-800"></div>
            <div className="h-48 rounded-lg bg-gray-100 dark:bg-gray-800"></div>
            <div className="h-48 rounded-lg bg-gray-100 dark:bg-gray-800"></div>
          </div>
        </div>
      }
    >
      <AccountsContent />
    </Suspense>
  )
}
