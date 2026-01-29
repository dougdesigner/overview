"use client"

import React from "react"
import { ExposureCard } from "./ExposureCard"
import { ExposureTablePagination } from "./ExposureTablePagination"
import { Account, ExposureDisplayValue, StockExposure } from "./types"

const PAGE_SIZE = 20

interface ExposureCardListProps {
  exposures: StockExposure[]
  accounts: Account[]
  displayValue: ExposureDisplayValue
  totalStocksValue: number
}

export function ExposureCardList({
  exposures,
  accounts,
  displayValue,
  totalStocksValue,
}: ExposureCardListProps) {
  // Track expanded state for grouped holdings
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set())

  // Manual pagination state
  const [currentPage, setCurrentPage] = React.useState(0)

  // Reset to first page when data changes
  React.useEffect(() => {
    setCurrentPage(0)
  }, [exposures.length])

  // Paginate the data
  const paginatedExposures = React.useMemo(() => {
    const startIndex = currentPage * PAGE_SIZE
    return exposures.slice(startIndex, startIndex + PAGE_SIZE)
  }, [exposures, currentPage])

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
        {paginatedExposures.length === 0 ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            No exposure data found
          </div>
        ) : (
          paginatedExposures.map((exposure) => (
            <ExposureCard
              key={exposure.id}
              exposure={exposure}
              accounts={accounts}
              displayValue={displayValue}
              totalStocksValue={totalStocksValue}
              isExpanded={expandedIds.has(exposure.id)}
              onToggleExpand={
                exposure.subRows && exposure.subRows.length > 0
                  ? () => toggleExpand(exposure.id)
                  : undefined
              }
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {exposures.length > 0 && (
        <ExposureTablePagination
          totalRows={exposures.length}
          currentPage={currentPage}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
}
