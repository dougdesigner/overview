"use client"

import { Card } from "@/components/Card"
import { toProperCase } from "@/lib/utils"
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

export function ExposureTreemap({
  exposures,
  totalValue,
}: ExposureTreemapProps) {
  const [groupingMode, setGroupingMode] = useState<GroupingMode>("sector")

  // Nivo's paired color scheme colors
  const pairedColors = [
    "#a6cee3",
    "#1f78b4",
    "#b2df8a",
    "#33a02c",
    "#fb9a99",
    "#e31a1c",
    "#fdbf6f",
    "#ff7f00",
    "#cab2d6",
    "#6a3d9a",
    "#ffff99",
    "#b15928",
  ]

  const getPairedColor = (index: number): string => {
    return pairedColors[index % pairedColors.length]
  }

  // Transform flat exposure data into hierarchical structure
  const transformToHierarchy = (mode: GroupingMode): TreeNode => {
    // Filter out ETF breakdown rows and stocks with no exposure
    const validExposures = exposures.filter(
      (exp) => !exp.isETFBreakdown && exp.totalValue > 0,
    )

    if (mode === "sector") {
      // For sector mode: create a three-level hierarchy (Sector -> Industry -> Stocks)
      const sectorMap = new Map<string, Map<string, StockExposure[]>>()

      validExposures.forEach((exposure) => {
        const sector = toProperCase(exposure.sector || "Unknown Sector")
        const industry = toProperCase(exposure.industry || "Unknown Industry")

        if (!sectorMap.has(sector)) {
          sectorMap.set(sector, new Map())
        }
        const industryMap = sectorMap.get(sector)!

        if (!industryMap.has(industry)) {
          industryMap.set(industry, [])
        }
        industryMap.get(industry)!.push(exposure)
      })

      // Build hierarchical structure with sectors -> industries -> stocks
      const children = Array.from(sectorMap.entries()).map(
        ([sectorName, industries]) => ({
          name: sectorName,
          children: Array.from(industries.entries()).map(
            ([industryName, stocks]) => ({
              name: industryName,
              children: stocks.map((stock) => ({
                name: stock.ticker,
                value: stock.totalValue,
                ticker: stock.ticker,
                percentage: ((stock.totalValue / totalValue) * 100).toFixed(2),
              })),
            }),
          ),
        }),
      )

      return {
        name: "Portfolio",
        children,
      }
    } else {
      // For industry mode: keep the current two-level hierarchy (Industry -> Stocks)
      const grouped = validExposures.reduce(
        (acc, exposure) => {
          const groupKey = toProperCase(exposure.industry || "Unknown Industry")

          if (!acc[groupKey]) {
            acc[groupKey] = []
          }
          acc[groupKey].push(exposure)
          return acc
        },
        {} as Record<string, StockExposure[]>,
      )

      // Build hierarchical structure
      const children = Object.entries(grouped).map(([groupName, stocks]) => ({
        name: groupName,
        children: stocks.map((stock) => ({
          name: stock.ticker,
          value: stock.totalValue,
          ticker: stock.ticker,
          percentage: ((stock.totalValue / totalValue) * 100).toFixed(2),
        })),
      }))

      return {
        name: "Portfolio",
        children,
      }
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
  // Keys should match the proper case format returned by toProperCase
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

  // Keys should match the proper case format returned by toProperCase
  const industryColors: Record<string, string> = {
    // Technology industries
    "Consumer Electronics": "#3b82f6",
    "Software—infrastructure": "#2563eb",
    Semiconductors: "#1d4ed8",
    "Software—application": "#1e40af",
    // Financial industries
    "Banks—diversified": "#8b5cf6",
    "Insurance—diversified": "#7c3aed",
    "Asset Management": "#6d28d9",
    "Capital Markets": "#5b21b6",
    // Consumer industries
    "Internet Retail": "#f59e0b",
    "Auto Manufacturers": "#d97706",
    "Specialty Retail": "#b45309",
    Restaurants: "#92400e",
    "Discount Stores": "#ec4899",
    "Beverages—non-alcoholic": "#db2777",
    "Packaged Foods": "#be185d",
    // Healthcare industries
    "Healthcare Plans": "#10b981",
    "Medical Devices": "#059669",
    Biotechnology: "#047857",
    Pharmaceuticals: "#065f46",
    // Communication industries
    "Internet Content & Information": "#06b6d4",
    "Telecom Services": "#0891b2",
    Entertainment: "#0e7490",
    "Interactive Media": "#155e75",
    // Default colors for unlisted industries
    "Unknown Industry": "#9ca3af",
  }

  // Use a color palette generator for industries not in the predefined list
  const generateColorForString = (str: string) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    const hue = hash % 360
    return `hsl(${hue}, 70%, 50%)`
  }

  // Color function for Nivo treemap - receives the node datum
  const getColor = (node: any) => {
    // The node object from Nivo has these properties:
    // - pathComponents: array of IDs from root to current node
    // - isLeaf: boolean indicating if it's a leaf node
    // - id: the node's identifier
    // - parent: reference to parent node

    const pathLength = node.pathComponents?.length || 0

    // For the root node
    if (pathLength === 1) {
      return "transparent"
    }

    if (groupingMode === "sector") {
      // Sector mode has 4 levels: Portfolio -> Sector -> Industry -> Stock

      // Level 2: Sector nodes
      if (pathLength === 2) {
        const sectorName = node.id
        return sectorColors[sectorName] || generateColorForString(sectorName)
      }

      // Level 3: Industry nodes within sectors
      if (pathLength === 3) {
        const sectorName = node.pathComponents[1]
        const baseColor =
          sectorColors[sectorName] || generateColorForString(sectorName)

        // Create a variation of the sector color for the industry
        // Convert hex to HSL, adjust lightness/saturation slightly
        const industryIndex =
          node.parent?.children?.findIndex(
            (child: any) => child.id === node.id,
          ) || 0
        return adjustColorBrightness(baseColor, 1 + industryIndex * 0.15)
      }

      // Level 4: Stock nodes
      if (pathLength === 4) {
        const sectorName = node.pathComponents[1]
        const industryName = node.pathComponents[2]
        const baseColor =
          sectorColors[sectorName] || generateColorForString(sectorName)

        // Stocks get a slight variation of their industry's color
        const industryNodes = node.parent?.parent?.children || []
        const industryIndex =
          industryNodes.findIndex((child: any) => child.id === industryName) ||
          0
        return adjustColorBrightness(baseColor, 1 + industryIndex * 0.15)
      }
    } else {
      // Industry mode has 3 levels: Portfolio -> Industry -> Stock

      // Level 2: Industry nodes
      if (pathLength === 2) {
        const industryName = node.id
        return (
          industryColors[industryName] || generateColorForString(industryName)
        )
      }

      // Level 3: Stock nodes
      if (pathLength === 3) {
        const industryName = node.pathComponents[1]
        return (
          industryColors[industryName] || generateColorForString(industryName)
        )
      }
    }

    // Fallback color
    return "#6b7280"
  }

  // Helper function to adjust color brightness
  const adjustColorBrightness = (color: string, factor: number): string => {
    // If it's an HSL color, adjust lightness directly
    if (color.startsWith("hsl")) {
      const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
      if (match) {
        const h = parseInt(match[1])
        const s = parseInt(match[2])
        const l = Math.min(90, Math.max(20, parseInt(match[3]) * factor))
        return `hsl(${h}, ${s}%, ${l}%)`
      }
    }

    // For hex colors, convert to RGB, adjust, and convert back
    const hex = color.replace("#", "")
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)

    const newR = Math.min(255, Math.max(0, Math.round(r * factor)))
    const newG = Math.min(255, Math.max(0, Math.round(g * factor)))
    const newB = Math.min(255, Math.max(0, Math.round(b * factor)))

    return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            Portfolio Treemap
          </h3>
          {/* <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {groupingMode === "sector"
              ? "Hierarchical view: Sectors → Industries → Stocks"
              : "Hierarchical view: Industries → Stocks"}
          </p> */}
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

      <div className="mt-6" style={{ height: "300px" }}>
        <ResponsiveTreeMap
          data={data}
          identity="name"
          value="value"
          valueFormat={formatValue}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          labelSkipSize={12}
          labelTextColor={{
            from: "color",
            modifiers: [["darker", 1.2]],
          }}
          parentLabelPosition="left"
          parentLabelTextColor={{
            from: "color",
            modifiers: [["darker", 2]],
          }}
          borderColor={{
            from: "color",
            modifiers: [["darker", 0.1]],
          }}
          colors={groupingMode === "sector" ? getColor : { scheme: "paired" }}
          nodeOpacity={1}
          borderWidth={2}
          enableLabel={true}
          label={(e) =>
            `${e.id}${e.value ? `: ${((e.value / totalValue) * 100).toFixed(1)}%` : ""}`
          }
          orientLabel={false}
          tile="squarify"
          tooltip={({ node }) => {
            const value = node.data.value || 0
            const percentage = ((value / totalValue) * 100).toFixed(2)
            const isLeaf = node.isLeaf

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
      <div className="mt-4 pt-0">
        <p className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          {groupingMode === "sector" ? "Top Sectors" : "Top Industries"}
        </p>
        <ul role="list" className="flex flex-wrap gap-x-10 gap-y-4 text-sm">
          {Object.entries(
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
            .map(([name, value], index) => (
              <li key={name}>
                <span className="text-base font-semibold text-gray-900 dark:text-gray-50">
                  {((value / totalValue) * 100).toFixed(1)}%
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-sm"
                    style={{
                      backgroundColor:
                        groupingMode === "sector"
                          ? sectorColors[name] || generateColorForString(name)
                          : getPairedColor(index),
                    }}
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
