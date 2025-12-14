"use client"

import { Button } from "@/components/Button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/DropdownMenu"
import { Tooltip } from "@/components/Tooltip"
import { getAssetClassHexColor } from "@/lib/assetClassColors"
import { Icon } from "@iconify/react"
import { RiFullscreenLine } from "@remixicon/react"
import { useTheme } from "next-themes"
import { useEffect, useRef, useState } from "react"

// Import Highcharts dynamically only on client-side
import type HighchartsType from "highcharts"
import type HighchartsReactType from "highcharts-react-official"

// Track if modules are initialized globally to prevent duplicate initialization
let modulesInitialized = false
let Highcharts: typeof HighchartsType | null = null
let HighchartsReact: typeof HighchartsReactType | null = null

interface HighchartsDonutChartProps {
  data: {
    name: string
    amount: number
    share: string
    borderColor: string
  }[]
  height?: number
  totalValue: number
  valueFormatter: (value: number) => string
  colors: string[]
  colorMapping?: Record<string, string> // Optional explicit color mapping
  useAssetClassColors?: boolean // Flag to use asset class specific colors
}

export function HighchartsDonutChart({
  data,
  height = 280,
  totalValue,
  valueFormatter,
  colors,
  colorMapping,
  useAssetClassColors = false,
}: HighchartsDonutChartProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null)
  const [isClient, setIsClient] = useState(false)
  const [isHighchartsLoaded, setIsHighchartsLoaded] = useState(false)

  // Load Highcharts dynamically on client-side
  useEffect(() => {
    setIsClient(true)

    const loadHighcharts = async () => {
      if (!Highcharts) {
        // Dynamically import Highcharts
        const highchartsModule = await import("highcharts")
        Highcharts = highchartsModule.default

        const highchartsReactModule = await import("highcharts-react-official")
        HighchartsReact = highchartsReactModule.default
      }

      // Initialize modules once
      if (!modulesInitialized && Highcharts && typeof Highcharts === "object") {
        // Load exporting first, then export-data (which depends on exporting's prototype)
        const HighchartsExporting = await import("highcharts/modules/exporting")
        if (typeof HighchartsExporting.default === "function") {
          HighchartsExporting.default(Highcharts)
        }

        const HighchartsExportData = await import("highcharts/modules/export-data")
        if (typeof HighchartsExportData.default === "function") {
          HighchartsExportData.default(Highcharts)
        }

        modulesInitialized = true
      }

      setIsHighchartsLoaded(true)
    }

    loadHighcharts()
  }, [])

  // Export handler
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

  // Map color names to hex values
  const colorMap: Record<string, string> = {
    blue: "#3b82f6",
    gray: "#6b7280",
    cyan: "#06b6d4",
    amber: "#f59e0b",
    emerald: "#10b981",
    violet: "#8b5cf6",
    fuchsia: "#ec4899",
    pink: "#f472b6",
    sky: "#0ea5e9",
    lime: "#84cc16",
    red: "#ef4444",
    green: "#22c55e",
    orange: "#fb923c",
  }

  // Transform data for Highcharts with improved color mapping
  const chartData = data.map((item, index) => {
    let color: string

    if (useAssetClassColors) {
      // Use asset class specific colors
      color = getAssetClassHexColor(item.name)
    } else if (colorMapping && colorMapping[item.name]) {
      // Use explicit color mapping if provided
      color = colorMapping[item.name]
    } else {
      // Fall back to index-based color mapping
      const colorName = colors[index] || "blue"
      color = colorMap[colorName] || colorMap.blue
    }

    return {
      name: item.name,
      y: item.amount,
      color: color,
    }
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options: any = {
    chart: {
      type: "pie",
      backgroundColor: "transparent",
      height,
      style: {
        fontFamily: "inherit",
      },
      events: {
        fullscreenOpen: function () {
          const currentIsDark =
            document.documentElement.classList.contains("dark")
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
          // Chart returns to normal state automatically
        },
      },
    },
    title: {
      text: valueFormatter(totalValue),
      verticalAlign: "middle",
      style: {
        fontSize: "20px",
        fontWeight: "600",
        color: isDark ? "#f9fafb" : "#111827",
      },
    },
    credits: {
      enabled: false,
    },
    tooltip: {
      useHTML: true,
      followTouchMove: false,
      headerFormat: "",
      pointFormat:
        '<div style="padding: 2px;">' +
        '<div style="font-weight: 600; margin-bottom: 4px;">{point.name}</div>' +
        "<div>Allocation: <b>{point.percentage:.1f}%</b></div>" +
        "<div>Value: <b>${point.y:,.0f}</b></div>" +
        "</div>",
      backgroundColor: isDark ? "#1f2937" : "#ffffff",
      borderColor: isDark ? "#4b5563" : "#e5e7eb",
      borderRadius: 2,
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
    },
    legend: {
      enabled: false,
    },
    exporting: {
      buttons: {
        contextButton: {
          enabled: false, // Using custom export button instead
        },
      },
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: "pointer",
        innerSize: "60%",
        borderWidth: 2,
        borderColor: isDark ? "#1f2937" : "#ffffff",
        borderRadius: 4,
        dataLabels: {
          enabled: false,
        },
        states: {
          hover: {
            halo: {
              size: 8,
            },
          },
        },
      },
    },
    series: [
      {
        type: "pie",
        name: "Amount",
        data: chartData,
      },
    ],
  }

  // Update chart when theme or data changes
  useEffect(() => {
    if (chartRef.current?.chart) {
      const chart = chartRef.current.chart

      // Update title and colors based on theme
      chart.update({
        title: {
          text: valueFormatter(totalValue),
          style: {
            fontSize: "20px",
            fontWeight: "600",
            color: isDark ? "#f9fafb" : "#111827",
          },
        },
        tooltip: {
          followTouchMove: false,
          backgroundColor: isDark ? "#1f2937" : "#ffffff",
          borderColor: isDark ? "#4b5563" : "#e5e7eb",
          style: {
            color: isDark ? "#f3f4f6" : "#111827",
            fontSize: "12px",
          },
        },
      })
    }
  }, [isDark, totalValue, valueFormatter])

  if (!isClient || !isHighchartsLoaded || !Highcharts || !HighchartsReact) {
    return <div style={{ height }} />
  }

  const HighchartsReactComponent = HighchartsReact

  return (
    <div className="relative">
      {/* Control buttons - positioned in top right */}
      <div className="absolute right-0 top-0 z-10 flex items-center gap-2">
        {/* Export Menu */}
        <DropdownMenu>
          <Tooltip triggerAsChild content="Export chart as image or data file">
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="h-9">
                <Icon icon="carbon:download" className="size-4" aria-hidden="true" />
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

        {/* Fullscreen Button */}
        <Tooltip triggerAsChild content="View chart in fullscreen mode">
          <Button
            variant="secondary"
            onClick={() => handleExport("fullscreen")}
            className="h-9"
          >
            <RiFullscreenLine className="size-4" aria-hidden="true" />
          </Button>
        </Tooltip>
      </div>

      <HighchartsReactComponent
        highcharts={Highcharts}
        options={options}
        ref={chartRef}
      />
    </div>
  )
}
