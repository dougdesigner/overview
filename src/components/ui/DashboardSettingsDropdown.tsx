"use client"

import { Button } from "@/components/Button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSubMenu,
  DropdownMenuSubMenuContent,
  DropdownMenuSubMenuTrigger,
  DropdownMenuTrigger,
} from "@/components/DropdownMenu"
import { Tooltip } from "@/components/Tooltip"
import {
  ExposureDisplayValue,
  HoldingsFilter,
} from "@/components/ui/data-table-exposure/types"
import { RiFilterLine } from "@remixicon/react"

interface DashboardSettingsDropdownProps {
  holdingsFilter: HoldingsFilter
  onHoldingsFilterChange: (value: HoldingsFilter) => void
  displayValue: ExposureDisplayValue
  onDisplayValueChange: (value: ExposureDisplayValue) => void
  combineGoogleShares: boolean
  onCombineGoogleSharesChange: (value: boolean) => void
}

// Helper to get display text for holdings filter
const getHoldingsFilterLabel = (filter: HoldingsFilter): string => {
  switch (filter) {
    case "all":
      return "All"
    case "mag7":
      return "Magnificent 7"
    case "top7":
      return "Top 7"
    case "top10":
      return "Top 10"
  }
}

// Helper to get display text for display value
const getDisplayValueLabel = (value: ExposureDisplayValue): string => {
  switch (value) {
    case "market-value":
      return "Market value"
    case "pct-stocks":
      return "Stock %"
    case "pct-portfolio":
      return "Portfolio %"
    case "none":
      return "None"
  }
}

export function DashboardSettingsDropdown({
  holdingsFilter,
  onHoldingsFilterChange,
  displayValue,
  onDisplayValueChange,
  combineGoogleShares,
  onCombineGoogleSharesChange,
}: DashboardSettingsDropdownProps) {
  // Check if any setting differs from default
  const hasChanges =
    holdingsFilter !== "all" ||
    displayValue !== "pct-portfolio" ||
    combineGoogleShares !== false

  return (
    <DropdownMenu>
      <Tooltip triggerAsChild content="Dashboard settings">
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" className="relative h-9">
            <RiFilterLine className="size-4" aria-hidden="true" />
            {hasChanges && (
              <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-blue-500" />
            )}
          </Button>
        </DropdownMenuTrigger>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>DASHBOARD SETTINGS</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* View submenu */}
        <DropdownMenuSubMenu>
          <DropdownMenuSubMenuTrigger>
            <span>View</span>
            <span className="ml-auto text-xs text-gray-500">
              {getHoldingsFilterLabel(holdingsFilter)}
            </span>
          </DropdownMenuSubMenuTrigger>
          <DropdownMenuSubMenuContent>
            <DropdownMenuRadioGroup
              value={holdingsFilter}
              onValueChange={(value) =>
                onHoldingsFilterChange(value as HoldingsFilter)
              }
            >
              <DropdownMenuRadioItem value="all" iconType="check">
                All
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="mag7" iconType="check">
                Magnificent 7
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="top7" iconType="check">
                Top 7
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="top10" iconType="check">
                Top 10
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubMenuContent>
        </DropdownMenuSubMenu>

        {/* Display value submenu */}
        <DropdownMenuSubMenu>
          <DropdownMenuSubMenuTrigger>
            <span>Display value</span>
            <span className="ml-auto text-xs text-gray-500">
              {getDisplayValueLabel(displayValue)}
            </span>
          </DropdownMenuSubMenuTrigger>
          <DropdownMenuSubMenuContent>
            <DropdownMenuRadioGroup
              value={displayValue}
              onValueChange={(value) =>
                onDisplayValueChange(value as ExposureDisplayValue)
              }
            >
              <DropdownMenuRadioItem value="market-value" iconType="check">
                Market value
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="pct-stocks" iconType="check">
                Stock %
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="pct-portfolio" iconType="check">
                Portfolio %
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubMenuContent>
        </DropdownMenuSubMenu>

        <DropdownMenuSeparator />

        {/* Combine Google checkbox */}
        <DropdownMenuCheckboxItem
          checked={combineGoogleShares}
          onCheckedChange={onCombineGoogleSharesChange}
        >
          Combine GOOG/GOOGL
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
