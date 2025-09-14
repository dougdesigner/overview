import { Badge } from "@/components/Badge"
import { Button } from "@/components/Button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/DropdownMenu"
import { cx } from "@/lib/utils"
import {
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiArrowUpSLine,
  RiDeleteBinLine,
  RiEditLine,
  RiMore2Fill,
  RiSubtractLine,
  RiAddLine,
} from "@remixicon/react"
import { ColumnDef, Row } from "@tanstack/react-table"
import { Holding } from "./types"

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

// Format number with commas
const formatNumber = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value)
}

// Format percentage
const formatPercentage = (value: number) => {
  return `${value.toFixed(2)}%`
}

// Get ticker color based on company/institution
const getTickerColor = (ticker: string, type: "stock" | "fund" | "cash"): string => {
  // Stock company colors
  const stockColors: Record<string, string> = {
    AAPL: "bg-gray-600", // Apple
    MSFT: "bg-blue-600", // Microsoft
    GOOGL: "bg-blue-500", // Google (simplified to blue)
    GOOG: "bg-blue-500", // Google
    AMZN: "bg-orange-500", // Amazon
    TSLA: "bg-red-600", // Tesla
    META: "bg-blue-700", // Meta/Facebook
    NVDA: "bg-green-600", // NVIDIA
    JPM: "bg-blue-800", // JP Morgan
    V: "bg-blue-600", // Visa
    MA: "bg-red-600", // Mastercard
    JNJ: "bg-red-500", // Johnson & Johnson
    WMT: "bg-blue-500", // Walmart
    PG: "bg-blue-600", // Procter & Gamble
    HD: "bg-orange-600", // Home Depot
    DIS: "bg-blue-500", // Disney
    NFLX: "bg-red-600", // Netflix
    ADBE: "bg-red-600", // Adobe
    CRM: "bg-blue-500", // Salesforce
    ORCL: "bg-red-600", // Oracle
    INTC: "bg-blue-600", // Intel
    AMD: "bg-gray-900", // AMD
    PYPL: "bg-blue-600", // PayPal
    CSCO: "bg-blue-700", // Cisco
  }

  // ETF/Fund colors based on provider
  const fundColors: Record<string, string> = {
    // Vanguard funds
    VOO: "bg-red-600", // Vanguard S&P 500
    VTI: "bg-red-600", // Vanguard Total Market
    VTV: "bg-red-600", // Vanguard Value
    VUG: "bg-red-600", // Vanguard Growth
    VIG: "bg-red-600", // Vanguard Dividend
    VYM: "bg-red-600", // Vanguard High Dividend
    BND: "bg-red-600", // Vanguard Bond
    VXUS: "bg-red-600", // Vanguard International
    VNQ: "bg-red-600", // Vanguard REIT
    // SPDR funds
    SPY: "bg-gray-700", // SPDR S&P 500
    // iShares/BlackRock funds
    IVV: "bg-gray-900", // iShares S&P 500
    IWM: "bg-gray-900", // iShares Russell 2000
    EFA: "bg-gray-900", // iShares MSCI EAFE
    AGG: "bg-gray-900", // iShares Core Aggregate Bond
    // Invesco funds
    QQQ: "bg-teal-600", // Invesco QQQ
    // Other popular funds
    ARKK: "bg-purple-600", // ARK Innovation
    ARKG: "bg-purple-600", // ARK Genomic
    GLD: "bg-yellow-600", // SPDR Gold
  }

  if (type === "stock" && stockColors[ticker]) {
    return stockColors[ticker]
  }

  if (type === "fund" && fundColors[ticker]) {
    return fundColors[ticker]
  }

  // Default colors
  return type === "stock" ? "bg-blue-500" : "bg-gray-500"
}

interface ColumnsProps {
  onEdit: (holding: Holding) => void
  onDelete: (holdingId: string) => void
  toggleExpandAll: () => void
  areAllExpanded: () => boolean
}

