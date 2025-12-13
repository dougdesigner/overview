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
import { useState, useRef, useEffect } from "react"
import { useDebouncedCallback } from "use-debounce"
import { TickerLogo } from "./TickerLogo"

interface TickerSelectorProps {
  value: string
  onValueChange: (value: string) => void
  onTickerSelect?: (ticker: { symbol: string; name: string; type: string }) => void
  placeholder?: string
  className?: string
  id?: string
}

export function TickerSelector({
  value,
  onValueChange,
  onTickerSelect,
  placeholder = "Select a ticker",
  className,
  id,
}: TickerSelectorProps) {
  const [search, setSearch] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [apiResults, setApiResults] = useState<TickerOption[]>([])
  const [selectedApiTicker, setSelectedApiTicker] = useState<TickerOption | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  // Debounced search function (300ms delay, 3+ chars)
  const debouncedSearch = useDebouncedCallback(async (query: string) => {
    if (query.length < 3) {
      setApiResults([])
      setIsSearching(false)
      return
    }

    // Cancel previous request
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    setIsSearching(true)
    try {
      const response = await fetch(
        `/api/symbol-search?keywords=${encodeURIComponent(query)}`,
        { signal: abortControllerRef.current.signal }
      )
      const data = await response.json()

      // Convert to TickerOption format
      const results: TickerOption[] = data.matches.map((m: { symbol: string; name: string; type: string }) => ({
        symbol: m.symbol,
        name: m.name,
        type: m.type === "ETF" ? "etf" as const : "stock" as const
      }))

      setApiResults(results)
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Symbol search failed:", error)
      }
    } finally {
      setIsSearching(false)
    }
  }, 300)
  const renderTickerOption = (ticker: TickerOption) => {
    return (
      <div className="flex items-center gap-2">
        <TickerLogo
          ticker={ticker.symbol}
          type={ticker.type === "mutual-fund" ? "mutual-fund" : ticker.type}
          companyName={ticker.name}
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
            {ticker.type === "etf"
              ? "ETF"
              : ticker.type === "mutual-fund"
                ? "MF"
                : "Stock"}
          </Badge>
        </div>
        <span className="max-w-[150px] truncate text-xs text-gray-500 dark:text-gray-400">
          {ticker.name}
        </span>
      </div>
    )
  }

  // Helper to render selected ticker display
  const renderSelectedTicker = (ticker: TickerOption) => (
    <div className="flex items-center gap-2">
      <TickerLogo
        ticker={ticker.symbol}
        type={ticker.type === "mutual-fund" ? "mutual-fund" : ticker.type}
        className="size-5"
      />
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
        {ticker.type === "etf"
          ? "ETF"
          : ticker.type === "mutual-fund"
            ? "MF"
            : "STOCK"}
      </Badge>
    </div>
  )

  const getSelectedDisplay = () => {
    // First check if we have a stored API selection
    if (selectedApiTicker && selectedApiTicker.symbol === value) {
      return renderSelectedTicker(selectedApiTicker)
    }

    // Fall back to static list
    const selectedTicker = popularTickers.find((t) => t.symbol === value)
    if (selectedTicker) {
      return renderSelectedTicker(selectedTicker)
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
        t.name.toLowerCase().includes(searchLower),
    )
  }

  // Merge API results with static list (deduplicate by symbol)
  const mergeWithApiResults = (staticList: TickerOption[]) => {
    if (apiResults.length === 0) return staticList
    const staticSymbols = new Set(staticList.map((t) => t.symbol))
    const uniqueApiResults = apiResults.filter((t) => !staticSymbols.has(t.symbol))
    return [...staticList, ...uniqueApiResults]
  }

  // Separate and filter stocks, ETFs, and mutual funds
  const filteredStocks = filterTickers(popularTickers.filter((t) => t.type === "stock"))
  const filteredEtfs = filterTickers(popularTickers.filter((t) => t.type === "etf"))
  const filteredMutualFunds = filterTickers(
    popularTickers.filter((t) => t.type === "mutual-fund"),
  )

  // Merge API results into respective categories
  const stocks = mergeWithApiResults(filteredStocks).filter((t) => t.type === "stock")
  const etfs = mergeWithApiResults(filteredEtfs).filter((t) => t.type === "etf")
  const mutualFunds = filteredMutualFunds // API doesn't return mutual funds

  const hasResults = stocks.length > 0 || etfs.length > 0 || mutualFunds.length > 0

  // Handle select open/close
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setSearch("") // Clear search when closing
      setApiResults([]) // Clear API results
      setIsSearching(false)
    }
  }

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearch(value)
    debouncedSearch(value)
  }

  return (
    <Select
      value={value}
      onValueChange={(val) => {
        // Find full ticker data from API results or popular tickers
        const apiTicker = apiResults.find((t) => t.symbol === val)
        const popularTicker = popularTickers.find((t) => t.symbol === val)
        const tickerData = apiTicker || popularTicker

        // Store API ticker for display purposes
        if (apiTicker) {
          setSelectedApiTicker(apiTicker)
        } else {
          setSelectedApiTicker(null)
        }

        // Call onTickerSelect with full ticker data if available
        if (tickerData && onTickerSelect) {
          onTickerSelect({
            symbol: tickerData.symbol,
            name: tickerData.name,
            type: tickerData.type,
          })
        }

        onValueChange(val)
        setSearch("") // Clear search after selection
        setApiResults([]) // Clear API results
      }}
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      <SelectTrigger className={className} id={id}>
        <SelectValue placeholder={placeholder}>
          {getSelectedDisplay()}
        </SelectValue>
      </SelectTrigger>
      <SelectContent hideScrollButtons>
        {/* Search input - negative margins to cover viewport padding and prevent content clipping */}
        <div className="sticky -top-1 z-10 -mx-1 border-b border-gray-200 bg-white px-3 pb-4 pt-4 dark:border-gray-800 dark:bg-gray-950">
          <Input
            placeholder="Search tickers..."
            value={search}
            onChange={handleSearchChange}
            onKeyDown={(e) => e.stopPropagation()} // Prevent Radix from intercepting
            className="h-8"
            autoFocus
          />
        </div>

        {/* Loading state - shown inline while searching */}
        {isSearching && (
          <div className="px-2 py-2 text-center text-sm text-gray-500 dark:text-gray-400">
            Searching...
          </div>
        )}

        {/* No results message */}
        {!hasResults && !isSearching && (
          <div className="px-2 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
            No tickers found
          </div>
        )}

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
      </SelectContent>
    </Select>
  )
}
