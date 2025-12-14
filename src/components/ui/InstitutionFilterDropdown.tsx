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
import { institutionLabels } from "@/hooks/usePortfolioStore"
import { RiArrowDownSLine } from "@remixicon/react"

interface InstitutionFilterDropdownProps {
  institutions: string[]
  selectedInstitution: string
  onInstitutionChange: (value: string) => void
  totalCount?: number // Total account count for "All" option
  hideTextOnMobile?: boolean
  compactWhenActive?: boolean
}

export function InstitutionFilterDropdown({
  institutions,
  selectedInstitution,
  onInstitutionChange,
  totalCount,
  hideTextOnMobile = false,
  compactWhenActive = false,
}: InstitutionFilterDropdownProps) {
  const hasChanges = selectedInstitution !== "all"

  // Get selected institution label for tooltip
  const selectedLabel =
    selectedInstitution === "all"
      ? "All Institutions"
      : institutionLabels[selectedInstitution] || selectedInstitution

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
              Institution
            </span>
            <RiArrowDownSLine className="size-4" aria-hidden="true" />
            {hasChanges && (
              <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-blue-500" />
            )}
          </Button>
        </DropdownMenuTrigger>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuRadioGroup
          value={selectedInstitution}
          onValueChange={onInstitutionChange}
        >
          <DropdownMenuRadioItem value="all" iconType="check">
            <span className="flex items-center gap-2">
              All Institutions
              {totalCount !== undefined && (
                <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  {totalCount}
                </span>
              )}
            </span>
          </DropdownMenuRadioItem>
          {institutions.map((institution) => (
            <DropdownMenuRadioItem
              key={institution}
              value={institution}
              iconType="check"
            >
              <InstitutionLogo institution={institution} className="size-5" />
              {institutionLabels[institution] || institution}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
