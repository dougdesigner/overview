"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select"
import { institutionLabels } from "@/lib/institutionUtils"
import React from "react"
import { InstitutionLogo } from "./InstitutionLogo"

export interface Account {
  id: string
  name: string
  institution: string
  institutionLabel?: string
}

interface AccountSelectorProps {
  accounts: Account[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  showAllOption?: boolean
  className?: string
  id?: string
}

export function AccountSelector({
  accounts,
  value,
  onValueChange,
  placeholder = "Select an account",
  showAllOption = false,
  className,
  id,
}: AccountSelectorProps) {
  const renderAccountOption = (account: Account, showInstitutionName = true) => {
    const institutionLabel =
      account.institutionLabel ||
      institutionLabels[account.institution] ||
      account.institution

    return (
      <div className="flex items-start gap-2">
        <InstitutionLogo institution={account.institution} />
        <div className="flex flex-col">
          <span>{account.name}</span>
          {showInstitutionName && (
            <span className="text-xs text-gray-500">
              {institutionLabel}
            </span>
          )}
        </div>
      </div>
    )
  }

  const getSelectedDisplay = () => {
    if (value === "all" && showAllOption) {
      return (
        <>
          All{" "}
          <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-sm font-medium tabular-nums text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {accounts.length}
          </span>
        </>
      )
    }

    const selectedAccount = accounts.find(a => a.id === value)
    if (selectedAccount) {
      return (
        <div className="flex items-center gap-2">
          <InstitutionLogo institution={selectedAccount.institution} />
          <span className="truncate">{selectedAccount.name}</span>
        </div>
      )
    }

    return null
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className} id={id}>
        <SelectValue placeholder={placeholder}>
          {getSelectedDisplay()}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {showAllOption && (
          <SelectItem value="all">
            All{" "}
            <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-sm font-medium tabular-nums text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {accounts.length}
            </span>
          </SelectItem>
        )}
        {accounts.map((account) => (
          <SelectItem key={account.id} value={account.id}>
            {renderAccountOption(account)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}