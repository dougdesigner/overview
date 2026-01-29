"use client"
import { Card } from "@/components/Card"
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
export const groupHoldings = (holdings: Holding[]): Holding[] => {
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
  onToggleIgnored,
  selectedAccount = "all",
}: HoldingsTableProps) {
  const [expanded, setExpanded] = React.useState<ExpandedState>({})
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "allocation", desc: true },
  ])

  // Filter holdings by selected account
  const filteredHoldings = React.useMemo(() => {
    const filtered =
      selectedAccount === "all"
        ? holdings
        : holdings.filter((h) => h.accountId === selectedAccount)
    return groupHoldings(filtered)
  }, [holdings, selectedAccount])

  // We need to create the table first before we can use it in toggleExpandAll
  const tableRef = React.useRef<ReturnType<typeof useReactTable<Holding>> | null>(null)

  const toggleExpandAll = React.useCallback(() => {
    if (!tableRef.current) return
    const allExpandableRows = tableRef.current
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
  }, [])

  const areAllExpanded = React.useCallback(() => {
    if (!tableRef.current) return false
    const allExpandableRows =
      tableRef.current.getRowModel().rows.filter((row) => row.getCanExpand()) || []
    return (
      allExpandableRows.length > 0 &&
      allExpandableRows.every((row) => row.getIsExpanded())
    )
  }, [])

  const columns = React.useMemo(
    () => createColumns({ onEdit, onDelete, onToggleIgnored, toggleExpandAll, areAllExpanded, accounts }),
    [onEdit, onDelete, onToggleIgnored, toggleExpandAll, areAllExpanded, accounts],
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

  // Store the table in the ref so it can be used in callbacks
  React.useEffect(() => {
    tableRef.current = table
  }, [table])

  return (
    <div className="space-y-4">
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
