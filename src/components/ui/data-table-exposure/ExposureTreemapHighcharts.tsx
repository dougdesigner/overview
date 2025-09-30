"use client"

import { Card } from "@/components/Card"
import { toProperCase } from "@/lib/utils"
import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"
import HighchartsTreemap from "highcharts/modules/treemap"
import { useTheme } from "next-themes"
import { useEffect, useRef, useState } from "react"
import { StockExposure } from "./types"

// Initialize Highcharts modules for Next.js
if (typeof Highcharts === "object") {
  const treemapModule = HighchartsTreemap as unknown as (H: typeof Highcharts) => void
  if (typeof treemapModule === "function") {
    treemapModule(Highcharts)
  }
}

interface ExposureTreemapHighchartsProps {
  exposures: StockExposure[]
  totalValue: number
}

type GroupingMode = "sector" | "industry"

export function ExposureTreemapHighcharts({
  exposures,
  totalValue,
}: ExposureTreemapHighchartsProps) {
  const [groupingMode, setGroupingMode] = useState<GroupingMode>("sector")
  const [isTreemapLoaded, setIsTreemapLoaded] = useState(false)
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const chartRef = useRef<HighchartsReact.RefObject>(null)

  useEffect(() => {
    setIsTreemapLoaded(true)
  }, [])

  // Define color scheme for sectors
  const sectorColors: Record<string, string> = {
    Technology: "#3b82f6",
    Healthcare: "#10b981",
    "Financial Services": "#8b5cf6",
    "Consumer Cyclical": "#f59e0b",
    "Consumer Defensive": "#ec4899",
    "Communication Services": "#06b6d4",
    Energy: "#f97316",
    Industrials: "#6b7280",
    "Real Estate": "#84cc16",
    Materials: "#a78bfa",
    Utilities: "#fbbf24",
    "Unknown Sector": "#9ca3af",
  }

  // Define colors for industries
  const industryColors = [
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
  ]

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`
    }
    return `$${value.toFixed(0)}`
  }

  // Transform data to Highcharts treemap format
  const transformToHighchartsData = (mode: GroupingMode) => {
    const validExposures = exposures.filter(
      (exp) => !exp.isETFBreakdown && exp.totalValue > 0,
    )

    const data: Array<{
      id: string
      parent?: string
      name: string
      value?: number
      color?: string
    }> = []
    const colorMap = new Map<string, string>()
    let colorIndex = 0

    if (mode === "sector") {
      // Create sector groups with stocks directly as children (no industry level)
      const sectorMap = new Map<string, StockExposure[]>()

      validExposures.forEach((exposure) => {
        const sector = toProperCase(exposure.sector || "Unknown Sector")

        if (!sectorMap.has(sector)) {
          sectorMap.set(sector, [])
        }
        sectorMap.get(sector)!.push(exposure)
      })

      // Add parent nodes (sectors)
      Array.from(sectorMap.keys()).forEach((sectorName) => {
        const sectorColor =
          sectorColors[sectorName] ||
          industryColors[colorIndex++ % industryColors.length]
        colorMap.set(sectorName, sectorColor)

        data.push({
          id: sectorName,
          name: sectorName,
          color: sectorColor,
        })
      })

      // Add stocks directly under sectors (no industry intermediary)
      Array.from(sectorMap.entries()).forEach(([sectorName, stocks]) => {
        stocks.forEach((stock) => {
          data.push({
            id: `${sectorName}-${stock.ticker}`,
            name: stock.ticker,
            parent: sectorName,
            value: stock.totalValue,
          })
        })
      })
    } else {
      // Industry mode - simpler two-level hierarchy
      const industryMap = new Map<string, StockExposure[]>()

      validExposures.forEach((exposure) => {
        const industry = toProperCase(exposure.industry || "Unknown Industry")
        if (!industryMap.has(industry)) {
          industryMap.set(industry, [])
        }
        industryMap.get(industry)!.push(exposure)
      })

      // Add industry parent nodes
      Array.from(industryMap.keys()).forEach((industryName, index) => {
        const color = industryColors[index % industryColors.length]
        colorMap.set(industryName, color)

        data.push({
          id: industryName,
          name: industryName,
          color: color,
        })
      })

      // Add stocks as children
      Array.from(industryMap.entries()).forEach(([industryName, stocks]) => {
        stocks.forEach((stock) => {
          data.push({
            id: `${industryName}-${stock.ticker}`,
            name: stock.ticker,
            parent: industryName,
            value: stock.totalValue,
          })
        })
      })
    }

    return data
  }

  const data = transformToHighchartsData(groupingMode)

  // Update chart when theme changes
  useEffect(() => {
    if (chartRef.current && chartRef.current.chart) {
      chartRef.current.chart.update({
        chart: {
          backgroundColor: "transparent",
        },
        title: {
          style: {
            color: isDark ? "#f3f4f6" : "#111827",
          },
        },
        plotOptions: {
          treemap: {
            dataLabels: {
              style: {
                fontSize: "14px",
                fontWeight: "600",
              },
            },
            levels: [
              {
                level: 1,
                dataLabels: {
                  style: {
                    color: isDark ? "#f3f4f6" : "#111827",
                  },
                },
              },
              {
                level: 2,
                dataLabels: {
                  style: {
                    color: isDark ? "#e5e7eb" : "#374151",
                  },
                },
              },
              {
                level: 3,
                dataLabels: {
                  style: {
                    color: isDark ? "#d1d5db" : "#4b5563",
                  },
                },
              },
            ],
          },
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

  const options: Highcharts.Options = {
    chart: {
      type: "treemap",
      backgroundColor: "transparent",
      margin: [0, 0, 0, 0],
      height: 300,
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
        name: "All",
        allowTraversingTree: true,
        alternateStartingDirection: true,
        data: data,
        dataLabels: {
          enabled: true,
          format: "{point.name}",
          style: {
            fontSize: "11px",
            fontWeight: "500",
            textOutline: "none",
            color: isDark ? "#f3f4f6" : "#111827",
          },
          filter: {
            property: "value",
            operator: ">",
            value: totalValue * 0.0005, // Show labels for items > 0.05% of total
          },
        },
        borderRadius: 3,
        nodeSizeBy: "leaf",
        borderColor: isDark ? "#374151" : "#e5e7eb",
        levels: [
          {
            level: 1,
            layoutAlgorithm:
              groupingMode === "sector" ? "sliceAndDice" : "squarified",
            groupPadding: 3,
            dataLabels: {
              enabled: true,
              headers: true,
              style: {
                fontSize: "13px",
                fontWeight: "600",
                color: isDark ? "#f3f4f6" : "#111827",
              },
            },
            borderRadius: 3,
            borderWidth: 2,
            borderColor: isDark ? "#4b5563" : "#d1d5db",
          },
          {
            level: 2,
            dataLabels: {
              enabled: true,
              inside: false,
            },
          },
        ],
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
          id?: string
        }
        const percentage = point.value
          ? ((point.value / totalValue) * 100).toFixed(2)
          : "0"
        const isLeaf = point.value !== undefined

        if (isLeaf) {
          return `
            <div style="padding: 2px;">
              <div style="font-weight: 600; margin-bottom: 4px;">${point.name}</div>
              <div>Value: ${formatValue(point.value ?? 0)}</div>
              <div>Portfolio: ${percentage}%</div>
            </div>
          `
        } else {
          // For parent nodes, calculate the total
          const childrenTotal = data
            .filter((d) => d.parent === point.id)
            .reduce((sum, child) => {
              if (child.value) return sum + child.value
              // For intermediate nodes, sum their children
              const grandchildren = data.filter((d) => d.parent === child.id)
              return (
                sum + grandchildren.reduce((s, gc) => s + (gc.value || 0), 0)
              )
            }, 0)

          const parentPercentage = ((childrenTotal / totalValue) * 100).toFixed(
            2,
          )

          return `
            <div style="padding: 2px;">
              <div style="font-weight: 600; margin-bottom: 4px;">${point.name}</div>
              <div>Total: ${formatValue(childrenTotal)}</div>
              <div>Portfolio: ${parentPercentage}%</div>
            </div>
          `
        }
      },
    },
    plotOptions: {
      treemap: {
        clip: false,
        levelIsConstant: false,
        opacity: 1,
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

  // Calculate top sectors/industries for legend
  const topGroups = Object.entries(
    exposures
      .filter((exp) => !exp.isETFBreakdown && exp.totalValue > 0)
      .reduce(
        (acc, exp) => {
          const key =
            groupingMode === "sector"
              ? toProperCase(exp.sector || "Unknown Sector")
              : toProperCase(exp.industry || "Unknown Industry")
          acc[key] = (acc[key] || 0) + exp.totalValue
          return acc
        },
        {} as Record<string, number>,
      ),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            Portfolio Treemap
          </h3>
        </div>

        {/* Grouping Mode Toggle */}
        <div className="flex items-center rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          <button
            onClick={() => setGroupingMode("sector")}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              groupingMode === "sector"
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-50"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
            }`}
          >
            By Sector
          </button>
          <button
            onClick={() => setGroupingMode("industry")}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              groupingMode === "industry"
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-50"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
            }`}
          >
            By Industry
          </button>
        </div>
      </div>

      <div className="mt-6">
        {isTreemapLoaded ? (
          <HighchartsReact
            highcharts={Highcharts}
            options={options}
            ref={chartRef}
          />
        ) : (
          <div className="flex h-[300px] items-center justify-center">
            <div className="text-sm text-gray-500">Loading chart...</div>
          </div>
        )}
      </div>

      {/* Legend for top sectors/industries */}
      <div className="mt-4 pt-0">
        <p className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          {groupingMode === "sector" ? "Top Sectors" : "Top Industries"}
        </p>
        <ul role="list" className="flex flex-wrap gap-x-10 gap-y-4 text-sm">
          {topGroups.map(([name, value], index) => {
            const color =
              groupingMode === "sector"
                ? sectorColors[name] ||
                  industryColors[index % industryColors.length]
                : industryColors[index % industryColors.length]

            return (
              <li key={name}>
                <span className="text-base font-semibold text-gray-900 dark:text-gray-50">
                  {((value / totalValue) * 100).toFixed(1)}%
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  />
                  <span className="text-sm">{name}</span>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </Card>
  )
}
