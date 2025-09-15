import { Badge } from "@/components/Badge"
import { Button } from "@/components/Button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/DropdownMenu"
import { getTickerColor } from "@/lib/tickerColors"
import { cx } from "@/lib/utils"
import {
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiArrowUpSLine,
  RiDeleteBinLine,
  RiEditLine,
  RiMore2Fill,
} from "@remixicon/react"
import { ColumnDef } from "@tanstack/react-table"
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

// Note: getTickerColor is now imported from @/lib/tickerColors for shared use across the app

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
      const type = row.original.type

      if (!ticker) return <span className="text-gray-400">—</span>

      const color = getTickerColor(ticker, type)

      return (
        <div className="flex items-center gap-2">
          <div
            className={cx("h-6 w-6 shrink-0 rounded-full", color)}
            aria-hidden="true"
          />
          <Badge variant="flat" className="font-semibold">
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
      return (
        <span
          className={cx(
            "font-semibold text-gray-900 dark:text-gray-50",
            isNested && "pl-6 font-normal text-gray-600 dark:text-gray-400",
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
      const qtyA =
        rowA.original.type === "cash"
          ? rowA.original.marketValue
          : rowA.original.quantity
      const qtyB =
        rowB.original.type === "cash"
          ? rowB.original.marketValue
          : rowB.original.quantity
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
          className="flex w-full items-center justify-end gap-1 font-medium hover:text-gray-900 dark:hover:text-gray-50"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Last Price
          {column.getIsSorted() === "asc" && (
            <RiArrowUpSLine className="h-4 w-4" />
          )}
          {column.getIsSorted() === "desc" && (
            <RiArrowDownSLine className="h-4 w-4" />
          )}
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
    accessorKey: "marketValue",
    cell: ({ row }) => {
      const value = row.original.marketValue
      return <span className="text-sm text-gray-900 dark:text-gray-50">{formatCurrency(value)}</span>
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
    accessorKey: "allocation",
    cell: ({ row }) => {
      const allocation = row.original.allocation
      return (
        <span className="text-sm text-gray-900 dark:text-gray-50">
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
