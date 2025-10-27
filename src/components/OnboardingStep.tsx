"use client"

import React from "react"
import { cx } from "@/lib/utils"

interface OnboardingStepProps {
  title: string
  description: string
  highlights?: string[]
  children: React.ReactNode
  className?: string
}

export function OnboardingStep({
  title,
  description,
  highlights,
  children,
  className,
}: OnboardingStepProps) {
  return (
    <div
      className={cx(
        "flex flex-col lg:flex-row gap-8 lg:gap-12 items-center",
        className
      )}
    >
      {/* Left side - Text content */}
      <div className="w-full lg:w-2/5 space-y-4">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
          {title}
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
          {description}
        </p>
        {highlights && highlights.length > 0 && (
          <ul className="space-y-3 mt-6">
            {highlights.map((highlight, index) => (
              <li
                key={index}
                className="flex items-start gap-3"
              >
                <div className="mt-1.5 size-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">
                  {highlight}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Right side - Visual content */}
      <div className="w-full lg:w-3/5">
        <div className="relative rounded-xl overflow-hidden shadow-xl">
          {children}
        </div>
      </div>
    </div>
  )
}