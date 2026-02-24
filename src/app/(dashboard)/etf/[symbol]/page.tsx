"use client"

import { Badge } from "@/components/Badge"
import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { Divider } from "@/components/Divider"
import { TickerLogo } from "@/components/ui/TickerLogo"
import { cx } from "@/lib/utils"
import { getKnownETFName } from "@/lib/knownETFNames"
import { Icon } from "@iconify/react"
import { useParams, useRouter } from "next/navigation"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"
import HighchartsTreemap from "highcharts/modules/treemap"
import { useTheme } from "next-themes"

// Initialize Highcharts modules for Next.js
if (typeof Highcharts === "object") {
  const treemapModule = HighchartsTreemap as unknown as (
    H: typeof Highcharts,
  ) => void
  if (typeof treemapModule === "function") {
    treemapModule(Highcharts)
  }
}

interface ETFHolding {
  symbol: string
  name?: string
  weight: number
  shares?: number
}

interface ETFProfile {
  symbol: string
  name: string
  holdings: ETFHolding[]
  lastUpdated: string
  cachedAt?: string
  source?: string
  error?: string
}

// Format percentage
const formatPercentage = (value: number) => {
  return `${(value * 100).toFixed(2)}%`
}

export default function ETFDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const symbol = (params.symbol as string)?.toUpperCase()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const [etfProfile, setEtfProfile] = useState<ETFProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [sortColumn, setSortColumn] = useState<"weight" | "symbol">("weight")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const chartRef = React.useRef<HighchartsReact.RefObject>(null)

  // Hydration guard
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Fetch ETF data
  useEffect(() => {
    if (!symbol) return

    const fetchETFData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/etf-holdings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbols: [symbol] }),
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch ETF data: ${response.statusText}`)
        }

        const data = await response.json()
        const profile = data[symbol]

        if (!profile) {
          throw new Error(`No data found for ${symbol}`)
        }

        if (profile.error && profile.holdings.length === 0) {
          throw new Error(profile.error)
        }

        setEtfProfile(profile)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch ETF data",
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchETFData()
  }, [symbol])

  // Get ETF display name
  const etfName = useMemo(() => {
    if (etfProfile?.name && etfProfile.name !== `${symbol} ETF`) {
      return etfProfile.name
    }
    return getKnownETFName(symbol) || `${symbol} ETF`
  }, [symbol, etfProfile])

  // Filter valid holdings (exclude n/a and zero weight)
  const validHoldings = useMemo(() => {
    if (!etfProfile?.holdings) return []
    return etfProfile.holdings.filter(
      (h) =>
        h.symbol &&
        h.symbol !== "n/a" &&
        h.weight > 0,
    )
  }, [etfProfile])

  // Sorted holdings for table
  const sortedHoldings = useMemo(() => {
    const sorted = [...validHoldings]
    sorted.sort((a, b) => {
      if (sortColumn === "weight") {
        return sortDirection === "desc"
          ? b.weight - a.weight
          : a.weight - b.weight
      }
      return sortDirection === "desc"
        ? b.symbol.localeCompare(a.symbol)
        : a.symbol.localeCompare(b.symbol)
    })
    return sorted
  }, [validHoldings, sortColumn, sortDirection])

  // Total weight of all valid holdings
  const totalWeight = useMemo(() => {
    return validHoldings.reduce((sum, h) => sum + h.weight, 0)
  }, [validHoldings])

  // Handle column sort toggle
  const handleSort = useCallback(
    (column: "weight" | "symbol") => {
      if (sortColumn === column) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
      } else {
        setSortColumn(column)
        setSortDirection(column === "weight" ? "desc" : "asc")
      }
    },
    [sortColumn],
  )

  // Treemap colors
  const treemapColors = [
    "#3b82f6",
    "#10b981",
    "#8b5cf6",
    "#f59e0b",
    "#ec4899",
    "#06b6d4",
    "#f97316",
    "#84cc16",
    "#a78bfa",
    "#fbbf24",
    "#ef4444",
    "#6b7280",
    "#14b8a6",
    "#e879f9",
    "#fb923c",
    "#4ade80",
    "#60a5fa",
    "#c084fc",
    "#facc15",
    "#f472b6",
  ]

  // Transform to Highcharts treemap data
  const treemapData = useMemo(() => {
    return validHoldings
      .filter((h) => h.weight >= 0.001) // Only show holdings >= 0.1%
      .map((holding, index) => ({
        name: holding.symbol,
        value: holding.weight,
        color: treemapColors[index % treemapColors.length],
      }))
  }, [validHoldings])

  // Update chart when theme changes
  useEffect(() => {
    if (chartRef.current && chartRef.current.chart) {
      chartRef.current.chart.update({
        chart: {
          backgroundColor: "transparent",
        },
        tooltip: {
          backgroundColor: isDark ? "#1f2937" : "#ffffff",
          borderColor: isDark ? "#4b5563" : "#e5e7eb",
          style: {
            color: isDark ? "#f3f4f6" : "#111827",
          },
        },
      })
    }
  }, [isDark])

  const treemapOptions: Highcharts.Options = {
    chart: {
      type: "treemap",
      backgroundColor: "transparent",
      margin: [0, 0, 0, 0],
      height: 400,
      style: {
        fontFamily: "inherit",
      },
    },
    title: {
      text: undefined,
    },
    credits: {
      enabled: false,
    },
    series: [
      {
        type: "treemap",
        name: symbol,
        layoutAlgorithm: "squarified",
        data: treemapData,
        dataLabels: {
          enabled: true,
          format: "{point.name}",
          style: {
            fontSize: "12px",
            fontWeight: "500",
            textOutline: "none",
            color: "#ffffff",
          },
          filter: {
            property: "value",
            operator: ">",
            value: 0.005,
          },
        },
        borderRadius: 3,
        borderColor: isDark ? "#374151" : "#e5e7eb",
        borderWidth: 1,
      } as Highcharts.SeriesTreemapOptions,
    ],
    tooltip: {
      useHTML: true,
      backgroundColor: isDark ? "#1f2937" : "#ffffff",
      borderColor: isDark ? "#4b5563" : "#e5e7eb",
      borderRadius: 6,
      borderWidth: 1,
      shadow: {
        color: "rgba(0, 0, 0, 0.1)",
        offsetX: 0,
        offsetY: 2,
        opacity: 0.1,
        width: 3,
      },
      style: {
        color: isDark ? "#f3f4f6" : "#111827",
        fontSize: "12px",
      },
      formatter: function () {
        const point = this as unknown as Highcharts.Point & {
          name: string
          value?: number
        }
        const weight = point.value ? (point.value * 100).toFixed(2) : "0"
        return `
          <div style="padding: 2px;">
            <div style="font-weight: 600; margin-bottom: 4px;">${point.name}</div>
            <div>Weight: ${weight}%</div>
          </div>
        `
      },
    },
    plotOptions: {
      treemap: {
        clip: false,
        states: {
          hover: {
            opacity: 0.8,
            borderWidth: 2,
            borderColor: isDark ? "#60a5fa" : "#3b82f6",
          },
        },
      },
    },
  }

  // Top holdings for legend
  const topHoldings = useMemo(() => {
    return validHoldings.slice(0, 10)
  }, [validHoldings])

  if (isLoading) {
    return (
      <main className="min-h-[calc(100vh-180px)] pb-20 sm:pb-0">
        <div className="animate-pulse">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-gray-100 dark:bg-gray-800" />
            <div>
              <div className="mb-2 h-8 w-48 rounded bg-gray-100 dark:bg-gray-800" />
              <div className="h-4 w-64 rounded bg-gray-100 dark:bg-gray-800" />
            </div>
          </div>
          <div className="my-6 h-px bg-gray-200 dark:bg-gray-800" />
          <div className="mb-6 h-[400px] rounded-lg bg-gray-100 dark:bg-gray-800" />
          <div className="space-y-3">
            <div className="h-12 rounded-lg bg-gray-100 dark:bg-gray-800" />
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-lg bg-gray-100 dark:bg-gray-800"
              />
            ))}
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-[calc(100vh-180px)] pb-20 sm:pb-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="h-9 w-9 p-0"
          >
            <Icon icon="carbon:arrow-left" className="size-5" />
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
            {symbol}
          </h1>
        </div>
        <Divider />
        <div className="mt-8 rounded-lg bg-red-50 p-4 dark:bg-red-900/10">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-180px)] pb-20 sm:pb-0">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="h-9 w-9 p-0"
          >
            <Icon icon="carbon:arrow-left" className="size-5" />
          </Button>
          <TickerLogo
            ticker={symbol}
            type="etf"
            className="size-10"
          />
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-900 dark:text-gray-50">
              {etfName}
              <Badge variant="neutral">{symbol}</Badge>
            </h1>
            <p className="text-gray-500 dark:text-gray-500 sm:text-sm/6">
              {validHoldings.length} holdings
              {etfProfile?.lastUpdated && (
                <>
                  {" "}
                  &middot; Last updated{" "}
                  {new Date(etfProfile.lastUpdated).toLocaleDateString()}
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      <Divider />

      {/* Treemap */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
          Holdings by Weight
        </h3>

        <div className="mt-4">
          {isClient && treemapData.length > 0 ? (
            <HighchartsReact
              highcharts={Highcharts}
              options={treemapOptions}
              ref={chartRef}
            />
          ) : (
            <div className="flex h-[400px] items-center justify-center">
              <div className="text-sm text-gray-500">Loading chart...</div>
            </div>
          )}
        </div>

        {/* Top holdings legend */}
        <div className="mt-4 pt-0">
          <p className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
            Top Holdings
          </p>
          <ul role="list" className="flex flex-wrap gap-x-10 gap-y-4 text-sm">
            {topHoldings.map((holding, index) => (
              <li key={holding.symbol}>
                <span className="text-base font-semibold text-gray-900 dark:text-gray-50">
                  {(holding.weight * 100).toFixed(1)}%
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-sm"
                    style={{
                      backgroundColor:
                        treemapColors[index % treemapColors.length],
                    }}
                    aria-hidden="true"
                  />
                  <span className="text-sm">{holding.symbol}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      {/* Holdings Table */}
      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-50">
            All Holdings
            <Badge variant="neutral">{validHoldings.length}</Badge>
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total weight: {(totalWeight * 100).toFixed(1)}%
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                <th className="w-12 py-3 pl-4 pr-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  #
                </th>
                <th className="py-3 pl-2 pr-4 text-left">
                  <button
                    className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                    onClick={() => handleSort("symbol")}
                  >
                    Symbol
                    {sortColumn === "symbol" &&
                      (sortDirection === "asc" ? (
                        <Icon icon="carbon:chevron-up" className="size-3" />
                      ) : (
                        <Icon icon="carbon:chevron-down" className="size-3" />
                      ))}
                  </button>
                </th>
                <th className="py-3 pr-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  Name
                </th>
                <th className="py-3 pr-4 text-right">
                  <button
                    className="ml-auto flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                    onClick={() => handleSort("weight")}
                  >
                    Weight
                    {sortColumn === "weight" &&
                      (sortDirection === "asc" ? (
                        <Icon icon="carbon:chevron-up" className="size-3" />
                      ) : (
                        <Icon icon="carbon:chevron-down" className="size-3" />
                      ))}
                  </button>
                </th>
                <th className="py-3 pr-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                  Weight Bar
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedHoldings.map((holding, index) => {
                // Determine rank based on original (weight-desc) order
                const rank =
                  validHoldings.findIndex(
                    (h) => h.symbol === holding.symbol,
                  ) + 1
                const maxWeight =
                  validHoldings.length > 0 ? validHoldings[0].weight : 1
                const barWidth = (holding.weight / maxWeight) * 100

                return (
                  <tr
                    key={`${holding.symbol}-${index}`}
                    className={cx(
                      "border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800/50 dark:hover:bg-gray-900/50",
                      index === sortedHoldings.length - 1 && "border-b-0",
                    )}
                  >
                    <td className="py-3 pl-4 pr-2 text-sm tabular-nums text-gray-400 dark:text-gray-500">
                      {rank}
                    </td>
                    <td className="py-3 pl-2 pr-4">
                      <div className="flex items-center gap-2">
                        <TickerLogo
                          ticker={holding.symbol}
                          type="stock"
                          className="size-6"
                        />
                        <Badge variant="flat" className="font-semibold">
                          {holding.symbol}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-600 dark:text-gray-400">
                      {holding.name || "—"}
                    </td>
                    <td className="py-3 pr-4 text-right text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-50">
                      {formatPercentage(holding.weight)}
                    </td>
                    <td className="w-40 py-3 pr-4">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all dark:bg-blue-400"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
