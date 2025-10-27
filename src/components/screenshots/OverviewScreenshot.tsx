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
                $2,847,392
              </p>
              <div className="flex items-center gap-4 mt-3">
                <span className="text-sm text-green-600 dark:text-green-400">
                  ↑ 12.4%
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  +$314,892 YTD
                </span>
              </div>
            </div>
            <div className="h-16 w-32 bg-gradient-to-t from-blue-200 to-blue-500 dark:from-blue-900 dark:to-blue-600 rounded opacity-50" />
          </div>
        </div>

        {/* Asset class cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "U.S. Stocks", value: "$1,423,696", color: "bg-blue-500" },
            { label: "Int'l Stocks", value: "$854,218", color: "bg-emerald-500" },
            { label: "Fixed Income", value: "$427,109", color: "bg-amber-500" },
            { label: "Cash", value: "$142,369", color: "bg-gray-500" },
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

        {/* Chart placeholder */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-50 mb-4">
            Performance
          </p>
          <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 rounded-lg flex items-end p-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 mx-0.5"
                style={{
                  height: `${30 + Math.random() * 70}%`,
                }}
              >
                <div className="h-full bg-blue-500 dark:bg-blue-600 rounded-t opacity-80" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}