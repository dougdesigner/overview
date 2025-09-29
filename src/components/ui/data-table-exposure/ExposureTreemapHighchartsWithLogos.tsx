"use client"

import { Card } from "@/components/Card"
import { getTickerLogoUrl } from "@/lib/logoUtils"
import { toProperCase } from "@/lib/utils"
import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"
import HighchartsExportData from "highcharts/modules/export-data"
import HighchartsExporting from "highcharts/modules/exporting"
import HighchartsTreemap from "highcharts/modules/treemap"
import { useTheme } from "next-themes"
import { useRef, useState } from "react"
import { StockExposure } from "./types"

// Initialize Highcharts modules for Next.js
if (typeof Highcharts === "object") {
  // Type assertion to handle module initialization
  if (typeof HighchartsTreemap === "function") {
    ;(HighchartsTreemap as any)(Highcharts)
  }
  if (typeof HighchartsExporting === "function") {
    ;(HighchartsExporting as any)(Highcharts)
  }
  if (typeof HighchartsExportData === "function") {
    ;(HighchartsExportData as any)(Highcharts)
  }
}

interface ExposureTreemapHighchartsProps {
  exposures: StockExposure[]
  totalValue: number
}

type GroupingMode = "sector" | "industry"

// Extended data point type to include custom properties
interface ExtendedTreemapPoint extends Highcharts.PointOptionsObject {
  logoUrl?: string | null
  percentage?: number
  ticker?: string
}

