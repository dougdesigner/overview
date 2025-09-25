"use client"
import { Card } from "@/components/Card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/Table"
import { cx } from "@/lib/utils"
import {
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"
import React from "react"
import { DataTablePagination } from "../data-table/DataTablePagination"
import { createColumns } from "./columns"
import { Holding, HoldingsTableProps } from "./types"

// Get institution brand color
const getInstitutionBrandColor = (institution: string): string => {
  const brandColors: Record<string, string> = {
    fidelity: "bg-emerald-600",
    chase: "bg-blue-600",
    vanguard: "bg-red-600",
    wealthfront: "bg-purple-600",
    amex: "bg-blue-700",
    schwab: "bg-orange-600",
    etrade: "bg-purple-700",
    "td-ameritrade": "bg-green-600",
    merrill: "bg-blue-600",
    betterment: "bg-blue-500",
    robinhood: "bg-green-500",
    bofa: "bg-red-700",
    "wells-fargo": "bg-red-600",
    citi: "bg-blue-600",
  }
  return brandColors[institution] || "bg-gray-500"
}

// Get institution initials for logo
const getInstitutionInitials = (institutionLabel: string): string => {
  const words = institutionLabel.split(" ")
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase()
  }
  return words
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase()
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

// Group holdings by ticker and account for nested display
const groupHoldings = (holdings: Holding[]): Holding[] => {
  const grouped: Record<string, Holding[]> = {}

  // Group holdings by ticker for stocks/funds, or by type for cash
  holdings.forEach((holding) => {
    // For cash holdings, group all together regardless of name
    const key =
      holding.type === "cash" ? "CASH_GROUP" : holding.ticker || holding.name
    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(holding)
  })

  // Create parent rows for groups with multiple holdings
  const result: Holding[] = []
  Object.entries(grouped).forEach(([key, group]) => {
    if (group.length > 1) {
      // Calculate aggregated values
      const totalQuantity = group.reduce((sum, h) => sum + h.quantity, 0)
      const totalMarketValue = group.reduce((sum, h) => sum + h.marketValue, 0)
      const totalAllocation = group.reduce((sum, h) => sum + h.allocation, 0)
      const avgPrice = totalMarketValue / totalQuantity

      // Create parent row
      const parent: Holding = {
        id: `group-${key}`,
        accountId: "all",
        accountName: "All Accounts",
        ticker: group[0].ticker,
        name: group[0].type === "cash" ? "Cash" : group[0].name,
        quantity: totalQuantity,
        lastPrice: group[0].type === "cash" ? 1 : avgPrice,
        marketValue: totalMarketValue,
        allocation: totalAllocation,
        type: group[0].type,
        isGroup: true,
        subRows: group,
      }
      result.push(parent)
    } else {
      // Single holding, no grouping needed
      result.push(group[0])
    }
  })

  return result
}

export function HoldingsTable({
  holdings,
  accounts,
  onEdit,
  onDelete,
  initialAccountFilter = "all",
  onAccountFilterChange,
}: HoldingsTableProps) {
  const [expanded, setExpanded] = React.useState<ExpandedState>({})
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [selectedAccount, setSelectedAccount] =
    React.useState<string>(initialAccountFilter)

  // Filter holdings by selected account
  const filteredHoldings = React.useMemo(() => {
    const filtered =
      selectedAccount === "all"
        ? holdings
        : holdings.filter((h) => h.accountId === selectedAccount)
    return groupHoldings(filtered)
  }, [holdings, selectedAccount])

  // Calculate total value of filtered holdings
  const totalValue = React.useMemo(() => {
    // Use the original filtered holdings to avoid counting grouped rows
    const filtered =
      selectedAccount === "all"
        ? holdings
        : holdings.filter((h) => h.accountId === selectedAccount)
    return filtered.reduce((sum, holding) => sum + holding.marketValue, 0)
  }, [holdings, selectedAccount])

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Toggle expand/collapse all
  const toggleExpandAll = () => {
    const allExpandableRows = table
      .getRowModel()
      .rows.filter((row) => row.getCanExpand())
    const allExpanded = allExpandableRows.every((row) => row.getIsExpanded())

    if (allExpanded) {
      setExpanded({})
    } else {
      const newExpanded: ExpandedState = {}
      allExpandableRows.forEach((row) => {
        newExpanded[row.id] = true
      })
      setExpanded(newExpanded)
    }
  }

  const areAllExpanded = () => {
    const allExpandableRows =
      table?.getRowModel().rows.filter((row) => row.getCanExpand()) || []
    return (
      allExpandableRows.length > 0 &&
      allExpandableRows.every((row) => row.getIsExpanded())
    )
  }

  const columns = React.useMemo(
    () => createColumns({ onEdit, onDelete, toggleExpandAll, areAllExpanded }),
    [onEdit, onDelete],
  )

  const table = useReactTable({
    data: filteredHoldings,
    columns,
    state: {
      expanded,
      sorting,
    },
    onExpandedChange: setExpanded,
    onSortingChange: setSorting,
    getSubRows: (row) => row.subRows,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  })

  return (
    <div className="space-y-4">
      {/* Account Filter and Total Value */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          <label htmlFor="account-filter" className="text-sm font-medium">
            Account
          </label>
          <Select
            value={selectedAccount}
            onValueChange={(value) => {
              setSelectedAccount(value)
              onAccountFilterChange?.(value)
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px]" id="account-filter">
              <SelectValue placeholder="Select an account">
                {selectedAccount === "all"
                  ? "All Accounts"
                  : (() => {
                      const selectedAccountData = accounts.find(
                        (a) => a.id === selectedAccount,
                      )
                      if (selectedAccountData) {
                        const institutionLabel =
                          institutionLabels[selectedAccountData.institution] ||
                          selectedAccountData.institution
                        return (
                          <div className="flex items-center gap-2">
                            <div
                              className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white ${getInstitutionBrandColor(selectedAccountData.institution)}`}
                            >
                              {getInstitutionInitials(institutionLabel)}
                            </div>
                            <span className="truncate">
                              {selectedAccountData.name}
                            </span>
                          </div>
                        )
                      }
                      return null
                    })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              {accounts.map((account) => {
                const institutionLabel =
                  institutionLabels[account.institution] || account.institution
                return (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-start gap-2">
                      <div
                        className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white ${getInstitutionBrandColor(account.institution)}`}
                      >
                        {getInstitutionInitials(institutionLabel)}
                      </div>
                      <div className="flex flex-col">
                        <span>{account.name}</span>
                        <span className="text-xs text-gray-500">
                          {institutionLabel}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
        <div className="text-right">
          <div className="text-base font-medium text-gray-900 dark:text-gray-50">
            {formatCurrency(totalValue)}
          </div>
          <div className="text-sm font-normal text-gray-500 dark:text-gray-400">
            {filteredHoldings.length}{" "}
            {filteredHoldings.length === 1 ? "holding" : "holdings"}
          </div>
        </div>
      </div>

      {/* Table */}
      <Card className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHeaderCell
                      key={header.id}
                      className={cx(header.column.columnDef.meta?.className)}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHeaderCell>
                  ))}
                </TableRow>
              ))}
            </TableHead>
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No holdings found
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={cx(
                      row.depth > 0 && "bg-gray-50 dark:bg-gray-900/50",
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cx(cell.column.columnDef.meta?.className)}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      <DataTablePagination table={table} pageSize={20} />
    </div>
  )
}
