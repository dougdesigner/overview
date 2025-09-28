"use client"

import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"
import { useTheme } from "next-themes"
import { useEffect, useRef, useState } from "react"

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
}

export function HighchartsDonutChart({
  data,
  height = 280,
  totalValue,
  valueFormatter,
  colors,
}: HighchartsDonutChartProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const chartRef = useRef<HighchartsReact.RefObject>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

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

  // Transform data for Highcharts
  const chartData = data.map((item, index) => ({
    name: item.name,
    y: item.amount,
    color: colorMap[colors[index]] || colorMap.blue,
  }))

  const options: Highcharts.Options = {
    chart: {
      type: "pie",
      backgroundColor: "transparent",
      height,
      style: {
        fontFamily: "inherit",
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
      headerFormat: "",
      pointFormat:
        '<div style="padding: 2px;">' +
        '<div style="font-weight: 600; margin-bottom: 4px;">{point.name}</div>' +
        "<div>Allocation: <b>{point.percentage:.1f}%</b></div>" +
        "<div>Value: <b>${point.y:,.0f}</b></div>" +
        "</div>",
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
    },
    legend: {
      enabled: false,
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: "pointer",
        innerSize: "60%",
        borderWidth: 2,
        borderColor: isDark ? "#1f2937" : "#ffffff",
        borderRadius: 8,
        dataLabels: {
          enabled: true,
          distance: -25,
          format: "{point.percentage:.0f}%",
          style: {
            color: isDark ? "#f3f4f6" : "#111827",
            fontSize: "14px",
            fontWeight: "600",
          },
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
          backgroundColor: isDark ? "#1f2937" : "#ffffff",
          borderColor: isDark ? "#4b5563" : "#e5e7eb",
          style: {
            color: isDark ? "#f3f4f6" : "#111827",
            fontSize: "12px",
          },
        },
        plotOptions: {
          pie: {
            dataLabels: {
              style: {
                color: isDark ? "#f3f4f6" : "#111827",
                fontSize: "14px",
                fontWeight: "600",
              },
            },
          },
        },
      })
    }
  }, [isDark, totalValue, valueFormatter])

  if (!isClient) {
    return <div style={{ height }} />
  }

  return (
    <HighchartsReact highcharts={Highcharts} options={options} ref={chartRef} />
  )
}
