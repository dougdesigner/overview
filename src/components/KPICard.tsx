"use client"

import { Card } from "@/components/Card"
import {
  type AvailableChartColorsKeys,
  getColorClassName,
} from "@/lib/chartUtils"
import { cx } from "@/lib/utils"

interface KPICardProps {
  name: string
  stat: string
  change: string
  color: AvailableChartColorsKeys
}

export default function KPICard({ name, stat, change, color }: KPICardProps) {
  return (
    <Card>
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
        {name}
      </dt>
      <dd className="mt-2 flex items-baseline space-x-2.5">
        <span
          className={cx(
            "text-3xl font-semibold",
            getColorClassName(color, "text"),
          )}
        >
          {stat}
        </span>
        <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
          {change}
        </span>
      </dd>
    </Card>
  )
}
