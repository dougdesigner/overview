"use client"

import { Card } from "@/components/Card"
import { Button } from "@/components/Button"
import { ExposureTable } from "@/components/ui/data-table-exposure/ExposureTable"
import { PortfolioHolding } from "@/components/ui/data-table-exposure/types"
import React from "react"

// Sample portfolio with mutual funds, ETFs, and individual stocks
const testPortfolio: PortfolioHolding[] = [
  // Mutual Funds (will be converted to ETF equivalents)
  {
    id: "1",
    accountId: "acc1",
    accountName: "401k Account",
    ticker: "VFFVX",
    name: "Vanguard Target Retirement 2055",
    quantity: 100,
    lastPrice: 100,
    marketValue: 10000,
    type: "fund"
  },
  {
    id: "2",
    accountId: "acc1",
    accountName: "401k Account",
    ticker: "VTSAX",
    name: "Vanguard Total Stock Market Index Admiral",
    quantity: 50,
    lastPrice: 120,
    marketValue: 6000,
    type: "fund"
  },
  // ETFs
  {
    id: "3",
    accountId: "acc2",
    accountName: "Taxable Brokerage",
    ticker: "QQQ",
    name: "Invesco QQQ Trust",
    quantity: 20,
    lastPrice: 400,
    marketValue: 8000,
    type: "fund"
  },
  {
    id: "4",
    accountId: "acc2",
    accountName: "Taxable Brokerage",
    ticker: "VOO",
    name: "Vanguard S&P 500 ETF",
    quantity: 10,
    lastPrice: 450,
    marketValue: 4500,
    type: "fund"
  },
  // Individual Stocks
  {
    id: "5",
    accountId: "acc2",
    accountName: "Taxable Brokerage",
    ticker: "AAPL",
    name: "Apple Inc.",
    quantity: 50,
    lastPrice: 190,
    marketValue: 9500,
    type: "stock"
  },
  {
    id: "6",
    accountId: "acc3",
    accountName: "IRA",
    ticker: "MSFT",
    name: "Microsoft Corporation",
    quantity: 30,
    lastPrice: 380,
    marketValue: 11400,
    type: "stock"
  },
  {
    id: "7",
    accountId: "acc3",
    accountName: "IRA",
    ticker: "NVDA",
    name: "NVIDIA Corporation",
    quantity: 10,
    lastPrice: 500,
    marketValue: 5000,
    type: "stock"
  },
  // Cash position
  {
    id: "8",
    accountId: "acc2",
    accountName: "Taxable Brokerage",
    name: "Cash & Money Market",
    quantity: 1,
    lastPrice: 2500,
    marketValue: 2500,
    type: "cash"
  }
]

export default function ExposureTestPage() {
  const [portfolio, setPortfolio] = React.useState<PortfolioHolding[]>(testPortfolio)
  const [showMutualFunds, setShowMutualFunds] = React.useState(true)

  const toggleMutualFunds = () => {
    if (showMutualFunds) {
      // Remove mutual funds
      setPortfolio(testPortfolio.filter(h => h.ticker !== "VFFVX" && h.ticker !== "VTSAX"))
    } else {
      // Add them back
      setPortfolio(testPortfolio)
    }
    setShowMutualFunds(!showMutualFunds)
  }

  const totalValue = portfolio.reduce((sum, h) => sum + h.marketValue, 0)

  return (
    <div className="space-y-6">
      {/* Test Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
              Enhanced Exposure Calculator Test
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Testing mutual fund support and API optimization
            </p>
          </div>
          <Button onClick={toggleMutualFunds} variant="secondary">
            {showMutualFunds ? "Remove" : "Add"} Mutual Funds
          </Button>
        </div>
      </Card>

      {/* Portfolio Summary */}
      <Card className="p-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-3">
          Test Portfolio Holdings
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolio.map(holding => (
            <div
              key={holding.id}
              className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-gray-50">
                    {holding.ticker || holding.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {holding.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {holding.accountName} • {holding.type}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm text-gray-900 dark:text-gray-50">
                    ${holding.marketValue.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {((holding.marketValue / totalValue) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              {holding.ticker === "VFFVX" && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Target Date Fund → VTI (54%) + VXUS (36%) + BND (7%) + BNDX (3%)
                  </p>
                </div>
              )}
              {holding.ticker === "VTSAX" && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Mutual Fund → VTI (100%)
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Total Portfolio Value
            </span>
            <span className="text-base font-semibold text-gray-900 dark:text-gray-50">
              ${totalValue.toLocaleString()}
            </span>
          </div>
        </div>
      </Card>

      {/* Key Features Highlight */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
          🚀 Key Improvements Implemented
        </h3>
        <ul className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
          <li>• Mutual Fund Support: VFFVX converts to multiple ETFs automatically</li>
          <li>• Asset Class Tracking: Shows allocation across equity, bonds, cash</li>
          <li>• No Stock Price API Calls: Calculates exposure using only fund values</li>
          <li>• Sector Breakdown: Aggregates sectors across all holdings</li>
          <li>• API Optimization: Reduces API calls from thousands to under 10</li>
        </ul>
      </Card>

      {/* Exposure Table with all new features */}
      <ExposureTable holdings={portfolio} />
    </div>
  )
}