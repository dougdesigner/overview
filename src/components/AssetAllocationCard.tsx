"use client"

import { Badge } from "@/components/Badge"
import { Card } from "@/components/Card"
import { HighchartsDonutChart } from "@/components/HighchartsDonutChartWrapper"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Tabs"
import { InstitutionLogo } from "@/components/ui/InstitutionLogo"
import { TickerLogo } from "@/components/ui/TickerLogo"
import { AvailableChartColorsKeys } from "@/lib/chartUtils"
import { cx } from "@/lib/utils"
import React from "react"

export interface AssetAllocationItem {
  name: string
  amount: number
  share: string
  borderColor: string
  institution?: string // For accounts tab
  type?: "stock" | "fund" | "cash" | "other" // For holdings tab to determine logo display
  ticker?: string // Optional ticker symbol (may differ from name)
}

export interface AssetAllocationData {
  name: string
  data: AssetAllocationItem[]
  colors: AvailableChartColorsKeys[]
}

interface AssetAllocationCardProps {
  title?: string
  description?: string
  data?: AssetAllocationData[]
  defaultTab?: string
  className?: string
  sectionId?: string
}

// Default data - same as original overview page
const getDefaultData = (): AssetAllocationData[] => {
  const dataByAssets: AssetAllocationItem[] = [
    {
      name: "VOO",
      amount: 79681,
      share: "32.2%",
      borderColor: "border-blue-500 dark:border-blue-500",
    },
    {
      name: "AAPL",
      amount: 14240,
      share: "5.8%",
      borderColor: "border-gray-500 dark:border-gray-500",
    },
    {
      name: "MSFT",
      amount: 11356,
      share: "4.6%",
      borderColor: "border-cyan-500 dark:border-cyan-500",
    },
    {
      name: "BND",
      amount: 14436,
      share: "5.8%",
      borderColor: "border-amber-500 dark:border-amber-500",
    },
    {
      name: "Cash",
      amount: 67000,
      share: "27.1%",
      borderColor: "border-emerald-500 dark:border-emerald-500",
    },
    {
      name: "Others",
      amount: 60755,
      share: "24.5%",
      borderColor: "border-violet-500 dark:border-violet-500",
    },
  ]

  const dataByAssetClass: AssetAllocationItem[] = [
    {
      name: "U.S. Stocks",
      amount: 85129,
      share: "34.4%",
      borderColor: "border-blue-500 dark:border-blue-500",
    },
    {
      name: "Non-U.S. Stocks",
      amount: 75725,
      share: "30.6%",
      borderColor: "border-cyan-500 dark:border-cyan-500",
    },
    {
      name: "Fixed Income",
      amount: 51721,
      share: "20.9%",
      borderColor: "border-amber-500 dark:border-amber-500",
    },
    {
      name: "Cash",
      amount: 34893,
      share: "14.1%",
      borderColor: "border-emerald-500 dark:border-emerald-500",
    },
  ]

  const dataByAccount: AssetAllocationItem[] = [
    {
      name: "401(k)",
      amount: 98987,
      share: "40.0%",
      borderColor: "border-violet-500 dark:border-violet-500",
      institution: "fidelity",
    },
    {
      name: "Personal Investment",
      amount: 74240,
      share: "30.0%",
      borderColor: "border-fuchsia-500 dark:border-fuchsia-500",
      institution: "wealthfront",
    },
    {
      name: "Roth IRA",
      amount: 49494,
      share: "20.0%",
      borderColor: "border-pink-500 dark:border-pink-500",
      institution: "vanguard",
    },
    {
      name: "Savings",
      amount: 17224,
      share: "7.0%",
      borderColor: "border-sky-500 dark:border-sky-500",
      institution: "chase",
    },
    {
      name: "Checking",
      amount: 7423,
      share: "3.0%",
      borderColor: "border-lime-500 dark:border-lime-500",
      institution: "chase",
    },
  ]

  const dataBySectors: AssetAllocationItem[] = [
    {
      name: "Technology",
      amount: 74240,
      share: "30.0%",
      borderColor: "border-blue-500 dark:border-blue-500",
    },
    {
      name: "Healthcare",
      amount: 49494,
      share: "20.0%",
      borderColor: "border-red-500 dark:border-red-500",
    },
    {
      name: "Financial",
      amount: 37195,
      share: "15.0%",
      borderColor: "border-green-500 dark:border-green-500",
    },
    {
      name: "Consumer",
      amount: 29756,
      share: "12.0%",
      borderColor: "border-violet-500 dark:border-violet-500",
    },
    {
      name: "Energy",
      amount: 19797,
      share: "8.0%",
      borderColor: "border-orange-500 dark:border-orange-500",
    },
    {
      name: "Others",
      amount: 36986,
      share: "15.0%",
      borderColor: "border-gray-500 dark:border-gray-500",
    },
  ]

  return [
    {
      name: "Holdings",
      data: dataByAssets,
      colors: [
        "blue",
        "gray",
        "cyan",
        "amber",
        "emerald",
        "violet",
      ] as AvailableChartColorsKeys[],
    },
    {
      name: "Asset Classes",
      data: dataByAssetClass,
      colors: [
        "blue",
        "cyan",
        "amber",
        "emerald",
      ] as AvailableChartColorsKeys[],
    },
    {
      name: "Accounts",
      data: dataByAccount,
      colors: [
        "violet",
        "fuchsia",
        "pink",
        "sky",
        "lime",
      ] as AvailableChartColorsKeys[],
    },
    {
      name: "Sectors",
      data: dataBySectors,
      colors: [
        "blue",
        "red",
        "emerald",
        "violet",
        "amber",
        "gray",
      ] as AvailableChartColorsKeys[],
    },
  ]
}

