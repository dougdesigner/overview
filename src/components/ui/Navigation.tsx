"use client"

import { TabNavigation, TabNavigationLink } from "@/components/TabNavigation"
import Link from "next/link"
import { RiLayout2Fill } from "@remixicon/react"
import { usePathname } from "next/navigation"
import { DropdownUserProfile } from "./UserProfile"

function Navigation() {
  const pathname = usePathname()
  return (
    <div className="shadow-s sticky top-0 z-20 bg-white dark:bg-gray-950">
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
      <TabNavigation className="mt-5">
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
  )
}

export { Navigation }
