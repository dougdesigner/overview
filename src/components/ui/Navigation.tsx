"use client"

import { TabNavigation, TabNavigationLink } from "@/components/TabNavigation"
import { cx } from "@/lib/utils"
import {
  RiBankLine,
  RiDonutChartFill,
  RiLayoutMasonryLine,
  RiPieChartLine,
} from "@remixicon/react"

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
  return (
    <>
    <div className="shadow-s z-20 bg-white sm:sticky sm:top-0 dark:bg-gray-950">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 pt-3 sm:px-6">
        <div className="flex items-center gap-2">
          <GradientLogoIcon className="size-6" />
          <span className="text-lg font-semibold">ETF Exposure</span>
        </div>
        <div className="flex h-[42px] flex-nowrap gap-1">
          {/* <Notifications /> */}
          <DropdownUserProfile />
        </div>
      </div>
      <TabNavigation className="mt-5 hidden sm:flex">
        <div className="mx-auto flex w-full max-w-7xl items-center px-6">
          <TabNavigationLink
            className="inline-flex gap-2"
            asChild
            active={pathname === "/overview"}
          >
            <Link href="/overview">Overview</Link>
          </TabNavigationLink>
          <TabNavigationLink
            className="inline-flex gap-2"
            asChild
            active={pathname === "/accounts"}
          >
            <Link href="/accounts">Accounts</Link>
          </TabNavigationLink>
          <TabNavigationLink
            className="inline-flex gap-2"
            asChild
            active={pathname === "/holdings"}
          >
            <Link href="/holdings">Holdings</Link>
          </TabNavigationLink>
          <TabNavigationLink
            className="inline-flex gap-2"
            asChild
            active={pathname === "/exposure"}
          >
            <Link href="/exposure">Exposure</Link>
          </TabNavigationLink>
          {/* <TabNavigationLink
            className="inline-flex gap-2"
            asChild
            active={pathname === "/analysis"}
          >
            <Link href="/analysis">Analysis</Link>
          </TabNavigationLink> */}

          {/* <TabNavigationLink
            className="inline-flex gap-2"
            asChild
            active={pathname === "/support"}
          >
            <Link href="/support">Support</Link>
          </TabNavigationLink>
          <TabNavigationLink
            className="inline-flex gap-2"
            asChild
            active={pathname === "/retention"}
          >
            <Link href="/retention">Retention</Link>
          </TabNavigationLink>
          <TabNavigationLink
            className="inline-flex gap-2"
            asChild
            active={pathname === "/workflow"}
          >
            <Link href="/workflow">Workflow</Link>
          </TabNavigationLink>
          <TabNavigationLink
            className="inline-flex gap-2"
            asChild
            active={pathname === "/agents"}
          >
            <Link href="/agents">Agents</Link>
          </TabNavigationLink> */}
        </div>
      </TabNavigation>
    </div>

    {/* Mobile Bottom Navigation */}
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white pb-safe sm:hidden dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-center justify-around py-2">
        <Link
          href="/overview"
          className={cx(
            "flex flex-col items-center gap-1 px-3 py-1 text-xs font-medium",
            pathname === "/overview"
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-500 dark:text-gray-400"
          )}
        >
          <RiDonutChartFill className="size-6" />
          <span>Overview</span>
        </Link>
        <Link
          href="/accounts"
          className={cx(
            "flex flex-col items-center gap-1 px-3 py-1 text-xs font-medium",
            pathname === "/accounts"
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-500 dark:text-gray-400"
          )}
        >
          <RiBankLine className="size-6" />
          <span>Accounts</span>
        </Link>
        <Link
          href="/holdings"
          className={cx(
            "flex flex-col items-center gap-1 px-3 py-1 text-xs font-medium",
            pathname === "/holdings"
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-500 dark:text-gray-400"
          )}
        >
          <RiPieChartLine className="size-6" />
          <span>Holdings</span>
        </Link>
        <Link
          href="/exposure"
          className={cx(
            "flex flex-col items-center gap-1 px-3 py-1 text-xs font-medium",
            pathname === "/exposure"
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-500 dark:text-gray-400"
          )}
        >
          <RiLayoutMasonryLine className="size-6" />
          <span>Exposure</span>
        </Link>
      </div>
    </div>
    </>
  )
}

export { Navigation }
