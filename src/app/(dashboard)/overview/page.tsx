"use client"

import { Card } from "@/components/Card"
import { CategoryBar } from "@/components/CategoryBar"
import { Divider } from "@/components/Divider"
import { DonutChart } from "@/components/DonutChart"
import KPICard from "@/components/KPICard"
import SankeyChart from "@/components/SankeyChart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Tabs"
import { RiArrowRightSLine } from "@remixicon/react"
import { cx } from "@/lib/utils"
import { AvailableChartColorsKeys } from "@/lib/chartUtils"
import React from "react"

export default function OverviewPage() {
  const [isOpen, setIsOpen] = React.useState(false)

  // Calculate account count from Sankey data
  const accountCount = 5 // 401(k), Personal Investment, Roth IRA, Savings, Checking

  // Data for donut charts
  const dataByAssetClass = [
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

  const dataByAccount = [
    {
      name: "401(k)",
      amount: 98987,
      share: "40.0%",
      borderColor: "border-violet-500 dark:border-violet-500",
    },
    {
      name: "Personal Investment",
      amount: 74240,
      share: "30.0%",
      borderColor: "border-fuchsia-500 dark:border-fuchsia-500",
    },
    {
      name: "Roth IRA",
      amount: 49494,
      share: "20.0%",
      borderColor: "border-pink-500 dark:border-pink-500",
    },
    {
      name: "Savings",
      amount: 17224,
      share: "7.0%",
      borderColor: "border-sky-500 dark:border-sky-500",
    },
    {
      name: "Checking",
      amount: 7423,
      share: "3.0%",
      borderColor: "border-lime-500 dark:border-lime-500",
    },
  ]

  const summary = [
    {
      name: "Asset Class",
      data: dataByAssetClass,
      colors: ["blue", "cyan", "amber", "emerald"] as AvailableChartColorsKeys[],
    },
    {
      name: "Account",
      data: dataByAccount,
      colors: ["violet", "fuchsia", "pink", "sky", "lime"] as AvailableChartColorsKeys[],
    },
  ]

  const currencyFormatter = (number: number) => {
    return "$" + Intl.NumberFormat("us").format(number).toString()
  }

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
      <dl className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-1 lg:grid-cols-1">
        {/* Portfolio Value Card */}
        <Card>
          <dt className="text-base font-medium text-gray-900 dark:text-gray-50">
            Portfolio Value
          </dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-50">
            $247,468
          </dd>
          <div className="mt-1 text-sm font-normal text-gray-500 dark:text-gray-400">
            {accountCount} {accountCount === 1 ? "account" : "accounts"}
          </div>
          <CategoryBar
            values={[34.4, 30.6, 20.9, 14.1]}
            className="mt-6"
            colors={["blue", "cyan", "amber", "emerald"]}
            showLabels={false}
          />
          <ul
            role="list"
            className="mt-4 flex flex-wrap gap-x-10 gap-y-4 text-sm"
          >
            <li>
              <span className="text-base font-semibold text-gray-900 dark:text-gray-50">
                34.4%
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-sm bg-blue-600 dark:bg-blue-500"
                  aria-hidden="true"
                />
                <span className="text-sm">U.S. Stocks</span>
              </div>
            </li>
            <li>
              <span className="text-base font-semibold text-gray-900 dark:text-gray-50">
                30.6%
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-sm bg-cyan-600 dark:bg-cyan-500"
                  aria-hidden="true"
                />
                <span className="text-sm">Non-U.S. Stocks</span>
              </div>
            </li>
            <li>
              <span className="text-base font-semibold text-gray-900 dark:text-gray-50">
                20.9%
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-sm bg-amber-600 dark:bg-amber-500"
                  aria-hidden="true"
                />
                <span className="text-sm">Fixed Income</span>
              </div>
            </li>
            <li>
              <span className="text-base font-semibold text-gray-900 dark:text-gray-50">
                14.1%
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-sm bg-emerald-600 dark:bg-emerald-500"
                  aria-hidden="true"
                />
                <span className="text-sm">Cash</span>
              </div>
            </li>
            <li>
              <span className="text-base font-semibold text-gray-900 dark:text-gray-50">
                0%
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-sm bg-gray-400 dark:bg-gray-600"
                  aria-hidden="true"
                />
                <span className="text-sm">Other</span>
              </div>
            </li>
          </ul>
        </Card>

        {/* Asset Allocation Donut Chart */}
        <Card className="overflow-hidden p-0">
          <div className="px-6 pt-6">
            <h3 className="text-base font-medium text-gray-900 dark:text-gray-50">
              Asset Allocation
            </h3>
            <p className="mt-1 text-sm/6 text-gray-500 dark:text-gray-500">
              Portfolio distribution across asset classes and accounts
            </p>
          </div>
          <Tabs defaultValue={summary[0].name}>
            <TabsList className="px-6 pt-6">
              {summary.map((category) => (
                <TabsTrigger key={category.name} value={category.name}>
                  By {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="pt-8">
              {summary.map((category) => (
                <TabsContent key={category.name} value={category.name}>
                  <div className="px-6 pb-6">
                    <DonutChart
                      className="mx-auto"
                      data={category.data}
                      value="amount"
                      category="name"
                      valueFormatter={currencyFormatter}
                      showLabel={true}
                      showTooltip={false}
                      colors={category.colors}
                    />
                  </div>
                  <ul
                    role="list"
                    className="mt-2 divide-y divide-gray-200 border-t border-gray-200 text-sm text-gray-500 dark:divide-gray-800 dark:border-gray-800 dark:text-gray-500"
                  >
                    {category.data.map((item) => (
                      <li
                        key={item.name}
                        className="group relative flex items-center justify-between space-x-4 truncate pr-4 hover:bg-gray-50 hover:dark:bg-gray-900"
                      >
                        <div
                          className={cx(
                            item.borderColor,
                            "flex h-12 items-center truncate border-l-2 pl-4"
                          )}
                        >
                          <span className="truncate text-gray-700 group-hover:text-gray-900 dark:text-gray-300 group-hover:dark:text-gray-50">
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-medium tabular-nums text-gray-900 dark:text-gray-50">
                            {currencyFormatter(item.amount)}{" "}
                            <span className="font-normal text-gray-500 dark:text-gray-500">
                              ({item.share})
                            </span>
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </Card>
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
          stat="$85,129"
          change="34.4%"
          color="blue"
        />
        <KPICard
          name="Non-U.S. Stocks"
          stat="$75,725"
          change="30.6%"
          color="cyan"
        />
        <KPICard
          name="Fixed Income"
          stat="$51,721"
          change="20.9%"
          color="amber"
        />
        <KPICard name="Cash" stat="$34,893" change="14.1%" color="emerald" />
      </dl>

      <Card className="mt-8">
        <p className="text-base font-medium text-gray-900 dark:text-gray-50">
          Account Flow
        </p>
        <SankeyChart
          data={{
            nodes: [
              // Account nodes (left side)
              { id: "401(k)" },
              { id: "Personal Investment" },
              { id: "Roth IRA" },
              { id: "Savings" },
              { id: "Checking" },
              // Portfolio Total (center)
              { id: "Portfolio Total" },
              // Asset type nodes (right side)
              { id: "U.S. Stocks" },
              { id: "Non-U.S. Stocks" },
              { id: "Fixed Income" },
              { id: "Cash" },
            ],
            links: [
              // Accounts to Portfolio Total
              { source: "401(k)", target: "Portfolio Total", value: 98987 },
              {
                source: "Personal Investment",
                target: "Portfolio Total",
                value: 74240,
              },
              { source: "Roth IRA", target: "Portfolio Total", value: 49494 },
              { source: "Savings", target: "Portfolio Total", value: 17224 },
              { source: "Checking", target: "Portfolio Total", value: 7423 },
              // Portfolio Total to Asset Types
              {
                source: "Portfolio Total",
                target: "U.S. Stocks",
                value: 85129,
              },
              {
                source: "Portfolio Total",
                target: "Non-U.S. Stocks",
                value: 75725,
              },
              {
                source: "Portfolio Total",
                target: "Fixed Income",
                value: 51721,
              },
              { source: "Portfolio Total", target: "Cash", value: 34893 },
            ],
          }}
          colors={["blue", "cyan", "amber", "emerald"]}
          accountColors={["violet", "fuchsia", "pink", "sky", "lime"]}
          height={350}
        />
      </Card>
    </main>
  )
}
