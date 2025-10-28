"use client"

import React from "react"

export function AccountsScreenshot() {
  const accounts = [
    {
      name: "401(k) - Fidelity",
      type: "401(k)",
      institution: "Fidelity",
      value: "$842,156",
      allocation: { stocks: 70, bonds: 25, cash: 5 },
      color: "bg-purple-500",
    },
    {
      name: "IRA - Vanguard",
      type: "Traditional IRA",
      institution: "Vanguard",
      value: "$523,481",
      allocation: { stocks: 60, bonds: 35, cash: 5 },
      color: "bg-red-500",
    },
    {
      name: "Roth IRA - Schwab",
      type: "Roth IRA",
      institution: "Charles Schwab",
      value: "$298,742",
      allocation: { stocks: 80, bonds: 15, cash: 5 },
      color: "bg-blue-500",
    },
    {
      name: "Taxable - E*TRADE",
      type: "Taxable",
      institution: "E*TRADE",
      value: "$456,923",
      allocation: { stocks: 65, bonds: 20, cash: 15 },
      color: "bg-green-500",
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
            portfolio.app/accounts
          </div>
        </div>
      </div>

      {/* Accounts page content */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-6 space-y-6 rounded-b-lg">
        {/* Header with total */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
              Investment Accounts
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              4 accounts • Total value: $2,121,302
            </p>
          </div>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600">
            + Add Account
          </button>
        </div>

        {/* Account cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((account, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-900 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`size-10 rounded-lg ${account.color} flex items-center justify-center text-white font-bold`}
                  >
                    {account.institution[0]}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-50">
                      {account.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {account.type}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold text-gray-900 dark:text-gray-50">
                    {account.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Current balance
                  </p>
                </div>
              </div>

              {/* Mini allocation bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Asset Allocation</span>
                </div>
                <div className="flex h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800">
                  <div
                    className="bg-blue-500"
                    style={{ width: `${account.allocation.stocks}%` }}
                  />
                  <div
                    className="bg-amber-500"
                    style={{ width: `${account.allocation.bonds}%` }}
                  />
                  <div
                    className="bg-gray-500"
                    style={{ width: `${account.allocation.cash}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <div className="size-2 rounded-full bg-blue-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Stocks {account.allocation.stocks}%
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="size-2 rounded-full bg-amber-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Bonds {account.allocation.bonds}%
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="size-2 rounded-full bg-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Cash {account.allocation.cash}%
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}