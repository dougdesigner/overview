"use client"

import { Card } from "@/components/Card"
import { ResponsiveTreeMap } from "@nivo/treemap"
import { useState } from "react"
import { StockExposure } from "./types"

interface ExposureTreemapProps {
  exposures: StockExposure[]
  totalValue: number
}

type GroupingMode = "sector" | "industry"

interface TreeNode {
  name: string
  value?: number
  children?: TreeNode[]
  ticker?: string
  color?: string
}

export function ExposureTreemap({ exposures, totalValue }: ExposureTreemapProps) {
  const [groupingMode, setGroupingMode] = useState<GroupingMode>("sector")

  // Transform flat exposure data into hierarchical structure
  const transformToHierarchy = (mode: GroupingMode): TreeNode => {
    // Filter out ETF breakdown rows and stocks with no exposure
    const validExposures = exposures.filter(
      exp => !exp.isETFBreakdown && exp.totalValue > 0
    )

    // Group exposures by sector or industry
    const grouped = validExposures.reduce((acc, exposure) => {
      const groupKey = mode === "sector"
        ? (exposure.sector || "Unknown Sector")
        : (exposure.industry || "Unknown Industry")

      if (!acc[groupKey]) {
        acc[groupKey] = []
      }
      acc[groupKey].push(exposure)
      return acc
    }, {} as Record<string, StockExposure[]>)

    // Build hierarchical structure
    const children = Object.entries(grouped).map(([groupName, stocks]) => ({
      name: groupName,
      children: stocks.map(stock => ({
        name: stock.ticker,
        value: stock.totalValue,
        ticker: stock.ticker,
        percentage: ((stock.totalValue / totalValue) * 100).toFixed(2)
      }))
    }))

    return {
      name: "Portfolio",
      children
    }
  }

  const data = transformToHierarchy(groupingMode)

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`
    }
    return `$${value.toFixed(0)}`
  }

  // Define color scheme for sectors/industries
  const getColor = (node: any) => {
    const sectorColors: Record<string, string> = {
      "Technology": "#3b82f6",
      "Healthcare": "#10b981",
      "Financial Services": "#8b5cf6",
      "Consumer Cyclical": "#f59e0b",
      "Consumer Defensive": "#ec4899",
      "Communication Services": "#06b6d4",
      "Energy": "#f97316",
      "Industrials": "#6b7280",
      "Real Estate": "#84cc16",
      "Materials": "#a78bfa",
      "Utilities": "#fbbf24",
      "Unknown Sector": "#9ca3af",
      "Unknown Industry": "#9ca3af"
    }

    // For parent nodes (sectors/industries)
    if (node.depth === 1) {
      return sectorColors[node.id] || "#6b7280"
    }

    // For leaf nodes (stocks), inherit parent color with variation
    if (node.parent) {
      const baseColor = sectorColors[node.parent.id] || "#6b7280"
      return baseColor
    }

    return "#6b7280"
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            Portfolio Treemap
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Hierarchical view of stock exposure grouped by {groupingMode}
          </p>
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

      <div className="mt-6" style={{ height: "500px" }}>
        <ResponsiveTreeMap
          data={data}
          identity="name"
          value="value"
          valueFormat={formatValue}
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          labelSkipSize={12}
          labelTextColor={{
            from: "color",
            modifiers: [["darker", 1.2]]
          }}
          parentLabelPosition="left"
          parentLabelTextColor={{
            from: "color",
            modifiers: [["darker", 2]]
          }}
          borderColor={{
            from: "color",
            modifiers: [["darker", 0.1]]
          }}
          colors={getColor}
          nodeOpacity={1}
          borderWidth={2}
          enableLabel={true}
          label={e => `${e.id}${e.value ? `: ${((e.value / totalValue) * 100).toFixed(1)}%` : ''}`}
          orientLabel={false}
          tile="squarify"
          tooltip={({ node }) => {
            const value = node.data.value || 0
            const percentage = ((value / totalValue) * 100).toFixed(2)
            const isLeaf = !node.data.children

            return (
              <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-md dark:border-gray-800 dark:bg-gray-950">
                <div className="font-medium text-gray-900 dark:text-gray-50">
                  {node.id}
                </div>
                {isLeaf && (
                  <>
                    <div className="mt-1 text-gray-600 dark:text-gray-400">
                      Value: {formatValue(value)}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Portfolio: {percentage}%
                    </div>
                  </>
                )}
                {!isLeaf && (
                  <div className="mt-1 text-gray-600 dark:text-gray-400">
                    Total: {formatValue(value)}
                  </div>
                )}
              </div>
            )
          }}
        />
      </div>

      {/* Legend for top sectors/industries */}
      <div className="mt-6 grid grid-cols-2 gap-2 border-t pt-4 sm:grid-cols-3">
        {Object.entries(
          exposures
            .filter(exp => !exp.isETFBreakdown && exp.totalValue > 0)
            .reduce((acc, exp) => {
              const key = groupingMode === "sector"
                ? (exp.sector || "Unknown Sector")
                : (exp.industry || "Unknown Industry")
              acc[key] = (acc[key] || 0) + exp.totalValue
              return acc
            }, {} as Record<string, number>)
        )
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([name, value], index) => (
            <div key={name} className="flex items-center gap-2">
              <div
                className="h-3 w-3 shrink-0 rounded"
                style={{
                  backgroundColor: getColor({ id: name, depth: 1 })
                }}
              />
              <span className="truncate text-sm text-gray-900 dark:text-gray-50">
                {name}
              </span>
              <span className="ml-auto text-sm font-medium text-gray-600 dark:text-gray-400">
                {((value / totalValue) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
      </div>
    </Card>
  )
}