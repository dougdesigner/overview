"use client"

import { Card } from "@/components/Card"
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
  if (typeof HighchartsTreemap === "function") {
    HighchartsTreemap(Highcharts)
  }
  if (typeof HighchartsExporting === "function") {
    HighchartsExporting(Highcharts)
  }
  if (typeof HighchartsExportData === "function") {
    HighchartsExportData(Highcharts)
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

  // Transform data for treemap
  const getTreemapData = (): Highcharts.SeriesTreemapOptions["data"] => {
    const validExposures = exposures.filter(
      (exp) => !exp.isETFBreakdown && exp.totalValue > 0,
    )

    const data: Highcharts.SeriesTreemapOptions["data"] = []
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

      // Child nodes (stocks)
      stocks.forEach((stock) => {
        data.push({
          name: stock.ticker,
          parent: groupName,
          value: stock.totalValue,
        })
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
              // align: "center",
              // verticalAlign: "center",
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
              inside: false,
            },
            borderWidth: 3,
            borderColor: isDark ? "#1f2937" : "#f3f4f6",
          },
        ],
        dataLabels: {
          enabled: true,
          style: {
            // color: isDark ? "#f3f4f6" : "#111827",
            fontSize: "14px",
            fontWeight: "600",
            // textOutline: isDark ? "1px contrast" : "none",
            textOutline: "none",
          },
        },
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
      pointFormatter: function () {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const point = this as any
        const value = typeof point.value === "number" ? point.value : 0
        const percentage = ((value / totalValue) * 100).toFixed(1)
        return `<div style="padding: 2px;">
                  <div style="font-weight: 600; margin-bottom: 4px;">${point.name}</div>
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
          Exposure map
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
