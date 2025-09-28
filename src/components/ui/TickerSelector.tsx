"use client"

import { Badge } from "@/components/Badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select"
import { popularTickers, type TickerOption } from "@/lib/tickerData"
import { cx } from "@/lib/utils"
import { TickerLogo } from "./TickerLogo"

interface TickerSelectorProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  id?: string
  required?: boolean
}

export function TickerSelector({
  value,
  onValueChange,
  placeholder = "Select a ticker",
  className,
  id,
  required,
}: TickerSelectorProps) {
  const renderTickerOption = (ticker: TickerOption) => {
    return (
      <div className="flex items-center gap-2">
        <TickerLogo
          ticker={ticker.symbol}
          type={ticker.type}
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
                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
            )}
          >
            {ticker.type === "etf" ? "ETF" : "Stock"}
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
            type={selectedTicker.type}
            className="size-5"
          />
          <span className="font-medium">{selectedTicker.symbol}</span>
          <Badge
            variant="flat"
            className={cx(
              "text-xs",
              selectedTicker.type === "etf"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
            )}
          >
            {selectedTicker.type.toUpperCase()}
          </Badge>
        </div>
      )
    }

    return null
  }

  // Separate stocks and ETFs
  const stocks = popularTickers.filter((t) => t.type === "stock")
  const etfs = popularTickers.filter((t) => t.type === "etf")

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className} id={id}>
        <SelectValue placeholder={placeholder}>
          {getSelectedDisplay()}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {/* Stocks section */}
        <div className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">
          Stocks
        </div>
        {stocks.map((ticker) => (
          <SelectItem key={ticker.symbol} value={ticker.symbol}>
            {renderTickerOption(ticker)}
          </SelectItem>
        ))}

        {/* ETFs section */}
        <div className="mt-2 px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">
          ETFs
        </div>
        {etfs.map((ticker) => (
          <SelectItem key={ticker.symbol} value={ticker.symbol}>
            {renderTickerOption(ticker)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
