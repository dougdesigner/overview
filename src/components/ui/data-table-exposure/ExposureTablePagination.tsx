"use client"

import { Button } from "@/components/Button"
import { cx } from "@/lib/utils"
import {
  RiArrowLeftDoubleLine,
  RiArrowLeftSLine,
  RiArrowRightDoubleLine,
  RiArrowRightSLine,
} from "@remixicon/react"

interface ExposureTablePaginationProps {
  totalRows: number
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function ExposureTablePagination({
  totalRows,
  currentPage,
  pageSize,
  onPageChange,
}: ExposureTablePaginationProps) {
  const pageCount = Math.ceil(totalRows / pageSize)
  const canPreviousPage = currentPage > 0
  const canNextPage = currentPage < pageCount - 1

  const firstRowIndex = totalRows === 0 ? 0 : currentPage * pageSize + 1
  const lastRowIndex = Math.min(totalRows, firstRowIndex + pageSize - 1)

  const paginationButtons = [
    {
      icon: RiArrowLeftDoubleLine,
      onClick: () => onPageChange(0),
      disabled: !canPreviousPage,
      srText: "First page",
      mobileView: "hidden sm:block",
    },
    {
      icon: RiArrowLeftSLine,
      onClick: () => onPageChange(currentPage - 1),
      disabled: !canPreviousPage,
      srText: "Previous page",
      mobileView: "",
    },
    {
      icon: RiArrowRightSLine,
      onClick: () => onPageChange(currentPage + 1),
      disabled: !canNextPage,
      srText: "Next page",
      mobileView: "",
    },
    {
      icon: RiArrowRightDoubleLine,
      onClick: () => onPageChange(pageCount - 1),
      disabled: !canNextPage,
      srText: "Last page",
      mobileView: "hidden sm:block",
    },
  ]

  return (
    <div className="flex items-center justify-between">
      <p className="hidden text-sm tabular-nums text-gray-500 sm:block dark:text-gray-500">
        Showing{" "}
        <span className="font-medium text-gray-900 dark:text-gray-50">
          {firstRowIndex}-{lastRowIndex}
        </span>{" "}
        of{" "}
        <span className="font-medium text-gray-900 dark:text-gray-50">
          {totalRows}
        </span>
      </p>
      <div className="flex items-center gap-x-1.5">
        {paginationButtons.map((button, index) => (
          <Button
            key={index}
            variant="secondary"
            className={cx(button.mobileView, "p-1.5")}
            onClick={button.onClick}
            disabled={button.disabled}
          >
            <span className="sr-only">{button.srText}</span>
            <button.icon className="size-4 shrink-0" aria-hidden="true" />
          </Button>
        ))}
      </div>
    </div>
  )
}
