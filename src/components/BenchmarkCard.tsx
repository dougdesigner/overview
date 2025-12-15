"use client"

import * as Dialog from "@radix-ui/react-dialog"
import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { HighchartsDonutChart } from "@/components/HighchartsDonutChartWrapper"
import { usePortfolioStore } from "@/hooks/usePortfolioStore"
import {
  getAssetClassBgColor,
  getAssetClassBorderColor,
} from "@/lib/assetClassColors"
import { getFromStorage, setToStorage, STORAGE_KEYS } from "@/lib/localStorage"
import { cx } from "@/lib/utils"
import { Icon } from "@iconify/react"
import React, { useCallback, useEffect, useState } from "react"

// Benchmark types
type BenchmarkType =
  | "aggressive"
  | "moderately-aggressive"
  | "moderate"
  | "moderately-conservative"
  | "conservative"

interface BenchmarkAllocation {
  usStocks: number
  nonUsStocks: number
  fixedIncome: number
  other: number
}

interface BenchmarkProfile {
  name: string
  description: string
  allocation: BenchmarkAllocation
}

// Benchmark allocation data
const BENCHMARKS: Record<BenchmarkType, BenchmarkProfile> = {
  aggressive: {
    name: "Aggressive",
    description: "Higher weighting of stocks for maximum growth potential",
    allocation: { usStocks: 67, nonUsStocks: 25, fixedIncome: 5, other: 3 },
  },
  "moderately-aggressive": {
    name: "Moderately Aggressive",
    description: "Slightly higher weightings in equities with some bonds",
    allocation: { usStocks: 53, nonUsStocks: 23, fixedIncome: 19, other: 5 },
  },
  moderate: {
    name: "Moderate",
    description: "Balanced weightings of stocks and bonds",
    allocation: { usStocks: 46, nonUsStocks: 13, fixedIncome: 35, other: 6 },
  },
  "moderately-conservative": {
    name: "Moderately Conservative",
    description: "Higher weighting of bonds and stable assets",
    allocation: { usStocks: 27, nonUsStocks: 11, fixedIncome: 56, other: 6 },
  },
  conservative: {
    name: "Conservative",
    description: "Slightly higher weightings in bonds for stability",
    allocation: { usStocks: 16, nonUsStocks: 5, fixedIncome: 72, other: 7 },
  },
}

// Stable formatter for mini donuts
const percentFormatter = (v: number) => `${v}%`

// Static colors array for mini donuts
const MINI_DONUT_COLORS = ["blue", "cyan", "amber", "gray"] as const

// Mini donut chart for modal previews - memoized to prevent re-renders on selection change
const MiniDonutPreview = React.memo(function MiniDonutPreview({
  allocation
}: {
  allocation: BenchmarkAllocation
}) {
  const data = React.useMemo(() => [
    {
      name: "U.S. Stocks",
      amount: allocation.usStocks,
      share: `${allocation.usStocks}%`,
      borderColor: getAssetClassBorderColor("U.S. Stocks"),
    },
    {
      name: "Non-U.S. Stocks",
      amount: allocation.nonUsStocks,
      share: `${allocation.nonUsStocks}%`,
      borderColor: getAssetClassBorderColor("Non-U.S. Stocks"),
    },
    {
      name: "Fixed Income",
      amount: allocation.fixedIncome,
      share: `${allocation.fixedIncome}%`,
      borderColor: getAssetClassBorderColor("Fixed Income"),
    },
    {
      name: "Other",
      amount: allocation.other,
      share: `${allocation.other}%`,
      borderColor: getAssetClassBorderColor("Other"),
    },
  ].filter((d) => d.amount > 0), [allocation.usStocks, allocation.nonUsStocks, allocation.fixedIncome, allocation.other])

  return (
    <div className="h-24">
      <HighchartsDonutChart
        data={data}
        totalValue={100}
        valueFormatter={percentFormatter}
        colors={MINI_DONUT_COLORS as unknown as string[]}
        height={96}
        showControls={false}
        showTitle={false}
        useAssetClassColors={true}
      />
    </div>
  )
})

// Selection Sheet Props
interface SelectionSheetProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  tempSelection: BenchmarkType | null
  onSelectionChange: (key: BenchmarkType) => void
  onSave: () => void
}

