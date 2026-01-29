"use client"

import { Button } from "@/components/Button"
import { cx } from "@/lib/utils"
import { Icon } from "@iconify/react"
import React from "react"

export type ViewMode = "table" | "card"

interface ViewToggleProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  className?: string
}

export function ViewToggle({
  viewMode,
  onViewModeChange,
  className,
}: ViewToggleProps) {
  const toggleView = () => {
    onViewModeChange(viewMode === "table" ? "card" : "table")
  }

  // Show the icon for the OTHER mode (what you'll switch to)
  const icon = viewMode === "table" ? "carbon:view-mode-1" : "carbon:data-table"
  const tooltip = viewMode === "table" ? "Switch to card view" : "Switch to table view"

  return (
    <Button
      variant="secondary"
      className={cx("h-8 px-2", className)}
      onClick={toggleView}
      aria-label={tooltip}
      title={tooltip}
    >
      <Icon icon={icon} className="size-4" />
    </Button>
  )
}
