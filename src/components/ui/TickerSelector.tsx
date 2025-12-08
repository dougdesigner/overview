"use client"

import { Badge } from "@/components/Badge"
import { Input } from "@/components/Input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select"
import { popularTickers, type TickerOption } from "@/lib/tickerData"
import { cx } from "@/lib/utils"
import { useState } from "react"
import { TickerLogo } from "./TickerLogo"

interface TickerSelectorProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  id?: string
}

export function TickerSelector({
  value,
  onValueChange,
  placeholder = "Select a ticker",
  className,
  id,
}: TickerSelectorProps) {
  const [search, setSearch] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const renderTickerOption = (ticker: TickerOption) => {
    return (
      <div className="flex items-center gap-2">
        <TickerLogo
          ticker={ticker.symbol}
          type={ticker.type === "mutual-fund" ? "mutual-fund" : ticker.type}
          className="size-5"
        />
        <div className="flex flex-1 items-center gap-2">
          <span className="font-medium">{ticker.symbol}</span>
          <Badge
            variant="flat"
            className={cx(
              "text-xs",
              ticker.type === "etf"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                : ticker.type === "mutual-fund"
                ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
            )}
          >
            {ticker.type === "etf" ? "ETF" : ticker.type === "mutual-fund" ? "MF" : "Stock"}
          </Badge>
        </div>
        <span className="max-w-[150px] truncate text-xs text-gray-500 dark:text-gray-400">
          {ticker.name}
        </span>
      </div>
    )
  }

  const getSelectedDisplay = () => {
    const selectedTicker = popularTickers.find((t) => t.symbol === value)
    if (selectedTicker) {
      return (
        <div className="flex items-center gap-2">
          <TickerLogo
            ticker={selectedTicker.symbol}
            type={selectedTicker.type === "mutual-fund" ? "mutual-fund" : selectedTicker.type}
            className="size-5"
          />
          <span className="font-medium">{selectedTicker.symbol}</span>
          <Badge
            variant="flat"
            className={cx(
              "text-xs",
              selectedTicker.type === "etf"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                : selectedTicker.type === "mutual-fund"
                ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
            )}
          >
            {selectedTicker.type === "etf" ? "ETF" : selectedTicker.type === "mutual-fund" ? "MF" : "STOCK"}
          </Badge>
        </div>
      )
    }

    return null
  }

  // Filter function for search
  const filterTickers = (tickers: TickerOption[]) => {
    if (!search.trim()) return tickers
    const searchLower = search.toLowerCase()
    return tickers.filter(
      (t) =>
        t.symbol.toLowerCase().includes(searchLower) ||
        t.name.toLowerCase().includes(searchLower)
    )
  }

  // Separate and filter stocks, ETFs, and mutual funds
  const stocks = filterTickers(popularTickers.filter((t) => t.type === "stock"))
  const etfs = filterTickers(popularTickers.filter((t) => t.type === "etf"))
  const mutualFunds = filterTickers(popularTickers.filter((t) => t.type === "mutual-fund"))

  const hasResults = stocks.length > 0 || etfs.length > 0 || mutualFunds.length > 0

  // Handle select open/close
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setSearch("") // Clear search when closing
    }
  }

  return (
    <Select
      value={value}
      onValueChange={(val) => {
        onValueChange(val)
        setSearch("") // Clear search after selection
      }}
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      <SelectTrigger className={className} id={id}>
        <SelectValue placeholder={placeholder}>
          {getSelectedDisplay()}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {/* Search input */}
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-950">
          <Input
            placeholder="Search tickers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()} // Prevent Radix from intercepting
            className="h-8"
            autoFocus
          />
        </div>

        {!hasResults ? (
          <div className="px-2 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
            No tickers found
          </div>
        ) : (
          <>
            {/* Stocks section */}
            {stocks.length > 0 && (
              <>
                <div className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                  Stocks
                </div>
                {stocks.map((ticker) => (
                  <SelectItem key={ticker.symbol} value={ticker.symbol}>
                    {renderTickerOption(ticker)}
                  </SelectItem>
                ))}
              </>
            )}

            {/* ETFs section */}
            {etfs.length > 0 && (
              <>
                <div className="mt-2 px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                  ETFs
                </div>
                {etfs.map((ticker) => (
                  <SelectItem key={ticker.symbol} value={ticker.symbol}>
                    {renderTickerOption(ticker)}
                  </SelectItem>
                ))}
              </>
            )}

            {/* Mutual Funds section */}
            {mutualFunds.length > 0 && (
              <>
                <div className="mt-2 px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                  Mutual Funds
                </div>
                {mutualFunds.map((ticker) => (
                  <SelectItem key={ticker.symbol} value={ticker.symbol}>
                    {renderTickerOption(ticker)}
                  </SelectItem>
                ))}
              </>
            )}
          </>
        )}
      </SelectContent>
    </Select>
  )
}
