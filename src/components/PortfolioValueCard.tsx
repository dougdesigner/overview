"use client"

import { Card } from "@/components/Card"
import { CategoryBar } from "@/components/CategoryBar"
import { AvailableChartColorsKeys } from "@/lib/chartUtils"
import { cx } from "@/lib/utils"
import React from "react"

export interface AssetClassItem {
  name: string
  percentage: number
  color: AvailableChartColorsKeys
  bgColorClass: string
}

export interface PortfolioValueCardProps {
  title?: string
  value?: number
  accountCount?: number
  holdingsCount?: number
  assetClasses?: AssetClassItem[]
  className?: string
}

// Default asset class distribution
const getDefaultAssetClasses = (): AssetClassItem[] => [
  {
    name: "U.S. Stocks",
    percentage: 34.4,
    color: "blue",
    bgColorClass: "bg-blue-600 dark:bg-blue-500",
  },
  {
    name: "Non-U.S. Stocks",
    percentage: 30.6,
    color: "cyan",
    bgColorClass: "bg-cyan-600 dark:bg-cyan-500",
  },
  {
    name: "Fixed Income",
    percentage: 20.9,
    color: "amber",
    bgColorClass: "bg-amber-600 dark:bg-amber-500",
  },
  {
    name: "Cash",
    percentage: 14.1,
    color: "emerald",
    bgColorClass: "bg-emerald-600 dark:bg-emerald-500",
  },
  {
    name: "Other",
    percentage: 0,
    color: "gray",
    bgColorClass: "bg-gray-400 dark:bg-gray-600",
  },
]

const PortfolioValueCard = React.forwardRef<HTMLDivElement, PortfolioValueCardProps>(
  (
    {
      title = "Portfolio Value",
      value = 247468,
      accountCount = 5,
      holdingsCount = 6,
      assetClasses,
      className,
      ...props
    },
    forwardedRef
  ) => {
    const classes = assetClasses || getDefaultAssetClasses()
    const valueFormatter = (number: number) => {
      return "$" + Intl.NumberFormat("us").format(number).toString()
    }

    // Extract percentages and colors for CategoryBar
    const percentages = classes.slice(0, 4).map(item => item.percentage) // Exclude "Other" if 0%
    const colors = classes.slice(0, 4).map(item => item.color)

    return (
      <Card ref={forwardedRef} className={cx(className)} {...props}>
        <dt className="text-base font-medium text-gray-900 dark:text-gray-50">
          {title}
        </dt>
        <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-50">
          {valueFormatter(value)}
        </dd>
        <div className="mt-1 text-sm font-normal text-gray-500 dark:text-gray-400">
          {accountCount} {accountCount === 1 ? "account" : "accounts"} · {holdingsCount} {holdingsCount === 1 ? "holding" : "holdings"}
        </div>
        <CategoryBar
          values={percentages}
          className="mt-6"
          colors={colors}
          showLabels={false}
        />
        <ul
          role="list"
          className="mt-4 flex flex-wrap gap-x-10 gap-y-4 text-sm"
        >
          {classes.map((item) => (
            <li key={item.name}>
              <span className="text-base font-semibold text-gray-900 dark:text-gray-50">
                {item.percentage}%
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={cx(
                    "size-2.5 shrink-0 rounded-sm",
                    item.bgColorClass
                  )}
                  aria-hidden="true"
                />
                <span className="text-sm">{item.name}</span>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    )
  }
)

PortfolioValueCard.displayName = "PortfolioValueCard"

export { PortfolioValueCard }
export default PortfolioValueCard