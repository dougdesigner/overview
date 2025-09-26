"use client"

import { type AvailableChartColorsKeys } from "@/lib/chartUtils"
import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"
import { useTheme } from "next-themes"
import { useEffect, useRef, useState } from "react"

// Import Highcharts modules for side effects (auto-initializes in Highcharts v12+)
import "highcharts/modules/export-data"
import "highcharts/modules/exporting"
import "highcharts/modules/sankey"

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
  height?: number
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
}

export default function SankeyChartHighcharts({
  data,
  colors = ["blue", "cyan", "amber", "emerald"],
  accountColors = ["violet", "fuchsia", "pink", "sky", "lime"],
  height = 500,
}: SankeyChartHighchartsProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const chartRef = useRef<HighchartsReact.RefObject>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
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

    // Account nodes (left side) - nodes that feed into Portfolio Total
    const accounts = data.nodes.filter(
      (n) => n.id !== "Portfolio Total" && !assetTypes.includes(n.id),
    )
    const accountIndex = accounts.findIndex((n) => n.id === nodeId)
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
    // Create nodes array with colors
    const nodes = data.nodes.map((node) => ({
      id: node.id,
      color: getNodeColor(node.id),
      dataLabels: {
        style: {
          color: isDark ? "#f3f4f6" : "#111827",
          textOutline: "none",
        },
      },
    }))

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
        type: "sankey",
        name: "Portfolio Flow",
        keys: ["from", "to", "weight"],
        data: sankeyData,
        nodes: highchartsNodes,
        nodeWidth: 20,
        nodePadding: 24,
        linkOpacity: isDark ? 0.5 : 0.33,
        linkColorMode: "gradient" as any,
        dataLabels: {
          enabled: true,
          nodeFormat: "{point.name}",
          style: {
            color: isDark ? "#f3f4f6" : "#111827",
            textOutline: "none",
            fontSize: "12px",
            fontWeight: "600",
          },
        },
        states: {
          hover: {
            linkOpacity: 0.8,
          },
          inactive: {
            enabled: true,
            linkOpacity: 0.1,
            opacity: 0.35,
          },
        },
      } as any,
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
      nodeFormatter: function () {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const point = this as any
        const total =
          point.sum ||
          point.linksFrom?.reduce(
            (sum: number, link: any) => sum + link.weight,
            0,
          ) ||
          0

        return `<div style="padding: 2px;">
          <div style="font-weight: 600; margin-bottom: 4px;">${point.name}</div>
          <div>Total: ${formatValue(total)}</div>
        </div>`
      },
      pointFormatter: function () {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const point = this as any
        return `<div style="padding: 2px;">
          <div style="font-weight: 600; margin-bottom: 4px;">
            ${point.from} → ${point.to}
          </div>
          <div>Value: ${formatValue(point.weight)}</div>
          <div>Flow: ${((point.weight / point.fromNode.sum) * 100).toFixed(1)}%</div>
        </div>`
      },
    },
    plotOptions: {
      sankey: {
        colorByPoint: false,
        curveFactor: 0.33,
        borderRadius: 3,
        states: {
          hover: {
            brightness: 0.1,
          },
        },
      },
    },
  }

  if (!isClient) {
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
