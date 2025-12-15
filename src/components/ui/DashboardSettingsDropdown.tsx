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
import { cx } from "@/lib/utils"
import * as Dialog from "@radix-ui/react-dialog"
import { Icon } from "@iconify/react"
import { useEffect, useState } from "react"

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
    case "mag10":
      return "Magnificent 10"
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
  // Mobile detection for responsive UI
  const [isMobile, setIsMobile] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

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

  // Shared trigger button
  const triggerButton = (
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
      <Icon
        icon={hasChanges ? "carbon:filter-edit" : "carbon:filter"}
        className="size-4"
        aria-hidden="true"
      />
      {hasChanges && (
        <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-blue-500" />
      )}
    </Button>
  )

  // Mobile: Bottom sheet drawer
  if (isMobile) {
    return (
      <Dialog.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <Tooltip triggerAsChild content="Dashboard settings">
          <Dialog.Trigger asChild>{triggerButton}</Dialog.Trigger>
        </Tooltip>

        <Dialog.Portal>
          {/* Overlay */}
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-dialogOverlayShow" />

          {/* Bottom Sheet Content */}
          <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 mx-2 mb-2 max-h-[85vh] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg data-[state=open]:animate-bottomSheetSlideUp data-[state=closed]:animate-bottomSheetSlideDown dark:border-gray-800 dark:bg-gray-950">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
              <Dialog.Title className="text-base font-semibold text-gray-900 dark:text-gray-50">
                Dashboard Settings
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200">
                  <Icon icon="carbon:close" className="size-5" />
                </button>
              </Dialog.Close>
            </div>

            {/* Scrollable Body */}
            <div className="max-h-[calc(85vh-60px)] overflow-y-auto">
              {/* Account Section */}
              {accounts && accounts.length > 0 && onAccountsChange && (
                <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
                  <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Account
                  </div>
                  <div className="space-y-1">
                    {/* All Accounts option */}
                    <button
                      onClick={() => onAccountsChange(["all"])}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
                        All Accounts
                      </span>
                      {(selectedAccounts?.includes("all") ?? true) && (
                        <Icon icon="carbon:checkmark" className="size-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </button>

                    {/* Individual accounts */}
                    {accounts.map((account) => {
                      const isChecked =
                        !selectedAccounts?.includes("all") &&
                        (selectedAccounts?.includes(account.id) ?? false)
                      return (
                        <button
                          key={account.id}
                          onClick={() =>
                            handleAccountToggle(account.id, !isChecked)
                          }
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <span className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-50">
                            <InstitutionLogo
                              institution={account.institution}
                              className="size-5"
                            />
                            {account.name}
                          </span>
                          {isChecked && (
                            <Icon icon="carbon:checkmark" className="size-5 text-blue-600 dark:text-blue-400" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Stocks Section */}
              <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Stocks
                </div>
                <div className="space-y-1">
                  {(
                    [
                      { value: "all", label: "All" },
                      { value: "mag7", label: "Magnificent 7" },
                      { value: "mag10", label: "Magnificent 10" },
                      { value: "top7", label: "Top 7" },
                      { value: "top10", label: "Top 10" },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.value}
                      onClick={() => onHoldingsFilterChange(option.value)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
                        {option.label}
                      </span>
                      {holdingsFilter === option.value && (
                        <Icon icon="carbon:checkmark" className="size-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Highlight Section */}
              <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Highlight
                </div>
                <div className="space-y-1">
                  {(
                    [
                      { value: "market-value", label: "Market value" },
                      { value: "pct-stocks", label: "Stock %" },
                      { value: "pct-portfolio", label: "Portfolio %" },
                      { value: "none", label: "None" },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.value}
                      onClick={() => onDisplayValueChange(option.value)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
                        {option.label}
                      </span>
                      {displayValue === option.value && (
                        <Icon icon="carbon:checkmark" className="size-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Views Section */}
              <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Views
                </div>
                <div className="space-y-1">
                  {/* Combine Google */}
                  <button
                    onClick={() =>
                      onCombineGoogleSharesChange(!combineGoogleShares)
                    }
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
                      Combine GOOG/GOOGL
                    </span>
                    <div
                      className={cx(
                        "flex size-5 items-center justify-center rounded border",
                        combineGoogleShares
                          ? "border-blue-600 bg-blue-600 dark:border-blue-500 dark:bg-blue-500"
                          : "border-gray-300 dark:border-gray-600",
                      )}
                    >
                      {combineGoogleShares && (
                        <Icon icon="carbon:checkmark" className="size-3.5 text-white" />
                      )}
                    </div>
                  </button>

                  {/* Show Other Assets */}
                  <button
                    onClick={() => onShowOtherAssetsChange(!showOtherAssets)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
                      Show Other Assets
                    </span>
                    <div
                      className={cx(
                        "flex size-5 items-center justify-center rounded border",
                        showOtherAssets
                          ? "border-blue-600 bg-blue-600 dark:border-blue-500 dark:bg-blue-500"
                          : "border-gray-300 dark:border-gray-600",
                      )}
                    >
                      {showOtherAssets && (
                        <Icon icon="carbon:checkmark" className="size-3.5 text-white" />
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* Reset Button */}
              {onReset && hasChanges && (
                <div className="px-4 py-3">
                  <button
                    onClick={() => {
                      onReset()
                      setIsDrawerOpen(false)
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                  >
                    <Icon icon="carbon:filter-reset" className="size-4" />
                    Reset All
                  </button>
                </div>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    )
  }

  // Desktop: Dropdown menu with submenus
  return (
    <DropdownMenu>
      <Tooltip triggerAsChild content="Dashboard settings">
        <DropdownMenuTrigger asChild>{triggerButton}</DropdownMenuTrigger>
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
              <DropdownMenuRadioItem value="mag10" iconType="check">
                Magnificent 10
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
              <DropdownMenuRadioItem value="none" iconType="check">
                None
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubMenuContent>
        </DropdownMenuSubMenu>
        <DropdownMenuSeparator />

        {/* Views section */}
        <DropdownMenuLabel>VIEWS</DropdownMenuLabel>

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
              <Icon icon="carbon:filter-reset" className="mr-2 size-4" aria-hidden="true" />
              Reset All
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
