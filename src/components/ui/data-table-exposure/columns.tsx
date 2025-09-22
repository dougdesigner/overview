import { Badge } from "@/components/Badge"
import { getTickerColor } from "@/lib/tickerColors"
import { cx, toProperCase } from "@/lib/utils"
import {
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiArrowUpSLine,
} from "@remixicon/react"
import { ColumnDef } from "@tanstack/react-table"
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

      const color = isETFBreakdown
        ? "bg-gray-200 dark:bg-gray-700"
        : getTickerColor(ticker, "stock")

      return (
        <div className="flex items-center gap-2">
          <div
            className={cx("h-6 w-6 shrink-0 rounded-full", color)}
            aria-hidden="true"
          />
          <Badge
            variant={isETFBreakdown ? "flat" : "flat"}
            className={cx(
              "font-semibold",
              isETFBreakdown && "text-gray-600 dark:text-gray-400"
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
            isETFBreakdown && "text-gray-600 dark:text-gray-400 italic"
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
    },
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
    },
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
        <span className={cx(
          "font-semibold",
          !isETFBreakdown && "text-gray-900 dark:text-gray-50"
        )}>
          {formatNumber(row.original.totalShares)}
        </span>
      )
    },
    enableSorting: true,
    meta: {
      className: "text-right",
    },
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
        <span className={cx(
          "text-sm",
          !isETFBreakdown && "font-semibold text-gray-900 dark:text-gray-50"
        )}>
          {formatCurrency(value)}
        </span>
      )
    },
    enableSorting: true,
    meta: {
      className: "text-right",
    },
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
        <span className={cx(
          "text-sm",
          !isETFBreakdown && "font-semibold text-gray-900 dark:text-gray-50",
          isConcentrated && "text-orange-600 dark:text-orange-400"
        )}>
          {formatPercentage(percent)}
        </span>
      )
    },
    enableSorting: true,
    meta: {
      className: "text-right",
    },
  },
]