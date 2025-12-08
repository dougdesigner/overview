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
import {
  getInstitutionBrandColor,
  getInstitutionInitials,
  institutionLabels,
} from "@/lib/institutionUtils"
import { getInstitutionLogoUrl } from "@/lib/logoUtils"
import { cx } from "@/lib/utils"
import { RiDeleteBinLine, RiEditLine, RiMore2Fill } from "@remixicon/react"
import Image from "next/image"
import { useState } from "react"

interface AccountCardProps {
  // Account identification
  name?: string
  accountType:
    | "Traditional 401(k)"
    | "Roth IRA"
    | "Personal Investment"
    | "Checking"
    | "Savings"
  institution: string

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

  // Portfolio allocation percentage (0-100)
  allocation?: number

  // Action handlers
  onEdit?: () => void
  onDelete?: () => void
  onClick?: () => void
}

export default function AccountCard({
  name,
  accountType,
  institution,
  totalValue,
  holdingsCount,
  assetAllocation,
  allocation,
  onEdit,
  onDelete,
  onClick,
}: AccountCardProps) {
  // Logo loading state
  const [logoError, setLogoError] = useState(false)

  // Default name to account type if no custom name provided
  const displayName = name || accountType

  // Get logo URL and display label from institution key
  const logoUrl = getInstitutionLogoUrl(institution)
  const institutionLabel = institutionLabels[institution] || institution

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
    <Card
      className={cx(
        "relative",
        onClick &&
          "cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/50",
      )}
      onClick={onClick}
    >
      {/* Header with logo, account info, actions, and financial data */}
      <div className="flex items-start gap-3">
        {/* Institution logo */}
        {logoUrl && !logoError ? (
          <Image
            src={logoUrl}
            alt={institutionLabel}
            width={80}
            height={80}
            className="size-9 rounded-full bg-white object-cover"
            onError={() => setLogoError(true)}
          />
        ) : (
          <div
            className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${getInstitutionBrandColor(institution)}`}
          >
            {getInstitutionInitials(institutionLabel)}
          </div>
        )}

        {/* Account identification */}
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-medium text-gray-900 dark:text-gray-50">
            {displayName}
          </h3>
          <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
            {institutionLabel}
          </p>
        </div>

        {/* Financial data */}
        <div className="text-right">
          <div className="flex items-center justify-end gap-2">
            <span className="text-base font-medium text-gray-900 dark:text-gray-50">
              {formatCurrency(totalValue)}
            </span>
            {allocation !== undefined && (
              <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-sm font-medium tabular-nums text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {allocation.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="text-sm font-normal text-gray-500 dark:text-gray-400">
            {holdingsCount} {holdingsCount === 1 ? "holding" : "holdings"}
          </div>
        </div>

        {/* More actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <RiMore2Fill className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onEdit?.()
              }}
            >
              <RiEditLine className="mr-2 h-4 w-4" />
              Edit Account
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.()
              }}
              className="text-red-600 dark:text-red-400"
            >
              <RiDeleteBinLine className="mr-2 h-4 w-4" />
              Delete Account
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Asset allocation visualization - only show if there's data */}
      {allocationValues.some((value) => value > 0) && (
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
