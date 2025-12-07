import dynamic from "next/dynamic"

export const HoldingsSunburst = dynamic(
  () => import("./HoldingsSunburstEnhanced").then(mod => ({ default: mod.HoldingsSunburstEnhanced })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[350px] items-center justify-center sm:h-[500px]">
        <div className="text-sm text-gray-500">Loading chart...</div>
      </div>
    )
  }
)