const AssetAllocationCard = React.forwardRef<
  HTMLDivElement,
  AssetAllocationCardProps
>(
  (
    {
      title = "Portfolio distribution",
      description = "Distribution across assets, classes, accounts, and sectors",
      data,
      defaultTab,
      className,
      sectionId = "portfolio-distribution-section",
      ...props
    },
    forwardedRef,
  ) => {
    const allocationData = data || getDefaultData()
    // Find first tab with data, or use the provided defaultTab
    const firstTabWithData = allocationData.find(category => category.data.length > 0)?.name
    const defaultTabValue = defaultTab || firstTabWithData || allocationData[0]?.name

    const currencyFormatter = (number: number) => {
      const decimals = number % 1 === 0 ? 0 : 2
      return "$" + Intl.NumberFormat("us", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(number).toString()
    }

    // Calculate total value once (same for all tabs)
    const totalValue = React.useMemo(() => {
      if (allocationData.length > 0) {
        return allocationData[0].data.reduce(
          (sum, item) => sum + item.amount,
          0,
        )
      }
      return 0
    }, [allocationData])

    return (
      <Card
        ref={forwardedRef}
        id={sectionId}
        className={cx("overflow-hidden p-0", className)}
        {...props}
      >
        <div className="px-6 pt-6">
          <h3
            className="cursor-pointer text-base font-medium text-gray-900 transition-colors hover:text-blue-600 dark:text-gray-50 dark:hover:text-blue-400"
            onClick={() => {
              document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" })
            }}
          >
            {title}
          </h3>
          <p className="mt-1 text-sm/6 text-gray-500 dark:text-gray-500">
            {description}
          </p>
        </div>
        <Tabs defaultValue={defaultTabValue}>
          <TabsList className="px-6 pt-6">
            {allocationData.filter(category => category.data.length > 0).map((category) => (
              <TabsTrigger key={category.name} value={category.name}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="px-6 pb-6">
            {allocationData.map((category) => (
              <TabsContent key={category.name} value={category.name}>
                <div className="mx-auto mt-8" style={{ height: 280 }}>
                  {/* HighchartsDonutChart */}
                  <HighchartsDonutChart
                    data={category.data}
                    totalValue={totalValue}
                    valueFormatter={currencyFormatter}
                    colors={category.colors}
                    height={280}
                    useAssetClassColors={category.name === "Asset Classes"}
                  />
                </div>
                {category.data.length > 0 && (
                  <>
                    <p className="mt-8 flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                      <span>Category</span>
                      <span>Value / Allocation</span>
                    </p>
                    <ul
                      role="list"
                      className="mt-2 divide-y divide-gray-200 text-sm text-gray-500 dark:divide-gray-800 dark:text-gray-500"
                    >
                      {category.data.map((item, index) => (
                    <li
                      key={`${item.name}-${index}`}
                      className="py-3"
                    >
                      <div className="flex items-center justify-between space-x-6">
                        <div className="flex items-center space-x-2.5 truncate">
                          {category.name === "Holdings" &&
                          item.type !== "cash" && item.type !== "other" ? (
                            // Special styling for stock/fund tickers in Holdings tab
                            <>
                              {/* Legend color indicator (matches donut chart) */}
                              <span
                                className={cx(
                                  item.borderColor.replace(/border/g, "bg"),
                                  "size-2.5 shrink-0 rounded-sm",
                                )}
                                aria-hidden="true"
                              />
                              {/* Ticker logo */}
                              <TickerLogo
                                ticker={item.ticker || item.name}
                                type={item.type === "fund" ? "etf" : "stock"}
                                className="size-6"
                              />
                              {/* Ticker symbol badge */}
                              <Badge variant="flat" className="font-semibold">
                                {item.name}
                              </Badge>
                            </>
                          ) : category.name === "Accounts" && item.institution ? (
                            // Special styling for accounts with institution logos
                            <>
                              {/* Legend color indicator (matches donut chart) */}
                              <span
                                className={cx(
                                  item.borderColor.replace(/border/g, "bg"),
                                  "size-2.5 shrink-0 rounded-sm",
                                )}
                                aria-hidden="true"
                              />
                              {/* Institution logo */}
                              <InstitutionLogo
                                institution={item.institution}
                                className="size-6"
                              />
                              {/* Account name */}
                              <span className="truncate dark:text-gray-300">
                                {item.name}
                              </span>
                            </>
                          ) : (
                            // Default styling for other items
                            <>
                              <span
                                className={cx(
                                  item.borderColor.replace(/border/g, "bg"),
                                  "size-2.5 shrink-0 rounded-sm",
                                )}
                                aria-hidden="true"
                              />
                              <span className="truncate dark:text-gray-300">
                                {item.name}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium tabular-nums text-gray-900 dark:text-gray-50">
                            {currencyFormatter(item.amount)}
                          </span>
                          <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-xs font-medium tabular-nums text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            {item.share}
                          </span>
                        </div>
                      </div>
                      {/* Progress bar visualization */}
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                        <div
                          className={cx(
                            "h-full rounded-full",
                            item.borderColor.replace(/border/g, "bg"),
                          )}
                          style={{ width: item.share }}
                        />
                      </div>
                    </li>
                  ))}
                    </ul>
                  </>
                )}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </Card>
    )
  },
)

AssetAllocationCard.displayName = "AssetAllocationCard"

export { AssetAllocationCard }
export default AssetAllocationCard
