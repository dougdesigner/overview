"use client"

import { Button } from "@/components/Button"
import { usePortfolioStore } from "@/hooks/usePortfolioStore"
import { cx } from "@/lib/utils"
import { Icon } from "@iconify/react"
import { RiArrowLeftLine, RiArrowRightLine } from "@remixicon/react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { OnboardingStep } from "./OnboardingStep"

// Hook to detect mobile viewport
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return isMobile
}

// Screenshot component that loads appropriate image based on viewport
function OnboardingScreenshot({
  pageId,
  alt,
}: {
  pageId: string
  alt: string
}) {
  const isMobile = useIsMobile()
  const viewport = isMobile ? "mobile" : "desktop"

  // Use light theme for screenshots (could be extended to match current theme)
  const theme = "light"
  const src = `/images/onboarding/${pageId}-${viewport}-${theme}.png`

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-gray-200 shadow-lg dark:border-gray-700">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover object-top"
        sizes="(max-width: 768px) 100vw, 60vw"
        priority
      />
    </div>
  )
}

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
    pageId: "overview",
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
    pageId: "accounts",
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
    pageId: "holdings",
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
    pageId: "exposure",
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
    window.location.href = "/overview"
  }

  const handleStartFresh = () => {
    router.push("/accounts")
  }

  return (
    <>
      <div className="flex min-h-[600px] flex-col justify-between">
        {/* Step Content */}
        <div className="flex-1">
          <OnboardingStep
            title={step.title}
            description={step.description}
            highlights={step.highlights}
          >
            <OnboardingScreenshot
              pageId={step.pageId}
              alt={`${step.title} screenshot`}
            />
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
