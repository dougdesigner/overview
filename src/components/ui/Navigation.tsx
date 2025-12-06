"use client"

import { TabNavigation, TabNavigationLink } from "@/components/TabNavigation"
import { cx } from "@/lib/utils"
import {
  RiBankLine,
  RiLayout2Fill,
  RiLineChartLine,
  RiPieChartLine,
  RiHome5Line,
} from "@remixicon/react"
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
          {/* Alternative icon options - easily switch between them: */}
          {/* <RiDonutChartFill
            className="size-6 text-blue-600 dark:text-blue-400"
            aria-hidden="true"
          /> */}
          <RiLayout2Fill
            className="size-6 text-blue-600 dark:text-blue-400"
            aria-hidden="true"
          />
          <span className="text-lg font-semibold">ETF Exposure</span>
          {/* <Logo className="h-6" /> */}
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
          <RiHome5Line className="size-6" />
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
          <RiLineChartLine className="size-6" />
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
          <RiPieChartLine className="size-6" />
          <span>Exposure</span>
        </Link>
      </div>
    </div>
    </>
  )
}

export { Navigation }
