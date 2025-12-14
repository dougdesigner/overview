"use client"

import {
  extractDomainsFromCompanyName,
  getLogoUrlFromDomain,
  getTickerLogoUrl,
} from "@/lib/logoUtils"
import { getTickerColor } from "@/lib/tickerColors"
import { cx } from "@/lib/utils"
import Image from "next/image"
import React from "react"

// Helper function for special ticker logos (Google, Apple, Figma need padding)
const getLogoStyle = (ticker: string) => {
  const upperTicker = ticker?.toUpperCase() || ""
  if (upperTicker === "GOOGL" || upperTicker === "GOOG") {
    return { background: "#f2f3fa", needsPadding: true }
  }
  if (upperTicker === "AAPL") {
    return { background: "#ebebeb", needsPadding: true }
  }
  if (upperTicker === "FIGM" || upperTicker === "FIG") {
    return { background: "#f1f3f9", needsPadding: true }
  }
  return { background: "#f1f3fa", needsPadding: false }
}

interface TickerLogoProps {
  ticker: string
  type?: "stock" | "etf" | "mutual-fund"
  className?: string
  // For manual entries
  domain?: string // Pre-resolved domain (e.g., "tulip.co")
  companyName?: string // Company name to derive domain from
}

export function TickerLogo({
  ticker,
  type = "stock",
  className = "size-6",
  domain,
  companyName,
}: TickerLogoProps) {
  const [logoError, setLogoError] = React.useState(false)
  const upperTicker = ticker

  // Special handling for Berkshire Hathaway
  const isBerkshire =
    upperTicker === "BRK.B" ||
    upperTicker === "BRK-B" ||
    upperTicker === "BRK.A" ||
    upperTicker === "BRK-A"

  // Get logo URL with priority:
  // 1. Pre-resolved domain (for manual entries)
  // 2. Ticker-based overrides (GOOGL→google.com, AAPL→apple.com.cn, etc.)
  // 3. Domain derived from company name (fallback for unknown tickers)
  const getLogoUrl = (): string | null => {
    if (isBerkshire) return null

    // Priority 1: Use pre-resolved domain
    if (domain) {
      return getLogoUrlFromDomain(domain)
    }

    // Priority 2: Check ticker-based overrides first (handles GOOGL→google.com, etc.)
    const tickerUrl = getTickerLogoUrl(ticker)
    if (tickerUrl) {
      return tickerUrl
    }

    // Priority 3: Fall back to deriving domain from company name
    if (companyName) {
      const derivedDomains = extractDomainsFromCompanyName(companyName)
      if (derivedDomains.length > 0) {
        return getLogoUrlFromDomain(derivedDomains[0])
      }
    }

    return null
  }

  const logoUrl = getLogoUrl()

  // Get fallback color
  const color = type === "etf" ? "bg-blue-600" :
                type === "mutual-fund" ? "bg-purple-600" :
                getTickerColor(ticker, "stock")

  if (isBerkshire) {
    // Custom Berkshire Hathaway logo
    return (
      <div
        className={cx(
          "flex shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
          className,
        )}
        style={{ backgroundColor: "#000080" }}
        aria-hidden="true"
      >
        BH
      </div>
    )
  }

  if (logoUrl && !logoError) {
    const logoStyle = getLogoStyle(ticker)

    return logoStyle.needsPadding ? (
      <div
        className={cx("flex shrink-0 items-center justify-center rounded-full", className)}
        style={{ backgroundColor: logoStyle.background }}
      >
        <Image
          src={logoUrl}
          alt={ticker}
          width={48}
          height={48}
          className="size-[75%] rounded-full object-contain"
          onError={() => setLogoError(true)}
        />
      </div>
    ) : (
      <Image
        src={logoUrl}
        alt={ticker}
        width={48}
        height={48}
        className={cx("shrink-0 rounded-full object-cover", className)}
        style={{ backgroundColor: logoStyle.background }}
        onError={() => setLogoError(true)}
      />
    )
  }

  // Fallback to colored circle with initials
  return (
    <div
      className={cx(
        "flex shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white",
        className,
        color,
      )}
      aria-hidden="true"
    >
      {ticker.slice(0, 2).toUpperCase()}
    </div>
  )
}
