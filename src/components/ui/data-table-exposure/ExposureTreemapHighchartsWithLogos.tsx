"use client"

import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSubMenu,
  DropdownMenuSubMenuContent,
  DropdownMenuSubMenuTrigger,
  DropdownMenuTrigger,
} from "@/components/DropdownMenu"
import { Tooltip } from "@/components/Tooltip"
import { getAssetClassHexColor } from "@/lib/assetClassColors"
import { toProperCase } from "@/lib/utils"
import {
  RiDonutChartLine,
  RiDownloadLine,
  RiFullscreenLine,
  RiLayout4Line,
  RiLayoutMasonryLine,
  RiResetLeftLine,
  RiSettings3Line,
} from "@remixicon/react"
import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"
import HighchartsTreemap from "highcharts/modules/treemap"
// DO NOT import exporting and export-data statically - they have load order dependency
// export-data depends on exporting's prototype being available
import { useTheme } from "next-themes"
import { useEffect, useRef, useState } from "react"
import { Account, StockExposure } from "./types"

// Initialize Highcharts modules at module level with correct order
// This follows the pattern from CLAUDE.md to prevent SSR/hydration issues
if (typeof Highcharts === "object") {
  // Treemap has no dependencies - can use static import
  if (typeof HighchartsTreemap === "function") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(HighchartsTreemap as any)(Highcharts)
  }

  // Load exporting first, then export-data (which depends on exporting)
  // Using require() ensures sequential loading - export-data needs exporting's prototype
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const HighchartsExporting = require("highcharts/modules/exporting")
  if (typeof HighchartsExporting === "function") {
    HighchartsExporting(Highcharts)
  } else if (HighchartsExporting?.default) {
    HighchartsExporting.default(Highcharts)
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const HighchartsExportData = require("highcharts/modules/export-data")
  if (typeof HighchartsExportData === "function") {
    HighchartsExportData(Highcharts)
  } else if (HighchartsExportData?.default) {
    HighchartsExportData.default(Highcharts)
  }
}

interface ExposureTreemapHighchartsProps {
  exposures: StockExposure[]
  totalValue: number
  stocksOnlyValue?: number  // Full stocks value for percentage calculations (not affected by view filter)
  accounts: Account[]
  selectedAccounts: string[]
  logoUrls: Record<string, string | null>
  dataVersion?: number
  holdingsFilter?: "all" | "mag7" | "top7" | "top10"  // View filter for legend display
  displayValue?: DisplayValue  // Display value from page-level settings
  onChartSettingsChange?: (hasChanges: boolean) => void  // Callback when chart settings change
}

type ChartType = "treemap" | "pie"
type GroupingMode = "none" | "sector" | "sector-industry"
type SizingMode = "proportional" | "monosize"
type TitleMode = "symbol" | "name" | "none"
type DisplayValue = "market-value" | "pct-stocks" | "pct-portfolio" | "none"

// Magnificent 7 tickers
const MAG7_TICKERS = ["AAPL", "MSFT", "GOOGL", "GOOG", "AMZN", "NVDA", "META", "TSLA"]

// Colors for non-stock holdings (cash, bonds, etc.)
const CASH_COLOR = getAssetClassHexColor("Cash")   // emerald-500 (#10b981)
const BONDS_COLOR = getAssetClassHexColor("Bonds") // amber-500 (#f59e0b)
const OTHER_COLOR = getAssetClassHexColor("Other") // gray-500 (#6b7280)

// Extended data point type to include custom properties
interface ExtendedTreemapPoint extends Highcharts.PointOptionsObject {
  logoUrl?: string | null
  percentage?: number
  ticker?: string
  companyName?: string
  actualValue?: number
}

// Type for point with graphic element
interface PointWithGraphic {
  graphic?: {
    element?: unknown
    getBBox: () => { height: number; width: number }
  }
  percentage?: number
}

