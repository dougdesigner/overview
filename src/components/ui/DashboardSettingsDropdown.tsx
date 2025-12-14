"use client"

import { Button } from "@/components/Button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
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
  Account,
  ExposureDisplayValue,
  HoldingsFilter,
} from "@/components/ui/data-table-exposure/types"
import { InstitutionLogo } from "@/components/ui/InstitutionLogo"
import { RiFilterLine, RiResetLeftLine } from "@remixicon/react"

interface DashboardSettingsDropdownProps {
  accounts?: Account[]
  selectedAccounts?: string[]
  onAccountsChange?: (value: string[]) => void
  holdingsFilter: HoldingsFilter
  onHoldingsFilterChange: (value: HoldingsFilter) => void
  displayValue: ExposureDisplayValue
  onDisplayValueChange: (value: ExposureDisplayValue) => void
  combineGoogleShares: boolean
  onCombineGoogleSharesChange: (value: boolean) => void
  showOtherAssets: boolean
  onShowOtherAssetsChange: (value: boolean) => void
  onReset?: () => void
  hideTextOnMobile?: boolean // Hide "Filters" text on mobile (for floating filter)
  compactWhenActive?: boolean // Hide text when filters are active (show icon only)
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
  accounts,
  selectedAccounts,
  onAccountsChange,
  holdingsFilter,
  onHoldingsFilterChange,
  displayValue,
  onDisplayValueChange,
  combineGoogleShares,
  onCombineGoogleSharesChange,
  showOtherAssets,
  onShowOtherAssetsChange,
  onReset,
  hideTextOnMobile = false,
  compactWhenActive = false,
}: DashboardSettingsDropdownProps) {
  // Check if any setting differs from default
  const hasChanges =
    (selectedAccounts && !selectedAccounts.includes("all")) ||
    holdingsFilter !== "all" ||
    displayValue !== "pct-stocks" ||
    combineGoogleShares !== true ||
    showOtherAssets !== false

  // Get selected account name for display
  const selectedAccountName =
    !selectedAccounts || selectedAccounts.includes("all")
      ? "All"
      : selectedAccounts.length === 1
        ? accounts?.find((a) => a.id === selectedAccounts[0])?.name || "1 account"
        : `${selectedAccounts.length} accounts`

  // Handle account toggle for multi-select
  const handleAccountToggle = (accountId: string, checked: boolean) => {
    if (!onAccountsChange || !accounts) return

    const currentAccounts = selectedAccounts?.includes("all")
      ? []
      : (selectedAccounts || [])

    let newAccounts: string[]

    if (checked) {
      newAccounts = [...currentAccounts, accountId]
      // If all accounts are now selected, switch to "all"
      if (newAccounts.length === accounts.length) {
        newAccounts = ["all"]
      }
    } else {
      newAccounts = currentAccounts.filter((id) => id !== accountId)
      // If no accounts selected, revert to "all"
      if (newAccounts.length === 0) {
        newAccounts = ["all"]
      }
    }

    onAccountsChange(newAccounts)
  }

  return (
    <DropdownMenu>
      <Tooltip triggerAsChild content="Dashboard settings">
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" className="relative h-9 gap-1.5">
            <span
              className={
                compactWhenActive
                  ? hasChanges
                    ? "hidden"
                    : "" // Always show text when no filters active
                  : hideTextOnMobile
                    ? "hidden sm:inline"
                    : ""
              }
            >
              Filters
            </span>
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

        {/* Account filter (multi-select) */}
        {accounts && accounts.length > 0 && onAccountsChange && (
          <DropdownMenuSubMenu>
            <DropdownMenuSubMenuTrigger>
              <span>Account</span>
              <span className="ml-auto text-xs text-gray-500">
                {selectedAccountName}
              </span>
            </DropdownMenuSubMenuTrigger>
            <DropdownMenuSubMenuContent>
              {/* All Accounts option */}
              <DropdownMenuCheckboxItem
                onSelect={(e) => e.preventDefault()}
                checked={selectedAccounts?.includes("all") ?? true}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onAccountsChange(["all"])
                  }
                }}
              >
                All Accounts
              </DropdownMenuCheckboxItem>

              <DropdownMenuSeparator />

              {/* Individual accounts - UNCHECKED when All is selected */}
              {accounts.map((account) => (
                <DropdownMenuCheckboxItem
                  key={account.id}
                  onSelect={(e) => e.preventDefault()}
                  checked={
                    !selectedAccounts?.includes("all") &&
                    (selectedAccounts?.includes(account.id) ?? false)
                  }
                  onCheckedChange={(checked) => {
                    handleAccountToggle(account.id, checked)
                  }}
                >
                  <InstitutionLogo
                    institution={account.institution}
                    className="size-5"
                  />
                  {account.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuSubMenuContent>
          </DropdownMenuSubMenu>
        )}

        {/* Stocks filter */}
        <DropdownMenuSubMenu>
          <DropdownMenuSubMenuTrigger>
            <span>Stocks</span>
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

        {/* Highlight */}
        <DropdownMenuSubMenu>
          <DropdownMenuSubMenuTrigger>
            <span>Highlight</span>
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

        {/* Show Other Assets checkbox */}
        <DropdownMenuCheckboxItem
          checked={showOtherAssets}
          onCheckedChange={onShowOtherAssetsChange}
        >
          Show Other Assets
        </DropdownMenuCheckboxItem>

        {/* ACTIONS - Reset with muted styling */}
        {onReset && hasChanges && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onReset}
              className="text-gray-500 dark:text-gray-400"
            >
              <RiResetLeftLine className="mr-2 size-4" aria-hidden="true" />
              Reset All
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
