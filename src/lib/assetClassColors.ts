// Centralized asset class color configuration
// This ensures consistent colors across all portfolio visualizations

import { AvailableChartColorsKeys } from "@/lib/chartUtils"

// Standard asset class colors - used across all visualizations
export const ASSET_CLASS_COLORS: Record<string, AvailableChartColorsKeys> = {
  // Core asset classes
  "U.S. Stocks": "blue",
  "Non-U.S. Stocks": "cyan",
  "Fixed Income": "amber",
  "Cash": "emerald",
  "Other": "gray",

  // Alternative names (for flexibility)
  "US Stocks": "blue",
  "Non-US Stocks": "cyan",
  "Bonds": "amber",
  "Cash & Equivalents": "emerald",
  "Alternative": "violet",
  "Real Estate": "rose",
  "Commodities": "orange",
}

// Hex color values for Highcharts (matches Tailwind colors)
export const ASSET_CLASS_HEX_COLORS: Record<string, string> = {
  // Core asset classes
  "U.S. Stocks": "#3b82f6",      // blue-500
  "Non-U.S. Stocks": "#06b6d4",  // cyan-500
  "Fixed Income": "#f59e0b",     // amber-500
  "Cash": "#10b981",              // emerald-500
  "Other": "#6b7280",             // gray-500

  // Alternative names
  "US Stocks": "#3b82f6",
  "Non-US Stocks": "#06b6d4",
  "Bonds": "#f59e0b",
  "Cash & Equivalents": "#10b981",
  "Alternative": "#8b5cf6",       // violet-500
  "Real Estate": "#f43f5e",       // rose-500
  "Commodities": "#fb923c",       // orange-400
}

// Background color classes for asset class indicators
export const ASSET_CLASS_BG_COLORS: Record<string, string> = {
  // Core asset classes
  "U.S. Stocks": "bg-blue-600 dark:bg-blue-500",
  "Non-U.S. Stocks": "bg-cyan-600 dark:bg-cyan-500",
  "Fixed Income": "bg-amber-600 dark:bg-amber-500",
  "Cash": "bg-emerald-600 dark:bg-emerald-500",
  "Other": "bg-gray-600 dark:bg-gray-500",

  // Alternative names
  "US Stocks": "bg-blue-600 dark:bg-blue-500",
  "Non-US Stocks": "bg-cyan-600 dark:bg-cyan-500",
  "Bonds": "bg-amber-600 dark:bg-amber-500",
  "Cash & Equivalents": "bg-emerald-600 dark:bg-emerald-500",
  "Alternative": "bg-violet-600 dark:bg-violet-500",
  "Real Estate": "bg-rose-600 dark:bg-rose-500",
  "Commodities": "bg-orange-600 dark:bg-orange-500",
}

// Border color classes for asset class indicators
export const ASSET_CLASS_BORDER_COLORS: Record<string, string> = {
  // Core asset classes
  "U.S. Stocks": "border-blue-500 dark:border-blue-500",
  "Non-U.S. Stocks": "border-cyan-500 dark:border-cyan-500",
  "Fixed Income": "border-amber-500 dark:border-amber-500",
  "Cash": "border-emerald-500 dark:border-emerald-500",
  "Other": "border-gray-500 dark:border-gray-500",

  // Alternative names
  "US Stocks": "border-blue-500 dark:border-blue-500",
  "Non-US Stocks": "border-cyan-500 dark:border-cyan-500",
  "Bonds": "border-amber-500 dark:border-amber-500",
  "Cash & Equivalents": "border-emerald-500 dark:border-emerald-500",
  "Alternative": "border-violet-500 dark:border-violet-500",
  "Real Estate": "border-rose-500 dark:border-rose-500",
  "Commodities": "border-orange-500 dark:border-orange-500",
}

// Helper function to get color for an asset class
export function getAssetClassColor(assetClass: string): AvailableChartColorsKeys {
  return ASSET_CLASS_COLORS[assetClass] || "gray"
}

// Helper function to get hex color for an asset class
export function getAssetClassHexColor(assetClass: string): string {
  return ASSET_CLASS_HEX_COLORS[assetClass] || "#6b7280" // default to gray
}

// Helper function to get background color class for an asset class
export function getAssetClassBgColor(assetClass: string): string {
  return ASSET_CLASS_BG_COLORS[assetClass] || "bg-gray-600 dark:bg-gray-500"
}

// Helper function to get border color class for an asset class
export function getAssetClassBorderColor(assetClass: string): string {
  return ASSET_CLASS_BORDER_COLORS[assetClass] || "border-gray-500 dark:border-gray-500"
}

// Default asset class order for consistent display
export const ASSET_CLASS_ORDER = [
  "U.S. Stocks",
  "Non-U.S. Stocks",
  "Fixed Income",
  "Cash",
  "Real Estate",
  "Commodities",
  "Alternative",
  "Other",
]