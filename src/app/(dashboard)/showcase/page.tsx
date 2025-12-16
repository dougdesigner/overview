"use client"

import { CategoryBar } from "@/components/CategoryBar"
import { HighchartsDonutChart } from "@/components/HighchartsDonutChartWrapper"
import { SankeyChartHighcharts } from "@/components/SankeyChartHighchartsWrapper"
import { ExposureTreemapHighchartsWithLogos } from "@/components/ui/data-table-exposure/ExposureTreemapHighchartsWrapper"
import { useExposureCalculations } from "@/hooks/useExposureCalculations"
import { usePortfolioStore } from "@/hooks/usePortfolioStore"
import {
  getAssetClassBgColor,
  getAssetClassBorderColor,
  getAssetClassColor,
} from "@/lib/assetClassColors"
import { getInstitutionDisplayLabel } from "@/lib/institutionUtils"
import { getCachedLogoUrls } from "@/lib/logoUtils"
import { cx } from "@/lib/utils"
import { useEffect, useMemo, useRef, useState } from "react"

export default function ShowcasePage() {
  const {
    accounts,
    holdings,
    totalPortfolioValue,
    portfolioAllocation,
    isDemoMode,
    setDemoMode,
    isLoading,
  } = usePortfolioStore()

  // Track if we auto-enabled demo mode so we can restore it on unmount
  const autoEnabledDemoMode = useRef(false)

  // Enable demo mode if user has no data (so showcase page isn't blank)
  useEffect(() => {
    // Wait for loading to complete before checking
    if (isLoading) return

    // If no accounts and not already in demo mode, enable it
    if (accounts.length === 0 && !isDemoMode) {
      autoEnabledDemoMode.current = true
      setDemoMode(true)
    }
  }, [accounts.length, isDemoMode, isLoading, setDemoMode])

  // Get exposure calculations for the stocks treemap
  const { exposures, totalValue: exposureTotalValue } =
    useExposureCalculations()

  // Combine GOOG and GOOGL into a single entry
  const combinedExposures = useMemo(() => {
    const googl = exposures.find((e) => e.ticker === "GOOGL")
    const goog = exposures.find((e) => e.ticker === "GOOG")

    if (!googl || !goog) return exposures

    // Create combined entry using GOOGL as base
    const combined = {
      ...googl,
      name: "Alphabet Inc.",
      directShares: googl.directShares + goog.directShares,
      etfExposure: googl.etfExposure + goog.etfExposure,
      totalShares: googl.totalShares + goog.totalShares,
      totalValue: googl.totalValue + goog.totalValue,
      percentOfPortfolio: googl.percentOfPortfolio + goog.percentOfPortfolio,
    }

    // Return all entries except GOOG, with GOOGL replaced by combined
    return exposures
      .filter((e) => e.ticker !== "GOOG")
      .map((e) => (e.ticker === "GOOGL" ? combined : e))
  }, [exposures])

  // Logo URLs for stocks treemap
  const [logoUrls, setLogoUrls] = useState<Record<string, string | null>>({})

  // Fetch logo URLs when exposures change
  useEffect(() => {
    const fetchLogos = async () => {
      if (combinedExposures.length === 0) return

      const tickers = combinedExposures.map((exp) => exp.ticker.toUpperCase())
      const logos = await getCachedLogoUrls(tickers)
      setLogoUrls(logos)
    }

    fetchLogos()
  }, [combinedExposures])

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
          Overview
        </h2>
        <p className="mt-2 max-w-lg text-pretty text-4xl font-semibold tracking-tight text-gray-950 dark:text-white sm:text-5xl">
          See your clear financial picture
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

          {/* Stocks Treemap - Stock Exposure */}
          <div className="relative lg:col-span-3">
            <div className="absolute inset-0 rounded-lg bg-white dark:bg-gray-800 lg:rounded-tr-[2rem]" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] lg:rounded-tr-[calc(2rem+1px)]">
              <div className="h-80 p-4">
                <ExposureTreemapHighchartsWithLogos
                  exposures={combinedExposures}
                  totalValue={exposureTotalValue || totalPortfolioValue}
                  accounts={accounts}
                  selectedAccounts={["all"]}
                  logoUrls={logoUrls}
                  showControls={false}
                  showLegend={false}
                  height={280}
                />
              </div>
              <div className="p-6 pt-0">
                <h3 className="text-sm/4 font-semibold text-blue-600 dark:text-blue-400">
                  Stock Exposure
                </h3>
                <p className="mt-2 text-lg font-medium tracking-tight text-gray-950 dark:text-white">
                  Individual stock holdings
                </p>
                <p className="mt-2 max-w-lg text-sm/6 text-gray-600 dark:text-gray-400">
                  See your direct and indirect stock exposure from ETFs and
                  funds, grouped by sector.
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 rounded-lg shadow-sm ring-1 ring-black/5 dark:ring-white/15 lg:rounded-tr-[2rem]" />
          </div>

          {/* Portfolio Value Summary */}
          <div className="relative lg:col-span-2">
            <div className="absolute inset-0 rounded-lg bg-white dark:bg-gray-800 lg:rounded-bl-[2rem]" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] lg:rounded-bl-[calc(2rem+1px)]">
              <div className="flex-1 p-6">
                <p className="text-base font-medium text-gray-900 dark:text-gray-50">
                  Portfolio value
                </p>
                <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-50">
                  {formatCurrency(totalPortfolioValue)}
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {accounts.length}{" "}
                  {accounts.length === 1 ? "account" : "accounts"} ·{" "}
                  {holdings.length}{" "}
                  {holdings.length === 1 ? "holding" : "holdings"}
                </p>

                {/* Category Bar */}
                <CategoryBar
                  values={[
                    portfolioAllocation.usStocks,
                    portfolioAllocation.nonUsStocks,
                    portfolioAllocation.fixedIncome,
                    portfolioAllocation.cash,
                  ].filter((v) => v > 0)}
                  colors={
                    [
                      portfolioAllocation.usStocks > 0 && "blue",
                      portfolioAllocation.nonUsStocks > 0 && "cyan",
                      portfolioAllocation.fixedIncome > 0 && "amber",
                      portfolioAllocation.cash > 0 && "emerald",
                    ].filter(Boolean) as (
                      | "blue"
                      | "cyan"
                      | "amber"
                      | "emerald"
                    )[]
                  }
                  className="mt-6"
                  showLabels={false}
                />

                {/* Asset class legend */}
                <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  {[
                    {
                      name: "U.S. Stocks",
                      value: portfolioAllocation.usStocks,
                    },
                    {
                      name: "Non-U.S. Stocks",
                      value: portfolioAllocation.nonUsStocks,
                    },
                    {
                      name: "Fixed Income",
                      value: portfolioAllocation.fixedIncome,
                    },
                    { name: "Cash", value: portfolioAllocation.cash },
                  ]
                    .filter((item) => item.value > 0)
                    .map((item) => (
                      <li key={item.name}>
                        <span className="text-base font-semibold text-gray-900 dark:text-gray-50">
                          {item.value % 1 === 0
                            ? item.value
                            : item.value.toFixed(1)}
                          %
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={cx(
                              "size-2.5 shrink-0 rounded-sm",
                              getAssetClassBgColor(item.name),
                            )}
                            aria-hidden="true"
                          />
                          <span className="text-sm">{item.name}</span>
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
              <div className="p-6 pt-0">
                <h3 className="text-sm/4 font-semibold text-blue-600 dark:text-blue-400">
                  Overview
                </h3>
                <p className="mt-2 text-lg font-medium tracking-tight text-gray-950 dark:text-white">
                  Total portfolio summary
                </p>
                <p className="mt-2 max-w-lg text-sm/6 text-gray-600 dark:text-gray-400">
                  Track your total value across all accounts and asset classes.
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 rounded-lg shadow-sm ring-1 ring-black/5 dark:ring-white/15 lg:rounded-bl-[2rem]" />
          </div>

          {/* Sankey Chart - Accounts */}
          <div className="relative lg:col-span-2">
            <div className="absolute inset-0 rounded-lg bg-white dark:bg-gray-800" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)]">
              <div className="flex-1 p-4">
                <SankeyChartHighcharts
                  data={sankeyData}
                  height={220}
                  colors={["blue", "cyan", "amber", "emerald"]}
                  institutions={[
                    ...new Set(
                      accounts.map((a) =>
                        getInstitutionDisplayLabel(a.institution),
                      ),
                    ),
                  ]}
                />
              </div>
              <div className="p-6 pt-0">
                <h3 className="text-sm/4 font-semibold text-blue-600 dark:text-blue-400">
                  Accounts
                </h3>
                <p className="mt-2 text-lg font-medium tracking-tight text-gray-950 dark:text-white">
                  Account allocation flow
                </p>
                <p className="mt-2 max-w-lg text-sm/6 text-gray-600 dark:text-gray-400">
                  Visualize how money flows from institutions to accounts and
                  asset classes.
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
                <p className="text-base font-medium text-gray-900 dark:text-gray-50">
                  Benchmark
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  vs. Moderate Portfolio
                </p>

                {/* Comparison bars */}
                <div className="mt-4 space-y-4">
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
                <h3 className="text-sm/4 font-semibold text-blue-600 dark:text-blue-400">
                  Benchmark
                </h3>
                <p className="mt-2 text-lg font-medium tracking-tight text-gray-950 dark:text-white">
                  Target allocation comparison
                </p>
                <p className="mt-2 max-w-lg text-sm/6 text-gray-600 dark:text-gray-400">
                  Compare your allocation against a moderate risk profile.
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
