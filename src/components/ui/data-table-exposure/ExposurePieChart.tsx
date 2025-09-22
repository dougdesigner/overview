"use client"

import { Card } from "@/components/Card"
import { DonutChart } from "@/components/DonutChart"
import { StockExposure } from "./types"

interface ExposurePieChartProps {
  exposures: StockExposure[]
  totalValue: number
}

export function ExposurePieChart({ exposures, totalValue }: ExposurePieChartProps) {
  // Get top 10 exposures and group the rest
  const topExposures = exposures.slice(0, 10)
  const otherExposures = exposures.slice(10)

  const otherValue = otherExposures.reduce((sum, exp) => sum + exp.totalValue, 0)

  const chartData = [
    ...topExposures.map(exp => ({
      name: exp.ticker,
      value: exp.totalValue,
      percentage: (exp.totalValue / totalValue * 100).toFixed(1)
    })),
    ...(otherValue > 0 ? [{
      name: "Others",
      value: otherValue,
      percentage: (otherValue / totalValue * 100).toFixed(1)
    }] : [])
  ]

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`
    }
    return `$${value.toFixed(0)}`
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
        Portfolio Composition
      </h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Top stock exposures including ETF holdings
      </p>

      <div className="mt-6">
        <DonutChart
          data={chartData}
          category="value"
          index="name"
          valueFormatter={formatCurrency}
          showAnimation={true}
          className="h-72"
        />
      </div>

      {/* Legend */}
      <div className="mt-6 grid grid-cols-2 gap-2">
        {chartData.slice(0, 6).map((item, index) => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="h-3 w-3 shrink-0 rounded-full"
              style={{
                backgroundColor: `hsl(${index * 30}, 70%, 50%)`
              }}
            />
            <span className="text-sm text-gray-900 dark:text-gray-50">
              {item.name}
            </span>
            <span className="ml-auto text-sm font-medium text-gray-600 dark:text-gray-400">
              {item.percentage}%
            </span>
          </div>
        ))}
      </div>

      {/* Concentration Warning */}
      {topExposures[0]?.percentOfPortfolio > 15 && (
        <div className="mt-4 rounded-md bg-orange-50 dark:bg-orange-950/50 p-3">
          <p className="text-sm text-orange-800 dark:text-orange-200">
            <span className="font-semibold">High Concentration:</span> {topExposures[0].ticker} represents {topExposures[0].percentOfPortfolio.toFixed(1)}% of your portfolio
          </p>
        </div>
      )}
    </Card>
  )
}