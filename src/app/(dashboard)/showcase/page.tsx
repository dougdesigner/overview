"use client"

import { AccountTreemap } from "@/components/AccountTreemapWrapper"
import { HighchartsDonutChart } from "@/components/HighchartsDonutChartWrapper"
import { HoldingsSunburst } from "@/components/HoldingsSunburstWrapper"
import { SankeyChartHighcharts } from "@/components/SankeyChartHighchartsWrapper"
import { institutionLabels, usePortfolioStore } from "@/hooks/usePortfolioStore"
import {
  getAssetClassBgColor,
  getAssetClassBorderColor,
} from "@/lib/assetClassColors"
import { getInstitutionDisplayLabel } from "@/lib/institutionUtils"
import { cx } from "@/lib/utils"
import { useMemo } from "react"

export default function ShowcasePage() {
  const { accounts, holdings, totalPortfolioValue, portfolioAllocation } =
    usePortfolioStore()

  // Currency formatter
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  // Calculate asset values
  const assetValues = useMemo(
    () => ({
      usStocks: (totalPortfolioValue * portfolioAllocation.usStocks) / 100,
      nonUsStocks:
        (totalPortfolioValue * portfolioAllocation.nonUsStocks) / 100,
      fixedIncome:
        (totalPortfolioValue * portfolioAllocation.fixedIncome) / 100,
      cash: (totalPortfolioValue * portfolioAllocation.cash) / 100,
    }),
    [totalPortfolioValue, portfolioAllocation],
  )

  // Donut chart data
  const donutData = useMemo(
    () =>
      [
        {
          name: "U.S. Stocks",
          amount: assetValues.usStocks,
          share: `${portfolioAllocation.usStocks.toFixed(1)}%`,
          borderColor: getAssetClassBorderColor("U.S. Stocks"),
        },
        {
          name: "Non-U.S. Stocks",
          amount: assetValues.nonUsStocks,
          share: `${portfolioAllocation.nonUsStocks.toFixed(1)}%`,
          borderColor: getAssetClassBorderColor("Non-U.S. Stocks"),
        },
        {
          name: "Fixed Income",
          amount: assetValues.fixedIncome,
          share: `${portfolioAllocation.fixedIncome.toFixed(1)}%`,
          borderColor: getAssetClassBorderColor("Fixed Income"),
        },
        {
          name: "Cash",
          amount: assetValues.cash,
          share: `${portfolioAllocation.cash.toFixed(1)}%`,
          borderColor: getAssetClassBorderColor("Cash"),
        },
      ].filter((d) => d.amount > 0),
    [assetValues, portfolioAllocation],
  )

  // Transform accounts for treemap
  const treemapAccounts = useMemo(
    () =>
      accounts.map((acc) => ({
        ...acc,
        institutionLabel:
          institutionLabels[
            acc.institution as keyof typeof institutionLabels
          ] || acc.institution,
      })),
    [accounts],
  )

  // Sankey chart data
  const sankeyData = useMemo(() => {
    const sankeyInstitutions = [
      ...new Set(
        accounts.map((a) => getInstitutionDisplayLabel(a.institution)),
      ),
    ]

    const assetClassTotals = [
      {
        id: "U.S. Stocks",
        value: accounts.reduce(
          (sum, acc) =>
            sum + (acc.totalValue * acc.assetAllocation.usStocks) / 100,
          0,
        ),
      },
      {
        id: "Non-U.S. Stocks",
        value: accounts.reduce(
          (sum, acc) =>
            sum + (acc.totalValue * acc.assetAllocation.nonUsStocks) / 100,
          0,
        ),
      },
      {
        id: "Fixed Income",
        value: accounts.reduce(
          (sum, acc) =>
            sum + (acc.totalValue * acc.assetAllocation.fixedIncome) / 100,
          0,
        ),
      },
      {
        id: "Cash",
        value: accounts.reduce(
          (sum, acc) => sum + (acc.totalValue * acc.assetAllocation.cash) / 100,
          0,
        ),
      },
    ]
      .filter((asset) => asset.value > 0)
      .sort((a, b) => b.value - a.value)

    return {
      nodes: [
        { id: "Portfolio Total" },
        ...sankeyInstitutions.map((name) => ({ id: name })),
        ...accounts.map((account) => ({ id: account.name })),
        ...assetClassTotals.map((asset, index) => ({
          id: asset.id,
          offset: index,
        })),
      ],
      links: [
        // Portfolio Total to Institutions
        ...sankeyInstitutions.map((instLabel) => ({
          source: "Portfolio Total",
          target: instLabel,
          value: accounts
            .filter(
              (acc) =>
                getInstitutionDisplayLabel(acc.institution) === instLabel,
            )
            .reduce((sum, acc) => sum + acc.totalValue, 0),
        })),
        // Institutions to Accounts
        ...accounts.map((account) => ({
          source: getInstitutionDisplayLabel(account.institution),
          target: account.name,
          value: account.totalValue,
        })),
        // Accounts to Asset Types
        ...accounts.flatMap((account) => {
          const links = []
          const usStocksValue =
            (account.totalValue * account.assetAllocation.usStocks) / 100
          const nonUsStocksValue =
            (account.totalValue * account.assetAllocation.nonUsStocks) / 100
          const fixedIncomeValue =
            (account.totalValue * account.assetAllocation.fixedIncome) / 100
          const cashValue =
            (account.totalValue * account.assetAllocation.cash) / 100

          if (usStocksValue > 0)
            links.push({
              source: account.name,
              target: "U.S. Stocks",
              value: usStocksValue,
            })
          if (nonUsStocksValue > 0)
            links.push({
              source: account.name,
              target: "Non-U.S. Stocks",
              value: nonUsStocksValue,
            })
          if (fixedIncomeValue > 0)
            links.push({
              source: account.name,
              target: "Fixed Income",
              value: fixedIncomeValue,
            })
          if (cashValue > 0)
            links.push({
              source: account.name,
              target: "Cash",
              value: cashValue,
            })
          return links
        }),
      ],
    }
  }, [accounts])

  // Holdings for sunburst - need to include allocation data
  const holdingsWithAllocations = useMemo(() => {
    return holdings.map((holding) => {
      const account = accounts.find((a) => a.id === holding.accountId)
      return {
        ...holding,
        allocation:
          totalPortfolioValue > 0
            ? (holding.totalValue / totalPortfolioValue) * 100
            : 0,
        accountName: account?.name || "Unknown",
      }
    })
  }, [holdings, accounts, totalPortfolioValue])

  // Benchmark comparison data
  const benchmarkAllocation = {
    usStocks: 46,
    nonUsStocks: 13,
    fixedIncome: 35,
    cash: 6,
  } // Moderate benchmark

  return (
    <div className="bg-white py-12 dark:bg-gray-950 sm:py-16">
      <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
        <h2 className="text-base/7 font-semibold text-blue-600 dark:text-blue-400">
          Overview Dashboard
        </h2>
        <p className="mt-2 max-w-lg text-pretty text-4xl font-semibold tracking-tight text-gray-950 dark:text-white sm:text-5xl">
          Your complete and clear picture
        </p>
        {/* <p className="mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
          Track {accounts.length} accounts with {holdings.length} holdings worth{" "}
          {formatCurrency(totalPortfolioValue)}
        </p> */}

        <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-16 lg:grid-cols-6 lg:grid-rows-2">
          {/* Donut Chart - Asset Allocation */}
          <div className="relative lg:col-span-3">
            <div className="absolute inset-0 rounded-lg bg-white dark:bg-gray-800 max-lg:rounded-t-[2rem] lg:rounded-tl-[2rem]" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] max-lg:rounded-t-[calc(2rem+1px)] lg:rounded-tl-[calc(2rem+1px)]">
              <div className="h-80 p-4">
                <HighchartsDonutChart
                  data={donutData}
                  totalValue={totalPortfolioValue}
                  valueFormatter={formatCurrency}
                  colors={["blue", "cyan", "amber", "emerald"]}
                  height={280}
                  useAssetClassColors={true}
                  showControls={false}
                  showTitle={false}
                />
              </div>
              <div className="p-6 pt-0">
                <h3 className="text-sm/4 font-semibold text-blue-600 dark:text-blue-400">
                  Asset Allocation
                </h3>
                <p className="mt-2 text-lg font-medium tracking-tight text-gray-950 dark:text-white">
                  Portfolio breakdown by asset class
                </p>
                <p className="mt-2 max-w-lg text-sm/6 text-gray-600 dark:text-gray-400">
                  Visualize how your investments are distributed across U.S.
                  stocks, international equities, fixed income, and cash.
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 rounded-lg shadow-sm ring-1 ring-black/5 dark:ring-white/15 max-lg:rounded-t-[2rem] lg:rounded-tl-[2rem]" />
          </div>

          {/* Sunburst Chart - Holdings Breakdown */}
          <div className="relative lg:col-span-3">
            <div className="absolute inset-0 rounded-lg bg-white dark:bg-gray-800 lg:rounded-tr-[2rem]" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] lg:rounded-tr-[calc(2rem+1px)]">
              <div className="h-80 p-4">
                <HoldingsSunburst
                  holdings={holdingsWithAllocations}
                  accounts={accounts}
                  height={280}
                  selectedAccountId="all"
                  onAccountChange={() => {}}
                />
              </div>
              <div className="p-6 pt-0">
                <h3 className="text-sm/4 font-semibold text-blue-600 dark:text-blue-400">
                  Holdings Breakdown
                </h3>
                <p className="mt-2 text-lg font-medium tracking-tight text-gray-950 dark:text-white">
                  Drill-down into your investments
                </p>
                <p className="mt-2 max-w-lg text-sm/6 text-gray-600 dark:text-gray-400">
                  Interactive sunburst chart showing your portfolio hierarchy.
                  Click to drill down into accounts and individual holdings.
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 rounded-lg shadow-sm ring-1 ring-black/5 dark:ring-white/15 lg:rounded-tr-[2rem]" />
          </div>

          {/* Treemap - Account Distribution */}
          <div className="relative lg:col-span-2">
            <div className="absolute inset-0 rounded-lg bg-white dark:bg-gray-800 lg:rounded-bl-[2rem]" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] lg:rounded-bl-[calc(2rem+1px)]">
              <div className="h-64 p-4">
                <AccountTreemap
                  accounts={treemapAccounts}
                  selectedAccounts={[]}
                  groupBy="institution"
                  displayValue="value"
                  height={220}
                />
              </div>
              <div className="p-6 pt-0">
                <h3 className="text-sm/4 font-semibold text-blue-600 dark:text-blue-400">
                  Accounts
                </h3>
                <p className="mt-2 text-lg font-medium tracking-tight text-gray-950 dark:text-white">
                  Account distribution
                </p>
                <p className="mt-2 max-w-lg text-sm/6 text-gray-600 dark:text-gray-400">
                  See how your portfolio is spread across different
                  institutions.
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 rounded-lg shadow-sm ring-1 ring-black/5 dark:ring-white/15 lg:rounded-bl-[2rem]" />
          </div>

          {/* Sankey Chart - Portfolio Flow */}
          <div className="relative lg:col-span-2">
            <div className="absolute inset-0 rounded-lg bg-white dark:bg-gray-800" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)]">
              <div className="h-64 p-4">
                <SankeyChartHighcharts
                  data={sankeyData}
                  height={220}
                  colors={["#3b82f6", "#06b6d4", "#f59e0b", "#10b981"]}
                  institutions={accounts.map((a) => ({
                    key: a.institution,
                    label: getInstitutionDisplayLabel(a.institution),
                  }))}
                />
              </div>
              <div className="p-6 pt-0">
                <h3 className="text-sm/4 font-semibold text-blue-600 dark:text-blue-400">
                  Portfolio Flow
                </h3>
                <p className="mt-2 text-lg font-medium tracking-tight text-gray-950 dark:text-white">
                  Money flow visualization
                </p>
                <p className="mt-2 max-w-lg text-sm/6 text-gray-600 dark:text-gray-400">
                  Track how money flows from institutions to accounts to asset
                  classes.
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 rounded-lg shadow-sm ring-1 ring-black/5 dark:ring-white/15" />
          </div>

          {/* Benchmark Comparison */}
          <div className="relative lg:col-span-2">
            <div className="absolute inset-0 rounded-lg bg-white dark:bg-gray-800 max-lg:rounded-b-[2rem] lg:rounded-br-[2rem]" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] max-lg:rounded-b-[calc(2rem+1px)] lg:rounded-br-[calc(2rem+1px)]">
              <div className="flex-1 p-6">
                <h3 className="text-sm/4 font-semibold text-blue-600 dark:text-blue-400">
                  Benchmark
                </h3>
                <p className="mt-2 text-lg font-medium tracking-tight text-gray-950 dark:text-white">
                  vs. Moderate Portfolio
                </p>

                {/* Comparison bars */}
                <div className="mt-6 space-y-4">
                  {[
                    {
                      name: "U.S. Stocks",
                      current: portfolioAllocation.usStocks,
                      benchmark: benchmarkAllocation.usStocks,
                    },
                    {
                      name: "Non-U.S.",
                      current: portfolioAllocation.nonUsStocks,
                      benchmark: benchmarkAllocation.nonUsStocks,
                    },
                    {
                      name: "Fixed Income",
                      current: portfolioAllocation.fixedIncome,
                      benchmark: benchmarkAllocation.fixedIncome,
                    },
                    {
                      name: "Cash",
                      current: portfolioAllocation.cash,
                      benchmark: benchmarkAllocation.cash,
                    },
                  ].map((item) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">
                          {item.name}
                        </span>
                        <span className="tabular-nums text-gray-900 dark:text-gray-100">
                          {item.current.toFixed(0)}%{" "}
                          <span className="text-gray-400">
                            / {item.benchmark}%
                          </span>
                        </span>
                      </div>
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                        <div
                          className={cx(
                            "absolute h-full rounded-full transition-all",
                            getAssetClassBgColor(item.name),
                          )}
                          style={{ width: `${Math.min(item.current, 100)}%` }}
                        />
                        <div
                          className="absolute top-0 h-full w-0.5 bg-gray-800 dark:bg-gray-200"
                          style={{ left: `${item.benchmark}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 pt-0">
                <p className="max-w-lg text-sm/6 text-gray-600 dark:text-gray-400">
                  Compare your allocation against a moderate risk profile
                  benchmark.
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 rounded-lg shadow-sm ring-1 ring-black/5 dark:ring-white/15 max-lg:rounded-b-[2rem] lg:rounded-br-[2rem]" />
          </div>
        </div>
      </div>
    </div>
  )
}
