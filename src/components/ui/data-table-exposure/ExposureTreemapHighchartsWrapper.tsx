import dynamic from "next/dynamic"

export const ExposureTreemapHighchartsWithLogos = dynamic(
  () => import("./ExposureTreemapHighchartsWithLogos").then(mod => ({
    default: mod.ExposureTreemapHighchartsWithLogos
  })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[350px] items-center justify-center sm:h-[500px]">
        <div className="text-sm text-gray-500">Loading chart...</div>
      </div>
    )
  }
)