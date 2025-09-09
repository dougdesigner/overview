"use client"

import { Card } from "@/components/Card"
import { CategoryBar } from "@/components/CategoryBar"
import { Divider } from "@/components/Divider"
import KPICard from "@/components/KPICard"
import SankeyChart from "@/components/SankeyChart"
import React from "react"

export default function OverviewPage() {
  const [isOpen, setIsOpen] = React.useState(false)
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
        <Card>
          <dt className="text-base font-medium text-gray-900 dark:text-gray-50">
            Portfolio Value
          </dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-50">
            $247,468
          </dd>
          <CategoryBar
            // label="Asset Allocation"
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

              {/* <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-50">
                34.4%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                $85,129 value
              </p> */}
            </li>
            <li>
              <span className="text-base font-semibold text-gray-900 dark:text-gray-50">
                30.6%
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="dark:bg-cyan-00 size-2.5 shrink-0 rounded-sm bg-cyan-600 dark:bg-cyan-500"
                  aria-hidden="true"
                />
                <span className="text-sm">Non-U.S. Stocks</span>
              </div>

              {/* <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-50">
                30.6%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                $75,725 value
              </p> */}
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

              {/* <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-50">
                20.9%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                $51,721 value
              </p> */}
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

              {/* <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-50">
                14.1%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                $34,893 value
              </p> */}
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

              {/* <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-50">
                0%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                $0 value
              </p> */}
            </li>
          </ul>
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
