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
  // 2. Domain derived from company name (for manual entries)
  // 3. Ticker-based lookup (only for regular stocks/ETFs, NOT manual entries)
  const getLogoUrl = (): string | null => {
    if (isBerkshire) return null

    // Priority 1: Use pre-resolved domain
    if (domain) {
      return getLogoUrlFromDomain(domain)
    }

    // Priority 2: Derive domain from company name (for manual entries)
    if (companyName) {
      const derivedDomains = extractDomainsFromCompanyName(companyName)
      if (derivedDomains.length > 0) {
        return getLogoUrlFromDomain(derivedDomains[0])
      }
      // For manual entries, don't fall back to ticker lookup - show initials instead
      return null
    }

    // Priority 3: Standard ticker lookup (only for non-manual entries)
    return getTickerLogoUrl(ticker)
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
    return (
      <Image
        src={logoUrl}
        alt={ticker}
        width={48}
        height={48}
        className={cx("shrink-0 rounded-full bg-white object-cover", className)}
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
