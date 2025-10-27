"use client"

import React, { useState } from "react"
import { Button } from "@/components/Button"
import { OnboardingStep } from "./OnboardingStep"
import { cx } from "@/lib/utils"
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiAddLine,
} from "@remixicon/react"
import { usePortfolioStore } from "@/hooks/usePortfolioStore"
import { AccountDrawer } from "@/components/ui/AccountDrawer"

// Import screenshot placeholders
import { OverviewScreenshot } from "./screenshots/OverviewScreenshot"
import { AssetAllocationScreenshot } from "./screenshots/AssetAllocationScreenshot"
import { ExposureAnalysisScreenshot } from "./screenshots/ExposureAnalysisScreenshot"

const onboardingSteps = [
  {
    id: "welcome",
    title: "Welcome to Your Portfolio Command Center",
    description:
      "Get a complete view of your investment portfolio in one place. Track performance, monitor trends, and make informed decisions with real-time insights.",
    highlights: [
      "Consolidated view across all your accounts",
      "Real-time portfolio valuation and performance metrics",
      "Interactive charts and visualizations",
      "Dark mode support for comfortable viewing",
    ],
    screenshot: <OverviewScreenshot />,
  },
  {
    id: "asset-allocation",
    title: "Master Your Asset Allocation",
    description:
      "Visualize your portfolio composition across asset classes. Understand your diversification at a glance and identify rebalancing opportunities.",
    highlights: [
      "Dynamic donut charts showing asset class distribution",
      "Drill down into individual holdings and accounts",
      "Track allocation changes over time",
      "Identify concentration risks and opportunities",
    ],
    screenshot: <AssetAllocationScreenshot />,
  },
  {
    id: "exposure-analysis",
    title: "Deep Dive with Exposure Analysis",
    description:
      "See beyond the surface with ETF look-through analysis. Understand your true underlying exposure across sectors and individual securities.",
    highlights: [
      "ETF holdings expansion for complete transparency",
      "Interactive treemap visualization of exposures",
      "Filter by account to analyze specific portfolios",
      "Export detailed exposure reports",
    ],
    screenshot: <ExposureAnalysisScreenshot />,
  },
]

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false)
  const { createAccount } = usePortfolioStore()

  const step = onboardingSteps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === onboardingSteps.length - 1

  const handleNext = () => {
    if (isLastStep) {
      setIsAccountDrawerOpen(true)
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, onboardingSteps.length - 1))
    }
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  return (
    <>
      <div className="min-h-[600px] flex flex-col justify-between">
        {/* Progress Indicator */}
        <div className="mb-8">
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
        </div>

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
        <div className="mt-12 flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={handlePrevious}
            disabled={isFirstStep}
            className={cx(
              "gap-2",
              isFirstStep && "invisible"
            )}
          >
            <RiArrowLeftLine className="size-4" />
            Previous
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
                    ? "bg-blue-500 w-8"
                    : "bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600"
                )}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>

          <Button
            variant="primary"
            onClick={handleNext}
            className="gap-2"
          >
            {isLastStep ? (
              <>
                <RiAddLine className="size-4" />
                Add Your First Account
              </>
            ) : (
              <>
                Next
                <RiArrowRightLine className="size-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Account Drawer */}
      <AccountDrawer
        open={isAccountDrawerOpen}
        onOpenChange={setIsAccountDrawerOpen}
        onSave={(account) => {
          createAccount(account)
          setIsAccountDrawerOpen(false)
        }}
      />
    </>
  )
}