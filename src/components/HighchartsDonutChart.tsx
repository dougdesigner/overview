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
      custom: {},
      events: {
        render() {
          const chart = this as any
          const series = chart.series[0]
          let customLabel = chart.options.chart.custom.label

          if (!customLabel) {
            customLabel = chart.options.chart.custom.label = chart.renderer
              .label(
                `<strong>${valueFormatter(totalValue)}</strong>`,
                0,
                0,
                undefined,
                undefined,
                undefined,
                true,
              )
              .css({
                color: isDark ? "#f9fafb" : "#111827",
                textAnchor: "middle",
              })
              .add()
          }

          const x = series.center[0] + chart.plotLeft
          const y =
            series.center[1] + chart.plotTop - customLabel.attr("height") / 2

          customLabel.attr({
            x,
            y,
          })

          // Set font size based on chart diameter
          customLabel.css({
            fontSize: `${series.center[2] / 12}px`,
          })
        },
      },
    },
    title: {
      text: undefined,
    },
    credits: {
      enabled: false,
    },
    tooltip: {
      pointFormat:
        "Allocation: <b>{point.percentage:.1f}%</b><br/>Value: <b>${point.y:,.0f}</b>",
      // valuePrefix: "$",
      backgroundColor: isDark ? "#1f2937" : "#ffffff",
      borderColor: isDark ? "#374151" : "#e5e7eb",
      style: {
        color: isDark ? "#f9fafb" : "#111827",
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
        // borderWidth: 0,
        borderRadius: 8,
        dataLabels: [
          {
            enabled: true,
            distance: 20,
            format: "{point.name}",
            style: {
              color: isDark ? "#9ca3af" : "#6b7280",
              fontSize: "14px",
              fontWeight: "normal",
            },
          },
          {
            enabled: true,
            distance: -30,
            format: "{point.percentage:.0f}%",
            style: {
              color: isDark ? "#f9fafb" : "#111827",
              fontSize: "14px",
              fontWeight: "600",
            },
          },
        ] as Highcharts.DataLabelsOptions[],
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
      const chart = chartRef.current.chart as any

      // Update custom label if it exists
      if (chart.options?.chart?.custom?.label) {
        chart.options.chart.custom.label.attr({
          text: `<strong>${valueFormatter(totalValue)}</strong>`,
        })
        chart.options.chart.custom.label.css({
          color: isDark ? "#f9fafb" : "#111827",
        })
      }

      // Update tooltip colors
      chart.update({
        tooltip: {
          backgroundColor: isDark ? "#1f2937" : "#ffffff",
          borderColor: isDark ? "#374151" : "#e5e7eb",
          style: {
            color: isDark ? "#f9fafb" : "#111827",
          },
        },
      })

      // Trigger re-render to update label
      chart.redraw()
    }
  }, [isDark, totalValue, valueFormatter])

  if (!isClient) {
    return <div style={{ height }} />
  }

  return (
    <HighchartsReact highcharts={Highcharts} options={options} ref={chartRef} />
  )
}
