// Tremor chartColors [v0.1.0]

export type ColorUtility = "bg" | "stroke" | "fill" | "text"

export const chartColors = {
  blue: {
    bg: "bg-blue-600 dark:bg-blue-500",
    stroke: "stroke-blue-600 dark:stroke-blue-500",
    fill: "fill-blue-600 dark:fill-blue-500",
    text: "text-blue-600 dark:text-blue-500",
  },
  sky: {
    bg: "bg-sky-600 dark:bg-sky-500",
    stroke: "stroke-sky-600 dark:stroke-sky-500",
    fill: "fill-sky-600 dark:fill-sky-500",
    text: "text-sky-600 dark:text-sky-500",
  },
  emerald: {
    bg: "bg-emerald-600 dark:bg-emerald-500",
    stroke: "stroke-emerald-600 dark:stroke-emerald-500",
    fill: "fill-emerald-600 dark:fill-emerald-500",
    text: "text-emerald-600 dark:text-emerald-500",
  },
  violet: {
    bg: "bg-violet-600 dark:bg-violet-500",
    stroke: "stroke-violet-600 dark:stroke-violet-500",
    fill: "fill-violet-600 dark:fill-violet-500",
    text: "text-violet-600 dark:text-violet-500",
  },
  amber: {
    bg: "bg-amber-600 dark:bg-amber-500",
    stroke: "stroke-amber-600 dark:stroke-amber-500",
    fill: "fill-amber-600 dark:fill-amber-500",
    text: "text-amber-600 dark:text-amber-500",
  },
  gray: {
    bg: "bg-gray-600 dark:bg-gray-500",
    stroke: "stroke-gray-600 dark:stroke-gray-500",
    fill: "fill-gray-600 dark:fill-gray-500",
    text: "text-gray-600 dark:text-gray-500",
  },
  lightGray: {
    bg: "bg-gray-500 dark:bg-gray-600",
    stroke: "stroke-gray-500 dark:stroke-gray-600",
    fill: "fill-gray-500 dark:fill-gray-600",
    text: "text-gray-500 dark:text-gray-600",
  },
  cyan: {
    bg: "bg-cyan-600 dark:bg-cyan-500",
    stroke: "stroke-cyan-600 dark:stroke-cyan-500",
    fill: "fill-cyan-600 dark:fill-cyan-500",
    text: "text-cyan-600 dark:text-cyan-500",
  },
  pink: {
    bg: "bg-pink-600 dark:bg-pink-500",
    stroke: "stroke-pink-600 dark:stroke-pink-500",
    fill: "fill-pink-600 dark:fill-pink-500",
    text: "text-pink-600 dark:text-pink-500",
  },
  lime: {
    bg: "bg-lime-600 dark:bg-lime-500",
    stroke: "stroke-lime-600 dark:stroke-lime-500",
    fill: "fill-lime-600 dark:fill-lime-500",
    text: "text-lime-600 dark:text-lime-500",
  },
  fuchsia: {
    bg: "bg-fuchsia-600 dark:bg-fuchsia-500",
    stroke: "stroke-fuchsia-600 dark:stroke-fuchsia-500",
    fill: "fill-fuchsia-600 dark:fill-fuchsia-500",
    text: "text-fuchsia-600 dark:text-fuchsia-500",
  },
  red: {
    bg: "bg-red-600 dark:bg-red-500",
    stroke: "stroke-red-600 dark:stroke-red-500",
    fill: "fill-red-600 dark:fill-red-500",
    text: "text-red-600 dark:text-red-500",
  },
} as const satisfies {
  [color: string]: {
    [key in ColorUtility]: string
  }
}

export type AvailableChartColorsKeys = keyof typeof chartColors

export const AvailableChartColors: AvailableChartColorsKeys[] = Object.keys(
  chartColors,
) as Array<AvailableChartColorsKeys>

export const constructCategoryColors = (
  categories: string[],
  colors: AvailableChartColorsKeys[],
): Map<string, AvailableChartColorsKeys> => {
  const categoryColors = new Map<string, AvailableChartColorsKeys>()
  categories.forEach((category, index) => {
    categoryColors.set(category, colors[index % colors.length])
  })
  return categoryColors
}

export const getColorClassName = (
  color: AvailableChartColorsKeys,
  type: ColorUtility,
): string => {
  const fallbackColor = {
    bg: "bg-gray-500",
    stroke: "stroke-gray-500",
    fill: "fill-gray-500",
    text: "text-gray-500",
  }
  return chartColors[color]?.[type] ?? fallbackColor[type]
}

// Tremor getYAxisDomain [v0.0.0]

export const getYAxisDomain = (
  autoMinValue: boolean,
  minValue: number | undefined,
  maxValue: number | undefined,
) => {
  const minDomain = autoMinValue ? "auto" : (minValue ?? 0)
  const maxDomain = maxValue ?? "auto"
  return [minDomain, maxDomain]
}

// Tremor hasOnlyOneValueForKey [v0.1.0]

export function hasOnlyOneValueForKey(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  array: any[],
  keyToCheck: string,
): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const val: any[] = []

  for (const obj of array) {
    if (Object.prototype.hasOwnProperty.call(obj, keyToCheck)) {
      val.push(obj[keyToCheck])
      if (val.length > 1) {
        return false
      }
    }
  }

  return true
}
