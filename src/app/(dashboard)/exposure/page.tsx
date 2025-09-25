"use client"

import { Divider } from "@/components/Divider"
import { ExposureTable } from "@/components/ui/data-table-exposure/ExposureTable"
import { PortfolioHolding } from "@/components/ui/data-table-exposure/types"
import React from "react"

export default function ExposurePage() {
  // Example holdings data - in a real app this would come from state or API
  // This includes both direct stock holdings and ETF holdings
  const [holdings] = React.useState<PortfolioHolding[]>([
    // ETF Holdings
    {
      id: "h1",
      accountId: "1",
      accountName: "Retirement Fund",
      ticker: "VOO",
      name: "Vanguard S&P 500 ETF",
      quantity: 100,
      lastPrice: 455.32,
      marketValue: 45532.0,
      type: "fund",
    },
    {
      id: "h4",
      accountId: "3",
      accountName: "Tax-Free Growth",
      ticker: "VTI",
      name: "Vanguard Total Stock Market ETF",
      quantity: 75,
      lastPrice: 238.45,
      marketValue: 17883.75,
      type: "fund",
    },
    {
      id: "h10",
      accountId: "3",
      accountName: "Tax-Free Growth",
      ticker: "QQQ",
      name: "Invesco QQQ Trust",
      quantity: 50,
      lastPrice: 455.32,
      marketValue: 22766.0,
      type: "fund",
    },
    {
      id: "h11",
      accountId: "2",
      accountName: "Personal Investment",
      ticker: "SPY",
      name: "SPDR S&P 500 ETF Trust",
      quantity: 30,
      lastPrice: 450.0,
      marketValue: 13500.0,
      type: "fund",
    },
    // Direct Stock Holdings
    {
      id: "h2",
      accountId: "2",
      accountName: "Personal Investment",
      ticker: "AAPL",
      name: "Apple Inc.",
      quantity: 50,
      lastPrice: 189.87,
      marketValue: 9493.5,
      type: "stock",
    },
    {
      id: "h3",
      accountId: "1",
      accountName: "Retirement Fund",
      ticker: "AAPL",
      name: "Apple Inc.",
      quantity: 25,
      lastPrice: 189.87,
      marketValue: 4746.75,
      type: "stock",
    },
    {
      id: "h6",
      accountId: "2",
      accountName: "Personal Investment",
      ticker: "MSFT",
      name: "Microsoft Corporation",
      quantity: 30,
      lastPrice: 378.52,
      marketValue: 11355.6,
      type: "stock",
    },
    {
      id: "h8",
      accountId: "3",
      accountName: "Tax-Free Growth",
      ticker: "GOOGL",
      name: "Alphabet Inc. Class A",
      quantity: 20,
      lastPrice: 139.67,
      marketValue: 2793.4,
      type: "stock",
    },
    {
      id: "h12",
      accountId: "1",
      accountName: "Retirement Fund",
      ticker: "NVDA",
      name: "NVIDIA Corporation",
      quantity: 15,
      lastPrice: 485.0,
      marketValue: 7275.0,
      type: "stock",
    },
    {
      id: "h13",
      accountId: "2",
      accountName: "Personal Investment",
      ticker: "AMZN",
      name: "Amazon.com Inc.",
      quantity: 10,
      lastPrice: 145.0,
      marketValue: 1450.0,
      type: "stock",
    },
    {
      id: "h14",
      accountId: "1",
      accountName: "Retirement Fund",
      ticker: "TSLA",
      name: "Tesla Inc.",
      quantity: 20,
      lastPrice: 250.0,
      marketValue: 5000.0,
      type: "stock",
    },
    // Cash holdings (not included in exposure calculation)
    {
      id: "h5",
      accountId: "4",
      accountName: "Emergency Fund",
      name: "Emergency Savings",
      quantity: 25000,
      lastPrice: 1,
      marketValue: 25000.0,
      type: "cash",
    },
    {
      id: "h9",
      accountId: "2",
      accountName: "Personal Investment",
      name: "Settlement Fund",
      quantity: 5000,
      lastPrice: 1,
      marketValue: 5000.0,
      type: "cash",
    },
  ])

  const handleRefresh = () => {
    // In a real app, this would refresh data from API
    console.log("Refreshing exposure data...")
  }

  return (
    <main>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
            Exposure
          </h1>
          <p className="text-gray-500 sm:text-sm/6 dark:text-gray-500">
            See your true stock exposure across all ETFs and direct holdings
          </p>
        </div>
      </div>
      <Divider />

      {/* Exposure Table */}
      <div className="mt-8">
        <ExposureTable holdings={holdings} onRefresh={handleRefresh} />
      </div>
    </main>
  )
}
