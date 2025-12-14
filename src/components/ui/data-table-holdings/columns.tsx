"use client"

import { Badge } from "@/components/Badge"
import { Button } from "@/components/Button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/DropdownMenu"
import { TickerLogo } from "@/components/ui/TickerLogo"
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
import { institutionLabels } from "@/lib/institutionUtils"
import { InstitutionLogo } from "@/components/ui/InstitutionLogo"
import { Account, Holding } from "./types"

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

interface ColumnsProps {
  onEdit: (holding: Holding) => void
  onDelete: (holdingId: string) => void
  toggleExpandAll: () => void
  areAllExpanded: () => boolean
  accounts: Account[]
}

export const createColumns = ({
  onEdit,
  onDelete,
  toggleExpandAll,
  areAllExpanded,
  accounts,
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
      const type = row.original.type

      if (!ticker) return <span className="text-gray-400">—</span>

      return (
        <div className="flex items-center gap-2">
          <TickerLogo
            ticker={ticker}
            type={type === "fund" ? "etf" : type === "stock" ? "stock" : undefined}
            className="size-6"
            domain={row.original.domain}
            companyName={row.original.isManualEntry ? row.original.name : undefined}
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
      displayName: "Account",
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
        </span>
      )
    },
    enableSorting: true,
    meta: {
      className: "text-left min-w-56",
      displayName: "Name",
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
      return <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">{formatCurrency(value)}</span>
    },
    enableSorting: true,
    meta: {
      className: "text-right",
      displayName: "Market Value",
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
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">
          {formatPercentage(allocation)}
        </span>
      )
    },
    enableSorting: true,
    meta: {
      className: "text-right min-w-40",
      displayName: "Portfolio %",
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
      displayName: "Quantity",
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
      className: "text-right min-w-32",
      displayName: "Last Price",
    },
  },
  {
    header: ({ column }) => {
      return (
        <button
          className="flex w-full items-center justify-end gap-1 font-medium hover:text-gray-900 dark:hover:text-gray-50"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Day Change (%)
          {column.getIsSorted() === "asc" && (
            <RiArrowUpSLine className="h-4 w-4" />
          )}
          {column.getIsSorted() === "desc" && (
            <RiArrowDownSLine className="h-4 w-4" />
          )}
        </button>
      )
    },
    accessorKey: "changePercent",
    cell: ({ row }) => {
      const changePercent = row.original.changePercent
      if (row.original.type === "cash" || changePercent === undefined) {
        return <span className="text-gray-400">—</span>
      }

      const isPositive = changePercent >= 0
      return (
        <span className={cx(
          "font-medium",
          isPositive ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"
        )}>
          {isPositive && "+"}
          {formatPercentage(changePercent)}
        </span>
      )
    },
    sortingFn: (rowA, rowB) => {
      const changeA = rowA.original.changePercent || 0
      const changeB = rowB.original.changePercent || 0
      return changeA - changeB
    },
    enableSorting: true,
    meta: {
      className: "text-right min-w-40",
      displayName: "Day Change (%)",
    },
  },
  {
    header: ({ column }) => {
      return (
        <button
          className="flex w-full items-center justify-end gap-1 font-medium hover:text-gray-900 dark:hover:text-gray-50"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          MV Day Change
          {column.getIsSorted() === "asc" && (
            <RiArrowUpSLine className="h-4 w-4" />
          )}
          {column.getIsSorted() === "desc" && (
            <RiArrowDownSLine className="h-4 w-4" />
          )}
        </button>
      )
    },
    accessorKey: "marketValueChange",
    cell: ({ row }) => {
      // Calculate market value change based on quantity and price change
      const quantity = row.original.quantity
      const changeAmount = row.original.changeAmount

      if (row.original.type === "cash" || changeAmount === undefined || quantity === undefined) {
        return <span className="text-gray-400">—</span>
      }

      const marketValueChange = quantity * changeAmount
      const isPositive = marketValueChange >= 0

      return (
        <span className={cx(
          "font-medium",
          isPositive ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"
        )}>
          {isPositive && "+"}
          {formatCurrency(Math.abs(marketValueChange))}
        </span>
      )
    },
    sortingFn: (rowA, rowB) => {
      const changeA = (rowA.original.quantity || 0) * (rowA.original.changeAmount || 0)
      const changeB = (rowB.original.quantity || 0) * (rowB.original.changeAmount || 0)
      return changeA - changeB
    },
    enableSorting: true,
    meta: {
      className: "text-right min-w-40",
      displayName: "Market Value Day Change",
    },
  },
  {
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 font-medium hover:text-gray-900 dark:hover:text-gray-50"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Institution
          {column.getIsSorted() === "asc" && (
            <RiArrowUpSLine className="h-4 w-4" />
          )}
          {column.getIsSorted() === "desc" && (
            <RiArrowDownSLine className="h-4 w-4" />
          )}
        </button>
      )
    },
    id: "institution",
    accessorFn: (row) => {
      const account = accounts.find((a) => a.id === row.accountId)
      return account?.institution || "Unknown"
    },
    cell: ({ row }) => {
      if (row.original.isGroup) {
        return <span className="text-gray-400">Multiple</span>
      }
      const account = accounts.find((a) => a.id === row.original.accountId)
      const institution = account?.institution
      if (!institution) {
        return <span className="text-gray-400">Unknown</span>
      }
      return (
        <div className="flex items-center gap-2">
          <InstitutionLogo institution={institution} className="size-5" />
          <span>{institutionLabels[institution] || institution}</span>
        </div>
      )
    },
    enableSorting: true,
    meta: {
      className: "text-left min-w-40",
      displayName: "Institution",
    },
  },
  {
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 font-medium hover:text-gray-900 dark:hover:text-gray-50"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Account
          {column.getIsSorted() === "asc" && (
            <RiArrowUpSLine className="h-4 w-4" />
          )}
          {column.getIsSorted() === "desc" && (
            <RiArrowDownSLine className="h-4 w-4" />
          )}
        </button>
      )
    },
    accessorKey: "accountName",
    cell: ({ row }) => {
      if (row.original.isGroup) {
        return <span className="text-gray-400">Multiple</span>
      }
      return <span>{row.original.accountName}</span>
    },
    enableSorting: true,
    meta: {
      className: "text-left min-w-40",
      displayName: "Account",
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
      displayName: "Actions",
    },
  },
]
