// Tremor DonutChart [v0.1.0]

"use client"

import React from "react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

import {
  AvailableChartColors,
  AvailableChartColorsKeys,
  getColorClassName,
} from "@/lib/chartUtils"
import { cx } from "@/lib/utils"

//#region Tooltip

interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    payload: {
      color?: string
      [key: string]: unknown
    }
  }>
  label?: string
  valueFormatter?: (value: number) => string
}

const ChartTooltip = ({
  active,
  payload,
  valueFormatter,
}: ChartTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null

  const data = payload[0]

  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-md dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-center gap-2">
        <span
          className={cx(
            "h-2.5 w-2.5 shrink-0 rounded-full",
            getColorClassName(data.payload.color || "blue", "bg"),
          )}
        />
        <p className="font-medium text-gray-900 dark:text-gray-50">
          {data.name}
        </p>
      </div>
      <p className="mt-1 text-gray-600 dark:text-gray-400">
        {valueFormatter ? valueFormatter(data.value) : data.value}
      </p>
    </div>
  )
}

//#region DonutChart

export interface DonutChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: Array<{
    name: string
    [key: string]: string | number | boolean | undefined
  }>
  value?: string
  category?: string
  colors?: AvailableChartColorsKeys[]
  valueFormatter?: (value: number) => string
  showLabel?: boolean
  showTooltip?: boolean
  innerRadius?: number | string
  outerRadius?: number | string
}

const DonutChart = React.forwardRef<HTMLDivElement, DonutChartProps>(
  (
    {
      data = [],
      value = "value",
      category = "name",
      colors = AvailableChartColors,
      valueFormatter = (value) => value.toString(),
      showLabel = true,
      showTooltip = true,
      innerRadius = "60%",
      outerRadius = "100%",
      className,
      ...props
    },
    forwardedRef,
  ) => {
    const chartData = React.useMemo(() => {
      return data.map((item, index) => ({
        ...item,
        color: colors[index % colors.length],
      }))
    }, [data, colors])

    const totalValue = React.useMemo(() => {
      return data.reduce((sum, item) => sum + (item[value] || 0), 0)
    }, [data, value])

    const renderCustomLabel = React.useCallback(
      (props: { cx: number; cy: number }) => {
        const { cx, cy } = props

        if (!showLabel) return null

        return (
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-gray-900 dark:fill-gray-50"
          >
            <tspan x={cx} dy="-0.2em" className="text-2xl font-semibold">
              {valueFormatter(totalValue)}
            </tspan>
            <tspan
              x={cx}
              dy="1.4em"
              className="fill-gray-500 text-sm dark:fill-gray-400"
            >
              Total
            </tspan>
          </text>
        )
      },
      [showLabel, totalValue, valueFormatter],
    )

    return (
      <div
        ref={forwardedRef}
        className={cx("h-64 w-full", className)}
        {...props}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={outerRadius}
              innerRadius={innerRadius}
              fill="#8884d8"
              dataKey={value}
              nameKey={category}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill=""
                  className={cx(
                    getColorClassName(entry.color, "fill"),
                    "stroke-white dark:stroke-gray-950",
                  )}
                  strokeWidth={2}
                />
              ))}
            </Pie>
            {showTooltip && (
              <Tooltip
                content={({ active, payload }) => (
                  <ChartTooltip
                    active={active}
                    payload={payload}
                    valueFormatter={valueFormatter}
                  />
                )}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  },
)

DonutChart.displayName = "DonutChart"

export { DonutChart }
