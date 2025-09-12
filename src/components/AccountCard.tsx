"use client"

import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { CategoryBar } from "@/components/CategoryBar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/DropdownMenu"
import { RiDeleteBinLine, RiEditLine, RiMore2Fill } from "@remixicon/react"

interface AccountCardProps {
  // Account identification
  name?: string
  accountType:
    | "Traditional 401(k)"
    | "Roth IRA"
    | "Personal Investment"
    | "Checking"
    | "Savings"
  institution:
    | "Fidelity Investments"
    | "Chase"
    | "American Express"
    | "Wealthfront"
    | "Vanguard"

  // Financial data
  totalValue: number
  holdingsCount: number

  // Asset allocation (percentages that should sum to 100)
  assetAllocation: {
    usStocks: number
    nonUsStocks: number
    fixedIncome: number
    cash: number
  }

  // Action handlers
  onEdit?: () => void
  onDelete?: () => void
}

export default function AccountCard({
  name,
  accountType,
  institution,
  totalValue,
  holdingsCount,
  assetAllocation,
  onEdit,
  onDelete,
}: AccountCardProps) {
  // Default name to account type if no custom name provided
  const displayName = name || accountType

  // Get institution brand color
  const getInstitutionBrandColor = (institution: string): string => {
    const brandColors: Record<string, string> = {
      "Fidelity Investments": "bg-emerald-600",
      Chase: "bg-blue-600",
      Vanguard: "bg-red-600",
      Wealthfront: "bg-purple-600",
      "American Express": "bg-blue-700",
    }
    return brandColors[institution] || "bg-gray-500"
  }

  // Get institution initials for logo
  const getInstitutionInitials = (institution: string): string => {
    const words = institution.split(" ")
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase()
    }
    return words
      .map((word) => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()
  }

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Asset allocation values for CategoryBar
  const allocationValues = [
    assetAllocation.usStocks,
    assetAllocation.nonUsStocks,
    assetAllocation.fixedIncome,
    assetAllocation.cash,
  ]

  // Asset allocation labels for tooltips
  const allocationLabels = [
    "U.S. Stocks",
    "Non-U.S. Stocks",
    "Fixed Income",
    "Cash",
  ]

  return (
    <Card className="relative">
      {/* Header with logo, account info, actions, and financial data */}
      <div className="flex items-start gap-3">
        {/* Institution logo */}
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${getInstitutionBrandColor(institution)}`}
        >
          {getInstitutionInitials(institution)}
        </div>

        {/* Account identification */}
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-medium text-gray-900 dark:text-gray-50">
            {displayName}
          </h3>
          <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
            {institution}
          </p>
        </div>

        {/* More actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <RiMore2Fill className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <RiEditLine className="mr-2 h-4 w-4" />
              Edit Account
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              className="text-red-600 dark:text-red-400"
            >
              <RiDeleteBinLine className="mr-2 h-4 w-4" />
              Delete Account
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Financial data */}
        <div className="text-right">
          <div className="text-base font-medium text-gray-900 dark:text-gray-50">
            {formatCurrency(totalValue)}
          </div>
          <div className="text-sm font-normal text-gray-500 dark:text-gray-400">
            {holdingsCount} {holdingsCount === 1 ? "holding" : "holdings"}
          </div>
        </div>
      </div>

      {/* Asset allocation visualization - only show if there's data */}
      {allocationValues.some(value => value > 0) && (
        <div className="mt-4">
          <CategoryBar
            values={allocationValues}
            colors={["blue", "cyan", "amber", "emerald"]}
            showLabels={false}
            segmentLabels={allocationLabels}
          />
        </div>
      )}
    </Card>
  )
}
