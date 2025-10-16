"use client"

import AssetAllocationCard from "@/components/AssetAllocationCard"
import { Button } from "@/components/Button"
import { Divider } from "@/components/Divider"
import KPICard from "@/components/KPICard"
import PortfolioValueCard from "@/components/PortfolioValueCard"
import { usePortfolioStore } from "@/hooks/usePortfolioStore"
import { useExposureCalculations } from "@/hooks/useExposureCalculations"
import { getAssetClassColor, getAssetClassBgColor, getAssetClassBorderColor } from "@/lib/assetClassColors"
import React, { useMemo } from "react"

export default function OverviewPage() {
  // Get data from portfolio store
  const {
    accounts,
    holdings,
    totalPortfolioValue,
    portfolioAllocation,
    isLoading
  } = usePortfolioStore()

  // Get exposure calculations for asset breakdown
  const { assetClassBreakdown } = useExposureCalculations()

  // Calculate asset values from portfolio allocation
  const assetValues = useMemo(() => {
    return {
      usStocks: (totalPortfolioValue * portfolioAllocation.usStocks) / 100,
      nonUsStocks: (totalPortfolioValue * portfolioAllocation.nonUsStocks) / 100,
      fixedIncome: (totalPortfolioValue * portfolioAllocation.fixedIncome) / 100,
      cash: (totalPortfolioValue * portfolioAllocation.cash) / 100,
    }
  }, [totalPortfolioValue, portfolioAllocation])

  return (
    <main>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
            Overview
          </h1>
          <p className="text-gray-500 sm:text-sm/6 dark:text-gray-400">
            Your portfolio value and asset class distribution at a glance
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
      <Divider />

      {isLoading ? (
        // Loading state
        <div className="mt-8 animate-pulse">
          <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-lg mb-6"></div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
            <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
            <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
            <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
          </div>
        </div>
      ) : accounts.length === 0 ? (
        // Empty state
        <div className="mt-8 py-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 mb-2">
            Welcome to your portfolio dashboard
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Start by adding your first account to see your portfolio overview.
          </p>
          <Button
            onClick={() => window.location.href = '/accounts'}
            className="inline-flex items-center gap-2"
          >
            Add Your First Account
          </Button>
        </div>
      ) : (
        <>
      <dl className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-1 lg:grid-cols-1">
        {/* Portfolio Value Card */}
        <PortfolioValueCard
          value={totalPortfolioValue}
          accountCount={accounts.length}
          holdingsCount={holdings.length}
          assetClasses={[
            {
              name: "U.S. Stocks",
              percentage: portfolioAllocation.usStocks,
              color: getAssetClassColor("U.S. Stocks"),
              bgColorClass: getAssetClassBgColor("U.S. Stocks"),
            },
            {
              name: "Non-U.S. Stocks",
              percentage: portfolioAllocation.nonUsStocks,
              color: getAssetClassColor("Non-U.S. Stocks"),
              bgColorClass: getAssetClassBgColor("Non-U.S. Stocks"),
            },
            {
              name: "Fixed Income",
              percentage: portfolioAllocation.fixedIncome,
              color: getAssetClassColor("Fixed Income"),
              bgColorClass: getAssetClassBgColor("Fixed Income"),
            },
            {
              name: "Cash",
              percentage: portfolioAllocation.cash,
              color: getAssetClassColor("Cash"),
              bgColorClass: getAssetClassBgColor("Cash"),
            },
          ]}
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

      <dl className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          name="U.S. Stocks"
          stat={`$${assetValues.usStocks.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
          change={`${portfolioAllocation.usStocks.toFixed(1)}%`}
          color={getAssetClassColor("U.S. Stocks")}
        />
        <KPICard
          name="Non-U.S. Stocks"
          stat={`$${assetValues.nonUsStocks.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
          change={`${portfolioAllocation.nonUsStocks.toFixed(1)}%`}
          color={getAssetClassColor("Non-U.S. Stocks")}
        />
        <KPICard
          name="Fixed Income"
          stat={`$${assetValues.fixedIncome.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
          change={`${portfolioAllocation.fixedIncome.toFixed(1)}%`}
          color={getAssetClassColor("Fixed Income")}
        />
        <KPICard
          name="Cash"
          stat={`$${assetValues.cash.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
          change={`${portfolioAllocation.cash.toFixed(1)}%`}
          color={getAssetClassColor("Cash")}
        />
      </dl>

      <dl className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-1 lg:grid-cols-1">
        <AssetAllocationCard
          defaultTab={holdings.length === 0 ? "Accounts" : undefined}
          data={[
            {
              name: "Holdings",
              data: holdings
                .sort((a, b) => b.marketValue - a.marketValue)
                .slice(0, 5)
                .concat({
                  id: 'others',
                  accountId: '',
                  accountName: '',
                  name: 'Others',
                  quantity: 0,
                  lastPrice: 0,
                  marketValue: holdings
                    .slice(5)
                    .reduce((sum, h) => sum + h.marketValue, 0),
                  allocation: 0,
                  type: 'stock',
                } as any)
                .filter(h => h.marketValue > 0)
                .map((h, index) => ({
                  name: h.ticker || h.name,
                  ticker: h.ticker,
                  type: h.type || "other",
                  amount: h.marketValue,
                  share: totalPortfolioValue > 0
                    ? `${((h.marketValue / totalPortfolioValue) * 100).toFixed(1)}%`
                    : '0%',
                  borderColor: [
                    "border-blue-500 dark:border-blue-500",
                    "border-gray-500 dark:border-gray-500",
                    "border-cyan-500 dark:border-cyan-500",
                    "border-amber-500 dark:border-amber-500",
                    "border-emerald-500 dark:border-emerald-500",
                    "border-violet-500 dark:border-violet-500",
                  ][index] || "border-gray-500 dark:border-gray-500",
                })),
              colors: ["blue", "gray", "cyan", "amber", "emerald", "violet"] as any,
            },
            {
              name: "Asset Classes",
              data: [
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
              ].filter(item => item.amount > 0),
              // These colors are not used when useAssetClassColors is true, but kept for compatibility
              colors: ["blue", "cyan", "amber", "emerald"] as any,
            },
            {
              name: "Accounts",
              data: accounts
                .sort((a, b) => b.totalValue - a.totalValue)
                .map((account, index) => ({
                  name: account.name,
                  amount: account.totalValue,
                  share: totalPortfolioValue > 0
                    ? `${((account.totalValue / totalPortfolioValue) * 100).toFixed(1)}%`
                    : '0%',
                  borderColor: [
                    "border-violet-500 dark:border-violet-500",
                    "border-fuchsia-500 dark:border-fuchsia-500",
                    "border-pink-500 dark:border-pink-500",
                    "border-sky-500 dark:border-sky-500",
                    "border-lime-500 dark:border-lime-500",
                  ][index] || "border-gray-500 dark:border-gray-500",
                  institution: account.institution,
                })),
              colors: ["violet", "fuchsia", "pink", "sky", "lime"] as any,
            },
          ]}
        />
      </dl>
      </>
      )}
    </main>
  )
}
