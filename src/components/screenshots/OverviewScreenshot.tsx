"use client"

import React from "react"
import { cx } from "@/lib/utils"

export function OverviewScreenshot() {
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
            portfolio.app/overview
          </div>
        </div>
      </div>

      {/* Dashboard content */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-6 space-y-6 rounded-b-lg">
        {/* Portfolio value card mockup */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Portfolio Value
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-50 mt-1">
                $2,121,302
              </p>
              <div className="flex items-center gap-4 mt-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  4 accounts • 32 holdings
                </span>
              </div>
            </div>
            <div className="h-16 w-32 bg-gradient-to-t from-blue-200 to-blue-500 dark:from-blue-900 dark:to-blue-600 rounded opacity-50" />
          </div>
        </div>

        {/* Asset class cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "U.S. Stocks", value: "$1,272,781", color: "bg-blue-500" },
            { label: "Int'l Stocks", value: "$424,260", color: "bg-emerald-500" },
            { label: "Fixed Income", value: "$318,195", color: "bg-amber-500" },
            { label: "Cash", value: "$106,066", color: "bg-gray-500" },
          ].map((item, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={cx("size-2 rounded-full", item.color)} />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.label}
                </p>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* Asset Allocation visualization */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-4">
            Asset Allocation
          </p>
          <div className="flex items-center justify-between">
            {/* Donut chart placeholder */}
            <div className="relative size-40">
              <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="35"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="20"
                  className="text-blue-500"
                  strokeDasharray="131.95 88"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="35"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="20"
                  className="text-emerald-500"
                  strokeDasharray="79.17 140.78"
                  strokeDashoffset="-131.95"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="35"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="20"
                  className="text-amber-500"
                  strokeDasharray="43.98 175.97"
                  strokeDashoffset="-211.12"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="35"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="20"
                  className="text-gray-500"
                  strokeDasharray="8.8 211.15"
                  strokeDashoffset="-255.1"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-50">$2.1M</p>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2">
              {[
                { label: "U.S. Stocks", value: "60%", color: "bg-blue-500" },
                { label: "Int'l Stocks", value: "20%", color: "bg-emerald-500" },
                { label: "Fixed Income", value: "15%", color: "bg-amber-500" },
                { label: "Cash", value: "5%", color: "bg-gray-500" },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className={cx("size-3 rounded-full", item.color)} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-50 ml-auto">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}