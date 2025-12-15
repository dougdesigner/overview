"use client"

import { Badge } from "@/components/Badge"
import { TickerLogo } from "@/components/ui/TickerLogo"
import { institutionLabels } from "@/lib/institutionUtils"
import { InstitutionLogo } from "@/components/ui/InstitutionLogo"
import { cx, toProperCase } from "@/lib/utils"
import {
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiArrowUpSLine,
} from "@remixicon/react"
import { ColumnDef } from "@tanstack/react-table"
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

type ExposureDisplayValue = "market-value" | "pct-stocks" | "pct-portfolio"

interface ColumnsProps {
  toggleExpandAll: () => void
  areAllExpanded: () => boolean
  accounts: Account[]
  displayValue?: ExposureDisplayValue
  totalStocksValue?: number
}

export const createColumns = ({
  toggleExpandAll,
  areAllExpanded,
  accounts,
  displayValue = "pct-portfolio",
  totalStocksValue = 0,
}: ColumnsProps): ColumnDef<StockExposure>[] => {
  // Define base columns
  const expanderColumn: ColumnDef<StockExposure> = {
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
  }

  const symbolColumn: ColumnDef<StockExposure> = {
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 font-medium hover:text-gray-900 dark:hover:text-gray-50"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Symbol
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

      // Determine the type for TickerLogo
      // ETF contribution breakdowns should show as ETF, everything else as stock
      const logoType = isETFBreakdown && !isDirectHolding ? "etf" : "stock"

      return (
        <div className="flex items-center gap-2">
          <TickerLogo
            ticker={ticker}
            type={logoType}
            className="size-6"
            domain={row.original.domain}
            companyName={row.original.name}
          />
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
    },
    sortingFn: (rowA, rowB) => {
      const tickerA = rowA.original.ticker || ""
      const tickerB = rowB.original.ticker || ""
      return tickerA.localeCompare(tickerB)
    },
    enableSorting: true,
    meta: {
      className: "text-left",
      displayName: "Symbol",
    },
  }

  const nameColumn: ColumnDef<StockExposure> = {
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
      className: "text-left min-w-56",
      displayName: "Name",
    },
  }

  // Define value columns (these get dynamically ordered based on displayValue)
  const marketValueColumn: ColumnDef<StockExposure> = {
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
  }

  const stockPercentColumn: ColumnDef<StockExposure> = {
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
  }

  const portfolioPercentColumn: ColumnDef<StockExposure> = {
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
  }

  // Define remaining columns
  const sectorColumn: ColumnDef<StockExposure> = {
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
  }

  const industryColumn: ColumnDef<StockExposure> = {
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
  }

  const institutionColumn: ColumnDef<StockExposure> = {
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
  }

  const accountColumn: ColumnDef<StockExposure> = {
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
  }

  // Order value columns based on displayValue - highlighted column comes first
  let valueColumns: ColumnDef<StockExposure>[]
  switch (displayValue) {
    case "market-value":
      valueColumns = [marketValueColumn, stockPercentColumn, portfolioPercentColumn]
      break
    case "pct-stocks":
      valueColumns = [stockPercentColumn, marketValueColumn, portfolioPercentColumn]
      break
    case "pct-portfolio":
    default:
      valueColumns = [portfolioPercentColumn, marketValueColumn, stockPercentColumn]
      break
  }

  // Build final columns array with dynamically ordered value columns
  return [
    expanderColumn,
    symbolColumn,
    nameColumn,
    ...valueColumns,
    sectorColumn,
    industryColumn,
    institutionColumn,
    accountColumn,
  ]
}
