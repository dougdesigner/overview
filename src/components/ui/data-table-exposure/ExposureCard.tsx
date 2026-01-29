"use client"

import { Badge } from "@/components/Badge"
import { Card } from "@/components/Card"
import { InstitutionLogo } from "@/components/ui/InstitutionLogo"
import { TickerLogo } from "@/components/ui/TickerLogo"
import { institutionLabels } from "@/lib/institutionUtils"
import { toProperCase } from "@/lib/utils"
import { Icon } from "@iconify/react"
import React from "react"
import { Account, ExposureDisplayValue, StockExposure } from "./types"

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

interface ExposureCardProps {
  exposure: StockExposure
  accounts: Account[]
  displayValue: ExposureDisplayValue
  totalStocksValue: number
  isExpanded?: boolean
  onToggleExpand?: () => void
}

export function ExposureCard({
  exposure,
  accounts,
  displayValue,
  totalStocksValue,
  isExpanded = false,
  onToggleExpand,
}: ExposureCardProps) {
  const ticker = exposure.ticker
  const hasSubRows = exposure.subRows && exposure.subRows.length > 0

  // Calculate stock percentage
  const stockPercent =
    totalStocksValue > 0 ? (exposure.totalValue / totalStocksValue) * 100 : 0

  // Get the primary display value
  const getPrimaryValue = () => {
    switch (displayValue) {
      case "market-value":
        return formatCurrencyCompact(exposure.totalValue)
      case "pct-stocks":
        return formatPercentage(stockPercent)
      case "pct-portfolio":
      default:
        return formatPercentage(exposure.percentOfPortfolio)
    }
  }

  // Get secondary display info
  const getSecondaryValue = () => {
    switch (displayValue) {
      case "market-value":
        return formatPercentage(exposure.percentOfPortfolio)
      case "pct-stocks":
        return formatCurrencyCompact(exposure.totalValue)
      case "pct-portfolio":
      default:
        return formatCurrencyCompact(exposure.totalValue)
    }
  }

  return (
    <Card className="p-4">
      {/* Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {/* Expand button for groups */}
          {hasSubRows && onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="-ml-1 shrink-0 p-1"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              <Icon
                icon={isExpanded ? "carbon:chevron-down" : "carbon:chevron-right"}
                className="size-4 text-gray-500"
              />
            </button>
          )}

          {/* Logo */}
          <TickerLogo
            ticker={ticker}
            type="stock"
            className="size-10 shrink-0"
            domain={exposure.domain}
            companyName={exposure.name}
          />

          {/* Ticker and Name */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="flat" className="shrink-0 font-semibold">
                {ticker}
              </Badge>
              {exposure.sector && (
                <Badge variant="flat" className="hidden text-xs sm:inline-flex">
                  {toProperCase(exposure.sector)}
                </Badge>
              )}
            </div>
            <p className="mt-0.5 truncate text-sm text-gray-600 dark:text-gray-400">
              {exposure.name}
            </p>
          </div>
        </div>

        {/* Value and Percentage */}
        <div className="shrink-0 text-right">
          <p className="text-base font-semibold text-gray-900 dark:text-gray-50">
            {getPrimaryValue()}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {getSecondaryValue()}
          </p>
        </div>
      </div>

      {/* Details Section */}
      <div className="mt-3 space-y-2 border-t border-gray-100 pt-3 dark:border-gray-800">
        {/* Direct vs ETF breakdown */}
        {(exposure.directValue > 0 || exposure.etfValue > 0) && (
          <>
            {exposure.directValue > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  Direct Holdings
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-50">
                  {formatNumber(exposure.directShares)} shares (
                  {formatCurrencyCompact(exposure.directValue)})
                </span>
              </div>
            )}
            {exposure.etfValue > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  Via ETFs
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-50">
                  {formatNumber(exposure.etfExposure)} shares (
                  {formatCurrencyCompact(exposure.etfValue)})
                </span>
              </div>
            )}
          </>
        )}

        {/* Industry */}
        {exposure.industry && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Industry</span>
            <span className="text-gray-700 dark:text-gray-300">
              {toProperCase(exposure.industry)}
            </span>
          </div>
        )}

        {/* ETF Sources summary */}
        {exposure.exposureSources && exposure.exposureSources.length > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">ETF Sources</span>
            <span className="text-gray-700 dark:text-gray-300">
              {exposure.exposureSources
                .slice(0, 3)
                .map((s) => s.etfSymbol)
                .join(", ")}
              {exposure.exposureSources.length > 3 &&
                ` +${exposure.exposureSources.length - 3} more`}
            </span>
          </div>
        )}
      </div>

      {/* Sub-rows for ETF breakdown */}
      {isExpanded && hasSubRows && (
        <div className="mt-3 space-y-2 border-t border-gray-100 pt-3 dark:border-gray-800">
          {exposure.subRows?.map((subRow) => {
            const account = subRow.accountId
              ? accounts.find((a) => a.id === subRow.accountId)
              : null
            const institution = account?.institution
            const isDirectHolding = subRow.id?.includes("-direct")

            return (
              <div
                key={subRow.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-900/50"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  {/* Show ticker logo for ETF sources */}
                  <TickerLogo
                    ticker={isDirectHolding ? ticker : subRow.ticker}
                    type={isDirectHolding ? "stock" : "etf"}
                    className="size-6"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-50">
                      {isDirectHolding ? "Direct Holding" : subRow.ticker}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      {institution && (
                        <>
                          <InstitutionLogo
                            institution={institution}
                            className="size-3"
                          />
                          <span>
                            {institutionLabels[institution] || institution}
                          </span>
                          <span>·</span>
                        </>
                      )}
                      <span>{subRow.accountName || "Unknown"}</span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                    {formatCurrencyCompact(subRow.totalValue)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatNumber(subRow.totalShares)} shares
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
