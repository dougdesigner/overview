"use client"

import { Badge } from "@/components/Badge"
import { getTickerLogoUrl, stockDomainOverrides } from "@/lib/logoUtils"
import { getTickerColor } from "@/lib/tickerColors"
import { cx, toProperCase } from "@/lib/utils"
import {
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiArrowUpSLine,
} from "@remixicon/react"
import { ColumnDef } from "@tanstack/react-table"
import Image from "next/image"
import { useEffect, useState } from "react"
import { StockExposure } from "./types"

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const formatPercentage = (value: number) => {
  return `${value.toFixed(2)}%`
}

// Cache for company domains to avoid repeated API calls
const domainCache = new Map<string, string>()

// Component for rendering ticker with logo
function TickerCell({
  ticker,
  isETFBreakdown,
}: {
  ticker: string
  isETFBreakdown?: boolean
}) {
  const [logoError, setLogoError] = useState(false)
  const [companyDomain, setCompanyDomain] = useState<string | undefined>(
    domainCache.get(ticker),
  )

  // Special handling for BRK.B - use custom text logo
  const isBerkshire =
    ticker.toUpperCase() === "BRK.B" || ticker.toUpperCase() === "BRK-B"

  // Try to get logo URL with domain if available (skip for Berkshire)
  const logoUrl = isBerkshire ? null : getTickerLogoUrl(ticker, companyDomain)
  const color = isETFBreakdown
    ? "bg-gray-200 dark:bg-gray-700"
    : getTickerColor(ticker, "stock")

  // If no domain and it's not an ETF breakdown, check overrides first, then fetch from Alpha Vantage
  useEffect(() => {
    if (!companyDomain && !logoUrl && !isETFBreakdown && ticker) {
      const upperTicker = ticker.toUpperCase()

      // Check if we have an override first
      const override = stockDomainOverrides[upperTicker]
      if (override) {
        // Use override, skip API call
        domainCache.set(ticker, `https://${override}`)
        setCompanyDomain(`https://${override}`)
      } else if (!domainCache.has(ticker)) {
        // Only make API call if no override exists
        // Mark as fetching to avoid duplicate requests
        domainCache.set(ticker, "")

        // Call API to get company overview with OfficialSite
        fetch("/api/company-overview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbols: [ticker] }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data[ticker]?.officialSite) {
              const site = data[ticker].officialSite
              domainCache.set(ticker, site)
              setCompanyDomain(site)
            }
          })
          .catch((err) => {
            console.error(`Failed to fetch domain for ${ticker}:`, err)
            // Remove from cache on error
            domainCache.delete(ticker)
          })
      }
    }
  }, [ticker, isETFBreakdown, companyDomain, logoUrl])

  return (
    <div className="flex items-center gap-2">
      {isBerkshire && !isETFBreakdown ? (
        // Custom Berkshire Hathaway logo
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: "#000080" }}
          aria-hidden="true"
        >
          BH
        </div>
      ) : logoUrl && !logoError && !isETFBreakdown ? (
        <Image
          src={logoUrl}
          alt={ticker}
          width={48}
          height={48}
          className="size-6 rounded-full bg-white object-cover"
          onError={() => setLogoError(true)}
        />
      ) : (
        <div
          className={cx("h-6 w-6 shrink-0 rounded-full", color)}
          aria-hidden="true"
        />
      )}
      <Badge
        variant="flat"
        className={cx(
          "font-semibold",
          isETFBreakdown && "text-gray-600 dark:text-gray-400",
        )}
      >
        {ticker}
      </Badge>
    </div>
  )
}

interface ColumnsProps {
  toggleExpandAll: () => void
  areAllExpanded: () => boolean
}

