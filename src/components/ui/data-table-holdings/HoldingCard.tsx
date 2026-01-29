"use client"

import { Badge } from "@/components/Badge"
import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/DropdownMenu"
import { InstitutionLogo } from "@/components/ui/InstitutionLogo"
import { TickerLogo } from "@/components/ui/TickerLogo"
import { institutionLabels } from "@/lib/institutionUtils"
import { getKnownStockName } from "@/lib/knownETFNames"
import { cx } from "@/lib/utils"
import { Icon } from "@iconify/react"
import React from "react"
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

// Format currency compact (no decimals)
const formatCurrencyCompact = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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

interface HoldingCardProps {
  holding: Holding
  accounts: Account[]
  onEdit: (holding: Holding) => void
  onDelete: (holdingId: string) => void
  onToggleIgnored: (holdingId: string) => void
  isExpanded?: boolean
  onToggleExpand?: () => void
}

export function HoldingCard({
  holding,
  accounts,
  onEdit,
  onDelete,
  onToggleIgnored,
  isExpanded = false,
  onToggleExpand,
}: HoldingCardProps) {
  const ticker = holding.ticker
  const type = holding.type
  const isGroup = holding.isGroup
  const isIgnored = holding.isIgnored
  const hasSubRows = holding.subRows && holding.subRows.length > 0

  // Get display name (canonical name if available)
  const canonicalName = ticker ? getKnownStockName(ticker) : null
  const displayName = canonicalName || holding.name

  // Get account info
  const account = accounts.find((a) => a.id === holding.accountId)
  const institution = account?.institution

  // Calculate day change if available
  const changePercent = holding.changePercent
  const changeAmount = holding.changeAmount
  const marketValueChange =
    changeAmount !== undefined && holding.quantity !== undefined
      ? holding.quantity * changeAmount
      : undefined

  return (
    <Card
      className={cx(
        "p-4",
        isIgnored && "opacity-60",
      )}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Expand button for groups */}
          {hasSubRows && onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="shrink-0 p-1 -ml-1"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              <Icon
                icon={isExpanded ? "carbon:chevron-down" : "carbon:chevron-right"}
                className="size-4 text-gray-500"
              />
            </button>
          )}

          {/* Logo */}
          {ticker ? (
            <TickerLogo
              ticker={ticker}
              type={type === "fund" ? "etf" : type === "stock" ? "stock" : undefined}
              className="size-10 shrink-0"
              domain={holding.domain}
              companyName={holding.name}
            />
          ) : (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <Icon icon="carbon:currency-dollar" className="size-5 text-gray-500" />
            </div>
          )}

          {/* Ticker and Name */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {ticker && (
                <Badge variant="flat" className="font-semibold shrink-0">
                  {ticker}
                </Badge>
              )}
              {isIgnored && (
                <Badge variant="warning" className="text-xs shrink-0">
                  Excluded
                </Badge>
              )}
            </div>
            <p
              className={cx(
                "mt-0.5 truncate text-sm text-gray-600 dark:text-gray-400",
                isIgnored && "line-through",
              )}
            >
              {displayName}
            </p>
          </div>
        </div>

        {/* Value and Allocation */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <p className="text-base font-semibold text-gray-900 dark:text-gray-50">
              {type !== "cash" && (!holding.marketValue || holding.marketValue === 0)
                ? "—"
                : formatCurrencyCompact(holding.marketValue)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatPercentage(holding.allocation)}
            </p>
          </div>

          {/* Actions Menu */}
          {!isGroup && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 shrink-0">
                  <Icon icon="carbon:overflow-menu-vertical" className="size-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(holding)}>
                  <Icon icon="carbon:edit" className="mr-2 size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleIgnored(holding.id)}>
                  <Icon
                    icon={isIgnored ? "carbon:view" : "carbon:view-off"}
                    className="mr-2 size-4"
                  />
                  {isIgnored ? "Include in Calculations" : "Exclude from Calculations"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(holding.id)}
                  className="text-red-600 dark:text-red-400"
                >
                  <Icon icon="carbon:trash-can" className="mr-2 size-4" />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Details Section */}
      <div className="mt-3 space-y-2 border-t border-gray-100 pt-3 dark:border-gray-800">
        {/* Quantity and Price */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            {type === "cash" ? "Amount" : "Shares"}
          </span>
          <span className="font-medium text-gray-900 dark:text-gray-50">
            {type === "cash"
              ? formatNumber(holding.marketValue)
              : formatNumber(holding.quantity)}{" "}
            {type !== "cash" && (
              <span className="text-gray-500 dark:text-gray-400">
                @ {holding.lastPrice && holding.lastPrice > 0
                  ? formatCurrency(holding.lastPrice)
                  : "—"}
              </span>
            )}
          </span>
        </div>

        {/* Day Change */}
        {type !== "cash" && changePercent !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Day Change</span>
            <div className="flex items-center gap-2">
              <span
                className={cx(
                  "font-medium",
                  changePercent >= 0
                    ? "text-green-600 dark:text-green-500"
                    : "text-red-600 dark:text-red-500",
                )}
              >
                {changePercent >= 0 && "+"}
                {formatPercentage(changePercent)}
              </span>
              {marketValueChange !== undefined && (
                <span
                  className={cx(
                    "font-medium",
                    marketValueChange >= 0
                      ? "text-green-600 dark:text-green-500"
                      : "text-red-600 dark:text-red-500",
                  )}
                >
                  ({marketValueChange >= 0 && "+"}
                  {formatCurrencyCompact(Math.abs(marketValueChange))})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Account Info */}
        {!isGroup && institution && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Account</span>
            <div className="flex items-center gap-2">
              <InstitutionLogo institution={institution} className="size-4" />
              <span className="text-gray-700 dark:text-gray-300">
                {institutionLabels[institution] || institution}
                {account?.name && (
                  <span className="text-gray-500 dark:text-gray-400">
                    {" - "}
                    {account.name}
                  </span>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Group indicator */}
        {isGroup && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Accounts</span>
            <span className="text-gray-700 dark:text-gray-300">
              {holding.subRows?.length || 0} accounts
            </span>
          </div>
        )}
      </div>

      {/* Sub-rows for grouped holdings */}
      {isExpanded && hasSubRows && (
        <div className="mt-3 space-y-2 border-t border-gray-100 pt-3 dark:border-gray-800">
          {holding.subRows?.map((subHolding) => {
            const subAccount = accounts.find((a) => a.id === subHolding.accountId)
            const subInstitution = subAccount?.institution
            return (
              <div
                key={subHolding.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-900/50"
              >
                <div className="flex items-center gap-2">
                  {subInstitution && (
                    <InstitutionLogo institution={subInstitution} className="size-5" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                      {subHolding.accountName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatNumber(subHolding.quantity)} shares
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                    {formatCurrencyCompact(subHolding.marketValue)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatPercentage(subHolding.allocation)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
