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
import { getCachedLogoUrls } from "@/lib/logoUtils"
import { toProperCase } from "@/lib/utils"
import { RiDownloadLine, RiExpandUpDownLine, RiFullscreenLine, RiSettings3Line } from "@remixicon/react"
import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"
import HighchartsTreemap from "highcharts/modules/treemap"
import HighchartsExporting from "highcharts/modules/exporting"
import HighchartsExportData from "highcharts/modules/export-data"
import { useTheme } from "next-themes"
import { useEffect, useRef, useState } from "react"
import { InstitutionLogo } from "@/components/ui/InstitutionLogo"
import { StockExposure, Account } from "./types"

// Track if modules are initialized globally to prevent duplicate initialization
let treemapLogoModulesInitialized = false

// Type assertion for module initialization functions
type HighchartsModule = (H: typeof Highcharts) => void

interface ExposureTreemapHighchartsProps {
  exposures: StockExposure[]
  totalValue: number
  accounts: Account[]
  selectedAccount: string
  onAccountChange: (accountId: string) => void
}

type GroupingMode = "none" | "sector" | "industry"
type SizingMode = "proportional" | "monosize"
type TitleMode = "symbol" | "name" | "none"
type DisplayValue = "market-value" | "pct-stocks" | "pct-portfolio"

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
  accounts,
  selectedAccount,
  onAccountChange,
}: ExposureTreemapHighchartsProps) {
  const [groupingMode, setGroupingMode] = useState<GroupingMode>("sector")
  const [sizingMode] = useState<SizingMode>("proportional")
  const [showLogo, setShowLogo] = useState(true)
  const [titleMode, setTitleMode] = useState<TitleMode>("symbol")
  const [displayValue, setDisplayValue] = useState<DisplayValue>("pct-portfolio")
  const [modulesLoaded, setModulesLoaded] = useState(false)
  const [logoUrls, setLogoUrls] = useState<Record<string, string | null>>({})
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const chartRef = useRef<HighchartsReact.RefObject>(null)

  useEffect(() => {
    // Initialize Highcharts modules only once on client side
    if (!treemapLogoModulesInitialized && typeof Highcharts === "object") {
      try {
        // Cast modules to callable functions
        const treemapInit = HighchartsTreemap as unknown as HighchartsModule
        const exportingInit = HighchartsExporting as unknown as HighchartsModule
        const exportDataInit =
          HighchartsExportData as unknown as HighchartsModule

        if (typeof treemapInit === "function") {
          treemapInit(Highcharts)
        }
        if (typeof exportingInit === "function") {
          exportingInit(Highcharts)
        }
        if (typeof exportDataInit === "function") {
          exportDataInit(Highcharts)
        }
        treemapLogoModulesInitialized = true
      } catch (e) {
        // Modules may already be initialized
        console.log("Highcharts modules initialization:", e)
      }
    }
    setModulesLoaded(true)
  }, [])

  // Batch fetch logo URLs when exposures change
  useEffect(() => {
    const fetchLogos = async () => {
      const validExposures = exposures.filter(
        (exp) => !exp.isETFBreakdown && exp.totalValue > 0,
      )

      if (validExposures.length === 0) return

      // Extract unique tickers
      const tickers = validExposures.map((exp) => exp.ticker)

      // Batch fetch logos
      const logos = await getCachedLogoUrls(tickers)
      setLogoUrls(logos)
    }

    fetchLogos()
  }, [exposures])

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

  // Format legend values based on display value setting
  const getLegendDisplayValue = (value: number): string => {
    if (displayValue === "market-value") {
      return formatValue(value)
    } else if (displayValue === "pct-stocks") {
      const percentage = stocksOnlyValue > 0 ? (value / stocksOnlyValue) * 100 : 0
      return `${percentage.toFixed(1)}%`
    } else {
      // "pct-portfolio"
      const percentage = (value / totalValue) * 100
      return `${percentage.toFixed(1)}%`
    }
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

  // Calculate stocks-only total value (for pct-stocks display mode)
  const stocksOnlyValue = exposures
    .filter((exp) => !exp.isETFBreakdown && exp.totalValue > 0)
    .reduce((sum, exp) => sum + exp.totalValue, 0)

  // Helper function to get the display value text based on display settings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getDisplayValueText = (point: any): string => {
    const value = point.actualValue !== undefined
      ? point.actualValue
      : (typeof point.value === "number" ? point.value : 0)

    if (displayValue === "market-value") {
      return formatValue(value)
    } else if (displayValue === "pct-stocks") {
      const percentage = stocksOnlyValue > 0 ? (value / stocksOnlyValue) * 100 : 0
      return `${percentage.toFixed(1)}%`
    } else {
      // "pct-portfolio"
      const percentage = (value / totalValue) * 100
      return `${percentage.toFixed(1)}%`
    }
  }

  // Helper function to render cell content based on display settings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderCellContent = (point: any, strategy: "full" | "logo-ticker" | "logo-only"): string => {
    const ticker = point.ticker || point.name
    const companyName = point.companyName || ticker
    const displayText = titleMode === "name" ? companyName : ticker
    const logoUrl = point.logoUrl
    const logoSize = calculateLogoSize(point)
    const { tickerSize, weightSize } = calculateTextSizes(point)
    const displayValueText = getDisplayValueText(point)

    // Strategy: logo-only
    if (strategy === "logo-only") {
      if (showLogo && logoUrl) {
        return `<div style="text-align: center; display: flex; align-items: center; justify-content: center; height: 100%; overflow: hidden;">
          <div style="width: ${logoSize}px; height: ${logoSize}px; border-radius: 50%; background: #f1f3fa; overflow: hidden; display: flex; align-items: center; justify-content: center;">
            <img src="${logoUrl}"
                 alt="${ticker}"
                 style="width: 100%; height: 100%; object-fit: contain;"
                 onerror="this.style.display='none'"
            />
          </div>
        </div>`
      } else {
        return ""
      }
    }

    // Strategy: logo-ticker
    if (strategy === "logo-ticker") {
      const hasLogo = showLogo && logoUrl
      const hasTitle = titleMode === "symbol" || titleMode === "name"

      if (hasLogo && hasTitle) {
        // Logo + ticker/name
        return `<div style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; overflow: hidden;">
          <div style="width: ${logoSize}px; height: ${logoSize}px; border-radius: 50%; background: #f1f3fa; overflow: hidden; display: flex; align-items: center; justify-content: center; margin-bottom: 2px;">
            <img src="${logoUrl}"
                 alt="${ticker}"
                 style="width: 100%; height: 100%; object-fit: contain;"
                 onerror="this.style.display='none'"
            />
          </div>
          <span style="color: ${isDark ? "#f3f4f6" : "#f3f4f6"}; font-size: ${tickerSize}px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${displayText}
          </span>
        </div>`
      } else if (hasLogo) {
        // Logo only
        return `<div style="text-align: center; display: flex; align-items: center; justify-content: center; height: 100%; overflow: hidden;">
          <div style="width: ${logoSize}px; height: ${logoSize}px; border-radius: 50%; background: #f1f3fa; overflow: hidden; display: flex; align-items: center; justify-content: center;">
            <img src="${logoUrl}"
                 alt="${ticker}"
                 style="width: 100%; height: 100%; object-fit: contain;"
                 onerror="this.style.display='none'"
            />
          </div>
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
      const hasLogo = showLogo && logoUrl
      const hasTitle = titleMode === "symbol" || titleMode === "name"

      if (hasLogo && hasTitle) {
        // Logo + ticker/name + value
        return `<div style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; overflow: hidden;">
          <div style="width: ${logoSize}px; height: ${logoSize}px; border-radius: 50%; background: #f1f3fa; overflow: hidden; display: flex; align-items: center; justify-content: center; margin-bottom: 2px;">
            <img src="${logoUrl}"
                 alt="${ticker}"
                 style="width: 100%; height: 100%; object-fit: contain;"
                 onerror="this.style.display='none'"
            />
          </div>
          <span style="color: ${isDark ? "#f3f4f6" : "#f3f4f6"}; font-size: ${tickerSize}px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${displayText}
          </span>
          <span style="color: ${isDark ? "#f3f4f6" : "#f3f4f6"}; font-size: ${weightSize}px; font-weight: 500; white-space: nowrap; margin-top: 1px;">
            ${displayValueText}
          </span>
        </div>`
      } else if (hasLogo) {
        // Logo + value only
        return `<div style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; overflow: hidden;">
          <div style="width: ${logoSize}px; height: ${logoSize}px; border-radius: 50%; background: #f1f3fa; overflow: hidden; display: flex; align-items: center; justify-content: center; margin-bottom: 2px;">
            <img src="${logoUrl}"
                 alt="${ticker}"
                 style="width: 100%; height: 100%; object-fit: contain;"
                 onerror="this.style.display='none'"
            />
          </div>
          <span style="color: ${isDark ? "#f3f4f6" : "#f3f4f6"}; font-size: ${weightSize}px; font-weight: 500; white-space: nowrap;">
            ${displayValueText}
          </span>
        </div>`
      } else if (hasTitle) {
        // Ticker/name + value only
        return `<div style="text-align: center; overflow: hidden; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <span style="color: ${isDark ? "#f3f4f6" : "#f3f4f6"}; font-size: ${tickerSize}px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${displayText}
          </span>
          <span style="color: ${isDark ? "#f3f4f6" : "#f3f4f6"}; font-size: ${weightSize}px; font-weight: 500; white-space: nowrap; margin-top: 1px;">
            ${displayValueText}
          </span>
        </div>`
      } else {
        // Value only
        return `<div style="text-align: center; overflow: hidden; height: 100%; display: flex; align-items: center; justify-content: center;">
          <span style="color: ${isDark ? "#f3f4f6" : "#f3f4f6"}; font-size: ${weightSize}px; font-weight: 500;">
            ${displayValueText}
          </span>
        </div>`
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

      sortedExposures.forEach((stock) => {
        const percentage = (stock.totalValue / totalValue) * 100
        const logoUrl = logoUrls[stock.ticker.toUpperCase()] ?? null

        data.push({
          id: stock.ticker,
          name: stock.ticker,
          value: sizingMode === "monosize" ? 1 : stock.totalValue,
          actualValue: stock.totalValue,
          color: colors[0], // Use first color (blue) for all stocks in no-group mode
          logoUrl: logoUrl,
          percentage: percentage,
          ticker: stock.ticker,
          companyName: stock.name,
        } as ExtendedTreemapPoint)
      })

      return data
    }

    // Handle grouped modes (sector or industry)
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
        const logoUrl = logoUrls[stock.ticker.toUpperCase()] ?? null

        data.push({
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
        // Use actualValue if available (for monosize mode), otherwise use value
        const value = point.actualValue !== undefined ? point.actualValue : (typeof point.value === "number" ? point.value : 0)
        const pctPortfolio = ((value / totalValue) * 100).toFixed(1)
        const pctStocks = stocksOnlyValue > 0 ? ((value / stocksOnlyValue) * 100).toFixed(1) : "0.0"
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

  // Calculate top groups or holdings for legend
  const topGroups = (() => {
    const validExposures = exposures.filter(
      (exp) => !exp.isETFBreakdown && exp.totalValue > 0,
    )

    if (groupingMode === "none") {
      // For "none" mode, show top 10 holdings
      return validExposures
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 10)
        .map((exp) => [exp.ticker, exp.totalValue] as [string, number])
    } else {
      // For grouped modes, show top 6 sectors/industries
      return Object.entries(
        validExposures.reduce(
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
    }
  })()

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

  if (!modulesLoaded) {
    return (
      <Card className="pb-4 pt-6">
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-sm text-gray-500">Loading chart...</div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="pb-4 pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-gray-900 dark:text-gray-50">
          Exposure map
        </h3>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="h-9 w-[200px] justify-between">
                <span className="flex items-center gap-2">
                  {selectedAccount === "all" ? (
                    "All Accounts"
                  ) : (
                    <>
                      <InstitutionLogo
                        institution={accounts.find(a => a.id === selectedAccount)?.institution || ""}
                        size="xs"
                      />
                      <span className="truncate">
                        {accounts.find(a => a.id === selectedAccount)?.name || "Select account"}
                      </span>
                    </>
                  )}
                </span>
                <RiExpandUpDownLine className="size-4 text-gray-400 dark:text-gray-600" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
              <DropdownMenuLabel>ACCOUNT</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={selectedAccount}
                onValueChange={onAccountChange}
              >
                <DropdownMenuRadioItem value="all" iconType="check">
                  All Accounts
                </DropdownMenuRadioItem>
                {accounts.map((account) => (
                  <DropdownMenuRadioItem key={account.id} value={account.id} iconType="check">
                    <div className="flex items-center gap-2">
                      <InstitutionLogo
                        institution={account.institution}
                        size="xs"
                      />
                      <span className="truncate">{account.name}</span>
                    </div>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="h-9 w-[180px] justify-between">
                <span>
                  {groupingMode === "none" ? "No group" :
                   groupingMode === "sector" ? "Sector" : "Industry"}
                </span>
                <RiExpandUpDownLine className="size-4 text-gray-400 dark:text-gray-600" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[180px]">
              <DropdownMenuLabel>GROUP BY</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={groupingMode}
                onValueChange={(value) => setGroupingMode(value as GroupingMode)}
              >
                <DropdownMenuRadioItem value="none" iconType="check">
                  No group
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="sector" iconType="check">
                  Sector
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="industry" iconType="check">
                  Industry
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="h-9">
                <RiDownloadLine className="size-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="h-9">
                <RiSettings3Line className="size-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
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
                    {titleMode === "symbol" ? "Symbol" :
                     titleMode === "name" ? "Name" : "None"}
                  </span>
                </DropdownMenuSubMenuTrigger>
                <DropdownMenuSubMenuContent>
                  <DropdownMenuRadioGroup
                    value={titleMode}
                    onValueChange={(value) => setTitleMode(value as TitleMode)}
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

              <DropdownMenuSubMenu>
                <DropdownMenuSubMenuTrigger>
                  <span>Display value</span>
                  <span className="ml-auto text-xs text-gray-500">
                    {displayValue === "market-value" ? "Market value" :
                     displayValue === "pct-stocks" ? "Stock %" :
                     "Portfolio %"}
                  </span>
                </DropdownMenuSubMenuTrigger>
                <DropdownMenuSubMenuContent>
                  <DropdownMenuRadioGroup
                    value={displayValue}
                    onValueChange={(value) => setDisplayValue(value as DisplayValue)}
                  >
                    <DropdownMenuRadioItem value="market-value" iconType="check">
                      Market value
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="pct-stocks" iconType="check">
                      Stock %
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="pct-portfolio" iconType="check">
                      Portfolio %
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubMenuContent>
              </DropdownMenuSubMenu>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="secondary"
            className="h-9"
            onClick={() => handleExport("fullscreen")}
          >
            <RiFullscreenLine className="size-4" aria-hidden="true" />
          </Button>
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
          {groupingMode === "none"
            ? "Top Holdings"
            : groupingMode === "sector"
              ? "Top Sectors"
              : "Top Industries"}
        </p>
        <ul className="flex flex-wrap gap-x-10 gap-y-4 text-sm">
          {topGroups.map(([name, value], index) => (
            <li key={name}>
              <span className="text-base font-semibold text-gray-900 dark:text-gray-50">
                {getLegendDisplayValue(value)}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-sm"
                  style={{
                    backgroundColor:
                      groupingMode === "none"
                        ? colors[0]
                        : colors[index % colors.length],
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
