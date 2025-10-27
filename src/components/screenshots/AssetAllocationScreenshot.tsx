"use client"

import React from "react"
import { cx } from "@/lib/utils"

export function AssetAllocationScreenshot() {
  const segments = [
    { label: "U.S. Stocks", value: 50, color: "bg-blue-500" },
    { label: "Int'l Stocks", value: 30, color: "bg-emerald-500" },
    { label: "Fixed Income", value: 15, color: "bg-amber-500" },
    { label: "Cash", value: 5, color: "bg-gray-500" },
  ]

  // Calculate rotation angles for donut chart segments
  let rotation = -90 // Start from top
  const segmentAngles = segments.map((segment) => {
    const angle = (segment.value / 100) * 360
    const start = rotation
    rotation += angle
    return { ...segment, start, angle }
  })

  return (
    <div className="bg-white dark:bg-gray-950 p-6 md:p-8">
      {/* Simulated browser chrome */}
      <div className="bg-gray-100 dark:bg-gray-900 rounded-t-lg p-3 flex items-center gap-2">
        <div className="flex gap-2">
          <div className="size-3 rounded-full bg-red-400" />
          <div className="size-3 rounded-full bg-yellow-400" />
          <div className="size-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 mx-4">
          <div className="bg-white dark:bg-gray-800 rounded px-3 py-1 text-xs text-gray-500 dark:text-gray-400">
            portfolio.app/overview#allocation
          </div>
        </div>
      </div>

      {/* Dashboard content */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-6 space-y-6 rounded-b-lg">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              Asset Allocation
            </h3>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md">
                Holdings
              </button>
              <button className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
                Asset Classes
              </button>
              <button className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
                Accounts
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-center">
            {/* Donut Chart */}
            <div className="relative size-64">
              {/* Background circle */}
              <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                {segmentAngles.map((segment, index) => {
                  const radius = 40
                  const innerRadius = 25
                  const startAngle = (segment.start * Math.PI) / 180
                  const endAngle = ((segment.start + segment.angle) * Math.PI) / 180

                  const x1 = 50 + radius * Math.cos(startAngle)
                  const y1 = 50 + radius * Math.sin(startAngle)
                  const x2 = 50 + radius * Math.cos(endAngle)
                  const y2 = 50 + radius * Math.sin(endAngle)
                  const x3 = 50 + innerRadius * Math.cos(endAngle)
                  const y3 = 50 + innerRadius * Math.sin(endAngle)
                  const x4 = 50 + innerRadius * Math.cos(startAngle)
                  const y4 = 50 + innerRadius * Math.sin(startAngle)

                  const largeArcFlag = segment.angle > 180 ? 1 : 0

                  const pathData = [
                    `M ${x1} ${y1}`,
                    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                    `L ${x3} ${y3}`,
                    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
                    'Z'
                  ].join(' ')

                  return (
                    <path
                      key={index}
                      d={pathData}
                      className={cx(segment.color, "opacity-80")}
                      fill="currentColor"
                    />
                  )
                })}
              </svg>

              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                  100%
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Allocated
                </p>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-3">
              {segments.map((segment, index) => (
                <div key={index} className="flex items-center justify-between gap-8">
                  <div className="flex items-center gap-3">
                    <div className={cx("size-3 rounded-full", segment.color)} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {segment.label}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
                    {segment.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Holdings table */}
          <div className="mt-8 border-t dark:border-gray-800 pt-6">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-4">
              Top Holdings
            </p>
            <div className="space-y-2">
              {[
                { ticker: "SPY", name: "SPDR S&P 500 ETF", value: "$423,580", weight: "14.9%" },
                { ticker: "VTI", name: "Vanguard Total Stock", value: "$356,218", weight: "12.5%" },
                { ticker: "AAPL", name: "Apple Inc.", value: "$298,742", weight: "10.5%" },
                { ticker: "QQQ", name: "Invesco QQQ Trust", value: "$267,934", weight: "9.4%" },
              ].map((holding, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b dark:border-gray-800 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                      {holding.ticker[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                        {holding.ticker}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {holding.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                      {holding.value}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {holding.weight}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}