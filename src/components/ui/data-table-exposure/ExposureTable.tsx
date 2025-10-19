"use client"

import { Card } from "@/components/Card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/Table"
import {
  enhancedExposureCalculator,
  type EnhancedExposureResult,
} from "@/lib/enhancedExposureCalculator"
import { cx } from "@/lib/utils"
import { RiRefreshLine } from "@remixicon/react"
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
import { DataTablePagination } from "../data-table/DataTablePagination"
import { createColumns } from "./columns"
// import { ExposureTreemap } from "./ExposureTreemap"  // Nivo version - commented out
// import { ExposureTreemapHighcharts } from "./ExposureTreemapHighcharts"  // Original version
// import { ExposureTreemapHighcharts } from "./ExposureTreemapHighchartsSimplified"  // Simplified version
import { ExposureTreemapHighchartsWithLogos as ExposureTreemapHighcharts } from "./ExposureTreemapHighchartsWrapper" // Version with logos
import { ExposureTableProps, StockExposure } from "./types"

type PercentageMode = "total" | "stocks"

export function ExposureTable({ holdings }: ExposureTableProps) {
  const [data, setData] = React.useState<StockExposure[]>([])
  const [rawData, setRawData] = React.useState<StockExposure[]>([])
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "percentOfPortfolio", desc: true },
  ])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [expanded, setExpanded] = React.useState<ExpandedState>({})
  const [isLoading, setIsLoading] = React.useState(false)
  const [totalPortfolioValue, setTotalPortfolioValue] = React.useState(0)
  const [percentageMode, setPercentageMode] =
    React.useState<PercentageMode>("total")

  // Calculate exposures on mount and when holdings change
  React.useEffect(() => {
    const calculateExposuresAsync = async () => {
      setIsLoading(true)
      try {
        const result: EnhancedExposureResult =
          await enhancedExposureCalculator.calculateExposures(holdings)
        setRawData(result.exposures)
        setData(result.exposures)
        setTotalPortfolioValue(result.totalPortfolioValue)

        // Log the improvements
        console.log("Total stocks with exposure:", result.exposures.length)
        console.log("API calls saved by not fetching individual stock prices!")
      } catch (error) {
        console.error("Error calculating exposures:", error)
      } finally {
        setIsLoading(false)
      }
    }
    calculateExposuresAsync()
  }, [holdings])

  // Recalculate percentages when mode changes
  React.useEffect(() => {
    if (rawData.length === 0) return

    if (percentageMode === "total") {
      // Use original percentages based on total portfolio
      setData(rawData)
    } else {
      // Recalculate percentages based on stocks only
      const stocksOnlyValue = rawData
        .filter((exp) => !exp.isETFBreakdown)
        .reduce((sum, exp) => sum + exp.totalValue, 0)

      const recalculatedData = rawData.map((exp) => ({
        ...exp,
        percentOfPortfolio:
          stocksOnlyValue > 0 ? (exp.totalValue / stocksOnlyValue) * 100 : 0,
        subRows: exp.subRows?.map((sub) => ({
          ...sub,
          percentOfPortfolio:
            stocksOnlyValue > 0 ? (sub.totalValue / stocksOnlyValue) * 100 : 0,
        })),
      }))

      setData(recalculatedData)
    }
  }, [percentageMode, rawData])

  const areAllExpanded = React.useCallback(() => {
    const expandableRows = data.filter(
      (row) => row.subRows && row.subRows.length > 0,
    )
    if (expandableRows.length === 0) return false
    return expandableRows.every((row) => {
      const index = data.indexOf(row).toString()
      return expanded[index as keyof typeof expanded]
    })
  }, [data, expanded])

  const toggleExpandAll = React.useCallback(() => {
    const allExpanded = areAllExpanded()
    if (allExpanded) {
      setExpanded({})
    } else {
      const newExpanded: ExpandedState = {}
      data.forEach((row, index) => {
        if (row.subRows && row.subRows.length > 0) {
          newExpanded[index.toString()] = true
        }
      })
      setExpanded(newExpanded)
    }
  }, [data, areAllExpanded])

  const columns = React.useMemo(
    () =>
      createColumns({
        toggleExpandAll,
        areAllExpanded,
        percentageMode,
      }),
    [toggleExpandAll, areAllExpanded, percentageMode],
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

      {/* Percentage Mode Toggle and Treemap Visualization */}
      {data.length > 0 && (
        <>
          {/* Percentage Mode Toggle */}
          <div className="mb-4 flex justify-end">
            <div className="flex items-center rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
              <button
                onClick={() => setPercentageMode("total")}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  percentageMode === "total"
                    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-50"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                }`}
              >
                Total Portfolio
              </button>
              <button
                onClick={() => setPercentageMode("stocks")}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  percentageMode === "stocks"
                    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-50"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                }`}
              >
                Stocks Only
              </button>
            </div>
          </div>

          {/* Option 1: Nivo Treemap (original) */}
          {/* <ExposureTreemap exposures={data} totalValue={totalPortfolioValue} /> */}

          {/* Option 2: Highcharts Treemap (now active - better margin control) */}
          <ExposureTreemapHighcharts
            exposures={data}
            totalValue={
              percentageMode === "total"
                ? totalPortfolioValue
                : data
                    .filter((exp) => !exp.isETFBreakdown)
                    .reduce((sum, exp) => sum + exp.totalValue, 0)
            }
            percentageMode={percentageMode}
          />
        </>
      )}

      {/* Table Controls */}
      <Card className="p-0">
        {/* <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
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
        </div> */}

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
      </Card>

      {/* Pagination */}
      <DataTablePagination table={table} pageSize={20} />
    </div>
  )
}
