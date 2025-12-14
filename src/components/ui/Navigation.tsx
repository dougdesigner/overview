"use client"

import { TabNavigation, TabNavigationLink } from "@/components/TabNavigation"
import { usePortfolioStore } from "@/hooks/usePortfolioStore"
import { cx } from "@/lib/utils"
import { Icon } from "@iconify/react"
import * as Dialog from "@radix-ui/react-dialog"
import { useRouter } from "next/navigation"
import { useState } from "react"

// Custom gradient logo icon (donut chart)
function GradientLogoIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      {/* Donut chart icon */}
      <path
        fill="url(#logo-gradient)"
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"
      />
    </svg>
  )
}
import Link from "next/link"
import { usePathname } from "next/navigation"
import { DropdownUserProfile } from "./UserProfile"

function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const { isDemoMode, accounts, holdings, hasViewedStocksPage } = usePortfolioStore()

  // Determine which tab should show an onboarding dot
  const getOnboardingDot = (path: string) => {
    // No dots in demo mode
    if (isDemoMode) return false
    // No accounts → dot on Accounts tab
    if (accounts.length === 0 && path === "/accounts") return true
    // Has account, no holdings → dot on Holdings tab
    if (accounts.length > 0 && holdings.length === 0 && path === "/holdings") return true
    // Has holdings, not viewed stocks → dot on Stocks tab
    if (holdings.length > 0 && !hasViewedStocksPage && path === "/exposure") return true
    return false
  }

  // Determine if user has accounts (for Add drawer options)
  const hasAccounts = accounts.length > 0

  const handleAddAccount = () => {
    setIsAddOpen(false)
    router.push("/accounts?add=true")
  }

  const handleAddHolding = () => {
    setIsAddOpen(false)
    router.push("/holdings?add=true")
  }

  return (
    <>
    <div className="shadow-s z-20 bg-white sm:sticky sm:top-0 dark:bg-gray-950">
      <div className="mx-auto flex max-w-7xl items-center px-4 py-3 sm:px-6">
        {/* Left: Logo + Title */}
        <div className="flex shrink-0 items-center gap-2">
          <GradientLogoIcon className="size-6" />
          <span className="text-lg font-semibold">Overview</span>
          {isDemoMode && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              Demo
            </span>
          )}
        </div>

        {/* Center: Tab Pills */}
        <TabNavigation className="mx-4 hidden flex-1 sm:flex sm:justify-start lg:justify-center">
          <TabNavigationLink
            className="inline-flex gap-2"
            asChild
            active={pathname === "/overview"}
          >
            <Link href="/overview">Home</Link>
          </TabNavigationLink>
          <div className="relative">
            <TabNavigationLink
              className="inline-flex gap-2"
              asChild
              active={pathname === "/accounts"}
            >
              <Link href="/accounts">Accounts</Link>
            </TabNavigationLink>
            {getOnboardingDot("/accounts") && (
              <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-blue-500" />
            )}
          </div>
          <div className="relative">
            <TabNavigationLink
              className="inline-flex gap-2"
              asChild
              active={pathname === "/holdings"}
            >
              <Link href="/holdings">Holdings</Link>
            </TabNavigationLink>
            {getOnboardingDot("/holdings") && (
              <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-blue-500" />
            )}
          </div>
          <div className="relative">
            <TabNavigationLink
              className="inline-flex gap-2"
              asChild
              active={pathname === "/exposure"}
            >
              <Link href="/exposure">Stocks</Link>
            </TabNavigationLink>
            {getOnboardingDot("/exposure") && (
              <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-blue-500" />
            )}
          </div>
        </TabNavigation>

        {/* Right: Settings */}
        <div className="ml-auto flex shrink-0 items-center">
          <DropdownUserProfile />
        </div>
      </div>
    </div>

    {/* Mobile Bottom Navigation */}
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white pb-safe sm:hidden dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-center justify-around px-2 py-2">
        <Link
          href="/overview"
          onClick={() => setIsAddOpen(false)}
          className={cx(
            "flex min-w-[4rem] flex-col items-center gap-0.5 rounded-2xl px-2 py-2 text-xs font-medium transition-colors",
            !isAddOpen && pathname === "/overview"
              ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
              : "text-gray-500 dark:text-gray-400"
          )}
        >
          <Icon icon="carbon:home" className="size-5" />
          <span>Home</span>
        </Link>
        <div className="relative">
          <Link
            href="/accounts"
            onClick={() => setIsAddOpen(false)}
            className={cx(
              "flex min-w-[4rem] flex-col items-center gap-0.5 rounded-2xl px-2 py-2 text-xs font-medium transition-colors",
              !isAddOpen && pathname === "/accounts"
                ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
                : "text-gray-500 dark:text-gray-400"
            )}
          >
            <Icon icon="carbon:sankey-diagram-alt" className="size-5" />
            <span>Accounts</span>
          </Link>
          {getOnboardingDot("/accounts") && (
            <span className="absolute right-1 top-1 size-2 rounded-full bg-blue-500" />
          )}
        </div>
        <div className="relative">
          <Link
            href="/holdings"
            onClick={() => setIsAddOpen(false)}
            className={cx(
              "flex min-w-[4rem] flex-col items-center gap-0.5 rounded-2xl px-2 py-2 text-xs font-medium transition-colors",
              !isAddOpen && pathname === "/holdings"
                ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
                : "text-gray-500 dark:text-gray-400"
            )}
          >
            <Icon icon="mdi:chart-donut" className="size-5" />
            <span>Holdings</span>
          </Link>
          {getOnboardingDot("/holdings") && (
            <span className="absolute right-1 top-1 size-2 rounded-full bg-blue-500" />
          )}
        </div>
        <div className="relative">
          <Link
            href="/exposure"
            onClick={() => setIsAddOpen(false)}
            className={cx(
              "flex min-w-[4rem] flex-col items-center gap-0.5 rounded-2xl px-2 py-2 text-xs font-medium transition-colors",
              !isAddOpen && pathname === "/exposure"
                ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
                : "text-gray-500 dark:text-gray-400"
            )}
          >
            <Icon icon="carbon:chart-treemap" className="size-5" />
            <span>Stocks</span>
          </Link>
          {getOnboardingDot("/exposure") && (
            <span className="absolute right-1 top-1 size-2 rounded-full bg-blue-500" />
          )}
        </div>

        {/* Add Button */}
        <Dialog.Root open={isAddOpen} onOpenChange={setIsAddOpen}>
          <Dialog.Trigger asChild>
            <button
              className={cx(
                "flex min-w-[4rem] flex-col items-center gap-0.5 rounded-2xl px-2 py-2 text-xs font-medium transition-all",
                isAddOpen
                  ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
                  : "text-gray-500 dark:text-gray-400"
              )}
            >
              <Icon
                icon={isAddOpen ? "mdi:close" : "mdi:plus"}
                className={cx(
                  "size-5 transition-transform duration-200",
                  isAddOpen && "rotate-90"
                )}
              />
              <span>{isAddOpen ? "Close" : "Add"}</span>
            </button>
          </Dialog.Trigger>

          <Dialog.Portal>
            {/* Overlay - stops above the mobile nav */}
            <Dialog.Overlay className="fixed inset-x-0 top-0 bottom-20 z-[60] bg-black/50 data-[state=open]:animate-dialogOverlayShow" />

            {/* Bottom gradient - fades content behind drawer, stops above mobile nav */}
            <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[59] h-32 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-gray-950 dark:via-gray-950/80" />

            {/* Bottom Sheet Content - positioned above mobile nav */}
            <Dialog.Content
              className="fixed inset-x-0 bottom-20 z-[60] mx-2 rounded-lg border border-gray-200 bg-white shadow-lg data-[state=open]:animate-bottomSheetSlideUp data-[state=closed]:animate-bottomSheetSlideDown dark:border-gray-800 dark:bg-gray-950"
            >
              <Dialog.Title className="sr-only">Add new item</Dialog.Title>
              <Dialog.Description className="sr-only">
                Choose to add a new account or holding
              </Dialog.Description>
              <div className="space-y-1 p-2">
                <button
                  onClick={handleAddAccount}
                  className="flex w-full items-center gap-4 rounded-xl p-4 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div className="flex size-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Icon icon="mdi:bank" className="size-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-50">Account</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Add a new investment account</div>
                  </div>
                </button>
                {hasAccounts && (
                  <button
                    onClick={handleAddHolding}
                    className="flex w-full items-center gap-4 rounded-xl p-4 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                      <Icon icon="mdi:format-list-bulleted" className="size-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-50">Holding</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Add stocks, ETFs, or cash</div>
                    </div>
                  </button>
                )}
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
    </>
  )
}

export { Navigation }
