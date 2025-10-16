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
import { enhancedExposureCalculator, type EnhancedExposureResult, type AssetClassBreakdown } from "@/lib/enhancedExposureCalculator"
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
import { ExposureTreemapHighchartsWithLogos as ExposureTreemapHighcharts } from "./ExposureTreemapHighchartsWrapper"  // Version with logos
import {
  ExposureTableProps,
  StockExposure,
} from "./types"

export function ExposureTable({ holdings }: ExposureTableProps) {
  const [data, setData] = React.useState<StockExposure[]>([])
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "percentOfPortfolio", desc: true },
  ])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [expanded, setExpanded] = React.useState<ExpandedState>({})
  const [isLoading, setIsLoading] = React.useState(false)
  const [totalPortfolioValue, setTotalPortfolioValue] = React.useState(0)
  const [assetClassBreakdown, setAssetClassBreakdown] = React.useState<AssetClassBreakdown[]>([])
  const [sectorBreakdown, setSectorBreakdown] = React.useState<{ sector: string; value: number; percentage: number }[]>([])

  // Calculate exposures on mount and when holdings change
  React.useEffect(() => {
    const calculateExposuresAsync = async () => {
      setIsLoading(true)
      try {
        const result: EnhancedExposureResult =
          await enhancedExposureCalculator.calculateExposures(holdings)
        setData(result.exposures)
        setTotalPortfolioValue(result.totalPortfolioValue)
        setAssetClassBreakdown(result.assetClassBreakdown)
        setSectorBreakdown(result.sectorBreakdown)

        // Log the improvements
        console.log("Asset Class Breakdown:", result.assetClassBreakdown)
        console.log("Sector Breakdown:", result.sectorBreakdown)
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
      }),
    [toggleExpandAll, areAllExpanded],
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

      {/* Asset Class Breakdown */}
      {assetClassBreakdown.length > 0 && (
        <Card className="p-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-3">
            Asset Allocation
          </h3>
          <div className="flex flex-wrap gap-2">
            {assetClassBreakdown.map((asset) => (
              <div
                key={asset.class}
                className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2"
              >
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: asset.color }}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {asset.className}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {asset.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            {sectorBreakdown.length > 0 && (
              <span>
                Top sectors: {sectorBreakdown.slice(0, 3).map(s => `${s.sector} (${s.percentage.toFixed(1)}%)`).join(", ")}
              </span>
            )}
          </div>
        </Card>
      )}

      {/* Treemap Visualization */}
      {data.length > 0 && (
        <>
          {/* Option 1: Nivo Treemap (original) */}
          {/* <ExposureTreemap exposures={data} totalValue={totalPortfolioValue} /> */}

          {/* Option 2: Highcharts Treemap (now active - better margin control) */}
          <ExposureTreemapHighcharts
            exposures={data}
            totalValue={totalPortfolioValue}
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
