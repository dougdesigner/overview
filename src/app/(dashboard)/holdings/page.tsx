"use client"

import { Button } from "@/components/Button"
import { Divider } from "@/components/Divider"
import {
  HoldingsDrawer,
  type HoldingFormData,
} from "@/components/ui/HoldingsDrawer"
import { HoldingsTable } from "@/components/ui/data-table-holdings/HoldingsTable"
import { Holding } from "@/components/ui/data-table-holdings/types"
import { RiAddLine } from "@remixicon/react"
import React from "react"

export default function HoldingsPage() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [editingHolding, setEditingHolding] = React.useState<Holding | null>(null)

  // Example accounts data - in a real app this would come from state or API
  const accounts = [
    { id: "1", name: "Retirement Fund", institution: "fidelity" },
    { id: "2", name: "Personal Investment", institution: "wealthfront" },
    { id: "3", name: "Tax-Free Growth", institution: "vanguard" },
    { id: "4", name: "Emergency Fund", institution: "chase" },
  ]

  // Example holdings data - in a real app this would come from state or API
  const [holdings, setHoldings] = React.useState<Holding[]>([
    {
      id: "h1",
      accountId: "1",
      accountName: "Retirement Fund",
      ticker: "VOO",
      name: "Vanguard S&P 500 ETF",
      quantity: 100,
      lastPrice: 455.32,
      marketValue: 45532.00,
      allocation: 15.2,
      type: "fund",
    },
    {
      id: "h2",
      accountId: "2",
      accountName: "Personal Investment",
      ticker: "AAPL",
      name: "Apple Inc.",
      quantity: 50,
      lastPrice: 189.87,
      marketValue: 9493.50,
      allocation: 8.5,
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
      allocation: 4.2,
      type: "stock",
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
      allocation: 12.1,
      type: "fund",
    },
    {
      id: "h5",
      accountId: "4",
      accountName: "Emergency Fund",
      ticker: undefined,
      name: "Emergency Savings",
      quantity: 25000,
      lastPrice: 1,
      marketValue: 25000.00,
      allocation: 10.8,
      type: "cash",
    },
    {
      id: "h6",
      accountId: "2",
      accountName: "Personal Investment",
      ticker: "MSFT",
      name: "Microsoft Corporation",
      quantity: 30,
      lastPrice: 378.52,
      marketValue: 11355.60,
      allocation: 9.7,
      type: "stock",
    },
    {
      id: "h7",
      accountId: "1",
      accountName: "Retirement Fund",
      ticker: "BND",
      name: "Vanguard Total Bond Market ETF",
      quantity: 200,
      lastPrice: 72.18,
      marketValue: 14436.00,
      allocation: 11.5,
      type: "fund",
    },
    {
      id: "h8",
      accountId: "3",
      accountName: "Tax-Free Growth",
      ticker: "GOOGL",
      name: "Alphabet Inc. Class A",
      quantity: 20,
      lastPrice: 139.67,
      marketValue: 2793.40,
      allocation: 3.8,
      type: "stock",
    },
    {
      id: "h9",
      accountId: "2",
      accountName: "Personal Investment",
      ticker: undefined,
      name: "Settlement Fund",
      quantity: 5000,
      lastPrice: 1,
      marketValue: 5000.00,
      allocation: 2.4,
      type: "cash",
    },
  ])

  const handleHoldingSubmit = (holding: HoldingFormData) => {
    if (editingHolding) {
      // Update existing holding
      setHoldings(prev => prev.map(h =>
        h.id === editingHolding.id
          ? {
              ...h,
              ticker: holding.ticker,
              name: holding.ticker || holding.description || "",
              quantity: holding.shares || holding.amount || 0,
              // In real app, would fetch latest price
              lastPrice: h.lastPrice,
              marketValue: (holding.shares || holding.amount || 0) * h.lastPrice,
            }
          : h
      ))
    } else {
      // Add new holding
      const account = accounts.find(a => a.id === holding.accountId)
      const newHolding: Holding = {
        id: Date.now().toString(),
        accountId: holding.accountId,
        accountName: account?.name || "",
        ticker: holding.ticker,
        name: holding.ticker || holding.description || "",
        quantity: holding.shares || holding.amount || 0,
        lastPrice: holding.holdingType === "cash" ? 1 : 100, // In real app, would fetch from API
        marketValue: (holding.shares || holding.amount || 0) * (holding.holdingType === "cash" ? 1 : 100),
        allocation: 5, // Would be calculated based on total portfolio
        type: holding.holdingType === "cash" ? "cash" : "stock",
      }
      setHoldings(prev => [...prev, newHolding])
    }
    setEditingHolding(null)
    setIsOpen(false)
  }

  const handleEdit = (holding: Holding) => {
    setEditingHolding(holding)
    setIsOpen(true)
  }

  const handleDelete = (holdingId: string) => {
    setHoldings(prev => prev.filter(h => h.id !== holdingId))
  }
  return (
    <main>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
            Holdings
          </h1>
          <p className="text-gray-500 sm:text-sm/6 dark:text-gray-500">
            See all your investments in one place, across every account
          </p>
        </div>
        <Button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 text-base sm:text-sm"
        >
          Add Holdings
          <RiAddLine className="-mr-0.5 size-5 shrink-0" aria-hidden="true" />
        </Button>
        <HoldingsDrawer
          open={isOpen}
          onOpenChange={setIsOpen}
          accounts={accounts}
          onSubmit={handleHoldingSubmit}
        />
      </div>
      <Divider />

      {/* Holdings Table */}
      <div className="mt-8">
        <HoldingsTable
          holdings={holdings}
          accounts={accounts}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </main>
  )
}
