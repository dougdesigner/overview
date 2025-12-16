"use client"

import { usePortfolioStore } from "@/hooks/usePortfolioStore"
import { Icon } from "@iconify/react"
import { RiArrowRightLine } from "@remixicon/react"
import Link from "next/link"

export default function InsightsPage() {
  const { setDemoMode } = usePortfolioStore()

  const handleTryDemo = () => {
    setDemoMode(true)
    window.location.href = "/overview"
  }

  return (
    <div className="bg-white dark:bg-gray-950">
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Market Insight
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-50 sm:text-5xl">
              Do You Know What You Really Own?
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
              Most investors think they&apos;re diversified. The reality? Your portfolio
              likely has more concentration in big tech than you realize.
            </p>
          </div>
        </div>
      </div>

      {/* Problem Statistics Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:max-w-none">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50 sm:text-4xl">
              The Concentration Problem
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-600 dark:text-gray-400">
              Market concentration is accelerating. Here&apos;s what the numbers say.
            </p>
          </div>

          {/* Stats Grid */}
          <dl className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-800 dark:bg-gray-900">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Top 10 stocks share of S&P 500
              </dt>
              <dd className="mt-3 text-5xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                ~40%
              </dd>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                The highest concentration in decades
              </p>
            </div>

            <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-800 dark:bg-gray-900">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Returns from top 10 since 2023
              </dt>
              <dd className="mt-3 text-5xl font-bold tracking-tight text-cyan-600 dark:text-cyan-400">
                65%
              </dd>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Of total S&P 500 performance
              </p>
            </div>

            <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center sm:col-span-2 lg:col-span-1 dark:border-gray-800 dark:bg-gray-900">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                S&P 500 &amp; Nasdaq overlap
              </dt>
              <dd className="mt-3 text-5xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                100+
              </dd>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Stocks appear in both indexes
              </p>
            </div>
          </dl>
        </div>
      </div>

      {/* Quote Section */}
      <div className="mx-auto mt-16 max-w-7xl px-6 sm:mt-24 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-12 sm:px-12 sm:py-16">
          <div className="relative mx-auto max-w-2xl text-center">
            <Icon
              icon="carbon:quotes"
              className="mx-auto size-10 text-white/50"
            />
            <blockquote className="mt-4 text-xl font-medium leading-8 text-white sm:text-2xl sm:leading-9">
              &ldquo;If you&apos;re invested in both the S&P 500 and Nasdaq,
              you&apos;re double-dipping on the same big tech stocks without realizing it.&rdquo;
            </blockquote>
            <p className="mt-6 text-base text-blue-100">
              Most portfolios have more overlap than you&apos;d expect.
            </p>
          </div>
        </div>
      </div>

      {/* Hidden Exposure Explanation */}
      <div className="mx-auto mt-16 max-w-7xl px-6 sm:mt-24 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-none">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
                The Hidden Exposure Problem
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
                When you own multiple ETFs and index funds, they often hold the same
                underlying stocks. Your &ldquo;diversified&rdquo; portfolio might be
                concentrated in ways you don&apos;t expect.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "VTI, VOO, and QQQ all hold Apple, Microsoft, and Nvidia",
                  "Target-date funds often mirror the same large-cap stocks",
                  "Your 401(k) and brokerage accounts may have significant overlap",
                  "International funds increasingly hold U.S. tech multinationals",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <Icon
                      icon="carbon:checkmark-filled"
                      className="size-6 shrink-0 text-blue-600 dark:text-blue-400"
                    />
                    <span className="text-gray-600 dark:text-gray-400">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col justify-center">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 dark:border-gray-800 dark:bg-gray-900">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Example: The &ldquo;Diversified&rdquo; Investor
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  An investor with VTI, VOO, and QQQ might think they&apos;re diversified
                  across three funds. In reality:
                </p>
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Apple exposure</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-50">~20% of equity</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div className="h-full w-[65%] rounded-full bg-blue-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Microsoft exposure</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-50">~18% of equity</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div className="h-full w-[58%] rounded-full bg-cyan-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Nvidia exposure</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-50">~15% of equity</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div className="h-full w-[48%] rounded-full bg-emerald-500" />
                  </div>
                </div>
                <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                  Combined: Over 50% exposure to just three companies.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Solution Section */}
      <div className="mx-auto mt-16 max-w-7xl px-6 sm:mt-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50 sm:text-4xl">
            See Through Your ETFs
          </h2>
          <p className="mt-4 text-lg leading-8 text-gray-600 dark:text-gray-400">
            Overview uses ETF look-through analysis to show you the individual stocks
            you actually own across all your accounts.
          </p>
        </div>

        {/* Features */}
        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-3">
          {[
            {
              icon: "carbon:chart-treemap",
              title: "Stock Treemap",
              description:
                "Visualize your true exposure to individual stocks across all ETFs and funds.",
            },
            {
              icon: "carbon:flow",
              title: "Account Flow",
              description:
                "See how money flows from institutions to accounts to asset classes.",
            },
            {
              icon: "carbon:analytics",
              title: "Exposure Analysis",
              description:
                "Understand sector concentration and benchmark against target allocations.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col items-center text-center"
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <Icon
                  icon={feature.icon}
                  className="size-6 text-blue-600 dark:text-blue-400"
                />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-50">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="mx-auto mt-16 max-w-7xl px-6 pb-16 sm:mt-24 sm:pb-24 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gray-900 px-6 py-16 sm:px-16 sm:py-24 dark:bg-gray-800">
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              See Your True Exposure
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-gray-300">
              Don&apos;t wait for a market correction to discover your concentration risk.
              Try Overview today and see what you really own.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
              <button
                onClick={handleTryDemo}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 text-base font-semibold text-white shadow-sm transition-all hover:from-blue-600 hover:to-cyan-600 hover:shadow-md"
              >
                Try Demo Portfolio
                <RiArrowRightLine className="size-5" />
              </button>
              <Link
                href="/accounts"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-600 bg-transparent px-6 py-3 text-base font-semibold text-white transition-all hover:border-gray-400 hover:bg-white/5"
              >
                Add Your Accounts
              </Link>
            </div>
            <p className="mt-6 text-sm text-gray-400">
              No signup required &nbsp;&bull;&nbsp; Data stored locally &nbsp;&bull;&nbsp; 100% private
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