export function ExposureTreemapHighchartsWithLogos({
  exposures,
  totalValue,
}: ExposureTreemapHighchartsProps) {
  const [groupingMode, setGroupingMode] = useState<GroupingMode>("sector")
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const chartRef = useRef<HighchartsReact.RefObject>(null)

  // Simple color palette
  const colors = [
    "#3b82f6",
    "#10b981",
    "#8b5cf6",
    "#f59e0b",
    "#ec4899",
    "#06b6d4",
    "#f97316",
    "#84cc16",
  ]

  // Format currency values
  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  // Calculate logo size based on cell dimensions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const calculateLogoSize = (point: any): number => {
    const minSize = 20 // Increased minimum for better visibility
    const maxSize = 48 // Increased max for larger logos

    // Try to get cell dimensions from the point's graphic element
    if (point.graphic && point.graphic.element) {
      const bbox = point.graphic.getBBox()
      const cellHeight = bbox.height
      const cellWidth = bbox.width

      // More conservative sizing: 30% of smaller dimension
      const availableSpace = Math.min(cellHeight, cellWidth)
      const targetSize = availableSpace * 0.3

      // Clamp between min and max
      return Math.max(minSize, Math.min(maxSize, Math.round(targetSize)))
    }

    // Fallback: use percentage-based sizing
    const percentage = point.percentage || 0
    const scaleFactor = Math.sqrt(percentage / 100)
    return Math.round(minSize + (maxSize - minSize) * scaleFactor)
  }

  // Determine what content to display based on cell size
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getContentStrategy = (point: any): "full" | "logo-only" | "none" => {
    // Try to get actual cell dimensions
    let cellHeight = 0
    let cellWidth = 0

    if (point.graphic && point.graphic.element) {
      const bbox = point.graphic.getBBox()
      cellHeight = bbox.height
      cellWidth = bbox.width
    }

    // Determine display strategy based on cell dimensions only
    if (cellHeight >= 50 && cellWidth >= 50) {
      return "full" // Show logo + ticker
    } else if (cellHeight >= 24 && cellWidth >= 24) {
      return "logo-only" // Show only logo
    } else {
      return "none" // Don't show anything to avoid overflow
    }
  }

  // Transform data for treemap
  const getTreemapData = (): ExtendedTreemapPoint[] => {
    const validExposures = exposures.filter(
      (exp) => !exp.isETFBreakdown && exp.totalValue > 0,
    )

    const data: ExtendedTreemapPoint[] = []
    const groupKey =
      groupingMode === "sector" ? "sector" : ("industry" as keyof StockExposure)

    // Group stocks by sector or industry
    const groups = new Map<string, StockExposure[]>()
    validExposures.forEach((exposure) => {
      const groupValue = exposure[groupKey] as string | undefined
      const group = toProperCase(
        groupValue || `Unknown ${toProperCase(groupKey)}`,
      )
      if (!groups.has(group)) {
        groups.set(group, [])
      }
      groups.get(group)!.push(exposure)
    })

    // Create parent nodes and child nodes
    let colorIndex = 0
    groups.forEach((stocks, groupName) => {
      // Parent node
      data.push({
        id: groupName,
        name: groupName,
        color: colors[colorIndex % colors.length],
      })
      colorIndex++

      // Child nodes (stocks) with logo URLs
      stocks.forEach((stock) => {
        const percentage = (stock.totalValue / totalValue) * 100
        const logoUrl = getTickerLogoUrl(stock.ticker)

        data.push({
          name: stock.ticker,
          parent: groupName,
          value: stock.totalValue,
          logoUrl: logoUrl,
          percentage: percentage,
          ticker: stock.ticker,
        } as ExtendedTreemapPoint)
      })
    })

    return data
  }

  // Chart options
  const options: Highcharts.Options = {
    chart: {
      type: "treemap",
      backgroundColor: "transparent",
      height: 300,
      margin: [0, 0, 0, 0],
    },
    title: {
      text: undefined,
    },
    credits: {
      enabled: false,
    },
    exporting: {
      buttons: {
        contextButton: {
          menuItems: [
            "viewFullscreen",
            "printChart",
            "separator",
            "downloadPNG",
            "downloadJPEG",
            "downloadPDF",
            "downloadSVG",
            "separator",
            "downloadCSV",
            "downloadXLS",
          ],
        },
      },
    },
    series: [
      {
        type: "treemap",
        name: "All",
        allowTraversingTree: true,
        layoutAlgorithm: "squarified",
        alternateStartingDirection: true,
        data: getTreemapData(),
        borderRadius: 3,
        nodeSizeBy: "leaf",
        breadcrumbs: {
          floating: false,
          position: {
            align: "left",
            verticalAlign: "top",
          },
          format: "{level.name}",
          buttonTheme: {
            fill: "transparent",
            style: {
              color: isDark ? "#f3f4f6" : "#111827",
            },
            states: {
              hover: {
                fill: isDark ? "#1f2937" : "#f3f4f6", // bg-gray-800 : bg-gray-100
                style: {
                  color: isDark ? "#f9fafb" : "#111827", // gray-50 : gray-900
                },
              },
              select: {
                // fill: isDark ? "#374151" : "#e5e7eb", // bg-gray-700 : bg-gray-200
                style: {
                  color: isDark ? "#f3f4f6" : "#111827",
                },
              },
            },
          },
          separator: {
            style: {
              color: isDark ? "#9ca3af" : "#6b7280",
            },
          },
          style: {
            color: isDark ? "#f3f4f6" : "#111827",
          },
        },
        levels: [
          {
            level: 1,
            layoutAlgorithm:
              groupingMode === "sector" ? "sliceAndDice" : "squarified",
            dataLabels: {
              enabled: true,
              headers: true,
              style: {
                textOutline: "none",
                color: isDark ? "#f3f4f6" : "#111827",
              },
            },
            borderWidth: 3,
            borderRadius: 3,
            borderColor: isDark ? "#1f2937" : "#f3f4f6",
          },
          {
            level: 2,
            dataLabels: {
              enabled: true,
              useHTML: true,
              inside: true,
              verticalAlign: "middle",
              align: "center",
              formatter: function () {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const point = (this as any).point as any
                const ticker = point.ticker || point.name
                const logoUrl = point.logoUrl
                const contentStrategy = getContentStrategy(point)

                // Return empty for very small cells
                if (contentStrategy === "none") {
                  return ""
                }

                // Logo only for medium cells
                if (contentStrategy === "logo-only") {
                  const logoSize = calculateLogoSize(point)
                  if (logoUrl) {
                    return `<div style="text-align: center; display: flex; align-items: center; justify-content: center; height: 100%; overflow: hidden;">
                      <div style="width: ${logoSize}px; height: ${logoSize}px; border-radius: 50%; background: transparent; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                        <img src="${logoUrl}"
                             alt="${ticker}"
                             style="width: 100%; height: 100%; object-fit: contain;"
                             onerror="this.style.display='none'"
                        />
                      </div>
                    </div>`
                  } else {
                    // Fallback to empty if no logo available
                    return ""
                  }
                }

                // Full content (logo + ticker) for large cells
                if (contentStrategy === "full") {
                  const logoSize = calculateLogoSize(point)
                  if (logoUrl) {
                    return `<div style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; overflow: hidden;">
                    <div style="width: ${logoSize}px; height: ${logoSize}px; border-radius: 50%; background: transparent; overflow: hidden; display: flex; align-items: center; justify-content: center; margin-bottom: 2px;">
                      <img src="${logoUrl}"
                           alt="${ticker}"
                           style="width: 100%; height: 100%; object-fit: contain;"
                           onerror="this.style.display='none'"
                      />
                    </div>
                    <span style="color: ${isDark ? "#f3f4f6" : "#111827"}; font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                      ${ticker}
                    </span>
                  </div>`
                  } else {
                    // Fallback to text only if no logo available for full display
                    return `<div style="text-align: center; overflow: hidden; height: 100%; display: flex; align-items: center; justify-content: center;">
                      <span style="color: ${isDark ? "#f3f4f6" : "#111827"}; font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${ticker}
                      </span>
                    </div>`
                  }
                }

                // Should not reach here, but return empty as fallback
                return ""
              },
            },
            borderWidth: 3,
            borderColor: isDark ? "#1f2937" : "#f3f4f6",
          },
        ],
        dataLabels: {
          enabled: false, // Disable default dataLabels at series level
        },
      } as Highcharts.SeriesTreemapOptions,
    ],
    tooltip: {
      useHTML: true,
      outside: true, // Render tooltip above all HTML content
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
      pointFormatter: function () {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const point = this as any
        const value = typeof point.value === "number" ? point.value : 0
        const percentage = ((value / totalValue) * 100).toFixed(1)
        const ticker = point.ticker || point.name
        return `<div style="padding: 2px;">
                  <div style="font-weight: 600; margin-bottom: 4px;">${ticker}</div>
                  <div>Value: <b>${formatValue(value)}</b></div>
                  <div>Portfolio: <b>${percentage}%</b></div>
                </div>`
      },
    },
  }

  // Calculate top groups for legend
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
    <Card className="pb-4 pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-gray-900 dark:text-gray-50">
          Exposure map (with logos)
        </h3>

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

      <div className="mt-4">
        <HighchartsReact
          highcharts={Highcharts}
          options={options}
          ref={chartRef}
        />
      </div>

      {/* Legend */}
      <div className="mt-4">
        <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          {groupingMode === "sector" ? "Top Sectors" : "Top Industries"}
        </p>
        <ul className="flex flex-wrap gap-x-10 gap-y-4 text-sm">
          {topGroups.map(([name, value], index) => (
            <li key={name}>
              <span className="text-base font-semibold text-gray-900 dark:text-gray-50">
                {((value / totalValue) * 100).toFixed(1)}%
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: colors[index % colors.length] }}
                  aria-hidden="true"
                />
                <span className="text-sm">{name}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}
