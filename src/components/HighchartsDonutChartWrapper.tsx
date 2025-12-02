import dynamic from "next/dynamic"

export const HighchartsDonutChart = dynamic(
  () => import("./HighchartsDonutChart").then(mod => ({ default: mod.HighchartsDonutChart })),
  {
    ssr: false,
    loading: () => <div className="h-[280px]" />
  }
)