export function ExposureTreemapHighchartsWithLogos({
  exposures,
  totalValue,
  stocksOnlyValue: stocksOnlyValueProp,
  logoUrls,
  holdingsFilter = "all",
  displayValue: displayValueProp = "pct-portfolio",
  onChartSettingsChange,
}: ExposureTreemapHighchartsProps) {
  const [chartType, setChartType] = useState<ChartType>("treemap")
  const [sizingMode] = useState<SizingMode>("proportional")
  const [showLogo, setShowLogo] = useState(true)
  const [titleMode, setTitleMode] = useState<TitleMode>("symbol")
  // Local toggle for showing/hiding values in chart cells
  const [showChartValue, setShowChartValue] = useState(true)
  // Effective display value: uses page-level setting when show is on, "none" when off
  const displayValue = showChartValue ? displayValueProp : "none"
  // Local state for grouping mode
  const [groupingMode, setGroupingMode] = useState<GroupingMode>("sector")
  // Check if any display setting differs from default
  const hasSettingsChanges =
    showLogo !== true ||
    titleMode !== "symbol" ||
    showChartValue !== true ||
    groupingMode !== "sector"

  // Reset all chart settings to defaults
  const resetChartSettings = () => {
    setShowLogo(true)
    setTitleMode("symbol")
    setShowChartValue(true)
    setGroupingMode("sector")
  }

  // Notify parent when chart settings change
  useEffect(() => {
    onChartSettingsChange?.(hasSettingsChanges)
  }, [hasSettingsChanges, onChartSettingsChange])

  // Modules are initialized at module level, so we default to true
  const [modulesLoaded] = useState(true)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const chartRef = useRef<HighchartsReact.RefObject>(null)

  // Responsive height: 350 on mobile (<640px), 500 on desktop
  const [responsiveHeight, setResponsiveHeight] = useState(500)

  useEffect(() => {
    const updateHeight = () => {
      setResponsiveHeight(window.innerWidth < 640 ? 350 : 500)
    }
    updateHeight()
    window.addEventListener("resize", updateHeight)
    return () => window.removeEventListener("resize", updateHeight)
  }, [])

  // Update chart when theme changes
  useEffect(() => {
    if (chartRef.current && chartRef.current.chart) {
      const chart = chartRef.current.chart

      // Update chart with new theme colors
      chart.update({
        chart: {
          backgroundColor: "transparent",
        },
        navigation: {
          breadcrumbs: {
            style: {
              color: isDark ? "#f3f4f6" : "#111827",
            },
            states: {
              hover: {
                fill: isDark ? "#1f2937" : "#f3f4f6",
                style: {
                  color: isDark ? "#f3f4f6" : "#111827",
                },
              },
            },
          },
        },
        plotOptions: {
          treemap: {
            borderColor: isDark ? "#1f2937" : "#f3f4f6",
            dataLabels: {
              style: {
                color: isDark ? "#f3f4f6" : "#111827",
                fontSize: "11px",
                fontWeight: "500",
                textOutline: "none",
              },
            },
            levels: [
              {
                level: 1,
                borderColor: isDark ? "#1f2937" : "#f3f4f6",
                dataLabels: {
                  style: {
                    fontSize: "16px",
                    fontWeight: "600",
                    color: isDark ? "#f3f4f6" : "#111827",
                  },
                },
              },
              {
                level: 2,
                borderColor: isDark ? "#374151" : "#e5e7eb",
                dataLabels: {
                  style: {
                    fontSize: "12px",
                    fontWeight: "500",
                    color: isDark ? "#f3f4f6" : "#111827",
                  },
                },
              },
            ],
          },
          pie: {
            borderColor: isDark ? "#1f2937" : "#f3f4f6",
            dataLabels: {
              style: {
                color: isDark ? "#f3f4f6" : "#111827",
                fontSize: "12px",
                fontWeight: "500",
              },
            },
          },
        },
        tooltip: {
          followTouchMove: false,
          backgroundColor: isDark ? "#1f2937" : "#ffffff",
          borderColor: isDark ? "#4b5563" : "#e5e7eb",
          style: {
            color: isDark ? "#f3f4f6" : "#111827",
          },
        },
      })
    }
  }, [isDark, chartType])

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

  /**
   * Darkens a hex color by a percentage
   * @param hexColor - Hex color string (e.g., "#3b82f6")
   * @param percent - Percentage to darken (0-100, where 100 = black)
   * @returns Darkened hex color
   */
  const darkenColor = (hexColor: string, percent: number): string => {
    // Remove # if present
    const hex = hexColor.replace("#", "")

    // Parse RGB
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)

    // Darken by percentage (move toward black)
    const factor = 1 - percent / 100
    const newR = Math.round(r * factor)
    const newG = Math.round(g * factor)
    const newB = Math.round(b * factor)

    // Convert back to hex
    const toHex = (n: number) => n.toString(16).padStart(2, "0")
    return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`
  }

  // Format currency values
  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  // Format legend values based on display value setting
  // Note: Legend always shows values even when displayValue is "none"
  // (defaults to portfolio percentage for legend readability)
  const getLegendDisplayValue = (value: number): string => {
    if (displayValue === "market-value") {
      return formatValue(value)
    } else if (displayValue === "pct-stocks") {
      const percentage =
        stocksOnlyValue > 0 ? (value / stocksOnlyValue) * 100 : 0
      return `${percentage.toFixed(1)}%`
    } else {
      // "pct-portfolio" or "none" - legend always shows portfolio %
      const percentage = (value / totalValue) * 100
      return `${percentage.toFixed(1)}%`
    }
  }

  // Get consistent color for a sector group across both chart types
  // Both "sector" and "sector-industry" modes use sector-based coloring
  const getGroupColor = (groupName: string, mode: GroupingMode): string => {
    // Use asset class colors for non-stock sectors
    if (groupName === "Cash") {
      return CASH_COLOR
    }
    if (groupName === "Bonds") {
      return BONDS_COLOR
    }
    if (groupName === "Real Estate" || groupName === "Commodities" || groupName === "Other") {
      return OTHER_COLOR
    }

    if (mode === "none") {
      return colors[0] // All stocks use the same color in no-group mode
    }

    // Non-stock sectors to exclude from stock color assignment
    const nonStockSectors = ["Cash", "Bonds", "Real Estate", "Commodities", "Other"]

    // Get all valid exposures (excluding non-stock sectors for color assignment)
    const validExposures = exposures.filter(
      (exp) => !exp.isETFBreakdown && exp.totalValue > 0 && !nonStockSectors.includes(exp.sector || ""),
    )

    // Always group by sector for color consistency (both sector and sector-industry use sectors)
    const groupValues = new Map<string, number>()
    validExposures.forEach((exp) => {
      const group = toProperCase(exp.sector || "Unknown Sector")
      groupValues.set(group, (groupValues.get(group) || 0) + exp.totalValue)
    })

    // Sort groups by value (largest first) for consistent color assignment
    const sortedGroups = Array.from(groupValues.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name)

    // Find the index of this group name in the value-sorted list
    const index = sortedGroups.indexOf(groupName)
    return colors[index % colors.length]
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

  // Calculate text sizes based on cell dimensions
  const calculateTextSizes = (
    point: PointWithGraphic,
  ): { tickerSize: number; weightSize: number } => {
    const minTickerSize = 10
    const maxTickerSize = 16
    const minWeightSize = 8
    const maxWeightSize = 12

    // Try to get cell dimensions from the point's graphic element
    if (point.graphic && point.graphic.element) {
      const bbox = point.graphic.getBBox()
      const cellHeight = bbox.height

      // Ticker size: 15-20% of cell height
      const tickerTarget = cellHeight * 0.17
      const tickerSize = Math.max(
        minTickerSize,
        Math.min(maxTickerSize, Math.round(tickerTarget)),
      )

      // Weight size: 12-15% of cell height (slightly smaller than ticker)
      const weightTarget = cellHeight * 0.14
      const weightSize = Math.max(
        minWeightSize,
        Math.min(maxWeightSize, Math.round(weightTarget)),
      )

      return { tickerSize, weightSize }
    }

    // Fallback to default sizes
    return { tickerSize: 12, weightSize: 10 }
  }

  // Determine what content to display based on cell size
  const getContentStrategy = (
    point: PointWithGraphic,
  ): "full" | "logo-ticker" | "logo-only" | "none" => {
    // Try to get actual cell dimensions
    let cellHeight = 0
    let cellWidth = 0

    if (point.graphic && point.graphic.element) {
      const bbox = point.graphic.getBBox()
      cellHeight = bbox.height
      cellWidth = bbox.width
    }

    // Determine display strategy based on cell dimensions only
    if (cellHeight >= 70 && cellWidth >= 70) {
      return "full" // Show logo + ticker + weight
    } else if (cellHeight >= 50 && cellWidth >= 50) {
      return "logo-ticker" // Show logo + ticker
    } else if (cellHeight >= 24 && cellWidth >= 24) {
      return "logo-only" // Show only logo
    } else {
      return "none" // Don't show anything to avoid overflow
    }
  }

  // Use passed stocksOnlyValue, or calculate from exposures if not provided (backward compatibility)
  const stocksOnlyValue = stocksOnlyValueProp ?? exposures
    .filter((exp) => !exp.isETFBreakdown && exp.totalValue > 0)
    .reduce((sum, exp) => sum + exp.totalValue, 0)

  // Helper function to get the display value text based on display settings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getDisplayValueText = (point: any): string => {
    if (displayValue === "none") {
      return ""
    }

    const value =
      point.actualValue !== undefined
        ? point.actualValue
        : typeof point.value === "number"
          ? point.value
          : 0

    if (displayValue === "market-value") {
      return formatValue(value)
    } else if (displayValue === "pct-stocks") {
      const percentage =
        stocksOnlyValue > 0 ? (value / stocksOnlyValue) * 100 : 0
      return `${percentage.toFixed(1)}%`
    } else {
      // "pct-portfolio"
      const percentage = (value / totalValue) * 100
      return `${percentage.toFixed(1)}%`
    }
  }

  // Helper function to get logo background and scale for special tickers (Google, Apple, Figma)
  const getLogoStyle = (ticker: string) => {
    const upperTicker = ticker?.toUpperCase() || ""
    if (upperTicker === "GOOGL" || upperTicker === "GOOG") {
      return { background: "#f2f3fa", scale: "75%" }
    }
    if (upperTicker === "AAPL") {
      return { background: "#ebebeb", scale: "75%" }
    }
    if (upperTicker === "FIGM" || upperTicker === "FIG") {
      return { background: "#f1f3f9", scale: "75%" }
    }
    return { background: "#f1f3fa", scale: "100%" }
  }

  // Helper function to render cell content based on display settings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderCellContent = (
    point: any,
    strategy: "full" | "logo-ticker" | "logo-only",
  ): string => {
    const ticker = point.ticker || point.name
    const companyName = point.companyName || ticker
    const displayText = titleMode === "name" ? companyName : ticker
    const logoUrl = point.logoUrl
    const logoSize = calculateLogoSize(point)
    const { tickerSize, weightSize } = calculateTextSizes(point)
    const displayValueText = getDisplayValueText(point)

    // Check if this is a cash entry
    const isCash = ticker === "CASH"

    // Strategy: logo-only
    if (strategy === "logo-only") {
      if (showLogo) {
        if (isCash) {
          // Show "$" initials for cash
          return `<div style="text-align: center; display: flex; align-items: center; justify-content: center; height: 100%; overflow: hidden;">
            <div style="width: ${logoSize}px; height: ${logoSize}px; border-radius: 50%; background: ${isDark ? "#374151" : "#e5e7eb"}; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: ${Math.round(logoSize * 0.5)}px; font-weight: 700; color: ${isDark ? "#9ca3af" : "#6b7280"};">$</span>
            </div>
          </div>`
        } else if (logoUrl) {
          const logoStyle = getLogoStyle(ticker)
          return `<div style="text-align: center; display: flex; align-items: center; justify-content: center; height: 100%; overflow: hidden;">
            <div style="width: ${logoSize}px; height: ${logoSize}px; border-radius: 50%; background: ${logoStyle.background}; overflow: hidden; display: flex; align-items: center; justify-content: center;">
              <img src="${logoUrl}"
                   alt="${ticker}"
                   style="width: ${logoStyle.scale}; height: ${logoStyle.scale}; object-fit: contain;"
                   onerror="this.style.display='none'"
              />
            </div>
          </div>`
        }
      }
      return ""
    }

    // Strategy: logo-ticker
    if (strategy === "logo-ticker") {
      const hasLogo = showLogo && (logoUrl || isCash)
      const hasTitle = titleMode === "symbol" || titleMode === "name"

      // Render cash "$" logo or stock logo
      const renderLogoElement = (withMargin: boolean = false) => {
        if (isCash) {
          return `<div style="width: ${logoSize}px; height: ${logoSize}px; border-radius: 50%; background: ${isDark ? "#374151" : "#e5e7eb"}; display: flex; align-items: center; justify-content: center;${withMargin ? " margin-bottom: 2px;" : ""}">
            <span style="font-size: ${Math.round(logoSize * 0.5)}px; font-weight: 700; color: ${isDark ? "#9ca3af" : "#6b7280"};">$</span>
          </div>`
        }
        const logoStyle = getLogoStyle(ticker)
        return `<div style="width: ${logoSize}px; height: ${logoSize}px; border-radius: 50%; background: ${logoStyle.background}; overflow: hidden; display: flex; align-items: center; justify-content: center;${withMargin ? " margin-bottom: 2px;" : ""}">
          <img src="${logoUrl}"
               alt="${ticker}"
               style="width: ${logoStyle.scale}; height: ${logoStyle.scale}; object-fit: contain;"
               onerror="this.style.display='none'"
          />
        </div>`
      }

      if (hasLogo && hasTitle) {
        // Logo + ticker/name
        return `<div style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; overflow: hidden;">
          ${renderLogoElement(true)}
          <span style="color: ${isDark ? "#f3f4f6" : "#f3f4f6"}; font-size: ${tickerSize}px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${displayText}
          </span>
        </div>`
      } else if (hasLogo) {
        // Logo only
        return `<div style="text-align: center; display: flex; align-items: center; justify-content: center; height: 100%; overflow: hidden;">
          ${renderLogoElement()}
        </div>`
      } else if (hasTitle) {
        // Ticker/name only
        return `<div style="text-align: center; overflow: hidden; height: 100%; display: flex; align-items: center; justify-content: center;">
          <span style="color: ${isDark ? "#f3f4f6" : "#f3f4f6"}; font-size: ${tickerSize}px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${displayText}
          </span>
        </div>`
      } else {
        return ""
      }
    }

    // Strategy: full
    if (strategy === "full") {
      const hasLogo = showLogo && (logoUrl || isCash)
      const hasTitle = titleMode === "symbol" || titleMode === "name"

      // Render cash "$" logo or stock logo for full strategy
      const renderFullLogo = () => {
        if (isCash) {
          return `<div style="width: ${logoSize}px; height: ${logoSize}px; border-radius: 50%; background: ${isDark ? "#374151" : "#e5e7eb"}; display: flex; align-items: center; justify-content: center; margin-bottom: 2px;">
            <span style="font-size: ${Math.round(logoSize * 0.5)}px; font-weight: 700; color: ${isDark ? "#9ca3af" : "#6b7280"};">$</span>
          </div>`
        }
        const logoStyle = getLogoStyle(ticker)
        return `<div style="width: ${logoSize}px; height: ${logoSize}px; border-radius: 50%; background: ${logoStyle.background}; overflow: hidden; display: flex; align-items: center; justify-content: center; margin-bottom: 2px;">
          <img src="${logoUrl}"
               alt="${ticker}"
               style="width: ${logoStyle.scale}; height: ${logoStyle.scale}; object-fit: contain;"
               onerror="this.style.display='none'"
          />
        </div>`
      }

      if (hasLogo && hasTitle) {
        // Logo + ticker/name + value
        return `<div style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; overflow: hidden;">
          ${renderFullLogo()}
          <span style="color: ${isDark ? "#f3f4f6" : "#f3f4f6"}; font-size: ${tickerSize}px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${displayText}
          </span>
          ${
            displayValueText
              ? `<span style="color: ${isDark ? "#f3f4f6" : "#f3f4f6"}; font-size: ${weightSize}px; font-weight: 500; white-space: nowrap; margin-top: 1px;">
            ${displayValueText}
          </span>`
              : ""
          }
        </div>`
      } else if (hasLogo) {
        // Logo + value only
        return `<div style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; overflow: hidden;">
          ${renderFullLogo()}
          ${
            displayValueText
              ? `<span style="color: ${isDark ? "#f3f4f6" : "#f3f4f6"}; font-size: ${weightSize}px; font-weight: 500; white-space: nowrap;">
            ${displayValueText}
          </span>`
              : ""
          }
        </div>`
      } else if (hasTitle) {
        // Ticker/name + value only
        return `<div style="text-align: center; overflow: hidden; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <span style="color: ${isDark ? "#f3f4f6" : "#f3f4f6"}; font-size: ${tickerSize}px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${displayText}
          </span>
          ${
            displayValueText
              ? `<span style="color: ${isDark ? "#f3f4f6" : "#f3f4f6"}; font-size: ${weightSize}px; font-weight: 500; white-space: nowrap; margin-top: 1px;">
            ${displayValueText}
          </span>`
              : ""
          }
        </div>`
      } else {
        // Value only
        return displayValueText
          ? `<div style="text-align: center; overflow: hidden; height: 100%; display: flex; align-items: center; justify-content: center;">
          <span style="color: ${isDark ? "#f3f4f6" : "#f3f4f6"}; font-size: ${weightSize}px; font-weight: 500;">
            ${displayValueText}
          </span>
        </div>`
          : ""
      }
    }

    return ""
  }

  // Transform data for treemap
  const getTreemapData = (): ExtendedTreemapPoint[] => {
    const validExposures = exposures.filter(
      (exp) => !exp.isETFBreakdown && exp.totalValue > 0,
    )

    const data: ExtendedTreemapPoint[] = []

    // Handle "none" mode - flat structure without grouping
    if (groupingMode === "none") {
      // Sort by value descending to show largest holdings first
      const sortedExposures = [...validExposures].sort(
        (a, b) => b.totalValue - a.totalValue,
      )

      // Non-stock sectors that need special coloring
      const nonStockSectors = ["Cash", "Bonds", "Real Estate", "Commodities", "Other"]

      sortedExposures.forEach((stock) => {
        const percentage = (stock.totalValue / totalValue) * 100
        const logoUrl = logoUrls[stock.ticker.toUpperCase()] ?? null
        const sector = stock.sector || ""
        const isNonStock = nonStockSectors.includes(sector)

        // Determine color based on sector
        let itemColor = colors[0] // Default for stocks
        if (sector === "Cash") itemColor = CASH_COLOR
        else if (sector === "Bonds") itemColor = BONDS_COLOR
        else if (isNonStock) itemColor = OTHER_COLOR

        data.push({
          id: stock.ticker + (isNonStock ? `-${stock.id}` : ""),
          name: stock.ticker,
          value: sizingMode === "monosize" ? 1 : stock.totalValue,
          actualValue: stock.totalValue,
          color: itemColor,
          logoUrl: logoUrl,
          percentage: percentage,
          ticker: stock.ticker,
          companyName: stock.name,
        } as ExtendedTreemapPoint)
      })

      return data
    }

    // Handle "sector-industry" mode - 3-level hierarchy: Sector → Industry → Stocks
    if (groupingMode === "sector-industry") {
      // Group by sector first, then by industry within each sector
      const sectorGroups = new Map<string, Map<string, StockExposure[]>>()

      validExposures.forEach((exposure) => {
        const sector = toProperCase(exposure.sector || "Unknown Sector")
        const industry = toProperCase(exposure.industry || "Unknown Industry")

        if (!sectorGroups.has(sector)) {
          sectorGroups.set(sector, new Map())
        }
        const industryMap = sectorGroups.get(sector)!
        if (!industryMap.has(industry)) {
          industryMap.set(industry, [])
        }
        industryMap.get(industry)!.push(exposure)
      })

      // Create nodes: Sector → Industry → Stocks
      sectorGroups.forEach((industries, sectorName) => {
        // Level 1: Sector parent node
        data.push({
          id: sectorName,
          name: sectorName,
          color: getGroupColor(sectorName, "sector"),
        })

        industries.forEach((stocks, industryName) => {
          // Level 2: Industry intermediate node
          const industryId = `${sectorName}-${industryName}`
          data.push({
            id: industryId,
            name: industryName,
            parent: sectorName,
          })

          // Level 3: Stock leaf nodes
          stocks.forEach((stock, stockIndex) => {
            const percentage = (stock.totalValue / totalValue) * 100
            const logoUrl = logoUrls[stock.ticker.toUpperCase()] ?? null
            data.push({
              id: `${industryId}-${stock.ticker}-${stockIndex}`,
              name: stock.ticker,
              parent: industryId,
              value: sizingMode === "monosize" ? 1 : stock.totalValue,
              actualValue: stock.totalValue,
              logoUrl: logoUrl,
              percentage: percentage,
              ticker: stock.ticker,
              companyName: stock.name,
            } as ExtendedTreemapPoint)
          })
        })
      })

      return data
    }


    // Handle "sector" mode - 2-level hierarchy: Sector → Stocks
    const groups = new Map<string, StockExposure[]>()
    validExposures.forEach((exposure) => {
      const group = toProperCase(exposure.sector || "Unknown Sector")
      if (!groups.has(group)) {
        groups.set(group, [])
      }
      groups.get(group)!.push(exposure)
    })

    // Create parent nodes and child nodes
    groups.forEach((stocks, groupName) => {
      // Parent node - use consistent color mapping
      data.push({
        id: groupName,
        name: groupName,
        color: getGroupColor(groupName, groupingMode),
      })

      // Child nodes (stocks) with logo URLs
      stocks.forEach((stock, stockIndex) => {
        const percentage = (stock.totalValue / totalValue) * 100
        const logoUrl = logoUrls[stock.ticker.toUpperCase()] ?? null

        data.push({
          id: `${groupName}-${stock.ticker}-${stockIndex}`,
          name: stock.ticker,
          parent: groupName,
          value: sizingMode === "monosize" ? 1 : stock.totalValue,
          actualValue: stock.totalValue,
          logoUrl: logoUrl,
          percentage: percentage,
          ticker: stock.ticker,
          companyName: stock.name,
        } as ExtendedTreemapPoint)
      })
    })

    return data
  }

  // Transform data for pie chart
  interface PieChartPoint extends Highcharts.PointOptionsObject {
    name: string
    y: number
    actualValue: number
    color?: string
    logoUrl?: string | null
    ticker?: string
    companyName?: string
  }

  const getPieChartData = (): PieChartPoint[] => {
    const validExposures = exposures.filter(
      (exp) => !exp.isETFBreakdown && exp.totalValue > 0,
    )

    const data: PieChartPoint[] = []
    const THRESHOLD_PERCENTAGE = 0.5 // 0.5% threshold - items below this go to "Others"

    // Handle "none" mode - show individual stocks with single color
    if (groupingMode === "none") {
      const sortedExposures = [...validExposures].sort(
        (a, b) => b.totalValue - a.totalValue,
      )

      // Calculate total value for percentage calculation
      const totalValue = sortedExposures.reduce(
        (sum, exp) => sum + exp.totalValue,
        0,
      )

      // Separate main and small segments
      const mainSegments: typeof sortedExposures = []
      const smallSegments: typeof sortedExposures = []

      sortedExposures.forEach((stock) => {
        const percentage = (stock.totalValue / totalValue) * 100
        if (percentage >= THRESHOLD_PERCENTAGE) {
          mainSegments.push(stock)
        } else {
          smallSegments.push(stock)
        }
      })

      // Non-stock sectors that need special coloring
      const nonStockSectors = ["Cash", "Bonds", "Real Estate", "Commodities", "Other"]

      // Add main segments
      mainSegments.forEach((stock) => {
        const logoUrl = logoUrls[stock.ticker.toUpperCase()] ?? null
        const sector = stock.sector || ""
        const isNonStock = nonStockSectors.includes(sector)

        // Determine color based on sector
        let itemColor = colors[0] // Default for stocks
        if (sector === "Cash") itemColor = CASH_COLOR
        else if (sector === "Bonds") itemColor = BONDS_COLOR
        else if (isNonStock) itemColor = OTHER_COLOR

        data.push({
          name: stock.ticker,
          y: stock.totalValue,
          actualValue: stock.totalValue,
          color: itemColor,
          logoUrl: logoUrl,
          ticker: stock.ticker,
          companyName: stock.name,
        })
      })

      // Add "Others" segment if there are small segments
      if (smallSegments.length > 0) {
        const othersTotal = smallSegments.reduce(
          (sum, stock) => sum + stock.totalValue,
          0,
        )
        const othersPercentage = (othersTotal / totalValue) * 100

        data.push({
          name: `Others (${smallSegments.length} stocks)`,
          y: othersTotal,
          actualValue: othersTotal,
          color: "#9ca3af", // Gray color for others
          custom: {
            description: `${smallSegments.length} stocks < 1% each (${othersPercentage.toFixed(1)}% total)`,
          },
        })
      }

      return data
    }

    // Handle grouped modes - differentiate between sector and sector-industry
    if (groupingMode === "sector") {
      // Show sectors (existing behavior)
      // Group stocks by sector and aggregate values
      const groups = new Map<string, number>()
      validExposures.forEach((exposure) => {
        const group = toProperCase(exposure.sector || "Unknown Sector")
        groups.set(group, (groups.get(group) || 0) + exposure.totalValue)
      })

      // Convert to array and sort by value
      const sortedGroups = Array.from(groups.entries()).sort(
        (a, b) => b[1] - a[1],
      )

      // Calculate total value for percentage calculation
      const totalValue = sortedGroups.reduce((sum, [, value]) => sum + value, 0)

      // Separate main and small segments
      const mainGroups: typeof sortedGroups = []
      const smallGroups: typeof sortedGroups = []

      sortedGroups.forEach(([groupName, value]) => {
        const percentage = (value / totalValue) * 100
        if (percentage >= THRESHOLD_PERCENTAGE) {
          mainGroups.push([groupName, value])
        } else {
          smallGroups.push([groupName, value])
        }
      })

      // Add main groups with consistent color mapping
      mainGroups.forEach(([groupName, value]) => {
        data.push({
          name: groupName,
          y: value,
          actualValue: value,
          color: getGroupColor(groupName, "sector"),
        })
      })

      // Add "Others" segment if there are small groups
      if (smallGroups.length > 0) {
        const othersTotal = smallGroups.reduce((sum, [, value]) => sum + value, 0)
        const othersPercentage = (othersTotal / totalValue) * 100

        data.push({
          name: `Others (${smallGroups.length} sectors)`,
          y: othersTotal,
          actualValue: othersTotal,
          color: "#9ca3af",
          custom: {
            description: `${smallGroups.length} sectors < 0.5% each (${othersPercentage.toFixed(1)}% total)`,
          },
        })
      }

      return data
    } else if (groupingMode === "sector-industry") {
      // Show industries with darkened colors by sector

      // Step 1: Build sector → industries mapping
      const sectorIndustries = new Map<string, Map<string, number>>()

      validExposures.forEach((exposure) => {
        const sector = toProperCase(exposure.sector || "Unknown Sector")
        const industry = toProperCase(exposure.industry || "Unknown Industry")

        if (!sectorIndustries.has(sector)) {
          sectorIndustries.set(sector, new Map())
        }

        const industries = sectorIndustries.get(sector)!
        industries.set(
          industry,
          (industries.get(industry) || 0) + exposure.totalValue,
        )
      })

      // Step 2: Sort sectors by total value to get consistent sector colors
      const sectorTotals = new Map<string, number>()
      sectorIndustries.forEach((industries, sector) => {
        const total = Array.from(industries.values()).reduce(
          (sum, val) => sum + val,
          0,
        )
        sectorTotals.set(sector, total)
      })

      const sortedSectors = Array.from(sectorTotals.entries()).sort(
        (a, b) => b[1] - a[1],
      )

      // Step 3: Assign colors to each industry
      const allIndustries: Array<[string, number, string, string]> = [] // [industry, value, color, sector]

      sortedSectors.forEach(([sector, _], sectorIndex) => {
        const sectorColor = getGroupColor(sector, "sector") // Base sector color
        const industries = Array.from(
          sectorIndustries.get(sector)!.entries(),
        ).sort((a, b) => b[1] - a[1]) // Sort industries within sector by value

        industries.forEach(([industry, value], industryIndex) => {
          // Darken by 15%, 30%, 45%, 60% for 1st, 2nd, 3rd, 4th+ industries
          const darkenPercent = Math.min(15 + industryIndex * 15, 60)
          const industryColor = darkenColor(sectorColor, darkenPercent)

          allIndustries.push([industry, value, industryColor, sector])
        })
      })

      // Step 4: Keep industries grouped by sector (already sorted within each sector)
      const sortedIndustries = allIndustries
      const totalValue = sortedIndustries.reduce((sum, [, val]) => sum + val, 0)

      const mainIndustries: typeof sortedIndustries = []
      const smallIndustries: typeof sortedIndustries = []

      sortedIndustries.forEach((item) => {
        const [, value] = item
        const percentage = (value / totalValue) * 100
        if (percentage >= THRESHOLD_PERCENTAGE) {
          mainIndustries.push(item)
        } else {
          smallIndustries.push(item)
        }
      })

      // Step 5: Build pie chart data
      mainIndustries.forEach(([industry, value, color, sector]) => {
        data.push({
          name: industry,
          y: value,
          actualValue: value,
          color: color,
          custom: {
            sector: sector, // Add sector info for tooltip
          },
        })
      })

      // Add "Others" if needed
      if (smallIndustries.length > 0) {
        const othersTotal = smallIndustries.reduce(
          (sum, [, val]) => sum + val,
          0,
        )
        const othersPercentage = (othersTotal / totalValue) * 100

        data.push({
          name: `Others (${smallIndustries.length} industries)`,
          y: othersTotal,
          actualValue: othersTotal,
          color: "#9ca3af",
          custom: {
            description: `${smallIndustries.length} industries < 0.5% each (${othersPercentage.toFixed(1)}% total)`,
          },
        })
      }

      return data
    }

    return data
  }

  // Chart options
  const options: Highcharts.Options = {
    chart: {
      type: "treemap",
      backgroundColor: "transparent",
      height: responsiveHeight,
      margin: [0, 0, 0, 0],
      events: {
        fullscreenOpen: function () {
          // Get current theme from DOM
          const currentIsDark =
            document.documentElement.classList.contains("dark")
          // Update chart background for fullscreen
          this.update(
            {
              chart: {
                backgroundColor: currentIsDark ? "#111827" : "#ffffff",
              },
            },
            false,
          )
        },
        fullscreenClose: function () {
          // No need to update - chart returns to normal state automatically
        },
      },
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
          enabled: false, // Disable default button - using custom export button instead
        },
      },
    },
    series: [
      {
        type: "treemap",
        name: "All",
        allowTraversingTree: groupingMode !== "none", // Disable tree traversing for flat structure
        layoutAlgorithm: "strip",
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
            layoutAlgorithm: "squarified",
            dataLabels: {
              enabled: true,
              ...(groupingMode === "none"
                ? {
                    // For "none" mode, use the same formatter as level 2 to show logos
                    useHTML: true,
                    inside: true,
                    verticalAlign: "middle",
                    align: "center",
                    formatter: function () {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const point = (this as any).point as any
                      const contentStrategy = getContentStrategy(point)

                      // Return empty for very small cells
                      if (contentStrategy === "none") {
                        return ""
                      }

                      return renderCellContent(point, contentStrategy)
                    },
                  }
                : {
                    // For grouped modes, use simple headers
                    headers: true,
                    style: {
                      textOutline: "none",
                      color: isDark ? "#f3f4f6" : "#111827",
                    },
                  }),
            },
            borderWidth: 3,
            borderRadius: 3,
            borderColor: isDark ? "#1f2937" : "#f3f4f6",
          },
          {
            level: 2,
            dataLabels: {
              enabled: true,
              ...(groupingMode === "sector-industry"
                ? {
                    // For sector-industry mode, level 2 is industry headers
                    headers: true,
                    style: {
                      textOutline: "none",
                      color: isDark ? "#f3f4f6" : "#111827",
                      fontSize: "12px",
                    },
                  }
                : {
                    // For sector mode, level 2 is stocks with logos
                    useHTML: true,
                    inside: true,
                    verticalAlign: "middle",
                    align: "center",
                    formatter: function () {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const point = (this as any).point as any
                      const contentStrategy = getContentStrategy(point)

                      // Return empty for very small cells
                      if (contentStrategy === "none") {
                        return ""
                      }

                      return renderCellContent(point, contentStrategy)
                    },
                  }),
            },
            borderWidth: 3,
            borderColor: isDark ? "#1f2937" : "#f3f4f6",
          },
          {
            // Level 3: Stocks with logos (only used in sector-industry mode)
            level: 3,
            dataLabels: {
              enabled: true,
              useHTML: true,
              inside: true,
              verticalAlign: "middle",
              align: "center",
              formatter: function () {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const point = (this as any).point as any
                const contentStrategy = getContentStrategy(point)

                // Return empty for very small cells
                if (contentStrategy === "none") {
                  return ""
                }

                return renderCellContent(point, contentStrategy)
              },
            },
            borderWidth: 2,
            borderColor: isDark ? "#374151" : "#e5e7eb",
          },
        ],
        dataLabels: {
          enabled: false, // Disable default dataLabels at series level
        },
      } as Highcharts.SeriesTreemapOptions,
    ],
    tooltip: {
      useHTML: true,
      followTouchMove: false,
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
        // Use actualValue if available (for monosize mode), otherwise use value
        const value =
          point.actualValue !== undefined
            ? point.actualValue
            : typeof point.value === "number"
              ? point.value
              : 0
        const pctPortfolio = ((value / totalValue) * 100).toFixed(1)
        const pctStocks =
          stocksOnlyValue > 0
            ? ((value / stocksOnlyValue) * 100).toFixed(1)
            : "0.0"
        const ticker = point.ticker || point.name
        return `<div style="padding: 2px;">
                  <div style="font-weight: 600; margin-bottom: 4px;">${ticker}</div>
                  <div>Market Value: <b>${formatValue(value)}</b></div>
                  <div>Portfolio %: <b>${pctPortfolio}%</b></div>
                  <div>Stock %: <b>${pctStocks}%</b></div>
                </div>`
      },
    },
  }

  // Pie chart options
  const pieOptions: Highcharts.Options = {
    chart: {
      type: "pie",
      backgroundColor: "transparent",
      height: responsiveHeight,
      events: {
        fullscreenOpen: function () {
          // Get current theme from DOM
          const currentIsDark =
            document.documentElement.classList.contains("dark")
          // Update chart background for fullscreen
          this.update(
            {
              chart: {
                backgroundColor: currentIsDark ? "#111827" : "#ffffff",
              },
            },
            false,
          )
        },
        fullscreenClose: function () {
          // No need to update - chart returns to normal state automatically
        },
      },
    },
    title: {
      text: undefined,
    },
    credits: {
      enabled: false,
    },
    xAxis: {
      gridLineWidth: 0,
      lineWidth: 0,
      visible: false,
    },
    yAxis: {
      gridLineWidth: 0,
      lineWidth: 0,
      visible: false,
    },
    exporting: {
      buttons: {
        contextButton: {
          enabled: false,
        },
      },
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: "pointer",
        dataLabels: {
          enabled: true,
          useHTML: true,
          distance: 15,
          connectorColor: isDark ? "#4b5563" : "#9ca3af",
          connectorWidth: 1,
          formatter: function () {
            const point = this as any
            const value = point.actualValue ?? point.y
            const ticker = point.ticker || point.name
            const logoUrl = point.logoUrl
            const companyName = point.companyName || ticker

            // Calculate percentage of this section relative to stock portfolio
            const percentage = stocksOnlyValue > 0 ? (value / stocksOnlyValue) * 100 : 0

            // Skip very small slices
            if (percentage < 3) return null

            // Check if nothing is enabled
            if (!showLogo && titleMode === "none" && !showChartValue) return null

            const parts: string[] = []
            const isCash = ticker === "CASH"

            // Logo (if enabled and available, or "$" for cash)
            if (showLogo && percentage >= 5) {
              if (isCash) {
                // Show "$" for cash entries
                parts.push(`<div style="display:flex;justify-content:center;margin-bottom:2px;">
                  <div style="width:24px;height:24px;border-radius:50%;background:${isDark ? "#374151" : "#e5e7eb"};display:flex;align-items:center;justify-content:center;">
                    <span style="font-size:12px;font-weight:700;color:${isDark ? "#9ca3af" : "#6b7280"};">$</span>
                  </div>
                </div>`)
              } else if (logoUrl) {
                const tooltipLogoStyle = getLogoStyle(ticker)
                parts.push(`<div style="display:flex;justify-content:center;margin-bottom:2px;">
                  <div style="width:24px;height:24px;border-radius:50%;background:${tooltipLogoStyle.background};display:flex;align-items:center;justify-content:center;overflow:hidden;">
                    <img src="${logoUrl}" alt="${ticker}" style="width:${tooltipLogoStyle.scale};height:${tooltipLogoStyle.scale};object-fit:contain;" />
                  </div>
                </div>`)
              }
            }

            // Title (based on titleMode)
            if (titleMode === "symbol") {
              parts.push(`<div style="font-weight:600;text-align:center;">${ticker}</div>`)
            } else if (titleMode === "name") {
              // Truncate long names
              const displayName = companyName.length > 15 ? companyName.substring(0, 12) + "..." : companyName
              parts.push(`<div style="font-weight:600;text-align:center;font-size:10px;">${displayName}</div>`)
            }

            // Value (if showChartValue enabled)
            if (showChartValue) {
              let displayVal: string
              if (displayValue === "market-value") {
                displayVal = formatValue(value)
              } else if (displayValue === "pct-stocks") {
                displayVal = `${percentage.toFixed(1)}%`
              } else {
                // pct-portfolio or none - show portfolio %
                const pctPortfolio = (value / totalValue) * 100
                displayVal = `${pctPortfolio.toFixed(1)}%`
              }
              parts.push(`<div style="text-align:center;font-size:10px;">${displayVal}</div>`)
            }

            if (parts.length === 0) return null

            return `<div style="text-align:center;">${parts.join("")}</div>`
          },
          style: {
            color: isDark ? "#f3f4f6" : "#111827",
            fontSize: "11px",
            fontWeight: "500",
            textOutline: "none",
          },
        },
        showInLegend: false,
        borderWidth: 2,
        borderColor: isDark ? "#1f2937" : "#f3f4f6",
      },
    },
    series: [
      {
        type: "pie",
        innerSize: "50%",
        name:
          groupingMode === "none"
            ? "Holdings"
            : groupingMode === "sector"
              ? "Sectors"
              : "Industries",
        data: getPieChartData(),
      },
    ],
    tooltip: {
      useHTML: true,
      followTouchMove: false,
      outside: true,
      headerFormat: "",
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
        const value =
          point.actualValue !== undefined
            ? point.actualValue
            : typeof point.y === "number"
              ? point.y
              : 0
        const pctPortfolio = ((value / totalValue) * 100).toFixed(1)
        const pctStocks =
          stocksOnlyValue > 0
            ? ((value / stocksOnlyValue) * 100).toFixed(1)
            : "0.0"
        const name = point.ticker || point.name

        // Show sector information when in sector-industry mode
        const sectorInfo = groupingMode === "sector-industry" && point.custom?.sector
          ? `<div style="font-size: 11px; opacity: 0.8; margin-bottom: 4px;">Sector: ${point.custom.sector}</div>`
          : ""

        return `<div style="padding: 2px;">
                  <div style="font-weight: 600; margin-bottom: 4px;">${name}</div>
                  ${sectorInfo}
                  <div>Market Value: <b>${formatValue(value)}</b></div>
                  <div>Portfolio %: <b>${pctPortfolio}%</b></div>
                  <div>Stock %: <b>${pctStocks}%</b></div>
                </div>`
      },
    },
  }

  // Calculate top groups or holdings for legend
  const topGroups = (() => {
    const validExposures = exposures.filter(
      (exp) => !exp.isETFBreakdown && exp.totalValue > 0,
    )

    // For mag7, top7, or top10 filters, show all items in the filtered list
    if (holdingsFilter === "mag7" || holdingsFilter === "top7" || holdingsFilter === "top10") {
      return validExposures
        .sort((a, b) => b.totalValue - a.totalValue)
        .map((exp) => ({
          name: exp.ticker,
          value: exp.totalValue,
          logoUrl: logoUrls[exp.ticker.toUpperCase()] ?? null,
        }))
    }

    if (groupingMode === "none") {
      // For "none" mode, show top 10 holdings with logo URLs
      return validExposures
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 10)
        .map((exp) => ({
          name: exp.ticker,
          value: exp.totalValue,
          logoUrl: logoUrls[exp.ticker.toUpperCase()] ?? null,
        }))
    } else {
      // For grouped modes (sector and sector-industry), show top 6 sectors
      return Object.entries(
        validExposures.reduce(
          (acc, exp) => {
            const key = toProperCase(exp.sector || "Unknown Sector")
            acc[key] = (acc[key] || 0) + exp.totalValue
            return acc
          },
          {} as Record<string, number>,
        ),
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, value]) => ({
          name,
          value,
          logoUrl: null, // Sectors don't have logos
        }))
    }
  })()

  // Calculate total for filtered views (mag7, top7, or top10) or "none" grouping mode
  // For filtered views, sum all exposures; for "none" mode, sum only the legend items (top 10)
  const filteredTotal = (holdingsFilter === "mag7" || holdingsFilter === "top7" || holdingsFilter === "top10")
    ? exposures
        .filter((exp) => !exp.isETFBreakdown && exp.totalValue > 0)
        .reduce((sum, exp) => sum + exp.totalValue, 0)
    : groupingMode === "none"
      ? topGroups.reduce((sum, item) => sum + item.value, 0)
      : null

  // Export handlers
  const handleExport = (type: string) => {
    const chart = chartRef.current?.chart
    if (!chart) return

    switch (type) {
      case "fullscreen":
        chart.fullscreen?.open()
        break
      case "print":
        chart.print()
        break
      case "png":
        chart.exportChart({ type: "image/png" })
        break
      case "jpeg":
        chart.exportChart({ type: "image/jpeg" })
        break
      case "pdf":
        chart.exportChart({ type: "application/pdf" })
        break
      case "svg":
        chart.exportChart({ type: "image/svg+xml" })
        break
      case "csv":
        chart.downloadCSV()
        break
      case "xls":
        chart.downloadXLS()
        break
    }
  }

  // Calculate valid exposures early to determine if we need to show empty state
  const validExposures = exposures.filter(
    (exp) => !exp.isETFBreakdown && exp.totalValue > 0,
  )

  if (!modulesLoaded) {
    return (
      <Card className="pb-4 pt-6">
        <div className="flex items-center justify-center" style={{ height: responsiveHeight }}>
          <div className="text-sm text-gray-500">Loading chart...</div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="pb-4 pt-6" data-chart="exposure-map">
      <div className="flex items-center justify-between">
        <h3
          className="cursor-pointer text-base font-medium text-gray-900 transition-colors hover:text-blue-600 dark:text-gray-50 dark:hover:text-blue-400"
          onClick={() => {
            document.getElementById('exposure-section')?.scrollIntoView({ behavior: 'smooth' })
          }}
        >
          Exposure map
        </h3>

        <div className="flex items-center gap-2">
          <Tooltip
            triggerAsChild
            content="Switch between treemap and pie chart views"
          >
            <Button
              variant="secondary"
              className="h-9"
              onClick={() =>
                setChartType(chartType === "treemap" ? "pie" : "treemap")
              }
            >
              {chartType === "treemap" ? (
                <RiDonutChartLine className="size-4" aria-hidden="true" />
              ) : (
                <RiLayout4Line className="size-4" aria-hidden="true" />
              )}
            </Button>
          </Tooltip>

          <DropdownMenu>
            <Tooltip triggerAsChild content="Configure chart display options">
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="relative h-9">
                  <RiSettings3Line className="size-4" aria-hidden="true" />
                  {hasSettingsChanges && (
                    <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-blue-500" />
                  )}
                </Button>
              </DropdownMenuTrigger>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>DISPLAY SETTINGS</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuCheckboxItem
                checked={showLogo}
                onCheckedChange={setShowLogo}
              >
                Logo
              </DropdownMenuCheckboxItem>

              <DropdownMenuSubMenu>
                <DropdownMenuSubMenuTrigger>
                  <span>Title</span>
                  <span className="ml-auto text-xs text-gray-500">
                    {titleMode === "symbol"
                      ? "Symbol"
                      : titleMode === "name"
                        ? "Name"
                        : "None"}
                  </span>
                </DropdownMenuSubMenuTrigger>
                <DropdownMenuSubMenuContent>
                  <DropdownMenuRadioGroup
                    value={titleMode}
                    onValueChange={(value) =>
                      setTitleMode(value as TitleMode)
                    }
                  >
                    <DropdownMenuRadioItem value="symbol" iconType="check">
                      Symbol
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="name" iconType="check">
                      Name
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="none" iconType="check">
                      None
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubMenuContent>
              </DropdownMenuSubMenu>

              <DropdownMenuCheckboxItem
                checked={showChartValue}
                onCheckedChange={setShowChartValue}
              >
                Show value
              </DropdownMenuCheckboxItem>

              <DropdownMenuSeparator />

              <DropdownMenuSubMenu>
                <DropdownMenuSubMenuTrigger>
                  <span>Group by</span>
                  <span className="ml-auto text-xs text-gray-500">
                    {groupingMode === "none"
                      ? "None"
                      : groupingMode === "sector"
                        ? "Sector"
                        : "Sector & Industry"}
                  </span>
                </DropdownMenuSubMenuTrigger>
                <DropdownMenuSubMenuContent>
                  <DropdownMenuRadioGroup
                    value={groupingMode}
                    onValueChange={(value) =>
                      setGroupingMode(value as GroupingMode)
                    }
                  >
                    <DropdownMenuRadioItem value="none" iconType="check">
                      None
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="sector" iconType="check">
                      Sector
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="sector-industry" iconType="check">
                      Sector & Industry
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubMenuContent>
              </DropdownMenuSubMenu>

              {/* Reset Chart - shows when settings have changed */}
              {hasSettingsChanges && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={resetChartSettings}
                    className="text-gray-500 dark:text-gray-400"
                  >
                    <RiResetLeftLine className="mr-2 size-4" aria-hidden="true" />
                    Reset Chart
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <Tooltip
              triggerAsChild
              content="Export chart as image or data file"
            >
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="h-9">
                  <RiDownloadLine className="size-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>EXPORT OPTIONS</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport("print")}>
                Print chart
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport("png")}>
                Download PNG image
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("jpeg")}>
                Download JPEG image
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                Download PDF document
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("svg")}>
                Download SVG vector
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                Download CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("xls")}>
                Download XLS
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip triggerAsChild content="View chart in fullscreen mode">
            <Button
              variant="secondary"
              className="h-9"
              onClick={() => handleExport("fullscreen")}
            >
              <RiFullscreenLine className="size-4" aria-hidden="true" />
            </Button>
          </Tooltip>
        </div>
      </div>

      {validExposures.length === 0 ? (
        // Empty state when no stocks exist
        <div className="mt-4 flex flex-col items-center justify-center" style={{ height: responsiveHeight }}>
          <RiLayoutMasonryLine
            className="mb-3 size-12 text-gray-300 dark:text-gray-600"
            aria-hidden="true"
          />
          <h4 className="mb-1 text-base font-medium text-gray-900 dark:text-gray-50">
            No stock holdings found
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            The selected account contains no individual stock positions
          </p>
        </div>
      ) : (
        <>
          <div className="mt-4">
            <HighchartsReact
              highcharts={Highcharts}
              options={chartType === "treemap" ? options : pieOptions}
              ref={chartRef}
            />
          </div>

          {/* Legend */}
          <div className="mt-4">
            <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              {holdingsFilter === "mag7"
                ? "Magnificent 7"
                : holdingsFilter === "top7"
                  ? "Top 7 Holdings"
                  : holdingsFilter === "top10"
                    ? "Top 10 Holdings"
                    : groupingMode === "none"
                      ? "Top Holdings"
                      : "Top Sectors"}
            </p>
            <ul className="flex flex-wrap gap-x-10 gap-y-4 text-sm">
              {/* Total at START for filtered views */}
              {filteredTotal !== null && (
                <li className="border-r border-gray-300 pr-6 dark:border-gray-700">
                  <span className="text-base font-semibold text-gray-900 dark:text-gray-50">
                    {getLegendDisplayValue(filteredTotal)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {holdingsFilter === "mag7"
                        ? "Magnificent 7"
                        : holdingsFilter === "top7"
                          ? "Top 7"
                          : "Top 10"} Total
                    </span>
                  </div>
                </li>
              )}
              {topGroups.map((item, index) => {
                const logoUrl = showLogo ? item.logoUrl : null
                const isCash = item.name === "CASH" || item.name === "Cash"
                const isBonds = item.name === "Bonds" || item.name === "BONDS"

                // Non-stock sectors for legend coloring
                const nonStockSectors = ["Cash", "CASH", "Bonds", "BONDS", "Real Estate", "Commodities", "Other"]
                const isNonStock = nonStockSectors.includes(item.name)

                // Determine color for legend indicator
                let legendColor = groupingMode === "none" ? colors[0] : colors[index % colors.length]
                if (isCash) legendColor = CASH_COLOR
                else if (isBonds) legendColor = BONDS_COLOR
                else if (isNonStock) legendColor = OTHER_COLOR

                return (
                  <li key={`${item.name}-${index}`}>
                    <span className="text-base font-semibold text-gray-900 dark:text-gray-50">
                      {getLegendDisplayValue(item.value)}
                    </span>
                    <div className="flex items-center gap-2">
                      {showLogo && isCash ? (
                        // Show "$" for cash entries
                        <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">$</span>
                        </div>
                      ) : showLogo && isBonds ? (
                        // Show bond icon for bonds entries
                        <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400">B</span>
                        </div>
                      ) : logoUrl ? (
                        <div className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                          <img
                            src={logoUrl}
                            alt={item.name}
                            className="h-full w-full object-contain"
                          />
                        </div>
                      ) : (
                        <span
                          className="size-2.5 shrink-0 rounded-sm"
                          style={{
                            backgroundColor: legendColor,
                          }}
                          aria-hidden="true"
                        />
                      )}
                      <span className="text-sm">{item.name}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </>
      )}
    </Card>
  )
}