// Responsive Selection Modal: Bottom sheet on mobile, side drawer on desktop
// Extracted as a memoized component to prevent re-renders when selection changes
const SelectionSheet = React.memo(function SelectionSheet({
  isOpen,
  onOpenChange,
  tempSelection,
  onSelectionChange,
  onSave,
}: SelectionSheetProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-dialogOverlayShow" />

        {/* Mobile: Bottom Sheet / Desktop: Side Drawer */}
        <Dialog.Content
          onOpenAutoFocus={(e) => e.preventDefault()}
          className={cx(
            "fixed z-50 flex flex-col overflow-hidden border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-950",
            // Mobile: Bottom sheet
            "inset-x-0 bottom-0 mx-2 mb-2 max-h-[85vh] rounded-xl",
            "data-[state=open]:animate-bottomSheetSlideUp data-[state=closed]:animate-bottomSheetSlideDown",
            // Desktop (md+): Side drawer from right
            "md:inset-y-0 md:bottom-auto md:left-auto md:right-0 md:mx-0 md:mb-0 md:h-full md:max-h-full md:w-[480px] md:rounded-none md:rounded-l-xl",
            "md:data-[state=open]:animate-drawerSlideLeftAndFade md:data-[state=closed]:animate-drawerSlideRightAndFade"
          )}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
            <Dialog.Title className="text-base font-semibold text-gray-900 dark:text-gray-50">
              Select benchmark
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200">
                <Icon icon="carbon:close" className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-4">
            <p className="mb-4 text-sm text-gray-500">
              Choose a risk profile that aligns with your investment strategy.
              This will be used as a baseline for portfolio analysis.
            </p>

            <div className="grid grid-cols-1 gap-4">
              {(Object.entries(BENCHMARKS) as [BenchmarkType, BenchmarkProfile][]).map(
                ([key, benchmark]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onSelectionChange(key)}
                    className={cx(
                      "rounded-lg border-2 p-4 text-left transition-all hover:border-blue-500",
                      tempSelection === key
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                        : "border-gray-200 dark:border-gray-800"
                    )}
                  >
                    <h5 className="font-semibold text-gray-900 dark:text-gray-50">
                      {benchmark.name}
                    </h5>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                      {benchmark.description}
                    </p>

                    {/* Chart left, Legend right layout */}
                    <div className="mt-4 flex items-center gap-3">
                      {/* Mini donut chart preview */}
                      <div className="w-24 shrink-0">
                        <MiniDonutPreview allocation={benchmark.allocation} />
                      </div>

                      {/* Legend */}
                      <div className="flex-1 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span className={cx("size-2 rounded-sm", getAssetClassBgColor("U.S. Stocks"))} />
                            <span className="text-gray-600 dark:text-gray-400">
                              U.S. Stocks
                            </span>
                          </span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {benchmark.allocation.usStocks}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span className={cx("size-2 rounded-sm", getAssetClassBgColor("Non-U.S. Stocks"))} />
                            <span className="text-gray-600 dark:text-gray-400">
                              Non-U.S. Stocks
                            </span>
                          </span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {benchmark.allocation.nonUsStocks}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span className={cx("size-2 rounded-sm", getAssetClassBgColor("Fixed Income"))} />
                            <span className="text-gray-600 dark:text-gray-400">
                              Fixed Income
                            </span>
                          </span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {benchmark.allocation.fixedIncome}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span className={cx("size-2 rounded-sm", getAssetClassBgColor("Other"))} />
                            <span className="text-gray-600 dark:text-gray-400">
                              Other
                            </span>
                          </span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {benchmark.allocation.other}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 gap-2 border-t border-gray-200 p-4 dark:border-gray-800">
            <Dialog.Close asChild>
              <Button variant="secondary" className="flex-1">
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              onClick={onSave}
              disabled={!tempSelection}
              className="flex-1"
            >
              Save
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
})

interface BenchmarkCardProps {
  className?: string
  sectionId?: string
}

export function BenchmarkCard({
  className,
  sectionId = "benchmark-comparison-section",
}: BenchmarkCardProps) {
  const { totalPortfolioValue, portfolioAllocation } = usePortfolioStore()

  // State
  const [selectedBenchmark, setSelectedBenchmark] =
    useState<BenchmarkType | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tempSelection, setTempSelection] = useState<BenchmarkType | null>(null)

  // Load saved benchmark from storage
  useEffect(() => {
    const saved = getFromStorage<BenchmarkType>(STORAGE_KEYS.BENCHMARK)
    if (saved && BENCHMARKS[saved]) {
      setSelectedBenchmark(saved)
    }
  }, [])

  // Save benchmark selection - memoized to prevent SelectionSheet re-renders
  const handleSave = useCallback(() => {
    if (tempSelection) {
      setSelectedBenchmark(tempSelection)
      setToStorage(STORAGE_KEYS.BENCHMARK, tempSelection)
      setIsModalOpen(false)
    }
  }, [tempSelection])

  // Handle selection change - memoized for SelectionSheet
  const handleSelectionChange = useCallback((key: BenchmarkType) => {
    setTempSelection(key)
  }, [])

  // Open modal with current selection
  const openModal = useCallback(() => {
    setTempSelection(selectedBenchmark)
    setIsModalOpen(true)
  }, [selectedBenchmark])

  // Currency formatter
  const currencyFormatter = (number: number) => {
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

  // Extended allocation type including cash
  interface UserAllocation {
    usStocks: number
    nonUsStocks: number
    fixedIncome: number
    other: number
    cash: number
  }

  // Get user's current allocation
  const getUserAllocation = (): UserAllocation => {
    return {
      usStocks: portfolioAllocation.usStocks,
      nonUsStocks: portfolioAllocation.nonUsStocks,
      fixedIncome: portfolioAllocation.fixedIncome,
      other: 0, // User doesn't have "other" category, it maps to cash
      cash: portfolioAllocation.cash,
    }
  }

  // Asset classes for comparison (includes Cash which has no benchmark)
  const assetClasses: {
    name: string
    key: keyof UserAllocation
    bgColor: string
    borderColor: string
    hasBenchmark: boolean
  }[] = [
    {
      name: "U.S. Stocks",
      key: "usStocks",
      bgColor: getAssetClassBgColor("U.S. Stocks"),
      borderColor: getAssetClassBorderColor("U.S. Stocks"),
      hasBenchmark: true,
    },
    {
      name: "Non-U.S. Stocks",
      key: "nonUsStocks",
      bgColor: getAssetClassBgColor("Non-U.S. Stocks"),
      borderColor: getAssetClassBorderColor("Non-U.S. Stocks"),
      hasBenchmark: true,
    },
    {
      name: "Fixed Income",
      key: "fixedIncome",
      bgColor: getAssetClassBgColor("Fixed Income"),
      borderColor: getAssetClassBorderColor("Fixed Income"),
      hasBenchmark: true,
    },
    {
      name: "Cash",
      key: "cash",
      bgColor: getAssetClassBgColor("Cash"),
      borderColor: getAssetClassBorderColor("Cash"),
      hasBenchmark: false, // Benchmarks don't include cash
    },
    {
      name: "Other",
      key: "other",
      bgColor: "bg-gray-500",
      borderColor: "border-gray-500",
      hasBenchmark: true,
    },
  ]

  // Prepare donut chart data for comparison view
  const getComparisonChartData = () => {
    const userAllocation = getUserAllocation()
    return assetClasses
      .filter((ac) => userAllocation[ac.key] > 0)
      .map((ac) => ({
        name: ac.name,
        amount: (totalPortfolioValue * userAllocation[ac.key]) / 100,
        share: `${userAllocation[ac.key].toFixed(1)}%`,
        borderColor: ac.borderColor,
      }))
  }

  // Empty State
  if (!selectedBenchmark) {
    return (
      <>
        <Card id={sectionId} className={cx("overflow-hidden p-0", className)}>
          <div className="flex items-center justify-between px-6 pt-6">
            <h3
              className="cursor-pointer text-base font-medium text-gray-900 transition-colors hover:text-blue-600 dark:text-gray-50 dark:hover:text-blue-400"
              onClick={() => {
                document
                  .getElementById(sectionId)
                  ?.scrollIntoView({ behavior: "smooth" })
              }}
            >
              Benchmark Comparison
            </h3>
          </div>

          <div className="flex flex-col items-center justify-center px-6 py-16">
            <div className="rounded-full bg-gray-100 p-4 dark:bg-gray-800">
              <Icon
                icon="mdi:target"
                className="size-8 text-gray-400 dark:text-gray-500"
              />
            </div>
            <h4 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-50">
              Select a Benchmark
            </h4>
            <p className="mt-2 max-w-md text-center text-sm text-gray-500">
              Choose a risk profile to compare your portfolio allocation against
              ideal diversification targets.
            </p>
            <Button className="mt-6" onClick={openModal}>
              <Icon icon="mdi:target" className="mr-2 size-4" />
              Choose Benchmark
            </Button>
          </div>
        </Card>
        <SelectionSheet
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          tempSelection={tempSelection}
          onSelectionChange={handleSelectionChange}
          onSave={handleSave}
        />
      </>
    )
  }

  // Comparison View
  const benchmark = BENCHMARKS[selectedBenchmark]
  const userAllocation = getUserAllocation()

  return (
    <>
      <Card id={sectionId} className={cx("overflow-hidden p-0", className)}>
        <div className="flex items-center justify-between px-6 pt-6">
          <div>
            <h3
              className="cursor-pointer text-base font-medium text-gray-900 transition-colors hover:text-blue-600 dark:text-gray-50 dark:hover:text-blue-400"
              onClick={() => {
                document
                  .getElementById(sectionId)
                  ?.scrollIntoView({ behavior: "smooth" })
              }}
            >
              Benchmark Comparison
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              vs. {benchmark.name} Portfolio
            </p>
          </div>
          <Button variant="secondary" onClick={openModal} className="h-9">
            <Icon icon="carbon:chart-bullet" className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">
          {/* Left: Donut Chart */}
          <div style={{ height: 280 }}>
            <HighchartsDonutChart
              data={getComparisonChartData()}
              totalValue={totalPortfolioValue}
              valueFormatter={currencyFormatter}
              colors={["blue", "cyan", "amber", "emerald", "gray"]}
              height={280}
              useAssetClassColors={true}
              showControls={false}
            />
          </div>

          {/* Right: Comparison Table */}
          <div>
            <div className="flex items-center gap-4 border-b border-gray-200 pb-2 text-xs text-gray-500 dark:border-gray-800">
              <span className="flex-1">Asset Class</span>
              <span className="w-20 text-right">Investment</span>
              <span className="w-20 text-right">Benchmark</span>
              <span className="w-32"></span>
            </div>
            {assetClasses
              .filter((asset) => userAllocation[asset.key] > 0) // Only show asset classes with allocation
              .map((asset) => {
                const investment = userAllocation[asset.key]
                // Get benchmark value, but it won't exist for "cash"
                const benchmarkVal = asset.hasBenchmark
                  ? (benchmark.allocation[asset.key as keyof BenchmarkAllocation] ?? 0)
                  : null

                return (
                  <div
                    key={asset.name}
                    className="flex items-center gap-4 border-b border-gray-200 py-3 dark:border-gray-800"
                  >
                    <span className="flex flex-1 items-center gap-2">
                      <span
                        className={cx("size-2 shrink-0 rounded-sm", asset.bgColor)}
                      />
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {asset.name}
                      </span>
                    </span>
                    <span className="w-20 text-right text-sm font-medium tabular-nums text-gray-900 dark:text-gray-100">
                      {investment.toFixed(1)}%
                    </span>
                    <span className="w-20 text-right text-sm font-medium tabular-nums text-gray-900 dark:text-gray-100">
                      {benchmarkVal !== null ? `${benchmarkVal.toFixed(1)}%` : "-"}
                    </span>
                    {/* Comparison bar - full width = 100% of portfolio */}
                    <div className="relative h-2 w-32 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      {/* Investment bar - fills to the asset class percentage */}
                      <div
                        className={cx(
                          "absolute h-full rounded-full transition-all",
                          asset.bgColor
                        )}
                        style={{ width: `${investment}%` }}
                      />
                      {/* Benchmark marker - only show if benchmark exists */}
                      {benchmarkVal !== null && (
                        <div
                          className="absolute top-0 h-full w-0.5 bg-gray-800 dark:bg-gray-200"
                          style={{ left: `${benchmarkVal}%` }}
                        />
                      )}
                    </div>
                  </div>
              )
            })}
          </div>
        </div>

      </Card>
      <SelectionSheet
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        tempSelection={tempSelection}
        onSelectionChange={handleSelectionChange}
        onSave={handleSave}
      />
    </>
  )
}

export default BenchmarkCard
