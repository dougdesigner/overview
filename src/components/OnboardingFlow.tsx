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
import { AccountsScreenshot } from "./screenshots/AccountsScreenshot"
import { HoldingsScreenshot } from "./screenshots/HoldingsScreenshot"
import { ExposureAnalysisScreenshot } from "./screenshots/ExposureAnalysisScreenshot"

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