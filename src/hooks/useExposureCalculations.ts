"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { usePortfolioStore } from "./usePortfolioStore"
import {
  enhancedExposureCalculator,
  type EnhancedExposureResult,
  type AssetClassBreakdown
} from "@/lib/enhancedExposureCalculator"
import type {
  StockExposure,
  PortfolioHolding
} from "@/components/ui/data-table-exposure/types"

/**
 * Hook that automatically calculates exposures whenever holdings change
 * Provides memoized exposure data and derived calculations
 */
export function useExposureCalculations() {
  const { holdings, accounts } = usePortfolioStore()
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exposureResult, setExposureResult] = useState<EnhancedExposureResult | null>(null)

  // Convert holdings to the format expected by the exposure calculator
  const portfolioHoldings = useMemo((): PortfolioHolding[] => {
    return holdings.map(holding => ({
      id: holding.id,
      accountId: holding.accountId,
      accountName: holding.accountName,
      ticker: holding.ticker,
      name: holding.name,
      quantity: holding.quantity,
      lastPrice: holding.lastPrice,
      marketValue: holding.marketValue,
      type: holding.type as "stock" | "fund" | "cash",
      isManualEntry: holding.isManualEntry,
      sector: holding.sector,
      industry: holding.industry,
    }))
  }, [holdings])

  // Calculate exposures whenever holdings change
  useEffect(() => {
    if (holdings.length === 0) {
      setExposureResult(null)
      return
    }

    const calculateAsync = async () => {
      setIsCalculating(true)
      setError(null)

      try {
        const result = await enhancedExposureCalculator.calculateExposures(portfolioHoldings)
        setExposureResult(result)
      } catch (err) {
        console.error("Error calculating exposures:", err)
        setError(err instanceof Error ? err.message : "Failed to calculate exposures")
        setExposureResult(null)
      } finally {
        setIsCalculating(false)
      }
    }

    calculateAsync()
  }, [portfolioHoldings])

  // Extract data from the result
  const exposures = exposureResult?.exposures || []
  const totalValue = exposureResult?.totalPortfolioValue || 0
  const assetClassBreakdown = useMemo(() => {
    if (!exposureResult?.assetClassBreakdown) return []
    return exposureResult.assetClassBreakdown.map(ac => ({
      label: ac.className,
      value: ac.marketValue,
      percentage: ac.percentage,
      color: ac.color,
    }))
  }, [exposureResult])

  const sectorBreakdown = useMemo(() => {
    if (!exposureResult?.sectorBreakdown) return []
    return exposureResult.sectorBreakdown.map(s => ({
      label: s.sector,
      value: s.value,
      percentage: s.percentage,
    }))
  }, [exposureResult])

  // Calculate treemap data for visualization
  const treemapData = useMemo(() => {
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
  }, [exposures])

  // Get exposures for a specific account
  const getExposuresByAccount = useCallback(async (accountId: string) => {
    const accountHoldings = portfolioHoldings.filter(h => h.accountId === accountId)
    if (accountHoldings.length === 0) return []

    try {
      const result = await enhancedExposureCalculator.calculateExposures(accountHoldings)
      return result.exposures
    } catch (err) {
      console.error(`Error calculating exposures for account ${accountId}:`, err)
      return []
    }
  }, [portfolioHoldings])

  // Get top exposures by value
  const getTopExposures = useCallback((limit = 10) => {
    return exposures
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, limit)
  }, [exposures])

  // Check if a holding would create concentration risk
  const checkConcentrationRisk = useCallback((ticker: string, additionalValue: number) => {
    const currentExposure = exposures.find(e => e.ticker === ticker)
    const currentValue = currentExposure?.totalValue || 0
    const newValue = currentValue + additionalValue
    const newTotal = totalValue + additionalValue
    const newPercentage = (newValue / newTotal) * 100

    return {
      wouldExceed10Percent: newPercentage > 10,
      wouldExceed20Percent: newPercentage > 20,
      newPercentage,
      currentPercentage: currentExposure?.percentOfPortfolio || 0,
    }
  }, [exposures, totalValue])

  return {
    // Core exposure data
    exposures,
    totalValue,
    assetClassBreakdown,
    sectorBreakdown,

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