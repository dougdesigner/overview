"use client"

import { type AvailableChartColorsKeys } from "@/lib/chartUtils"
import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"
import HighchartsSankey from "highcharts/modules/sankey"
import HighchartsExporting from "highcharts/modules/exporting"
import HighchartsExportData from "highcharts/modules/export-data"
import { useTheme } from "next-themes"
import { useEffect, useRef, useState, RefObject } from "react"

// Track if modules are initialized globally to prevent duplicate initialization
let sankeyModulesInitialized = false

// Type assertion for module initialization functions
type HighchartsModule = (H: typeof Highcharts) => void

interface SankeyNode {
  id: string
  nodeColor?: string
}

interface SankeyLink {
  source: string
  target: string
  value: number
}

interface SankeyChartHighchartsProps {
  data: {
    nodes: SankeyNode[]
    links: SankeyLink[]
  }
  colors?: AvailableChartColorsKeys[]
  accountColors?: AvailableChartColorsKeys[]
  institutionColors?: AvailableChartColorsKeys[]
  institutions?: string[] // List of institution names to identify institution nodes
  height?: number
  chartRef?: RefObject<HighchartsReact.RefObject>
}

// Since Highcharts requires actual color values (not classes), we define them here
// These match Tailwind's color palette used in chartUtils (600 for light, 500 for dark)
const colorValues: Record<
  AvailableChartColorsKeys,
  { light: string; dark: string }
> = {
  blue: { light: "#2563eb", dark: "#3b82f6" }, // blue-600 / blue-500
  cyan: { light: "#0891b2", dark: "#06b6d4" }, // cyan-600 / cyan-500
  amber: { light: "#d97706", dark: "#f59e0b" }, // amber-600 / amber-500
  emerald: { light: "#059669", dark: "#10b981" }, // emerald-600 / emerald-500
  sky: { light: "#0284c7", dark: "#0ea5e9" }, // sky-600 / sky-500
  violet: { light: "#7c3aed", dark: "#8b5cf6" }, // violet-600 / violet-500
  pink: { light: "#db2777", dark: "#ec4899" }, // pink-600 / pink-500
  lime: { light: "#65a30d", dark: "#84cc16" }, // lime-600 / lime-500
  fuchsia: { light: "#c026d3", dark: "#d946ef" }, // fuchsia-600 / fuchsia-500
  red: { light: "#dc2626", dark: "#ef4444" }, // red-600 / red-500
  gray: { light: "#4b5563", dark: "#6b7280" }, // gray-600 / gray-500
  lightGray: { light: "#6b7280", dark: "#9ca3af" }, // gray-500 / gray-400
  rose: { light: "#e11d48", dark: "#f43f5e" }, // rose-600 / rose-500
  orange: { light: "#ea580c", dark: "#f97316" }, // orange-600 / orange-500
  teal: { light: "#0d9488", dark: "#14b8a6" }, // teal-600 / teal-500
  indigo: { light: "#4f46e5", dark: "#6366f1" }, // indigo-600 / indigo-500
}

