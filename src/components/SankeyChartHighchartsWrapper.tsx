import dynamic from "next/dynamic"

export const SankeyChartHighcharts = dynamic(
  () => import("./SankeyChartHighcharts"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-sm text-gray-500">Loading chart...</div>
      </div>
    )
  }
)