export const createColumns = ({
  toggleExpandAll,
  areAllExpanded,
}: ColumnsProps): ColumnDef<StockExposure>[] => [
  {
    id: "expander",
    header: ({ table }) => {
      const hasExpandableRows = table
        .getRowModel()
        .rows.some((row) => row.getCanExpand())
      if (!hasExpandableRows) return null

      return (
        <button
          onClick={toggleExpandAll}
          className="cursor-pointer p-1"
          title={areAllExpanded() ? "Collapse all" : "Expand all"}
        >
          {areAllExpanded() ? (
            <RiArrowDownSLine className="h-4 w-4" />
          ) : (
            <RiArrowRightSLine className="h-4 w-4" />
          )}
        </button>
      )
    },
    cell: ({ row }) => {
      if (!row.getCanExpand()) return null
      return (
        <button
          onClick={row.getToggleExpandedHandler()}
          className="cursor-pointer p-1"
        >
          {row.getIsExpanded() ? (
            <RiArrowDownSLine className="h-4 w-4" />
          ) : (
            <RiArrowRightSLine className="h-4 w-4" />
          )}
        </button>
      )
    },
    enableSorting: false,
    meta: {
      className: "!w-6 !pr-0",
    } as any,
  },
  {
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 font-medium hover:text-gray-900 dark:hover:text-gray-50"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Ticker
          {column.getIsSorted() === "asc" && (
            <RiArrowUpSLine className="h-4 w-4" />
          )}
          {column.getIsSorted() === "desc" && (
            <RiArrowDownSLine className="h-4 w-4" />
          )}
        </button>
      )
    },
    accessorKey: "ticker",
    cell: ({ row }) => {
      const ticker = row.original.ticker
      const isETFBreakdown = row.original.isETFBreakdown

      if (!ticker) return <span className="text-gray-400">—</span>

      return <TickerCell ticker={ticker} isETFBreakdown={isETFBreakdown} />
    },
    sortingFn: (rowA, rowB) => {
      const tickerA = rowA.original.ticker || ""
      const tickerB = rowB.original.ticker || ""
      return tickerA.localeCompare(tickerB)
    },
    enableSorting: true,
    meta: {
      className: "text-left",
    } as any,
  },
  {
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 font-medium hover:text-gray-900 dark:hover:text-gray-50"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          {column.getIsSorted() === "asc" && (
            <RiArrowUpSLine className="h-4 w-4" />
          )}
          {column.getIsSorted() === "desc" && (
            <RiArrowDownSLine className="h-4 w-4" />
          )}
        </button>
      )
    },
    accessorKey: "name",
    cell: ({ row }) => {
      const isNested = row.depth > 0
      const isETFBreakdown = row.original.isETFBreakdown
      return (
        <span
          className={cx(
            "font-semibold text-gray-900 dark:text-gray-50",
            isNested && "pl-6 font-normal",
            isETFBreakdown && "text-gray-600 dark:text-gray-400",
          )}
        >
          {row.original.name}
        </span>
      )
    },
    enableSorting: true,
    meta: {
      className: "text-left min-w-80",
    },
  },
  {
    header: ({ column }) => {
      return (
        <button
          className="flex w-full items-center justify-end gap-1 font-medium hover:text-gray-900 dark:hover:text-gray-50"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Direct Shares
          {column.getIsSorted() === "asc" && (
            <RiArrowUpSLine className="h-4 w-4" />
          )}
          {column.getIsSorted() === "desc" && (
            <RiArrowDownSLine className="h-4 w-4" />
          )}
        </button>
      )
    },
    accessorKey: "directShares",
    cell: ({ row }) => {
      const shares = row.original.directShares
      if (shares === 0) {
        return <span className="text-gray-400">—</span>
      }
      return <span>{formatNumber(shares)}</span>
    },
    enableSorting: true,
    meta: {
      className: "text-right",
    } as any,
  },
  {
    header: ({ column }) => {
      return (
        <button
          className="flex w-full items-center justify-end gap-1 font-medium hover:text-gray-900 dark:hover:text-gray-50"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          ETF Exposure
          {column.getIsSorted() === "asc" && (
            <RiArrowUpSLine className="h-4 w-4" />
          )}
          {column.getIsSorted() === "desc" && (
            <RiArrowDownSLine className="h-4 w-4" />
          )}
        </button>
      )
    },
    accessorKey: "etfExposure",
    cell: ({ row }) => {
      const shares = row.original.etfExposure
      if (shares === 0) {
        return <span className="text-gray-400">—</span>
      }
      return (
        <span className="text-blue-600 dark:text-blue-400">
          {formatNumber(shares)}
        </span>
      )
    },
    enableSorting: true,
    meta: {
      className: "text-right",
    } as any,
  },
  {
    header: ({ column }) => {
      return (
        <button
          className="flex w-full items-center justify-end gap-1 font-medium hover:text-gray-900 dark:hover:text-gray-50"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Quantity
          {column.getIsSorted() === "asc" && (
            <RiArrowUpSLine className="h-4 w-4" />
          )}
          {column.getIsSorted() === "desc" && (
            <RiArrowDownSLine className="h-4 w-4" />
          )}
        </button>
      )
    },
    accessorKey: "totalShares",
    cell: ({ row }) => {
      const isETFBreakdown = row.original.isETFBreakdown
      return (
        <span
          className={cx(
            "font-semibold",
            !isETFBreakdown && "text-gray-900 dark:text-gray-50",
          )}
        >
          {formatNumber(row.original.totalShares)}
        </span>
      )
    },
    enableSorting: true,
    meta: {
      className: "text-right",
    } as any,
  },
  {
    header: ({ column }) => {
      return (
        <button
          className="flex w-full items-center justify-end gap-1 font-medium hover:text-gray-900 dark:hover:text-gray-50"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Market Value
          {column.getIsSorted() === "asc" && (
            <RiArrowUpSLine className="h-4 w-4" />
          )}
          {column.getIsSorted() === "desc" && (
            <RiArrowDownSLine className="h-4 w-4" />
          )}
        </button>
      )
    },
    accessorKey: "totalValue",
    cell: ({ row }) => {
      const value = row.original.totalValue
      const isETFBreakdown = row.original.isETFBreakdown
      return (
        <span
          className={cx(
            "text-sm",
            !isETFBreakdown && "font-semibold text-gray-900 dark:text-gray-50",
          )}
        >
          {formatCurrency(value)}
        </span>
      )
    },
    enableSorting: true,
    meta: {
      className: "text-right",
    } as any,
  },
  {
    header: ({ column }) => {
      return (
        <button
          className="flex w-full items-center justify-end gap-1 font-medium hover:text-gray-900 dark:hover:text-gray-50"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Allocation (%)
          {column.getIsSorted() === "asc" && (
            <RiArrowUpSLine className="h-4 w-4" />
          )}
          {column.getIsSorted() === "desc" && (
            <RiArrowDownSLine className="h-4 w-4" />
          )}
        </button>
      )
    },
    accessorKey: "percentOfPortfolio",
    cell: ({ row }) => {
      const percent = row.original.percentOfPortfolio
      const isETFBreakdown = row.original.isETFBreakdown

      // Highlight concentrated positions
      const isConcentrated = percent > 10 && !isETFBreakdown

      return (
        <span
          className={cx(
            "text-sm",
            !isETFBreakdown && "font-semibold text-gray-900 dark:text-gray-50",
            isConcentrated && "text-orange-600 dark:text-orange-400",
          )}
        >
          {formatPercentage(percent)}
        </span>
      )
    },
    enableSorting: true,
    meta: {
      className: "text-right",
    } as any,
  },
  {
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 font-medium hover:text-gray-900 dark:hover:text-gray-50"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Sector
          {column.getIsSorted() === "asc" && (
            <RiArrowUpSLine className="h-4 w-4" />
          )}
          {column.getIsSorted() === "desc" && (
            <RiArrowDownSLine className="h-4 w-4" />
          )}
        </button>
      )
    },
    accessorKey: "sector",
    cell: ({ row }) => {
      const sector = row.original.sector
      const isETFBreakdown = row.original.isETFBreakdown

      if (!sector || isETFBreakdown) {
        return <span className="text-gray-400">—</span>
      }

      return (
        <Badge variant="flat" className="text-xs">
          {toProperCase(sector)}
        </Badge>
      )
    },
    enableSorting: true,
    meta: {
      className: "text-left",
    } as any,
  },
  {
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 font-medium hover:text-gray-900 dark:hover:text-gray-50"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Industry
          {column.getIsSorted() === "asc" && (
            <RiArrowUpSLine className="h-4 w-4" />
          )}
          {column.getIsSorted() === "desc" && (
            <RiArrowDownSLine className="h-4 w-4" />
          )}
        </button>
      )
    },
    accessorKey: "industry",
    cell: ({ row }) => {
      const industry = row.original.industry
      const isETFBreakdown = row.original.isETFBreakdown

      if (!industry || isETFBreakdown) {
        return <span className="text-gray-400">—</span>
      }

      return (
        <Badge variant="flat" className="text-xs">
          {toProperCase(industry)}
        </Badge>
      )
    },
    enableSorting: true,
    meta: {
      className: "text-left min-w-40",
    },
  },
]