export default function SankeyChartHighcharts({
  data,
  colors = ["blue", "cyan", "amber", "emerald"],
  accountColors = ["violet", "fuchsia", "pink", "sky", "lime"],
  institutionColors = ["rose", "orange", "teal", "indigo"],
  institutions = [],
  height = 500,
  chartRef: externalChartRef,
}: SankeyChartHighchartsProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const internalChartRef = useRef<HighchartsReact.RefObject>(null)
  const chartRef = externalChartRef || internalChartRef
  const [isClient, setIsClient] = useState(false)
  const [modulesLoaded, setModulesLoaded] = useState(false)

  useEffect(() => {
    setIsClient(true)

    // Initialize Highcharts modules only once on client side
    if (!sankeyModulesInitialized && typeof Highcharts === "object") {
      try {
        // Cast modules to callable functions
        const sankeyInit = HighchartsSankey as unknown as HighchartsModule
        const exportingInit = HighchartsExporting as unknown as HighchartsModule
        const exportDataInit = HighchartsExportData as unknown as HighchartsModule

        if (typeof sankeyInit === "function") {
          sankeyInit(Highcharts)
        }
        if (typeof exportingInit === "function") {
          exportingInit(Highcharts)
        }
        if (typeof exportDataInit === "function") {
          exportDataInit(Highcharts)
        }
        sankeyModulesInitialized = true
      } catch (e) {
        // Modules may already be initialized
        console.log("Highcharts modules initialization:", e)
      }
    }
    setModulesLoaded(true)
  }, [])

  // Get node color based on node type and position
  const getNodeColor = (nodeId: string) => {
    // Portfolio Total node - center node
    if (nodeId === "Portfolio Total") {
      return isDark ? colorValues.sky.dark : colorValues.sky.light
    }

    // Asset type nodes (right side) - nodes that receive from Portfolio Total
    const assetTypes = [
      "U.S. Stocks",
      "Non-U.S. Stocks",
      "Fixed Income",
      "Cash",
    ]
    if (assetTypes.includes(nodeId)) {
      const assetIndex = assetTypes.indexOf(nodeId)
      const colorKey = colors[assetIndex % colors.length]
      const colorValue = colorValues[colorKey] || colorValues.gray
      return isDark ? colorValue.dark : colorValue.light
    }

    // Institution nodes (first level) - check if nodeId is in institutions array
    if (institutions.includes(nodeId)) {
      const instIndex = institutions.indexOf(nodeId)
      const colorKey = institutionColors[instIndex % institutionColors.length]
      const colorValue = colorValues[colorKey] || colorValues.gray
      return isDark ? colorValue.dark : colorValue.light
    }

    // Account nodes - nodes that feed into Portfolio Total (not institutions or asset types)
    const accountNodes = data.nodes.filter(
      (n) =>
        n.id !== "Portfolio Total" &&
        !assetTypes.includes(n.id) &&
        !institutions.includes(n.id),
    )
    const accountIndex = accountNodes.findIndex((n) => n.id === nodeId)
    if (accountIndex >= 0) {
      const colorKey = accountColors[accountIndex % accountColors.length]
      const colorValue = colorValues[colorKey] || colorValues.gray
      return isDark ? colorValue.dark : colorValue.light
    }

    // Fallback to gray
    return isDark ? colorValues.gray.dark : colorValues.gray.light
  }

  // Transform data to Highcharts sankey format
  const transformToHighchartsData = () => {
    const assetTypes = ["U.S. Stocks", "Non-U.S. Stocks", "Fixed Income", "Cash"]

    // Create nodes array with colors and label positioning
    const nodes = data.nodes.map((node) => {
      // Determine if node is on the right side of the chart
      // Portfolio Total and Asset Types are on the right side
      const isRightSide =
        node.id === "Portfolio Total" || assetTypes.includes(node.id)

      return {
        id: node.id,
        color: getNodeColor(node.id),
        dataLabels: {
          // Position labels outside the nodes consistently
          // Left-side nodes: labels extend LEFT from node's left edge
          // Right-side nodes: labels extend RIGHT from node's right edge
          align: isRightSide ? "left" : "right",
          verticalAlign: "bottom", // Anchor text bottom to node top (pushes label up)
          // For left-side: small gap from left edge (label extends left)
          // For right-side: small gap from right edge (label extends right)
          x: isRightSide ? 5 : -5,
          inside: false,
          style: {
            color: isDark ? "#f3f4f6" : "#111827",
            fontSize: "14px",
            fontWeight: "600",
          },
        },
      }
    })

    // Transform links for Highcharts format
    const sankeyData = data.links.map((link) => ({
      from: link.source,
      to: link.target,
      weight: link.value,
    }))

    return { nodes, data: sankeyData }
  }

  // Format currency values
  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  const { nodes: highchartsNodes, data: sankeyData } =
    transformToHighchartsData()

  // Chart options
  const options: Highcharts.Options = {
    chart: {
      type: undefined, // Required for sankey
      backgroundColor: "transparent",
      height: height,
      spacing: [10, 10, 10, 10], // [top, right, bottom, left]
      events: {
        fullscreenOpen: function() {
          // Read theme from DOM to get current theme state
          const currentIsDark = document.documentElement.classList.contains('dark')

          // Update chart background for fullscreen
          this.update({
            chart: {
              backgroundColor: currentIsDark ? "#111827" : "#ffffff"
            }
          }, false)
        },
        fullscreenClose: function() {
          // No need to update - chart returns to normal state automatically
        }
      },
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
    exporting: {
      buttons: {
        contextButton: {
          enabled: false, // Disable default button - using custom export button instead
        },
      },
    },
    series: [
      {
        type: "sankey",
        name: "Portfolio Flow",
        keys: ["from", "to", "weight"],
        data: sankeyData,
        nodes: highchartsNodes,
        nodeWidth: 20,
        nodePadding: 40,
        nodeAlignment: "top",
        linkOpacity: 0.33,
        minLinkWidth: 1,
        linkColorMode: "gradient",
        dataLabels: {
          enabled: true,
          nodeFormat: "{point.name}",
          // Don't set align/x here - let per-node settings control positioning
          style: {
            color: isDark ? "#f3f4f6" : "#111827",
            fontSize: "14px",
            fontWeight: "600",
          },
        },
      } as Highcharts.SeriesSankeyOptions,
    ],
    tooltip: {
      useHTML: true,
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
        const point = this as Highcharts.Point & {
          from: string
          to: string
          weight: number
          fromNode: { sum: number }
        }
        return `<div style="padding: 2px;">
          <div style="font-weight: 600; margin-bottom: 4px;">
            ${point.from} → ${point.to}
          </div>
          <div>Value: <b>${formatValue(point.weight)}</b></div>
          <div>Flow: <b>${((point.weight / point.fromNode.sum) * 100).toFixed(1)}%</b></div>
        </div>`
      },
    },
    plotOptions: {
      sankey: {
        curveFactor: 0.33,
        tooltip: {
          nodeFormatter: function () {
            const point = this as Highcharts.Point & {
              name: string
              sum?: number
              linksFrom?: Array<{ weight: number }>
            }
            const total =
              point.sum ||
              point.linksFrom?.reduce(
                (sum: number, link: { weight: number }) => sum + link.weight,
                0,
              ) ||
              0

            return `<div style="padding: 2px;">
              <div style="font-weight: 600; margin-bottom: 4px;">${point.name}</div>
              <div>Total: ${formatValue(total)}</div>
            </div>`
          },
        },
      },
    },
  }

  if (!isClient || !modulesLoaded) {
    return (
      <div
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>
          Loading chart...
        </div>
      </div>
    )
  }

  return (
    <div style={{ height }}>
      <HighchartsReact
        highcharts={Highcharts}
        options={options}
        ref={chartRef}
      />
    </div>
  )
}
