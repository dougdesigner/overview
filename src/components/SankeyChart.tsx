"use client"

import { type AvailableChartColorsKeys } from "@/lib/chartUtils"
import { ResponsiveSankey } from "@nivo/sankey"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

interface SankeyNode {
  id: string
  nodeColor?: string
}

interface SankeyLink {
  source: string
  target: string
  value: number
}

interface SankeyChartProps {
  data: {
    nodes: SankeyNode[]
    links: SankeyLink[]
  }
  colors?: AvailableChartColorsKeys[]
  accountColors?: AvailableChartColorsKeys[]
  height?: number
  animate?: boolean
  motionConfig?:
    | "default"
    | "gentle"
    | "wobbly"
    | "stiff"
    | "slow"
    | "molasses"
    | {
        mass?: number
        tension?: number
        friction?: number
        clamp?: boolean
        precision?: number
        velocity?: number
      }
}

// Since Nivo requires actual color values (not classes), we define them here
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

export default function SankeyChart({
  data,
  colors = ["blue", "cyan", "amber", "emerald"],
  accountColors = ["violet", "fuchsia", "pink", "sky", "lime"],
  height = 500,
  animate = true,
  motionConfig = "gentle",
}: SankeyChartProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const [isMounted, setIsMounted] = useState(false)
  const [animationKey, setAnimationKey] = useState(0)

  // Ensure chart mounts properly with animations
  useEffect(() => {
    // Small delay to ensure DOM is ready and trigger proper animation initialization
    const timer = setTimeout(() => {
      setIsMounted(true)
      // Force a fresh mount to trigger animations
      setAnimationKey(1)
    }, 100)
    return () => clearTimeout(timer)
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

  // Define theme colors matching Tailwind's design system
  const themeColors = {
    text: {
      primary: isDark ? "#e5e7eb" : "#374151", // gray-200 / gray-700
      secondary: isDark ? "#9ca3af" : "#6b7280", // gray-400 / gray-500
    },
    label: isDark ? "#f9fafb" : "#111827", // gray-50 / gray-900
    border: isDark ? "#4b5563" : "#d1d5db", // gray-600 / gray-300
    background: isDark ? "#1f2937" : "#ffffff", // gray-800 / white
  }

  const nivoTheme = {
    background: "transparent",
    textColor: themeColors.text.primary,
    fontSize: 12,
    labels: {
      text: {
        fontWeight: 600,
        fontSize: 12,
        fill: themeColors.label,
      },
    },
    tooltip: {
      container: {
        background: themeColors.background,
        color: themeColors.text.primary,
        fontSize: 12,
        fontWeight: 500,
        borderRadius: 4,
        boxShadow:
          "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        padding: "6px 9px",
      },
    },
  }

  // Show loading state while waiting for mount
  if (!isMounted) {
    return (
      <div
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: themeColors.text.secondary }}>
          Loading chart...
        </div>
      </div>
    )
  }

  return (
    <div style={{ height }}>
      <ResponsiveSankey
        key={animationKey} // Force fresh mount to trigger animations
        data={data}
        theme={nivoTheme}
        margin={{ top: 20, right: 120, bottom: 20, left: 140 }}
        align="justify"
        sort="descending"
        colors={(node) => getNodeColor(node.id)}
        nodeOpacity={1}
        nodeHoverOthersOpacity={0.35}
        nodeThickness={18}
        nodeSpacing={24}
        nodeBorderWidth={0}
        nodeBorderRadius={3}
        linkOpacity={0.25}
        linkHoverOthersOpacity={0.1}
        linkContract={3}
        enableLinkGradient={true}
        labelPosition="outside"
        labelOrientation="horizontal"
        labelPadding={16}
        labelTextColor={themeColors.label}
        valueFormat={(value) => `$${value.toLocaleString()}`}
        animate={animate}
        motionConfig={motionConfig}
        isInteractive={true} // Ensure all interactive features are enabled
      />
    </div>
  )
}
