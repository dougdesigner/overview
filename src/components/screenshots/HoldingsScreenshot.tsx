"use client"

import React from "react"
import { cx } from "@/lib/utils"

export function HoldingsScreenshot() {
  const holdings = [
    {
      ticker: "VTI",
      name: "Vanguard Total Stock Market ETF",
      quantity: "1,245",
      price: "$228.45",
      value: "$284,320",
      weight: "13.4%",
      assetClass: "U.S. Stocks",
      assetClassColor: "bg-blue-500",
    },
    {
      ticker: "VXUS",
      name: "Vanguard Total International Stock ETF",
      quantity: "2,180",
      price: "$61.23",
      value: "$133,481",
      weight: "6.3%",
      assetClass: "Int'l Stocks",
      assetClassColor: "bg-emerald-500",
    },
    {
      ticker: "BND",
      name: "Vanguard Total Bond Market ETF",
      quantity: "1,850",
      price: "$71.84",
      value: "$132,904",
      weight: "6.3%",
      assetClass: "Fixed Income",
      assetClassColor: "bg-amber-500",
    },
    {
      ticker: "AAPL",
      name: "Apple Inc.",
      quantity: "450",
      price: "$192.53",
      value: "$86,639",
      weight: "4.1%",
      assetClass: "U.S. Stocks",
      assetClassColor: "bg-blue-500",
    },
    {
      ticker: "MSFT",
      name: "Microsoft Corporation",
      quantity: "235",
      price: "$380.54",
      value: "$89,427",
      weight: "4.2%",
      assetClass: "U.S. Stocks",
      assetClassColor: "bg-blue-500",
    },
    {
      ticker: "VOO",
      name: "Vanguard S&P 500 ETF",
      quantity: "185",
      price: "$432.18",
      value: "$79,953",
      weight: "3.8%",
      assetClass: "U.S. Stocks",
      assetClassColor: "bg-blue-500",
    },
    {
      ticker: "QQQ",
      name: "Invesco QQQ Trust",
      quantity: "210",
      price: "$378.92",
      value: "$79,573",
      weight: "3.8%",
      assetClass: "U.S. Stocks",
      assetClassColor: "bg-blue-500",
    },
    {
      ticker: "VMFXX",
      name: "Vanguard Federal Money Market",
      quantity: "142,369",
      price: "$1.00",
      value: "$142,369",
      weight: "6.7%",
      assetClass: "Cash",
      assetClassColor: "bg-gray-500",
    },
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
            portfolio.app/holdings
          </div>
        </div>
      </div>

      {/* Holdings page content */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-6 rounded-b-lg">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm">
          {/* Header */}
          <div className="p-4 border-b dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  All Holdings
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {holdings.length} positions across all accounts
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search holdings..."
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
                />
                <button className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                  Filter
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-950">
                <tr className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Holding</th>
                  <th className="text-right px-4 py-3">Quantity</th>
                  <th className="text-right px-4 py-3">Price</th>
                  <th className="text-right px-4 py-3">Value</th>
                  <th className="text-right px-4 py-3">Weight</th>
                  <th className="text-left px-4 py-3">Asset Class</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {holdings.map((holding, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 dark:hover:bg-gray-950 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                          {holding.ticker.slice(0, 2)}
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
                    </td>
                    <td className="text-right px-4 py-3 text-sm text-gray-900 dark:text-gray-50">
                      {holding.quantity}
                    </td>
                    <td className="text-right px-4 py-3 text-sm text-gray-900 dark:text-gray-50">
                      {holding.price}
                    </td>
                    <td className="text-right px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                        {holding.value}
                      </p>
                    </td>
                    <td className="text-right px-4 py-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
                        {holding.weight}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cx(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
                          "bg-opacity-10"
                        )}
                      >
                        <div className={cx("size-2 rounded-full", holding.assetClassColor)} />
                        <span className="text-gray-700 dark:text-gray-300">
                          {holding.assetClass}
                        </span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary footer */}
          <div className="p-4 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                Showing {holdings.length} of {holdings.length} holdings
              </span>
              <div className="flex items-center gap-4">
                <span className="text-gray-900 dark:text-gray-50 font-medium">
                  Total Portfolio Value: $2,121,302
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}