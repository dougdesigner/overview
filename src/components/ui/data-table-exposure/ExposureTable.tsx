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
import { getCachedLogoUrls } from "@/lib/logoUtils"
import { cx } from "@/lib/utils"
import { RiRefreshLine } from "@remixicon/react"
import {
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"
import React from "react"
import { ExposureTablePagination } from "./ExposureTablePagination"
import { createColumns } from "./columns"
// import { ExposureTreemap } from "./ExposureTreemap"  // Nivo version - commented out
// import { ExposureTreemapHighcharts } from "./ExposureTreemapHighcharts"  // Original version
// import { ExposureTreemapHighcharts } from "./ExposureTreemapHighchartsSimplified"  // Simplified version
import { ExposureTreemapHighchartsWithLogos as ExposureTreemapHighcharts } from "./ExposureTreemapHighchartsWrapper" // Version with logos
import { ExposureTableProps, StockExposure } from "./types"

export function ExposureTable({ holdings, accounts, dataVersion, selectedAccount = "all", displayValue }: ExposureTableProps) {
  const [data, setData] = React.useState<StockExposure[]>([])
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "percentOfPortfolio", desc: true },
  ])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [expanded, setExpanded] = React.useState<ExpandedState>({})
  const [isLoading, setIsLoading] = React.useState(false)
  const [totalPortfolioValue, setTotalPortfolioValue] = React.useState(0)
  const [logoUrls, setLogoUrls] = React.useState<Record<string, string | null>>(
    {},
  )

  // Manual pagination state for parent-row-only pagination
  const [currentPage, setCurrentPage] = React.useState(0)
  const PAGE_SIZE = 20

  // Filter holdings by selected account for treemap visualization
  const filteredHoldings = React.useMemo(() => {
    if (selectedAccount === "all") {
      return holdings
    }
    return holdings.filter((h) => h.accountId === selectedAccount)
  }, [holdings, selectedAccount])

  // Calculate filtered exposures for treemap
  const [filteredData, setFilteredData] = React.useState<StockExposure[]>([])
  const [filteredTotalValue, setFilteredTotalValue] = React.useState(0)

  React.useEffect(() => {
    const calculateFilteredExposures = async () => {
      if (filteredHoldings.length === 0) {
        setFilteredData([])
        setFilteredTotalValue(0)
        return
      }

      try {
        const result: EnhancedExposureResult =
          await enhancedExposureCalculator.calculateExposures(filteredHoldings)
        setFilteredData(result.exposures)
        setFilteredTotalValue(result.totalPortfolioValue)
      } catch (error) {
        console.error("Error calculating filtered exposures:", error)
      }
    }
    calculateFilteredExposures()
  }, [filteredHoldings, dataVersion])

  // Calculate exposures on mount and when holdings change (for table display)
  React.useEffect(() => {
    const calculateExposuresAsync = async () => {
      setIsLoading(true)
      try {
        const result: EnhancedExposureResult =
          await enhancedExposureCalculator.calculateExposures(holdings)
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
  }, [holdings, dataVersion])

  // Batch fetch logo URLs when data changes
  React.useEffect(() => {
    const fetchLogos = async () => {
      if (data.length === 0) return

      // Extract unique tickers from data and subRows
      const tickers = new Set<string>()
      data.forEach((exp) => {
        if (exp.ticker) tickers.add(exp.ticker)
        exp.subRows?.forEach((sub) => {
          if (sub.ticker) tickers.add(sub.ticker)
        })
      })

      if (tickers.size === 0) return

      // Batch fetch logos
      const logos = await getCachedLogoUrls(Array.from(tickers))
      setLogoUrls(logos)
    }

    fetchLogos()
  }, [data])

  // Get the active data source based on account filter
  const activeData = selectedAccount === "all" ? data : filteredData

  // Sort data globally before pagination
  // Uses activeData which is already filtered by account when needed
  const sortedData = React.useMemo(() => {
    if (sorting.length === 0) return activeData

    const [{ id, desc }] = sorting
    return [...activeData].sort((a, b) => {
      const aVal = a[id as keyof StockExposure]
      const bVal = b[id as keyof StockExposure]

      if (aVal == null) return desc ? -1 : 1
      if (bVal == null) return desc ? 1 : -1

      if (typeof aVal === "number" && typeof bVal === "number") {
        return desc ? bVal - aVal : aVal - bVal
      }

      return desc
        ? String(bVal).localeCompare(String(aVal))
        : String(aVal).localeCompare(String(bVal))
    })
  }, [activeData, sorting])

  // Paginate the sorted data (parent rows only)
  const paginatedData = React.useMemo(() => {
    const startIndex = currentPage * PAGE_SIZE
    return sortedData.slice(startIndex, startIndex + PAGE_SIZE)
  }, [sortedData, currentPage, PAGE_SIZE])

  // Reset to first page when data/filter/sort changes
  React.useEffect(() => {
    setCurrentPage(0)
  }, [activeData.length, globalFilter, sorting])

  const areAllExpanded = React.useCallback(() => {
    const expandableRows = activeData.filter(
      (row) => row.subRows && row.subRows.length > 0,
    )
    if (expandableRows.length === 0) return false
    return expandableRows.every((row) => {
      const index = activeData.indexOf(row).toString()
      return expanded[index as keyof typeof expanded]
    })
  }, [activeData, expanded])

  const toggleExpandAll = React.useCallback(() => {
    const allExpanded = areAllExpanded()
    if (allExpanded) {
      setExpanded({})
    } else {
      const newExpanded: ExpandedState = {}
      activeData.forEach((row, index) => {
        if (row.subRows && row.subRows.length > 0) {
          newExpanded[index.toString()] = true
        }
      })
      setExpanded(newExpanded)
    }
  }, [activeData, areAllExpanded])

  // Calculate total stocks value for pct-stocks display mode
  const totalStocksValue = React.useMemo(() => {
    return activeData
      .filter((exp) => !exp.isETFBreakdown)
      .reduce((sum, exp) => sum + exp.totalValue, 0)
  }, [activeData])

  const columns = React.useMemo(
    () =>
      createColumns({
        toggleExpandAll,
        areAllExpanded,
        logoUrls,
        accounts,
        displayValue,
        totalStocksValue,
      }),
    [toggleExpandAll, areAllExpanded, logoUrls, accounts, displayValue, totalStocksValue],
  )

  const table = useReactTable({
    data: paginatedData,
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
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows: (row) => row.subRows,
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

      {/* Treemap Visualization */}
      {data.length > 0 && (
        <ExposureTreemapHighcharts
          exposures={selectedAccount === "all" ? data : filteredData}
          totalValue={selectedAccount === "all" ? totalPortfolioValue : filteredTotalValue}
          accounts={accounts}
          selectedAccount={selectedAccount}
          logoUrls={logoUrls}
          dataVersion={dataVersion}
          displayValue={displayValue}
        />
      )}

      {/* Table Controls */}
      {data.length > 0 && (
        <>
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
          <ExposureTablePagination
            totalRows={activeData.length}
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  )
}
