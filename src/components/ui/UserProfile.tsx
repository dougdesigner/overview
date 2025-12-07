"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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
import { usePortfolioStore } from "@/hooks/usePortfolioStore"
import { clearETFCache } from "@/lib/etfCacheUtils"
import { cx, focusRing } from "@/lib/utils"
import {
  RiCheckLine,
  RiComputerLine,
  RiDownloadLine,
  RiLockLine,
  RiMoonLine,
  RiSettings3Line,
  RiSunLine,
  RiUploadLine,
} from "@remixicon/react"
import { useTheme } from "next-themes"
import React from "react"

function DropdownUserProfile() {
  const [mounted, setMounted] = React.useState(false)
  const { theme, setTheme } = useTheme()
  const { exportPortfolioData, importPortfolioData } = usePortfolioStore()
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Handle export
  const handleExport = () => {
    try {
      exportPortfolioData()
      console.log("✅ Portfolio exported successfully")
    } catch (error) {
      console.error("Failed to export portfolio:", error)
      alert("Failed to export portfolio data")
    }
  }

  // Handle import
  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      // Validate data structure
      if (!data.accounts || !data.holdings) {
        throw new Error("Invalid backup file format")
      }

      // Confirm before importing
      const accountCount = data.accounts.length
      const holdingCount = data.holdings.length

      if (
        confirm(
          `Import ${accountCount} accounts and ${holdingCount} holdings?\n\nThis will replace all current data.`,
        )
      ) {
        importPortfolioData(data)

        // Clear ETF cache to ensure fresh data
        clearETFCache()

        console.log(
          `✅ Portfolio imported: ${accountCount} accounts, ${holdingCount} holdings`,
        )
        alert(
          `Successfully imported ${accountCount} accounts and ${holdingCount} holdings`,
        )
      }
    } catch (error) {
      console.error("Failed to import portfolio:", error)
      alert("Failed to import portfolio data. Please check the file format.")
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  if (!mounted) {
    return null
  }
  return (
    <>
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="open settings"
            className={cx(
              focusRing,
              "group rounded-full p-1 hover:bg-gray-100 data-[state=open]:bg-gray-100 hover:dark:bg-gray-400/10 data-[state=open]:dark:bg-gray-400/10",
            )}
          >
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-xs font-medium text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
              aria-hidden="true"
            >
              <RiSettings3Line className="size-5" aria-hidden="true" />
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="!min-w-[calc(var(--radix-dropdown-menu-trigger-width))]"
        >
          <DropdownMenuLabel>Settings</DropdownMenuLabel>

          {/* Portfolio Data Management */}
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleExport}>
              <RiDownloadLine
                className="mr-2 size-4 shrink-0"
                aria-hidden="true"
              />
              Export Portfolio
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleImportClick}>
              <RiUploadLine
                className="mr-2 size-4 shrink-0"
                aria-hidden="true"
              />
              Import Portfolio
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuSubMenu>
              <DropdownMenuSubMenuTrigger>Theme</DropdownMenuSubMenuTrigger>
              <DropdownMenuSubMenuContent>
                <DropdownMenuRadioGroup
                  value={theme}
                  onValueChange={(value) => {
                    setTheme(value)
                  }}
                >
                  <DropdownMenuRadioItem
                    aria-label="Switch to Light Mode"
                    value="light"
                    iconType="check"
                  >
                    <RiSunLine className="size-4 shrink-0" aria-hidden="true" />
                    Light
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem
                    aria-label="Switch to Dark Mode"
                    value="dark"
                    iconType="check"
                  >
                    <RiMoonLine
                      className="size-4 shrink-0"
                      aria-hidden="true"
                    />
                    Dark
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem
                    aria-label="Switch to System Mode"
                    value="system"
                    iconType="check"
                  >
                    <RiComputerLine
                      className="size-4 shrink-0"
                      aria-hidden="true"
                    />
                    System
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubMenuContent>
            </DropdownMenuSubMenu>
          </DropdownMenuGroup>

          {/* Privacy & Security Notice */}
          <DropdownMenuSeparator />
          <div className="px-2 py-2">
            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <RiCheckLine className="size-3.5" aria-hidden="true" />
              <span>No signup required</span>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <RiLockLine className="size-3.5" aria-hidden="true" />
              <span>Safe & secure</span>
            </div>
            <p className="mt-1 text-center text-[11px] text-gray-400 dark:text-gray-500">
              All data is stored locally on your device
            </p>
          </div>

          {/* <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              Changelog
              <RiArrowRightUpLine
                className="mb-1 ml-1 size-3 shrink-0 text-gray-500"
                aria-hidden="true"
              />
            </DropdownMenuItem>
            <DropdownMenuItem>
              Documentation
              <RiArrowRightUpLine
                className="mb-1 ml-1 size-3 shrink-0 text-gray-500"
                aria-hidden="true"
              />
            </DropdownMenuItem>
            <DropdownMenuItem>
              Join Slack community
              <RiArrowRightUpLine
                className="mb-1 ml-1 size-3 shrink-0 text-gray-500"
                aria-hidden="true"
              />
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <a href={siteConfig.baseLinks.login} className="w-full">
                Sign out
              </a>
            </DropdownMenuItem>
          </DropdownMenuGroup> */}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

export { DropdownUserProfile }
