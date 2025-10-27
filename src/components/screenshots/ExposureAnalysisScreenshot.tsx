"use client"

import React from "react"
import { cx } from "@/lib/utils"

export function ExposureAnalysisScreenshot() {
  const exposures = [
    { ticker: "AAPL", name: "Apple Inc.", value: 8.2, color: "bg-blue-500" },
    { ticker: "MSFT", name: "Microsoft Corp.", value: 7.1, color: "bg-blue-600" },
    { ticker: "NVDA", name: "NVIDIA Corp.", value: 5.8, color: "bg-indigo-500" },
    { ticker: "AMZN", name: "Amazon.com Inc.", value: 4.3, color: "bg-purple-500" },
    { ticker: "GOOGL", name: "Alphabet Inc.", value: 3.9, color: "bg-pink-500" },
    { ticker: "META", name: "Meta Platforms", value: 3.2, color: "bg-rose-500" },
    { ticker: "TSLA", name: "Tesla Inc.", value: 2.8, color: "bg-orange-500" },
    { ticker: "BRK.B", name: "Berkshire Hathaway", value: 2.4, color: "bg-amber-500" },
  ]

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
            portfolio.app/exposure
          </div>
        </div>
      </div>

      {/* Dashboard content */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-6 space-y-6 rounded-b-lg">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                Exposure Analysis
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                ETF look-through analysis showing underlying holdings
              </p>
            </div>
            <select className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md">
              <option>All Accounts</option>
              <option>401(k)</option>
              <option>IRA</option>
              <option>Taxable</option>
            </select>
          </div>

          {/* Treemap visualization */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-4 gap-1">
              {exposures.slice(0, 4).map((item, index) => {
                const sizes = [
                  "col-span-2 row-span-2",
                  "col-span-2 row-span-1",
                  "col-span-1 row-span-1",
                  "col-span-1 row-span-1",
                ]
                return (
                  <div
                    key={index}
                    className={cx(
                      sizes[index],
                      item.color,
                      "rounded p-3 flex flex-col justify-between text-white"
                    )}
                    style={{
                      minHeight: index === 0 ? "160px" : "80px",
                    }}
                  >
                    <div>
                      <p className="text-lg font-bold">{item.ticker}</p>
                      <p className="text-xs opacity-90">{item.name}</p>
                    </div>
                    <p className="text-xl font-bold">{item.value}%</p>
                  </div>
                )
              })}
            </div>
            <div className="grid grid-cols-4 gap-1 mt-1">
              {exposures.slice(4, 8).map((item, index) => (
                <div
                  key={index}
                  className={cx(
                    "col-span-1",
                    item.color,
                    "rounded p-2 text-white"
                  )}
                  style={{
                    minHeight: "60px",
                  }}
                >
                  <p className="text-sm font-bold">{item.ticker}</p>
                  <p className="text-xs opacity-90">{item.value}%</p>
                </div>
              ))}
            </div>
          </div>

          {/* Expandable table */}
          <div className="border dark:border-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                  <th className="text-left text-xs font-medium text-gray-600 dark:text-gray-400 p-3">
                    HOLDING
                  </th>
                  <th className="text-right text-xs font-medium text-gray-600 dark:text-gray-400 p-3">
                    DIRECT
                  </th>
                  <th className="text-right text-xs font-medium text-gray-600 dark:text-gray-400 p-3">
                    VIA ETF
                  </th>
                  <th className="text-right text-xs font-medium text-gray-600 dark:text-gray-400 p-3">
                    TOTAL
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b dark:border-gray-800">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">▶</span>
                      <div className="size-6 rounded bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                        S
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                          SPY
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          SPDR S&P 500 ETF
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="text-right p-3 text-sm text-gray-900 dark:text-gray-50">
                    14.9%
                  </td>
                  <td className="text-right p-3 text-sm text-gray-500 dark:text-gray-400">
                    -
                  </td>
                  <td className="text-right p-3 text-sm font-medium text-gray-900 dark:text-gray-50">
                    14.9%
                  </td>
                </tr>
                <tr className="border-b dark:border-gray-800">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 dark:text-gray-50">▼</span>
                      <div className="size-6 rounded bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-xs font-semibold">
                        Q
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                          QQQ
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Invesco QQQ Trust
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="text-right p-3 text-sm text-gray-900 dark:text-gray-50">
                    9.4%
                  </td>
                  <td className="text-right p-3 text-sm text-gray-500 dark:text-gray-400">
                    -
                  </td>
                  <td className="text-right p-3 text-sm font-medium text-gray-900 dark:text-gray-50">
                    9.4%
                  </td>
                </tr>
                {/* Expanded ETF holdings */}
                <tr className="bg-gray-50 dark:bg-gray-950">
                  <td className="pl-12 p-3">
                    <div className="flex items-center gap-2">
                      <div className="size-5 rounded bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-white text-xs font-semibold">
                        A
                      </div>
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          AAPL
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Apple Inc.
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="text-right p-3 text-sm text-gray-700 dark:text-gray-300">
                    3.2%
                  </td>
                  <td className="text-right p-3 text-sm text-gray-500 dark:text-gray-400">
                    0.7%
                  </td>
                  <td className="text-right p-3 text-sm text-gray-700 dark:text-gray-300">
                    3.9%
                  </td>
                </tr>
                <tr className="bg-gray-50 dark:bg-gray-950">
                  <td className="pl-12 p-3">
                    <div className="flex items-center gap-2">
                      <div className="size-5 rounded bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-white text-xs font-semibold">
                        M
                      </div>
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          MSFT
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Microsoft Corp.
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="text-right p-3 text-sm text-gray-700 dark:text-gray-300">
                    2.8%
                  </td>
                  <td className="text-right p-3 text-sm text-gray-500 dark:text-gray-400">
                    0.6%
                  </td>
                  <td className="text-right p-3 text-sm text-gray-700 dark:text-gray-300">
                    3.4%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}