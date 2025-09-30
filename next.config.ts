import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  redirects: async () => {
    return [
      {
        source: "/",
        destination: "/overview",
        permanent: true,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.logo.dev',
      },
    ],
  },
}

export default nextConfig
