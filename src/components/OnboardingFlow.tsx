"use client"

import { Button } from "@/components/Button"
import { usePortfolioStore } from "@/hooks/usePortfolioStore"
import { cx } from "@/lib/utils"
import { Icon } from "@iconify/react"
import { RiArrowLeftLine, RiArrowRightLine } from "@remixicon/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { OnboardingStep } from "./OnboardingStep"

// Import screenshot placeholders
import { AccountsScreenshot } from "./screenshots/AccountsScreenshot"
import { ExposureAnalysisScreenshot } from "./screenshots/ExposureAnalysisScreenshot"
import { HoldingsScreenshot } from "./screenshots/HoldingsScreenshot"
import { OverviewScreenshot } from "./screenshots/OverviewScreenshot"

const onboardingSteps = [
  {
    id: "overview",
    title: "Your Portfolio at a Glance",
    description:
      "Get a comprehensive view of your entire investment portfolio. Monitor total value, asset allocation, and understand your overall financial position for long-term wealth building.",
    highlights: [
      "Total portfolio value across all accounts",
      "Asset class distribution visualization",
      "Consolidated view for holistic understanding",
      "Dark mode support for comfortable viewing",
    ],
    screenshot: <OverviewScreenshot />,
  },
  {
    id: "accounts",
    title: "Organize Your Investment Accounts",
    description:
      "Manage all your investment accounts in one place. Track different account types from retirement to taxable accounts, understanding how each contributes to your long-term goals.",
    highlights: [
      "Support for 401(k), IRA, and taxable accounts",
      "Individual account balances and allocations",
      "Account-level asset class breakdowns",
      "Easy account management and updates",
    ],
    screenshot: <AccountsScreenshot />,
  },
  {
    id: "holdings",
    title: "Track Your Individual Investments",
    description:
      "View all your holdings across accounts. Monitor diversification at the security level and ensure your portfolio aligns with your long-term investment strategy.",
    highlights: [
      "Complete list of all positions",
      "Position sizes and portfolio weights",
      "Diversification analysis by security",
      "Cross-account holding aggregation",
    ],
    screenshot: <HoldingsScreenshot />,
  },
  {
    id: "exposure",
    title: "Understand Your True Exposure",
    description:
      "See beyond fund names with ETF look-through analysis. Discover your actual underlying exposure to individual securities and sectors for better risk management.",
    highlights: [
      "ETF holdings expansion and transparency",
      "Interactive treemap visualization",
      "Concentration risk identification",
      "True underlying exposure analysis",
    ],
    screenshot: <ExposureAnalysisScreenshot />,
  },
]

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0)
  const router = useRouter()
  const { setDemoMode } = usePortfolioStore()

  const step = onboardingSteps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === onboardingSteps.length - 1

  const handleNext = () => {
    if (isLastStep) {
      router.push("/accounts")
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, onboardingSteps.length - 1))
    }
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const handleTryDemo = () => {
    setDemoMode(true)
    window.location.href = '/overview'
  }

  const handleStartFresh = () => {
    router.push("/accounts")
  }

  return (
    <>
      <div className="flex min-h-[600px] flex-col justify-between">
        {/* Progress Indicator */}
        {/* <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Step {currentStep + 1} of {onboardingSteps.length}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Getting Started
            </span>
          </div>
          <div className="relative h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-300 ease-out rounded-full"
              style={{
                width: `${((currentStep + 1) / onboardingSteps.length) * 100}%`,
              }}
            />
          </div>
        </div> */}

        {/* Step Content */}
        <div className="flex-1">
          <OnboardingStep
            title={step.title}
            description={step.description}
            highlights={step.highlights}
          >
            {step.screenshot}
          </OnboardingStep>
        </div>

        {/* Navigation */}
        <div className="mt-12">
          {/* Step Navigation */}
          <div className="mb-8 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={isFirstStep}
              className={cx("gap-2", isFirstStep && "invisible")}
            >
              <RiArrowLeftLine className="size-4" />
              Back
            </Button>

            {/* Step Indicators */}
            <div className="flex items-center gap-2">
              {onboardingSteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={cx(
                    "size-2 rounded-full transition-all duration-200",
                    index === currentStep
                      ? "w-8 bg-blue-500"
                      : "bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600",
                  )}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>

            <Button
              variant="ghost"
              onClick={handleNext}
              disabled={isLastStep}
              className={cx("gap-2", isLastStep && "invisible")}
            >
              Next
              <RiArrowRightLine className="size-4" />
            </Button>
          </div>

          {/* Choice Cards - Always visible */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
      </div>
    </>
  )
}
