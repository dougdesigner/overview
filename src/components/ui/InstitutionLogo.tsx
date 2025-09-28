"use client"

import {
  getInstitutionBrandColor,
  getInstitutionInitials,
  institutionLabels,
} from "@/lib/institutionUtils"
import { getInstitutionLogoUrl } from "@/lib/logoUtils"
import { cx } from "@/lib/utils"
import Image from "next/image"
import React from "react"

interface InstitutionLogoProps {
  institution: string
  className?: string
}

export function InstitutionLogo({
  institution,
  className = "size-6",
}: InstitutionLogoProps) {
  const [logoError, setLogoError] = React.useState(false)
  const institutionLabel = institutionLabels[institution] || institution
  const logoUrl = getInstitutionLogoUrl(institutionLabel)

  if (!logoUrl || logoError) {
    // Fallback to initials
    return (
      <div
        className={cx(
          "flex shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white",
          className,
          getInstitutionBrandColor(institution),
        )}
      >
        {getInstitutionInitials(institutionLabel)}
      </div>
    )
  }

  return (
    <Image
      src={logoUrl}
      alt={institutionLabel}
      width={48}
      height={48}
      className={cx("shrink-0 rounded-full bg-white object-cover", className)}
      onError={() => setLogoError(true)}
    />
  )
}
