"use client"

import React from "react"
import { DataTablePagination } from "../data-table/DataTablePagination"
import { HoldingCard } from "./HoldingCard"
import { groupHoldings } from "./HoldingsTable"
import { HoldingsTableProps } from "./types"
import { useReactTable, getCoreRowModel, getPaginationRowModel } from "@tanstack/react-table"

export function HoldingsCardList({
  holdings,
  accounts,
  onEdit,
  onDelete,
  onToggleIgnored,
  selectedAccount = "all",
}: HoldingsTableProps) {
  // Track expanded state for grouped holdings
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set())

  // Filter holdings by selected account
  const filteredHoldings = React.useMemo(() => {
    const filtered =
      selectedAccount === "all"
        ? holdings
        : holdings.filter((h) => h.accountId === selectedAccount)
    return groupHoldings(filtered)
  }, [holdings, selectedAccount])

  // Create a minimal table instance for pagination
  const table = useReactTable({
    data: filteredHoldings,
    columns: [], // We don't need columns for card view
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  })

  // Get paginated data
  const paginatedHoldings = table.getRowModel().rows.map((row) => row.original)

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="space-y-4">
      {/* Card List */}
      <div className="space-y-3">
        {paginatedHoldings.length === 0 ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            No holdings found
          </div>
        ) : (
          paginatedHoldings.map((holding) => (
            <HoldingCard
              key={holding.id}
              holding={holding}
              accounts={accounts}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleIgnored={onToggleIgnored}
              isExpanded={expandedIds.has(holding.id)}
              onToggleExpand={
                holding.subRows && holding.subRows.length > 0
                  ? () => toggleExpand(holding.id)
                  : undefined
              }
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {filteredHoldings.length > 0 && (
        <DataTablePagination table={table} pageSize={20} />
      )}
    </div>
  )
}
