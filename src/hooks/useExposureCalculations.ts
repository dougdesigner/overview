"use client"

import { useEffect, useMemo, useState } from "react"
import { usePortfolioStore } from "./usePortfolioStore"
import { calculateExposures, StockExposure } from "@/lib/enhancedExposureCalculator"

export interface ExposureData {
  exposures: StockExposure[]
  totalValue: number
  assetClassBreakdown: {
    label: string
    value: number
    percentage: number
    color: string
  }[]
  sectorBreakdown: {
    label: string
    value: number
    percentage: number
  }[]
  isCalculating: boolean
  error: string | null
}

/**
 * Hook that automatically calculates exposures whenever holdings change
 * Provides memoized exposure data and derived calculations
 */
export function useExposureCalculations() {
  const { holdings, accounts } = usePortfolioStore()
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Convert holdings to the format expected by the exposure calculator
  const portfolioHoldings = useMemo(() => {
    return holdings.map(holding => ({
      ticker: holding.ticker || "",
      name: holding.name,
      shares: holding.quantity,
      price: holding.lastPrice,
      value: holding.marketValue,
      type: holding.type as "stock" | "fund" | "cash",
      accountId: holding.accountId,
      accountName: holding.accountName,
    }))
  }, [holdings])

  // Calculate exposures whenever holdings change
  const calculatedData = useMemo(() => {
    if (holdings.length === 0) {
      return {
        exposures: [],
        totalValue: 0,
        assetClassBreakdown: [],
        sectorBreakdown: [],
      }
    }

    setIsCalculating(true)
    setError(null)

    try {
      const result = calculateExposures(portfolioHoldings)

      // Calculate total portfolio value
      const totalValue = portfolioHoldings.reduce((sum, h) => sum + h.value, 0)

      // Extract asset class breakdown from the result
      const assetClasses = result.assetClassBreakdown || []
      const assetClassBreakdown = assetClasses.map(ac => ({
        label: ac.label,
        value: ac.value,
        percentage: ac.percentage,
        color: ac.color || "#6B7280", // Default gray if no color
      }))

      // Extract sector breakdown from the result
      const sectors = result.sectorBreakdown || []
      const sectorBreakdown = sectors.map(s => ({
        label: s.label,
        value: s.value,
        percentage: s.percentage,
      }))

      setIsCalculating(false)
      return {
        exposures: result.exposures,
        totalValue,
        assetClassBreakdown,
        sectorBreakdown,
      }
    } catch (err) {
      console.error("Error calculating exposures:", err)
      setError(err instanceof Error ? err.message : "Failed to calculate exposures")
      setIsCalculating(false)

      return {
        exposures: [],
        totalValue: 0,
        assetClassBreakdown: [],
        sectorBreakdown: [],
      }
    }
  }, [portfolioHoldings])

  // Calculate treemap data for visualization
  const treemapData = useMemo(() => {
    const { exposures } = calculatedData

    if (exposures.length === 0) {
      return []
    }

    // Group exposures by sector for treemap
    const sectorMap = new Map<string, StockExposure[]>()

    exposures.forEach(exposure => {
      const sector = exposure.sector || "Unknown"
      if (!sectorMap.has(sector)) {
        sectorMap.set(sector, [])
      }
      sectorMap.get(sector)!.push(exposure)
    })

    // Convert to treemap format
    return Array.from(sectorMap.entries()).map(([sector, stocks]) => ({
      name: sector,
      value: stocks.reduce((sum, s) => sum + s.totalValue, 0),
      children: stocks.map(stock => ({
        name: stock.ticker || stock.name,
        ticker: stock.ticker,
        value: stock.totalValue,
        percentage: stock.percentOfPortfolio,
      })),
    }))
  }, [calculatedData])

  // Get exposures for a specific account
  const getExposuresByAccount = (accountId: string) => {
    const accountHoldings = portfolioHoldings.filter(h => h.accountId === accountId)
    if (accountHoldings.length === 0) return []

    try {
      const result = calculateExposures(accountHoldings)
      return result.exposures
    } catch (err) {
      console.error(`Error calculating exposures for account ${accountId}:`, err)
      return []
    }
  }

  // Get top exposures by value
  const getTopExposures = (limit = 10) => {
    return calculatedData.exposures
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, limit)
  }

  // Check if a holding would create concentration risk
  const checkConcentrationRisk = (ticker: string, additionalValue: number) => {
    const currentExposure = calculatedData.exposures.find(e => e.ticker === ticker)
    const currentValue = currentExposure?.totalValue || 0
    const newValue = currentValue + additionalValue
    const newTotal = calculatedData.totalValue + additionalValue
    const newPercentage = (newValue / newTotal) * 100

    return {
      wouldExceed10Percent: newPercentage > 10,
      wouldExceed20Percent: newPercentage > 20,
      newPercentage,
      currentPercentage: currentExposure?.percentOfPortfolio || 0,
    }
  }

  return {
    // Core exposure data
    exposures: calculatedData.exposures,
    totalValue: calculatedData.totalValue,
    assetClassBreakdown: calculatedData.assetClassBreakdown,
    sectorBreakdown: calculatedData.sectorBreakdown,

    // Status
    isCalculating,
    error,

    // Derived data
    treemapData,

    // Utility functions
    getExposuresByAccount,
    getTopExposures,
    checkConcentrationRisk,
  }
}