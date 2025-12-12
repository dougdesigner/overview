"use client"

import { Card } from "@/components/Card"
import { cx } from "@/lib/utils"
import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"
import React, { useEffect, useMemo, useState } from "react"

// Hex colors matching Tailwind chart colors
const CHART_HEX_COLORS: Record<string, string> = {
  blue: "#3b82f6",
  cyan: "#06b6d4",
  amber: "#f59e0b",
  emerald: "#10b981",
  gray: "#6b7280",
  violet: "#8b5cf6",
  rose: "#f43f5e",
  orange: "#fb923c",
}

export interface AssetClassItem {
  name: string
  percentage: number
  color: string
  bgColorClass: string
}

export interface PortfolioValueCardHighchartsProps {
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
    bgColorClass: "bg-blue-500",
  },
  {
    name: "Non-U.S. Stocks",
    percentage: 30.6,
    color: "cyan",
    bgColorClass: "bg-cyan-500",
  },
  {
    name: "Fixed Income",
    percentage: 20.9,
    color: "amber",
    bgColorClass: "bg-amber-500",
  },
  {
    name: "Cash",
    percentage: 14.1,
    color: "emerald",
    bgColorClass: "bg-emerald-500",
  },
  {
    name: "Other",
    percentage: 0,
    color: "gray",
    bgColorClass: "bg-gray-500",
  },
]

const PortfolioValueCardHighcharts = React.forwardRef<
  HTMLDivElement,
  PortfolioValueCardHighchartsProps
>(
  (
    {
      title = "Portfolio value",
      value = 247468,
      accountCount = 5,
      holdingsCount = 6,
      assetClasses,
      className,
      ...props
    },
    forwardedRef,
  ) => {
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
      setIsClient(true)
    }, [])

    const classes = assetClasses || getDefaultAssetClasses()

    const valueFormatter = (number: number) => {
      const decimals = number % 1 === 0 ? 0 : 2
      return (
        "$" +
        Intl.NumberFormat("us", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
          .format(number)
          .toString()
      )
    }

    // Format percentage: show integers without decimals, non-integers with up to 2 decimal places
    const formatPercentage = (value: number): string => {
      if (
        Number.isInteger(value) ||
        Math.abs(value - Math.round(value)) < 0.0001
      ) {
        return Math.round(value).toString()
      }
      return value.toFixed(2).replace(/\.?0+$/, "")
    }

    // Build Highcharts options
    const chartOptions: Highcharts.Options = useMemo(() => {
      // Filter out zero-percentage items and create series data
      const nonZeroClasses = classes.filter((item) => item.percentage > 0)

      return {
        chart: {
          type: "bar",
          height: 8,
          backgroundColor: "transparent",
          spacing: [0, 0, 0, 0],
          margin: [0, 0, 0, 0],
          animation: {
            duration: 1000,
          },
        },
        title: {
          text: undefined,
        },
        xAxis: {
          visible: false,
          categories: [""],
        },
        yAxis: {
          visible: false,
          min: 0,
          max: 100,
        },
        legend: {
          enabled: false,
        },
        tooltip: {
          enabled: false,
        },
        credits: {
          enabled: false,
        },
        plotOptions: {
          bar: {
            stacking: "normal",
            borderRadius: 0,
            pointPadding: 0,
            groupPadding: 0,
            borderWidth: 0,
            pointWidth: 8,
          },
          series: {
            animation: {
              duration: 1000,
              easing: "easeOutQuart",
            },
          },
        },
        series: nonZeroClasses.map((item, index) => ({
          type: "bar" as const,
          name: item.name,
          data: [item.percentage],
          color: CHART_HEX_COLORS[item.color] || CHART_HEX_COLORS.gray,
          // Add border radius to first and last segments
          borderRadiusTopLeft:
            index === 0 ? 4 : 0,
          borderRadiusBottomLeft:
            index === 0 ? 4 : 0,
          borderRadiusTopRight:
            index === nonZeroClasses.length - 1 ? 4 : 0,
          borderRadiusBottomRight:
            index === nonZeroClasses.length - 1 ? 4 : 0,
        })),
      }
    }, [classes])

    return (
      <Card ref={forwardedRef} className={cx(className)} {...props}>
        <dt className="text-base font-medium text-gray-900 dark:text-gray-50">
          {title}
        </dt>
        <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-50">
          {valueFormatter(value)}
        </dd>
        <div className="mt-1 text-sm font-normal text-gray-500 dark:text-gray-400">
          {accountCount} {accountCount === 1 ? "account" : "accounts"} ·{" "}
          {holdingsCount} {holdingsCount === 1 ? "holding" : "holdings"}
        </div>

        {/* Highcharts stacked bar */}
        <div className="mt-6 overflow-hidden rounded-full">
          {isClient ? (
            <HighchartsReact
              highcharts={Highcharts}
              options={chartOptions}
              containerProps={{
                style: { height: "8px", width: "100%" },
              }}
            />
          ) : (
            // Placeholder during SSR
            <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-800" />
          )}
        </div>

        <ul
          role="list"
          className="mt-4 flex flex-wrap gap-x-10 gap-y-4 text-sm"
        >
          {classes.map((item) => (
            <li key={item.name}>
              <span className="text-base font-semibold text-gray-900 dark:text-gray-50">
                {formatPercentage(item.percentage)}%
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={cx(
                    "size-2.5 shrink-0 rounded-sm",
                    item.bgColorClass,
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
  },
)

PortfolioValueCardHighcharts.displayName = "PortfolioValueCardHighcharts"

export { PortfolioValueCardHighcharts }
export default PortfolioValueCardHighcharts
