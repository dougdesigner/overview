"use client"

import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { Input } from "@/components/Input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/Table"
import { exposureCalculator } from "@/lib/exposureCalculator"
import { cx } from "@/lib/utils"
import { RiRefreshLine, RiSearchLine } from "@remixicon/react"
import {
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"
import React from "react"
import { createColumns } from "./columns"
import { ExposureTreemap } from "./ExposureTreemap"
import {
  ExposureCalculationResult,
  ExposureTableProps,
  StockExposure,
} from "./types"

export function ExposureTable({ holdings, onRefresh }: ExposureTableProps) {
  const [data, setData] = React.useState<StockExposure[]>([])
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "totalValue", desc: true },
  ])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [expanded, setExpanded] = React.useState<ExpandedState>({})
  const [isLoading, setIsLoading] = React.useState(false)
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null)
  const [totalPortfolioValue, setTotalPortfolioValue] = React.useState(0)

  // Calculate exposures on mount and when holdings change
  React.useEffect(() => {
    const calculateExposuresAsync = async () => {
      setIsLoading(true)
      try {
        const result: ExposureCalculationResult =
          await exposureCalculator.calculateExposures(holdings)
        setData(result.exposures)
        setTotalPortfolioValue(result.totalPortfolioValue)
        setLastUpdated(result.lastCalculated)
      } catch (error) {
        console.error("Error calculating exposures:", error)
      } finally {
        setIsLoading(false)
      }
    }
    calculateExposuresAsync()
  }, [holdings])

  const calculateExposures = async () => {
    setIsLoading(true)
    try {
      const result: ExposureCalculationResult =
        await exposureCalculator.calculateExposures(holdings)
      setData(result.exposures)
      setTotalPortfolioValue(result.totalPortfolioValue)
      setLastUpdated(result.lastCalculated)
    } catch (error) {
      console.error("Error calculating exposures:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    await calculateExposures()
    onRefresh?.()
  }

  const toggleExpandAll = () => {
    const allExpanded = areAllExpanded()
    if (allExpanded) {
      setExpanded({})
    } else {
      const newExpanded: ExpandedState = {}
      data.forEach((row, index) => {
        if (row.subRows && row.subRows.length > 0) {
          newExpanded[index] = true
        }
      })
      setExpanded(newExpanded)
    }
  }

  const areAllExpanded = () => {
    const expandableRows = data.filter(
      (row) => row.subRows && row.subRows.length > 0,
    )
    if (expandableRows.length === 0) return false
    return expandableRows.every((row) => expanded[data.indexOf(row)])
  }

  const columns = React.useMemo(
    () =>
      createColumns({
        toggleExpandAll,
        areAllExpanded,
      }),
    [expanded, data, toggleExpandAll, areAllExpanded],
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      expanded,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows: (row) => row.subRows,
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  })

  // Calculate summary statistics
  const totalStocks = data.filter((d) => !d.isETFBreakdown).length
  const stocksWithETFExposure = data.filter((d) => d.etfExposure > 0).length
  const topConcentration = data[0]?.percentOfPortfolio || 0

  return (
    <div className="space-y-6">
      {/* Summary Cards and Pie Chart */}

      {/* <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-2">
          <Card className="p-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Stocks
            </p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-50">
              {totalStocks}
            </p>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              {stocksWithETFExposure} with ETF exposure
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Portfolio Value
            </p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-50">
              ${(totalPortfolioValue / 1000000).toFixed(2)}M
            </p>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              Across all holdings
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Top Concentration
            </p>
            <p
              className={cx(
                "mt-1 text-2xl font-semibold",
                topConcentration > 10
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-gray-900 dark:text-gray-50",
              )}
            >
              {topConcentration.toFixed(1)}%
            </p>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              {data[0]?.ticker || "—"} exposure
            </p>
          </Card>
        </div> */}

      {/* Pie Chart */}
      {/* {data.length > 0 && (
          <div className="lg:col-span-1">
            <ExposurePieChart
              exposures={data}
              totalValue={totalPortfolioValue}
            />
          </div>
        )}
      </div> */}

      {/* Treemap Visualization */}
      {data.length > 0 && (
        <ExposureTreemap exposures={data} totalValue={totalPortfolioValue} />
      )}

      {/* Table Controls */}
      <Card>
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative">
            <RiSearchLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search stocks..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9 sm:w-64"
            />
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="secondary"
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RiRefreshLine
                className={cx("h-4 w-4", isLoading && "animate-spin")}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHeaderCell
                      key={header.id}
                      className={cx(header.column.columnDef.meta?.className)}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHeaderCell>
                  ))}
                </TableRow>
              ))}
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <div className="flex items-center justify-center">
                      <RiRefreshLine className="h-6 w-6 animate-spin text-gray-400" />
                      <span className="ml-2 text-gray-500">
                        Calculating exposures...
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={cx(
                      row.depth > 0 && "bg-gray-50 dark:bg-gray-900/50",
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cx(cell.column.columnDef.meta?.className)}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No exposure data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {table.getPageCount() > 1 && (
          <div className="flex items-center justify-between border-t p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {table.getState().pagination.pageIndex * 20 + 1} to{" "}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * 20,
                data.length,
              )}{" "}
              of {data.length} stocks
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