export const createColumns = ({
  onEdit,
  onDelete,
  toggleExpandAll,
  areAllExpanded,
}: ColumnsProps): ColumnDef<Holding>[] => [
  {
    id: "expander",
    header: ({ table }) => {
      const hasExpandableRows = table.getRowModel().rows.some(row => row.getCanExpand())
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
          {column.getIsSorted() === "asc" && <RiArrowUpSLine className="h-4 w-4" />}
          {column.getIsSorted() === "desc" && <RiArrowDownSLine className="h-4 w-4" />}
        </button>
      )
    },
    accessorKey: "ticker",
    cell: ({ row }) => {
      const ticker = row.original.ticker
      const type = row.original.type

      if (!ticker) return <span className="text-gray-400">—</span>

      const color = getTickerColor(ticker, type)

      return (
        <div className="flex items-center gap-2">
          <div
            className={cx(
              "h-6 w-6 rounded-full shrink-0",
              color
            )}
            aria-hidden="true"
          />
          <Badge variant="neutral" className="font-medium">
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
          {column.getIsSorted() === "asc" && <RiArrowUpSLine className="h-4 w-4" />}
          {column.getIsSorted() === "desc" && <RiArrowDownSLine className="h-4 w-4" />}
        </button>
      )
    },
    accessorKey: "name",
    cell: ({ row }) => {
      const isNested = row.depth > 0
      return (
        <span
          className={cx(
            "font-semibold text-gray-900 dark:text-gray-50",
            isNested && "pl-6 text-gray-600 dark:text-gray-400 font-normal",
          )}
        >
          {row.original.name}
          {isNested && (
            <span className="ml-2 text-xs text-gray-500">
              ({row.original.accountName})
            </span>
          )}
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
          className="flex items-center gap-1 font-medium hover:text-gray-900 dark:hover:text-gray-50 justify-end w-full"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Quantity
          {column.getIsSorted() === "asc" && <RiArrowUpSLine className="h-4 w-4" />}
          {column.getIsSorted() === "desc" && <RiArrowDownSLine className="h-4 w-4" />}
        </button>
      )
    },
    accessorKey: "quantity",
    cell: ({ row }) => {
      const quantity = row.original.quantity
      if (row.original.type === "cash") {
        // For cash, show the market value without dollar sign
        return <span>{formatNumber(row.original.marketValue)}</span>
      }
      return <span>{formatNumber(quantity)}</span>
    },
    sortingFn: (rowA, rowB) => {
      const qtyA = rowA.original.type === "cash" ? rowA.original.marketValue : rowA.original.quantity
      const qtyB = rowB.original.type === "cash" ? rowB.original.marketValue : rowB.original.quantity
      return qtyA - qtyB
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
          className="flex items-center gap-1 font-medium hover:text-gray-900 dark:hover:text-gray-50 justify-end w-full"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Last Price
          {column.getIsSorted() === "asc" && <RiArrowUpSLine className="h-4 w-4" />}
          {column.getIsSorted() === "desc" && <RiArrowDownSLine className="h-4 w-4" />}
        </button>
      )
    },
    accessorKey: "lastPrice",
    cell: ({ row }) => {
      const price = row.original.lastPrice
      if (row.original.type === "cash") {
        // For cash, always show $1.00
        return <span>{formatCurrency(1)}</span>
      }
      return <span>{formatCurrency(price)}</span>
    },
    sortingFn: (rowA, rowB) => {
      const priceA = rowA.original.type === "cash" ? 1 : rowA.original.lastPrice
      const priceB = rowB.original.type === "cash" ? 1 : rowB.original.lastPrice
      return priceA - priceB
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
          className="flex items-center gap-1 font-medium hover:text-gray-900 dark:hover:text-gray-50 justify-end w-full"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Market Value
          {column.getIsSorted() === "asc" && <RiArrowUpSLine className="h-4 w-4" />}
          {column.getIsSorted() === "desc" && <RiArrowDownSLine className="h-4 w-4" />}
        </button>
      )
    },
    accessorKey: "marketValue",
    cell: ({ row }) => {
      const value = row.original.marketValue
      return (
        <span>
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
          className="flex items-center gap-1 font-medium hover:text-gray-900 dark:hover:text-gray-50 justify-end w-full"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Allocation (%)
          {column.getIsSorted() === "asc" && <RiArrowUpSLine className="h-4 w-4" />}
          {column.getIsSorted() === "desc" && <RiArrowDownSLine className="h-4 w-4" />}
        </button>
      )
    },
    accessorKey: "allocation",
    cell: ({ row }) => {
      const allocation = row.original.allocation
      return (
        <span
          className={cx(
            "text-sm",
            allocation >= 10
              ? "text-gray-900 dark:text-gray-50"
              : "text-gray-600 dark:text-gray-400",
          )}
        >
          {formatPercentage(allocation)}
        </span>
      )
    },
    enableSorting: true,
    meta: {
      className: "text-right",
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const holding = row.original
      // Don't show actions for group rows
      if (holding.isGroup) return null

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <RiMore2Fill className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(holding)}>
              <RiEditLine className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(holding.id)}
              className="text-red-600 dark:text-red-400"
            >
              <RiDeleteBinLine className="mr-2 h-4 w-4" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    enableSorting: false,
    meta: {
      className: "text-center w-16",
    },
  },
]