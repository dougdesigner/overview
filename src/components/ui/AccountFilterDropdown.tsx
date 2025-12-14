"use client"

import { Button } from "@/components/Button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/DropdownMenu"
import { Tooltip } from "@/components/Tooltip"
import { InstitutionLogo } from "@/components/ui/InstitutionLogo"
import { institutionLabels } from "@/lib/institutionUtils"
import { RiArrowDownSLine } from "@remixicon/react"

interface Account {
  id: string
  name: string
  institution: string
  institutionLabel?: string
}

interface AccountFilterDropdownProps {
  accounts: Account[]
  selectedAccount: string
  onAccountChange: (value: string) => void
  hideTextOnMobile?: boolean
  compactWhenActive?: boolean
}

export function AccountFilterDropdown({
  accounts,
  selectedAccount,
  onAccountChange,
  hideTextOnMobile = false,
  compactWhenActive = false,
}: AccountFilterDropdownProps) {
  const hasChanges = selectedAccount !== "all"

  // Get selected account name for tooltip
  const selectedLabel =
    selectedAccount === "all"
      ? "All Accounts"
      : accounts.find((a) => a.id === selectedAccount)?.name || "All Accounts"

  return (
    <DropdownMenu>
      <Tooltip triggerAsChild content={selectedLabel}>
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
              Account
            </span>
            <RiArrowDownSLine className="size-4" aria-hidden="true" />
            {hasChanges && (
              <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-blue-500" />
            )}
          </Button>
        </DropdownMenuTrigger>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuRadioGroup
          value={selectedAccount}
          onValueChange={onAccountChange}
        >
          <DropdownMenuRadioItem value="all" iconType="check">
            <span className="flex items-center gap-2">
              All Accounts
              <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                {accounts.length}
              </span>
            </span>
          </DropdownMenuRadioItem>
          {accounts.map((account) => {
            const institutionLabel =
              account.institutionLabel ||
              institutionLabels[account.institution] ||
              account.institution

            return (
              <DropdownMenuRadioItem
                key={account.id}
                value={account.id}
                iconType="check"
              >
                <div className="flex items-center gap-2">
                  <InstitutionLogo
                    institution={account.institution}
                    className="size-5"
                  />
                  <div className="flex flex-col">
                    <span>{account.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {institutionLabel}
                    </span>
                  </div>
                </div>
              </DropdownMenuRadioItem>
            )
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
