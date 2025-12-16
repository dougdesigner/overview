"use client"

import { usePortfolioStore } from "@/hooks/usePortfolioStore"
import { Icon } from "@iconify/react"
import { RiArrowRightLine } from "@remixicon/react"
import { useRouter } from "next/navigation"

export function OnboardingFlow() {
  const router = useRouter()
  const { setDemoMode } = usePortfolioStore()

  const handleTryDemo = () => {
    setDemoMode(true)
    window.location.href = "/overview"
  }

  const handleStartFresh = () => {
    router.push("/accounts")
  }

  return (
    <div className="flex flex-col items-center justify-center px-4 py-8">
      {/* Marketing CTA Section */}
      <div className="mb-8 text-left">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 sm:text-4xl">
          See your clear financial picture
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          Most portfolios have more overlap than you'd expect. See yours
          clearly.
        </p>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
          No signup required &nbsp;•&nbsp; Safe & secure
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Try Demo Card */}
        <button
          onClick={handleTryDemo}
          className="group flex flex-col items-center rounded-xl border border-gray-200 bg-white p-6 text-center transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-700"
        >
          <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <Icon icon="carbon:view" className="size-6" />
          </div>
          <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-gray-50">
            Explore Demo Data
          </h3>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            See how it works with a sample portfolio
          </p>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 group-hover:gap-2 dark:text-blue-400">
            Try Demo
            <RiArrowRightLine className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </button>

        {/* Start Fresh Card */}
        <button
          onClick={handleStartFresh}
          className="group flex flex-col items-center rounded-xl border border-gray-200 bg-white p-6 text-center transition-all hover:border-emerald-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-emerald-700"
        >
          <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <Icon icon="carbon:add" className="size-6" />
          </div>
          <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-gray-50">
            Start Fresh
          </h3>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Add your first account and holdings
          </p>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 group-hover:gap-2 dark:text-emerald-400">
            Get Started
            <RiArrowRightLine className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </button>
      </div>
    </div>
  )
}
