"use client"

export const dynamic = "force-dynamic"

import AssetAllocationCard from "@/components/AssetAllocationCard"
import KPICard from "@/components/KPICard"
import { OnboardingFlow } from "@/components/OnboardingFlow"
import PortfolioValueCard from "@/components/PortfolioValueCard"
import { useExposureCalculations } from "@/hooks/useExposureCalculations"
import { usePortfolioStore } from "@/hooks/usePortfolioStore"
import {
  getAssetClassBgColor,
  getAssetClassBorderColor,
  getAssetClassColor,
} from "@/lib/assetClassColors"
import { useMemo } from "react"

export default function OverviewPage() {
  // Get data from portfolio store
  const {
    accounts,
    holdings,
    totalPortfolioValue,
    portfolioAllocation,
    isLoading,
  } = usePortfolioStore()

  // Get exposure calculations for asset breakdown (unused but kept for future use)
  useExposureCalculations()

  // Calculate asset values from portfolio allocation
  const assetValues = useMemo(() => {
    return {
      usStocks: (totalPortfolioValue * portfolioAllocation.usStocks) / 100,
      nonUsStocks:
        (totalPortfolioValue * portfolioAllocation.nonUsStocks) / 100,
      fixedIncome:
        (totalPortfolioValue * portfolioAllocation.fixedIncome) / 100,
      cash: (totalPortfolioValue * portfolioAllocation.cash) / 100,
    }
  }, [totalPortfolioValue, portfolioAllocation])

  // Sort asset classes by highest value
  const sortedAssetClasses = useMemo(() => {
    const assetClassData = [
      {
        name: "U.S. Stocks",
        value: assetValues.usStocks,
        percentage: portfolioAllocation.usStocks,
      },
      {
        name: "Non-U.S. Stocks",
        value: assetValues.nonUsStocks,
        percentage: portfolioAllocation.nonUsStocks,
      },
      {
        name: "Fixed Income",
        value: assetValues.fixedIncome,
        percentage: portfolioAllocation.fixedIncome,
      },
      {
        name: "Cash",
        value: assetValues.cash,
        percentage: portfolioAllocation.cash,
      },
    ]
    return assetClassData
      .filter((ac) => ac.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [assetValues, portfolioAllocation])

  return (
    <main className="min-h-[calc(100vh-180px)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
            Overview
          </h1>
          <p className="text-gray-500 dark:text-gray-400 sm:text-sm/6">
            Portfolio value and asset class distribution at a glance
          </p>
        </div>
        {/* <Button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 text-base sm:text-sm"
        >
          Create Ticket
          <RiAddLine className="-mr-0.5 size-5 shrink-0" aria-hidden="true" />
        </Button>
        <TicketDrawer open={isOpen} onOpenChange={setIsOpen} /> */}
      </div>
      {/* <Divider /> */}

      {isLoading ? (
        // Loading state
        <div className="mt-6 animate-pulse">
          <div className="mb-6 h-48 rounded-lg bg-gray-100 dark:bg-gray-800"></div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="h-32 rounded-lg bg-gray-100 dark:bg-gray-800"></div>
            <div className="h-32 rounded-lg bg-gray-100 dark:bg-gray-800"></div>
            <div className="h-32 rounded-lg bg-gray-100 dark:bg-gray-800"></div>
            <div className="h-32 rounded-lg bg-gray-100 dark:bg-gray-800"></div>
          </div>
        </div>
      ) : accounts.length === 0 ? (
        // Empty state with onboarding flow
        <div className="mt-6">
          <OnboardingFlow />
        </div>
      ) : (
        <>
          <dl className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-1 lg:grid-cols-1">
            {/* Portfolio Value Card */}
            <PortfolioValueCard
              value={totalPortfolioValue}
              accountCount={accounts.length}
              holdingsCount={holdings.length}
              assetClasses={sortedAssetClasses.map((ac) => ({
                name: ac.name,
                percentage: ac.percentage,
                color: getAssetClassColor(ac.name),
                bgColorClass: getAssetClassBgColor(ac.name),
              }))}
            />

            {/* Asset Allocation Donut Chart */}
            {/* <Card>
          <dt className="text-sm font-medium text-gray-900 dark:text-gray-50">
            SLA Performance
          </dt>
          <div className="mt-4 flex flex-nowrap items-center justify-between gap-y-4">
            <dd className="space-y-3">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-sm bg-blue-500 dark:bg-blue-500"
                    aria-hidden="true"
                  />
                  <span className="text-sm">Within SLA</span>
                </div>
                <span className="mt-1 block text-2xl font-semibold text-gray-900 dark:text-gray-50">
                  83.3%
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-sm bg-red-500 dark:bg-red-500"
                    aria-hidden="true"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-50">
                    SLA Breached
                  </span>
                </div>
                <span className="mt-1 block text-2xl font-semibold text-gray-900 dark:text-gray-50">
                  16.7%
                </span>
              </div>
            </dd>
            <ProgressCircle value={83} radius={45} strokeWidth={7} />
          </div>
        </Card>
        <Card>
          <dt className="text-sm font-medium text-gray-900 dark:text-gray-50">
            Call Volume Trends
          </dt>
          <div className="mt-4 flex items-center gap-x-8 gap-y-4">
            <dd className="space-y-3 whitespace-nowrap">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-sm bg-blue-500 dark:bg-blue-500"
                    aria-hidden="true"
                  />
                  <span className="text-sm">Today</span>
                </div>
                <span className="mt-1 block text-2xl font-semibold text-gray-900 dark:text-gray-50">
                  573
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-sm bg-gray-400 dark:bg-gray-600"
                    aria-hidden="true"
                  />
                  <span className="text-sm">Yesterday</span>
                </div>
                <span className="mt-1 block text-2xl font-semibold text-gray-900 dark:text-gray-50">
                  451
                </span>
              </div>
            </dd>
            <LineChartSupport
              className="h-28"
              data={volume}
              index="time"
              categories={["Today", "Yesterday"]}
              colors={["blue", "lightGray"]}
              showTooltip={false}
              valueFormatter={(number: number) =>
                Intl.NumberFormat("us").format(number).toString()
              }
              startEndOnly={true}
              showYAxis={false}
              showLegend={false}
            />
          </div>
        </Card> */}
          </dl>
          {/* <DataTable data={tickets} columns={columns} /> */}

          <dl className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-4 lg:grid-cols-4">
            {sortedAssetClasses.map((ac) => (
              <KPICard
                key={ac.name}
                name={ac.name}
                stat={`$${ac.value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
                change={`${ac.percentage.toFixed(1)}%`}
                color={getAssetClassColor(ac.name)}
              />
            ))}
          </dl>

          <dl className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-1 lg:grid-cols-1">
            <AssetAllocationCard
              defaultTab={holdings.length === 0 ? "Accounts" : undefined}
              data={[
                {
                  name: "Holdings",
                  data: (() => {
                    const sortedHoldings = holdings.sort(
                      (a, b) => b.marketValue - a.marketValue,
                    )
                    const top6 = sortedHoldings.slice(0, 6)
                    const others = sortedHoldings.slice(6)
                    const othersValue = others.reduce(
                      (sum, h) => sum + h.marketValue,
                      0,
                    )

                    const displayHoldings =
                      othersValue > 0
                        ? [
                            ...top6,
                            {
                              id: "others",
                              accountId: "",
                              accountName: "",
                              ticker: "Others",
                              name: "Others",
                              quantity: 0,
                              lastPrice: 0,
                              marketValue: othersValue,
                              allocation: 0,
                              type: "other" as const,
                            },
                          ]
                        : top6

                    return displayHoldings
                      .filter((h) => h.marketValue > 0)
                      .map((h, index) => ({
                        name: h.ticker || h.name,
                        ticker: h.ticker,
                        type: h.type || "other",
                        amount: h.marketValue,
                        share:
                          totalPortfolioValue > 0
                            ? `${((h.marketValue / totalPortfolioValue) * 100).toFixed(1)}%`
                            : "0%",
                        borderColor:
                          [
                            "border-blue-500 dark:border-blue-500",
                            "border-gray-500 dark:border-gray-500",
                            "border-cyan-500 dark:border-cyan-500",
                            "border-amber-500 dark:border-amber-500",
                            "border-emerald-500 dark:border-emerald-500",
                            "border-violet-500 dark:border-violet-500",
                            "border-rose-500 dark:border-rose-500",
                          ][index] || "border-gray-500 dark:border-gray-500",
                      }))
                  })(),
                  colors: [
                    "blue",
                    "gray",
                    "cyan",
                    "amber",
                    "emerald",
                    "violet",
                  ] as (
                    | "blue"
                    | "gray"
                    | "cyan"
                    | "amber"
                    | "emerald"
                    | "violet"
                  )[],
                },
                {
                  name: "Asset Classes",
                  data: sortedAssetClasses.map((ac) => ({
                    name: ac.name,
                    amount: ac.value,
                    share: `${ac.percentage.toFixed(1)}%`,
                    borderColor: getAssetClassBorderColor(ac.name),
                  })),
                  // These colors are not used when useAssetClassColors is true, but kept for compatibility
                  colors: ["blue", "cyan", "amber", "emerald"] as (
                    | "blue"
                    | "cyan"
                    | "amber"
                    | "emerald"
                  )[],
                },
                {
                  name: "Accounts",
                  data: accounts
                    .sort((a, b) => b.totalValue - a.totalValue)
                    .map((account, index) => ({
                      name: account.name,
                      amount: account.totalValue,
                      share:
                        totalPortfolioValue > 0
                          ? `${((account.totalValue / totalPortfolioValue) * 100).toFixed(1)}%`
                          : "0%",
                      borderColor:
                        [
                          "border-violet-500 dark:border-violet-500",
                          "border-fuchsia-500 dark:border-fuchsia-500",
                          "border-pink-500 dark:border-pink-500",
                          "border-sky-500 dark:border-sky-500",
                          "border-lime-500 dark:border-lime-500",
                        ][index] || "border-gray-500 dark:border-gray-500",
                      institution: account.institution,
                    })),
                  colors: ["violet", "fuchsia", "pink", "sky", "lime"] as (
                    | "violet"
                    | "fuchsia"
                    | "pink"
                    | "sky"
                    | "lime"
                  )[],
                },
              ]}
            />
          </dl>
        </>
      )}
    </main>
  )
}
