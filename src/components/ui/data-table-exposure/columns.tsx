"use client"

import { Badge } from "@/components/Badge"
import { stockDomainOverrides } from "@/lib/logoUtils"
import { getTickerColor } from "@/lib/tickerColors"
import { institutionLabels } from "@/lib/institutionUtils"
import { InstitutionLogo } from "@/components/ui/InstitutionLogo"
import { cx, toProperCase } from "@/lib/utils"
import {
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiArrowUpSLine,
} from "@remixicon/react"
import { ColumnDef } from "@tanstack/react-table"
import Image from "next/image"
import { useEffect, useState } from "react"
import { Account, StockExposure } from "./types"

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
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
  isDirectHolding,
  logoUrls,
}: {
  ticker: string
  isETFBreakdown?: boolean
  isDirectHolding?: boolean
  logoUrls?: Record<string, string | null>
}) {
  const [logoError, setLogoError] = useState(false)
  const [companyDomain, setCompanyDomain] = useState<string | undefined>(
    domainCache.get(ticker),
  )

  // Special handling for BRK.B - use custom text logo
  const isBerkshire =
    ticker.toUpperCase() === "BRK.B" || ticker.toUpperCase() === "BRK-B"

  // Determine if this is a stock or ETF
  // Direct holding breakdowns should be treated as stocks
  // ETF contribution breakdowns should be treated as ETFs
  const treatAsStock = !isETFBreakdown || isDirectHolding

  // Try to get logo URL from cached logoUrls first (skip for Berkshire)
  const logoUrl = isBerkshire
    ? null
    : logoUrls?.[ticker.toUpperCase()] ?? null
  const color =
    isETFBreakdown && !isDirectHolding
      ? "bg-gray-200 dark:bg-gray-700"
      : getTickerColor(ticker, "stock")

  // If no domain and it's a stock (not an ETF contribution), check overrides first, then fetch from Alpha Vantage
  useEffect(() => {
    if (!companyDomain && !logoUrl && treatAsStock && ticker) {
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
  }, [ticker, isETFBreakdown, companyDomain, logoUrl, treatAsStock])

  return (
    <div className="flex items-center gap-2">
      {isBerkshire && treatAsStock ? (
        // Custom Berkshire Hathaway logo
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-serif text-xs font-bold text-white"
          style={{ backgroundColor: "#000080" }}
          aria-hidden="true"
        >
          BH
        </div>
      ) : logoUrl && !logoError ? (
        <Image
          src={logoUrl}
          alt={ticker}
          width={48}
          height={48}
          className="size-6 rounded-full object-cover"
          style={{ backgroundColor: "#f1f3fa" }}
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

type ExposureDisplayValue = "market-value" | "pct-stocks" | "pct-portfolio"

interface ColumnsProps {
  toggleExpandAll: () => void
  areAllExpanded: () => boolean
  logoUrls?: Record<string, string | null>
  accounts: Account[]
  displayValue?: ExposureDisplayValue
  totalStocksValue?: number
}

export const createColumns = ({
  toggleExpandAll,
  areAllExpanded,
  logoUrls,
  accounts,
  displayValue = "pct-portfolio",
  totalStocksValue = 0,
}: ColumnsProps): ColumnDef<StockExposure>[] => {
  // Build columns array with all value columns always visible
  const columns: ColumnDef<StockExposure>[] = [
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
      displayName: "Expand",
    },
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

      // Check if this is a direct holding breakdown
      // Direct holdings have id like "stock-AAPL-direct"
      // ETF contributions have id like "stock-AAPL-etf-0"
      const isDirectHolding =
        isETFBreakdown && row.original.id?.includes("-direct")

      return (
        <TickerCell
          ticker={ticker}
          isETFBreakdown={isETFBreakdown}
          isDirectHolding={isDirectHolding}
          logoUrls={logoUrls}
        />
      )
    },
    sortingFn: (rowA, rowB) => {
      const tickerA = rowA.original.ticker || ""
      const tickerB = rowB.original.ticker || ""
      return tickerA.localeCompare(tickerB)
    },
    enableSorting: true,
    meta: {
      className: "text-left",
      displayName: "Ticker",
    },
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
      displayName: "Name",
    },
  },
  // Commented out Direct Shares and ETF Exposure columns
  // Users can see this breakdown by expanding rows
  // {
  //   header: ({ column }) => {
  //     return (
  //       <button
  //         className="flex w-full items-center justify-end gap-1 font-medium hover:text-gray-900 dark:hover:text-gray-50"
  //         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  //       >
  //         Direct Shares
  //         {column.getIsSorted() === "asc" && (
  //           <RiArrowUpSLine className="h-4 w-4" />
  //         )}
  //         {column.getIsSorted() === "desc" && (
  //           <RiArrowDownSLine className="h-4 w-4" />
  //         )}
  //       </button>
  //     )
  //   },
  //   accessorKey: "directShares",
  //   cell: ({ row }) => {
  //     const shares = row.original.directShares
  //     if (shares === 0) {
  //       return <span className="text-gray-400">—</span>
  //     }
  //     return <span>{formatNumber(shares)}</span>
  //   },
  //   enableSorting: true,
  //   meta: {
  //     className: "text-right",
  //     displayName: "Direct Shares",
  //   },
  // },
  // {
  //   header: ({ column }) => {
  //     return (
  //       <button
  //         className="flex w-full items-center justify-end gap-1 font-medium hover:text-gray-900 dark:hover:text-gray-50"
  //         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  //       >
  //         ETF Exposure
  //         {column.getIsSorted() === "asc" && (
  //           <RiArrowUpSLine className="h-4 w-4" />
  //         )}
  //         {column.getIsSorted() === "desc" && (
  //           <RiArrowDownSLine className="h-4 w-4" />
  //         )}
  //       </button>
  //     )
  //   },
  //   accessorKey: "etfExposure",
  //   cell: ({ row }) => {
  //     const shares = row.original.etfExposure
  //     if (shares === 0) {
  //       return <span className="text-gray-400">—</span>
  //     }
  //     return (
  //       <span className="text-blue-600 dark:text-blue-400">
  //         {formatNumber(shares)}
  //       </span>
  //     )
  //   },
  //   enableSorting: true,
  //   meta: {
  //     className: "text-right",
  //     displayName: "ETF Exposure",
  //   },
  // },
  {
    header: ({ column }) => {
      const isHighlighted = displayValue === "market-value"
      return (
        <button
          className={cx(
            "flex w-full items-center justify-end gap-1 font-medium",
            isHighlighted
              ? "text-gray-900 hover:text-gray-900 dark:text-gray-50 dark:hover:text-gray-50"
              : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400",
          )}
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
      const isHighlighted = displayValue === "market-value"
      return (
        <span
          className={cx(
            "text-sm",
            isHighlighted && !isETFBreakdown && "font-semibold text-gray-900 dark:text-gray-50",
            !isHighlighted && "text-gray-400 dark:text-gray-500",
          )}
        >
          {formatCurrency(value)}
        </span>
      )
    },
    enableSorting: true,
    meta: {
      className: "text-right min-w-32",
      displayName: "Market Value",
    },
  },
  // Stock % column - always visible, highlighted when selected
  {
    header: ({ column }) => {
      const isHighlighted = displayValue === "pct-stocks"
      return (
        <button
          className={cx(
            "flex w-full items-center justify-end gap-1 font-medium",
            isHighlighted
              ? "text-gray-900 hover:text-gray-900 dark:text-gray-50 dark:hover:text-gray-50"
              : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400",
          )}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Stock %
          {column.getIsSorted() === "asc" && (
            <RiArrowUpSLine className="h-4 w-4" />
          )}
          {column.getIsSorted() === "desc" && (
            <RiArrowDownSLine className="h-4 w-4" />
          )}
        </button>
      )
    },
    id: "stockPercent",
    accessorFn: (row) => {
      if (totalStocksValue > 0) {
        return (row.totalValue / totalStocksValue) * 100
      }
      return 0
    },
    cell: ({ row }) => {
      const isETFBreakdown = row.original.isETFBreakdown
      const isHighlighted = displayValue === "pct-stocks"
      const value = totalStocksValue > 0
        ? (row.original.totalValue / totalStocksValue) * 100
        : 0
      return (
        <span
          className={cx(
            "text-sm",
            isHighlighted && !isETFBreakdown && "font-semibold text-gray-900 dark:text-gray-50",
            !isHighlighted && "text-gray-400 dark:text-gray-500",
          )}
        >
          {formatPercentage(value)}
        </span>
      )
    },
    enableSorting: true,
    meta: {
      className: "text-right min-w-24",
      displayName: "Stock %",
    },
  },
  // Portfolio % column - always visible, highlighted when selected
  {
    header: ({ column }) => {
      const isHighlighted = displayValue === "pct-portfolio"
      return (
        <button
          className={cx(
            "flex w-full items-center justify-end gap-1 font-medium",
            isHighlighted
              ? "text-gray-900 hover:text-gray-900 dark:text-gray-50 dark:hover:text-gray-50"
              : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400",
          )}
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Portfolio %
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
      const isETFBreakdown = row.original.isETFBreakdown
      const isHighlighted = displayValue === "pct-portfolio"
      return (
        <span
          className={cx(
            "text-sm",
            isHighlighted && !isETFBreakdown && "font-semibold text-gray-900 dark:text-gray-50",
            !isHighlighted && "text-gray-400 dark:text-gray-500",
          )}
        >
          {formatPercentage(row.original.percentOfPortfolio)}
        </span>
      )
    },
    enableSorting: true,
    meta: {
      className: "text-right min-w-32",
      displayName: "Portfolio %",
    },
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
      displayName: "Sector",
    },
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
      displayName: "Industry",
    },
  },
  {
    header: "Institution",
    id: "institution",
    cell: ({ row }) => {
      const isETFBreakdown = row.original.isETFBreakdown
      // Only show for child rows (breakdown rows)
      if (!isETFBreakdown) {
        return <span className="text-gray-400">—</span>
      }
      const accountId = row.original.accountId
      if (!accountId) {
        return <span className="text-gray-400">—</span>
      }
      const account = accounts.find((a) => a.id === accountId)
      const institution = account?.institution
      if (!institution) {
        return <span className="text-gray-400">—</span>
      }
      return (
        <div className="flex items-center gap-2">
          <InstitutionLogo institution={institution} className="size-5" />
          <span>{institutionLabels[institution] || institution}</span>
        </div>
      )
    },
    enableSorting: false,
    meta: {
      className: "text-left min-w-40",
      displayName: "Institution",
    },
  },
  {
    header: "Account",
    id: "account",
    cell: ({ row }) => {
      const isETFBreakdown = row.original.isETFBreakdown
      // Only show for child rows (breakdown rows)
      if (!isETFBreakdown) {
        return <span className="text-gray-400">—</span>
      }
      const accountName = row.original.accountName
      return <span>{accountName || "—"}</span>
    },
    enableSorting: false,
    meta: {
      className: "text-left min-w-40 pr-6",
      displayName: "Account",
    },
  },
]

  return columns
}
