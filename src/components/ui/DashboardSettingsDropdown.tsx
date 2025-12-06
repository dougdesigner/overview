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
  GroupingMode,
  HoldingsFilter,
} from "@/components/ui/data-table-exposure/types"
import { RiFilterLine } from "@remixicon/react"

interface DashboardSettingsDropdownProps {
  holdingsFilter: HoldingsFilter
  onHoldingsFilterChange: (value: HoldingsFilter) => void
  groupingMode: GroupingMode
  onGroupingModeChange: (value: GroupingMode) => void
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

// Helper to get display text for grouping mode
const getGroupingModeLabel = (mode: GroupingMode): string => {
  switch (mode) {
    case "none":
      return "No group"
    case "sector":
      return "Sector"
    case "sector-industry":
      return "Sector & Industry"
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
  groupingMode,
  onGroupingModeChange,
  displayValue,
  onDisplayValueChange,
  combineGoogleShares,
  onCombineGoogleSharesChange,
}: DashboardSettingsDropdownProps) {
  return (
    <DropdownMenu>
      <Tooltip triggerAsChild content="Dashboard settings">
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" className="h-9">
            <RiFilterLine className="size-4" aria-hidden="true" />
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

        <DropdownMenuSeparator />

        {/* Group by submenu */}
        <DropdownMenuSubMenu>
          <DropdownMenuSubMenuTrigger>
            <span>Group by</span>
            <span className="ml-auto text-xs text-gray-500">
              {getGroupingModeLabel(groupingMode)}
            </span>
          </DropdownMenuSubMenuTrigger>
          <DropdownMenuSubMenuContent>
            <DropdownMenuRadioGroup
              value={groupingMode}
              onValueChange={(value) =>
                onGroupingModeChange(value as GroupingMode)
              }
            >
              <DropdownMenuRadioItem value="none" iconType="check">
                No group
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="sector" iconType="check">
                Sector
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="sector-industry" iconType="check">
                Sector & Industry
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
