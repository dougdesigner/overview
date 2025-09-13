"use client"
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

// Group holdings by ticker and account for nested display
const groupHoldings = (holdings: Holding[]): Holding[] => {
  const grouped: Record<string, Holding[]> = {}

  // Group holdings by ticker (or by name for cash)
  holdings.forEach((holding) => {
    const key = holding.ticker || holding.name
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
        name: group[0].name,
        quantity: totalQuantity,
        lastPrice: group[0].type === "cash" ? 0 : avgPrice,
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
}: HoldingsTableProps) {
  const [expanded, setExpanded] = React.useState<ExpandedState>({})
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [selectedAccount, setSelectedAccount] = React.useState<string>("all")

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
    const allExpandableRows = table.getRowModel().rows.filter(row => row.getCanExpand())
    const allExpanded = allExpandableRows.every(row => row.getIsExpanded())

    if (allExpanded) {
      setExpanded({})
    } else {
      const newExpanded: ExpandedState = {}
      allExpandableRows.forEach(row => {
        newExpanded[row.id] = true
      })
      setExpanded(newExpanded)
    }
  }

  const areAllExpanded = () => {
    const allExpandableRows = table?.getRowModel().rows.filter(row => row.getCanExpand()) || []
    return allExpandableRows.length > 0 && allExpandableRows.every(row => row.getIsExpanded())
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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="account-filter" className="text-sm font-medium">
              Account:
            </label>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger className="w-[200px]" id="account-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            {/* <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Value:
            </span> */}
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              {formatCurrency(totalValue)}
            </span>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {filteredHoldings.length} holdings
        </div>
      </div>

      {/* Table */}
      <div className="relative overflow-hidden overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
        <Table>
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-gray-200 dark:border-gray-800"
              >
                {headerGroup.headers.map((header) => (
                  <TableHeaderCell
                    key={header.id}
                    className={cx(
                      "whitespace-nowrap py-3 font-medium",
                      header.column.columnDef.meta?.className,
                    )}
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
                  className="h-24 text-center text-gray-500"
                >
                  No holdings found
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cx(
                    "border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-50",
                    row.depth > 0 && "bg-gray-50/50 dark:bg-gray-900/50",
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cx(
                        "whitespace-nowrap py-3",
                        cell.column.columnDef.meta?.className,
                      )}
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

      {/* Pagination */}
      <DataTablePagination table={table} pageSize={20} />
    </div>
  )
}
