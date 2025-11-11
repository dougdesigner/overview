"use client"

import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/DropdownMenu"
import { Tooltip } from "@/components/Tooltip"
import type {
  Account,
  Holding,
} from "@/components/ui/data-table-holdings/types"
import { getCachedLogoUrls } from "@/lib/logoUtils"
import { RiDownloadLine, RiFullscreenLine } from "@remixicon/react"
import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"
import { useTheme } from "next-themes"
import { useEffect, useMemo, useRef, useState } from "react"

// Track if modules are initialized globally to prevent duplicate initialization
let modulesInitialized = false

// Type assertion for module initialization functions
type HighchartsModule = (H: typeof Highcharts) => void

// Chart and control types
type ChartType = "sunburst" | "pie"
type GroupingMode = "none" | "account" | "type" | "account-type"

interface HoldingsSunburstEnhancedProps {
  holdings: Holding[]
  accounts: Account[]
  height?: number
  selectedAccountId?: string
  onAccountChange?: (accountId: string) => void
}

export function HoldingsSunburstEnhanced({
  holdings,
  accounts,
  height = 300,
  selectedAccountId = "all",
  onAccountChange,
}: HoldingsSunburstEnhancedProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const chartRef = useRef<HighchartsReact.RefObject>(null)
  const [isClient, setIsClient] = useState(false)
  const [modulesLoaded, setModulesLoaded] = useState(false)

  // Control states
  const [chartType, setChartType] = useState<ChartType>("sunburst")
  const [sunburstGrouping, setSunburstGrouping] =
    useState<GroupingMode>("account")
  const [pieGrouping, setPieGrouping] = useState<GroupingMode>("account")
  const [selectedAccount, setSelectedAccount] =
    useState<string>(selectedAccountId)
  const [logoUrls, setLogoUrls] = useState<Record<string, string | null>>({})

  // Active grouping mode based on chart type
  const groupingMode = chartType === "sunburst" ? sunburstGrouping : pieGrouping

  // Initialize Highcharts modules on client-side
  useEffect(() => {
    const initModules = async () => {
      if (!modulesInitialized && typeof window !== "undefined" && typeof Highcharts === "object") {
        try {
          // Dynamically import modules only on client
          const [HighchartsSunburst, HighchartsExporting, HighchartsExportData] = await Promise.all([
            import("highcharts/modules/sunburst"),
            import("highcharts/modules/exporting"),
            import("highcharts/modules/export-data")
          ])

          // Initialize each module
          if (typeof HighchartsSunburst.default === "function") {
            HighchartsSunburst.default(Highcharts)
          }
          if (typeof HighchartsExporting.default === "function") {
            HighchartsExporting.default(Highcharts)
          }
          if (typeof HighchartsExportData.default === "function") {
            HighchartsExportData.default(Highcharts)
          }

          modulesInitialized = true
        } catch (error) {
          console.error("Failed to initialize Highcharts modules:", error)
        }
      }
      setIsClient(true)
      setModulesLoaded(true)
    }

    initModules()
  }, [])

  // Fetch logos for tickers
  useEffect(() => {
    const fetchLogos = async () => {
      const tickers = holdings
        .filter((h) => h.ticker)
        .map((h) => h.ticker as string)

      if (tickers.length > 0) {
        const urls = await getCachedLogoUrls(tickers)
        setLogoUrls(urls)
      }
    }

    fetchLogos()
  }, [holdings])

  // Auto-adjust grouping mode when single account is selected
  useEffect(() => {
    // If a single account is selected and grouping includes account, adjust it
    if (selectedAccount !== "all") {
      if (
        sunburstGrouping === "account" ||
        sunburstGrouping === "account-type"
      ) {
        setSunburstGrouping("type")
      }
      if (pieGrouping === "account") {
        setPieGrouping("type")
      }
    }
  }, [selectedAccount])

  // Update chart when theme changes
  useEffect(() => {
    if (chartRef.current && chartRef.current.chart) {
      const chart = chartRef.current.chart

      // Update chart with new theme colors
      chart.update({
        chart: {
          backgroundColor: "transparent",
        },
        plotOptions: {
          sunburst: {
            borderColor: isDark ? "#374151" : "#e5e7eb",
            dataLabels: {
              style: {
                fontSize: "14px",
                fontWeight: "600",
                textOutline: "none",
              },
            },
          },
          pie: {
            borderColor: isDark ? "#1f2937" : "#f3f4f6",
            dataLabels: {
              style: {
                color: isDark ? "#f3f4f6" : "#111827",
                fontSize: "12px",
                fontWeight: "500",
              },
            },
          },
        },
        tooltip: {
          backgroundColor: isDark ? "#1f2937" : "#ffffff",
          borderColor: isDark ? "#4b5563" : "#e5e7eb",
          style: {
            color: isDark ? "#f3f4f6" : "#111827",
          },
        },
      })
    }
  }, [isDark])

  // Color palette
  const colors = [
    "#3b82f6", // blue
    "#10b981", // emerald
    "#8b5cf6", // violet
    "#f59e0b", // amber
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#f97316", // orange
    "#84cc16", // lime
  ]

  // Format currency values
  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  // Filter holdings by selected account
  const filteredHoldings =
    selectedAccount === "all"
      ? holdings
      : holdings.filter((h) => h.accountId === selectedAccount)

  // Calculate total portfolio value
  const totalValue = filteredHoldings.reduce((sum, h) => sum + h.marketValue, 0)

  // Get display text for a holding - always show ticker or name
  const getDisplayText = (holding: Holding): string => {
    return holding.ticker || holding.name
  }

  // Get legend display value - always show market value
  const getLegendDisplayValue = (value: number): string => {
    return formatValue(value)
  }

  // Get consistent color for groups
  const getGroupColor = (groupName: string, index: number): string => {
    // Always use index-based colors for consistency
    return colors[index % colors.length]
  }

  // Calculate top groups for legend
  const topGroups = useMemo(() => {
    if (filteredHoldings.length === 0) return []

    if (groupingMode === "none") {
      // Show top 10 individual holdings
      return filteredHoldings
        .filter((h) => h.marketValue > 0)
        .sort((a, b) => b.marketValue - a.marketValue)
        .slice(0, 10)
        .map((h) => [h.ticker || h.name, h.marketValue] as [string, number])
    } else if (groupingMode === "type") {
      // Group by type and show all types
      const typeGroups = new Map<string, number>()
      filteredHoldings.forEach((h) => {
        const current = typeGroups.get(h.type) || 0
        typeGroups.set(h.type, current + h.marketValue)
      })

      return Array.from(typeGroups.entries())
        .filter(([_, value]) => value > 0)
        .sort((a, b) => b[1] - a[1])
        .map(
          ([type, value]) =>
            [type.charAt(0).toUpperCase() + type.slice(1), value] as [
              string,
              number,
            ],
        )
    } else {
      // Group by account and show all accounts
      const accountGroups = new Map<string, { name: string; value: number }>()
      filteredHoldings.forEach((h) => {
        if (!accountGroups.has(h.accountId)) {
          accountGroups.set(h.accountId, {
            name: h.accountName,
            value: 0,
          })
        }
        const group = accountGroups.get(h.accountId)!
        group.value += h.marketValue
      })

      return Array.from(accountGroups.entries())
        .map(([_, group]) => [group.name, group.value] as [string, number])
        .filter(([_, value]) => value > 0)
        .sort((a, b) => b[1] - a[1])
    }
  }, [filteredHoldings, groupingMode])

  // Transform holdings data to sunburst format
  const transformToSunburstData = (): Array<{
    id: string
    parent: string
    name: string
    value: number
    color?: string
    ticker?: string
    fullName?: string
    quantity?: number
    lastPrice?: number
  }> => {
    const data: Array<{
      id: string
      parent: string
      name: string
      value: number
      color?: string
      ticker?: string
      fullName?: string
      quantity?: number
      lastPrice?: number
    }> = []

    // Root node (center) - dynamic based on selected account
    const rootName =
      selectedAccount === "all"
        ? "Portfolio"
        : accounts.find((a) => a.id === selectedAccount)?.name || "Account"

    data.push({
      id: "portfolio",
      parent: "",
      name: rootName,
      value: totalValue,
      color: "transparent",
    })

    // Sunburst always has grouping (never "none")
    if (sunburstGrouping === "type") {
      // Group by type
      const typeMap = new Map<string, Holding[]>()
      filteredHoldings.forEach((holding) => {
        if (!typeMap.has(holding.type)) {
          typeMap.set(holding.type, [])
        }
        typeMap.get(holding.type)!.push(holding)
      })

      // Sort types by total value for consistent color assignment
      const sortedTypes = Array.from(typeMap.entries())
        .map(([type, holdings]) => ({
          type,
          holdings,
          total: holdings.reduce((sum, h) => sum + h.marketValue, 0),
        }))
        .sort((a, b) => b.total - a.total)

      sortedTypes.forEach(({ type, holdings, total }, index) => {
        const typeNodeId = `type-${type}`

        // Add type node with color based on sorted position
        data.push({
          id: typeNodeId,
          parent: "portfolio",
          name: type.charAt(0).toUpperCase() + type.slice(1),
          value: total,
          color: colors[index % colors.length],
        })

        // Add individual holdings
        holdings.forEach((holding) => {
          data.push({
            id: `${typeNodeId}-${holding.id}`,
            parent: typeNodeId,
            name: getDisplayText(holding),
            value: holding.marketValue,
            ticker: holding.ticker,
            fullName: holding.name,
            quantity: holding.quantity,
            lastPrice: holding.lastPrice,
          })
        })
      })
    } else if (
      sunburstGrouping === "account" ||
      sunburstGrouping === "account-type"
    ) {
      // Group by account (with optional type grouping)
      const accountMap = new Map<
        string,
        { holdings: Holding[]; total: number }
      >()

      filteredHoldings.forEach((holding) => {
        if (!accountMap.has(holding.accountId)) {
          accountMap.set(holding.accountId, { holdings: [], total: 0 })
        }
        const account = accountMap.get(holding.accountId)!
        account.holdings.push(holding)
        account.total += holding.marketValue
      })

      // Sort accounts by total value for consistent color assignment
      const sortedAccounts = Array.from(accountMap.entries())
        .map(([accountId, data]) => ({
          accountId,
          accountName: data.holdings[0]?.accountName || `Account ${accountId}`,
          ...data,
        }))
        .sort((a, b) => b.total - a.total)

      // Add account nodes and their children
      sortedAccounts.forEach(
        ({ accountId, accountName, holdings, total }, index) => {
          const accountNodeId = `account-${accountId}`
          const accountColor = colors[index % colors.length]

          // Add account node
          data.push({
            id: accountNodeId,
            parent: "portfolio",
            name: accountName,
            value: total,
            color: accountColor,
          })

          if (sunburstGrouping === "account-type") {
            // Group holdings by type within this account
            const typeMap = new Map<string, Holding[]>()
            holdings.forEach((holding) => {
              if (!typeMap.has(holding.type)) {
                typeMap.set(holding.type, [])
              }
              typeMap.get(holding.type)!.push(holding)
            })

            // Add type nodes and individual holdings
            typeMap.forEach((typeHoldings, type) => {
              const typeNodeId = `${accountNodeId}-${type}`
              const typeTotal = typeHoldings.reduce(
                (sum, h) => sum + h.marketValue,
                0,
              )

              // Add type node
              data.push({
                id: typeNodeId,
                parent: accountNodeId,
                name: type.charAt(0).toUpperCase() + type.slice(1),
                value: typeTotal,
              })

              // Add individual holdings
              typeHoldings.forEach((holding) => {
                data.push({
                  id: `${typeNodeId}-${holding.id}`,
                  parent: typeNodeId,
                  name: getDisplayText(holding),
                  value: holding.marketValue,
                  ticker: holding.ticker,
                  fullName: holding.name,
                  quantity: holding.quantity,
                  lastPrice: holding.lastPrice,
                })
              })
            })
          } else {
            // Just account grouping - add holdings directly under account
            holdings.forEach((holding) => {
              data.push({
                id: `${accountNodeId}-${holding.id}`,
                parent: accountNodeId,
                name: getDisplayText(holding),
                value: holding.marketValue,
                ticker: holding.ticker,
                fullName: holding.name,
                quantity: holding.quantity,
                lastPrice: holding.lastPrice,
              })
            })
          }
        },
      )
    }

    return data
  }

  // Transform holdings data to pie format
  const transformToPieData = () => {
    const data: any[] = []

    if (groupingMode === "none") {
      // Show individual holdings - sort by value and limit to top N
      const sortedHoldings = [...filteredHoldings].sort(
        (a, b) => b.marketValue - a.marketValue,
      )

      const maxSlices = 20
      const topHoldings = sortedHoldings.slice(0, maxSlices)
      const otherHoldings = sortedHoldings.slice(maxSlices)

      topHoldings.forEach((holding, index) => {
        data.push({
          name: getDisplayText(holding),
          y: holding.marketValue,
          color: colors[index % colors.length], // Use index-based colors for variety
          ticker: holding.ticker,
          fullName: holding.name,
        })
      })

      // Add "Others" slice if there are more holdings
      if (otherHoldings.length > 0) {
        const othersTotal = otherHoldings.reduce(
          (sum, h) => sum + h.marketValue,
          0,
        )
        data.push({
          name: `Others (${otherHoldings.length})`,
          y: othersTotal,
          color: "#9ca3af", // Gray color for others
        })
      }
    } else if (groupingMode === "type") {
      // Group by type and sort by value for consistent color assignment
      const typeGroups = new Map<string, number>()

      filteredHoldings.forEach((holding) => {
        const current = typeGroups.get(holding.type) || 0
        typeGroups.set(holding.type, current + holding.marketValue)
      })

      // Sort by value descending for consistent color assignment
      const sortedTypes = Array.from(typeGroups.entries()).sort(
        (a, b) => b[1] - a[1],
      )

      sortedTypes.forEach(([type, value], index) => {
        data.push({
          name: type.charAt(0).toUpperCase() + type.slice(1),
          y: value,
          color: colors[index % colors.length],
        })
      })
    } else {
      // Group by account and sort by value for consistent color assignment
      const accountGroups = new Map<string, { name: string; value: number }>()

      filteredHoldings.forEach((holding) => {
        if (!accountGroups.has(holding.accountId)) {
          accountGroups.set(holding.accountId, {
            name: holding.accountName,
            value: 0,
          })
        }
        const group = accountGroups.get(holding.accountId)!
        group.value += holding.marketValue
      })

      // Sort by value descending for consistent color assignment
      const sortedAccounts = Array.from(accountGroups.entries())
        .map(([id, group]) => ({ id, ...group }))
        .sort((a, b) => b.value - a.value)

      sortedAccounts.forEach((account, index) => {
        data.push({
          name: account.name,
          y: account.value,
          color: colors[index % colors.length],
        })
      })
    }

    return data
  }

  // Export handlers
  const handleExport = (type: string) => {
    const chart = chartRef.current?.chart
    if (!chart) return

    switch (type) {
      case "fullscreen":
        chart.fullscreen?.open()
        break
      case "print":
        chart.print()
        break
      case "png":
        chart.exportChart({ type: "image/png" })
        break
      case "jpeg":
        chart.exportChart({ type: "image/jpeg" })
        break
      case "pdf":
        chart.exportChart({ type: "application/pdf" })
        break
      case "svg":
        chart.exportChart({ type: "image/svg+xml" })
        break
      case "csv":
        chart.downloadCSV()
        break
      case "xls":
        chart.downloadXLS()
        break
    }
  }

  // Chart options
  const getSunburstOptions = (): Highcharts.Options => ({
    chart: {
      type: undefined, // Required for sunburst
      backgroundColor: "transparent",
      height: height,
      events: {
        fullscreenOpen: function () {
          const currentIsDark =
            document.documentElement.classList.contains("dark")
          this.update(
            {
              chart: {
                backgroundColor: currentIsDark ? "#111827" : "#ffffff",
              },
            },
            false,
          )
        },
        fullscreenClose: function () {
          // No need to update - chart returns to normal state automatically
        },
      },
    },
    title: {
      text: undefined,
    },
    credits: {
      enabled: false,
    },
    exporting: {
      buttons: {
        contextButton: {
          enabled: false, // Disable default button - using custom export button instead
        },
      },
    },
    series: [
      {
        type: "sunburst",
        name: "Holdings",
        data: transformToSunburstData(),
        allowTraversingTree: true,
        cursor: "pointer",
        dataLabels: {
          format: "{point.name}",
          filter: {
            property: "innerArcLength",
            operator: ">",
            value: 16,
          },
          style: {
            fontSize: "14px",
            fontWeight: "600",
            textOutline: "none",
          },
        },
        borderRadius: 3,
        borderWidth: 2,
        borderColor: isDark ? "#374151" : "#e5e7eb",
        levels: [
          {
            level: 1,
            levelIsConstant: false,
            dataLabels: {
              filter: {
                property: "outerArcLength",
                operator: ">",
                value: 64,
              },
            },
          },
          {
            level: 2,
            colorByPoint: true,
          },
          {
            level: 3,
            colorVariation: {
              key: "brightness",
              to: -0.5,
            },
          },
          {
            level: 4,
            colorVariation: {
              key: "brightness",
              to: 0.5,
            },
          },
        ],
        breadcrumbs: {
          floating: false,
          position: {
            align: "left",
            verticalAlign: "top",
          },
          format: "{level.name}",
          buttonTheme: {
            fill: "transparent",
            style: {
              color: isDark ? "#f3f4f6" : "#111827",
            },
            states: {
              hover: {
                fill: isDark ? "#1f2937" : "#f3f4f6",
                style: {
                  color: isDark ? "#f9fafb" : "#111827",
                },
              },
              select: {
                style: {
                  color: isDark ? "#f3f4f6" : "#111827",
                },
              },
            },
          },
          separator: {
            style: {
              color: isDark ? "#9ca3af" : "#6b7280",
            },
          },
          style: {
            color: isDark ? "#f3f4f6" : "#111827",
          },
        },
      } as Highcharts.SeriesSunburstOptions,
    ],
    tooltip: {
      useHTML: true,
      headerFormat: "",
      backgroundColor: isDark ? "#1f2937" : "#ffffff",
      borderColor: isDark ? "#4b5563" : "#e5e7eb",
      borderRadius: 6,
      borderWidth: 1,
      shadow: {
        color: "rgba(0, 0, 0, 0.1)",
        offsetX: 0,
        offsetY: 2,
        opacity: 0.1,
        width: 3,
      },
      style: {
        color: isDark ? "#f3f4f6" : "#111827",
        fontSize: "12px",
      },
      pointFormatter: function () {
        const point = this as any
        const value = point.value || 0
        const percentage = ((value / totalValue) * 100).toFixed(1)
        const ticker = point.ticker || point.name
        const fullName = point.fullName || ""

        return `<div style="padding: 2px;">
                  <div style="font-weight: 600; margin-bottom: 4px;">${ticker}</div>
                  ${fullName ? `<div style="font-size: 11px; color: ${isDark ? "#9ca3af" : "#6b7280"}">${fullName}</div>` : ""}
                  <div>Value: <b>${formatValue(value)}</b></div>
                  <div>Portfolio: <b>${percentage}%</b></div>
                </div>`
      },
    },
  })

  // Chart options for pie
  const getPieOptions = (): Highcharts.Options => ({
    chart: {
      type: "pie",
      backgroundColor: "transparent",
      height: height,
      events: {
        fullscreenOpen: function () {
          const currentIsDark =
            document.documentElement.classList.contains("dark")
          this.update(
            {
              chart: {
                backgroundColor: currentIsDark ? "#111827" : "#ffffff",
              },
            },
            false,
          )
        },
        fullscreenClose: function () {
          // No need to update - chart returns to normal state automatically
        },
      },
    },
    title: {
      text: undefined,
    },
    credits: {
      enabled: false,
    },
    exporting: {
      buttons: {
        contextButton: {
          enabled: false,
        },
      },
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: "pointer",
        borderColor: isDark ? "#1f2937" : "#f3f4f6",
        borderWidth: 2,
        dataLabels: {
          enabled: true,
          format: "<b>{point.name}</b>: {point.percentage:.1f}%",
          style: {
            color: isDark ? "#f3f4f6" : "#111827",
            fontSize: "12px",
            fontWeight: "500",
          },
        },
        showInLegend: false,
      },
    },
    series: [
      {
        type: "pie",
        name: "Holdings",
        data: transformToPieData(),
      } as Highcharts.SeriesPieOptions,
    ],
    tooltip: {
      useHTML: true,
      headerFormat: "",
      backgroundColor: isDark ? "#1f2937" : "#ffffff",
      borderColor: isDark ? "#4b5563" : "#e5e7eb",
      borderRadius: 6,
      borderWidth: 1,
      style: {
        color: isDark ? "#f3f4f6" : "#111827",
        fontSize: "12px",
      },
      pointFormatter: function () {
        const point = this as any
        const value = point.y || 0
        const percentage = ((value / totalValue) * 100).toFixed(1)
        const name = point.name
        const ticker = point.ticker
        const fullName = point.fullName

        return `<div style="padding: 2px;">
                  <div style="font-weight: 600; margin-bottom: 4px;">${name}</div>
                  ${fullName && name !== fullName ? `<div style="font-size: 11px; color: ${isDark ? "#9ca3af" : "#6b7280"}">${fullName}</div>` : ""}
                  <div>Value: <b>${formatValue(value)}</b></div>
                  <div>Portfolio: <b>${percentage}%</b></div>
                </div>`
      },
    },
  })

  // Get the appropriate chart options based on chart type
  const getChartOptions = () => {
    switch (chartType) {
      case "pie":
        return getPieOptions()
      default:
        return getSunburstOptions()
    }
  }

  const options = useMemo(() => {
    return getChartOptions()
  }, [
    chartType,
    isDark,
    height,
    selectedAccount,
    groupingMode,
    filteredHoldings,
  ])

  if (!isClient || !modulesLoaded) {
    return (
      <Card className="pb-4 pt-6">
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-sm text-gray-500">Loading chart...</div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="pb-4 pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-gray-900 dark:text-gray-50">
          Holdings hierarchy
        </h3>
        <div className="flex items-center gap-2">
          {/* Account Selector */}
          {/* <DropdownMenu>
            <Tooltip triggerAsChild content="Select account to view holdings">
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  className="h-9 w-[280px] justify-between"
                >
                  <span className="flex items-center gap-2">
                    {selectedAccount === "all" ? (
                      <>All Accounts</>
                    ) : (
                      <>
                        {(() => {
                          const account = accounts.find(
                            (a) => a.id === selectedAccount,
                          )
                          return account ? account.name : "Select Account"
                        })()}
                      </>
                    )}
                  </span>
                  <RiExpandUpDownLine className="size-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
            </Tooltip>
            <DropdownMenuContent className="w-[280px]">
              <DropdownMenuLabel>ACCOUNT</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={selectedAccount}
                onValueChange={(value) => {
                  setSelectedAccount(value)
                  onAccountChange?.(value)
                }}
              >
                <DropdownMenuRadioItem value="all" iconType="check">
                  All Accounts
                </DropdownMenuRadioItem>
                {accounts.map((account) => (
                  <DropdownMenuRadioItem
                    key={account.id}
                    value={account.id}
                    iconType="check"
                  >
                    <span className="flex items-center gap-2">
                      <InstitutionLogo
                        institution={account.institution}
                        className="h-5 w-5"
                      />
                      {account.name}
                    </span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu> */}

          {/* Group By Dropdown */}
          {/* <DropdownMenu>
              <Tooltip triggerAsChild content="Group holdings by account, type, or show all">
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    className="h-9 w-[180px] justify-between"
                  >
                    <span>
                      {groupingMode === "none" ? "None" :
                       groupingMode === "account" ? "Account" :
                       groupingMode === "type" ? "Type" : "Account + Type"}
                    </span>
                    <RiExpandUpDownLine className="size-4" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
              </Tooltip>
              <DropdownMenuContent>
                <DropdownMenuLabel>GROUP BY</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {chartType === "sunburst" ? (
                  // Sunburst: checkboxes for multi-select (at least one must be selected)
                  <>
                    <DropdownMenuCheckboxItem
                      checked={sunburstGrouping.includes("account")}
                      disabled={selectedAccount !== "all"}
                      onCheckedChange={(checked) => {
                        const typeChecked = sunburstGrouping.includes("type")
                        if (checked) {
                          // Check Account
                          if (typeChecked) {
                            setSunburstGrouping("account-type")
                          } else {
                            setSunburstGrouping("account")
                          }
                        } else {
                          // Uncheck Account - only allow if Type is checked
                          if (typeChecked) {
                            setSunburstGrouping("type")
                          }
                          // If Type is not checked, don't allow unchecking Account
                        }
                      }}
                    >
                      Account
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={sunburstGrouping.includes("type")}
                      onCheckedChange={(checked) => {
                        const accountChecked = sunburstGrouping.includes("account")
                        if (checked) {
                          // Check Type
                          if (accountChecked) {
                            setSunburstGrouping("account-type")
                          } else {
                            setSunburstGrouping("type")
                          }
                        } else {
                          // Uncheck Type - only allow if Account is checked
                          if (accountChecked) {
                            setSunburstGrouping("account")
                          }
                          // If Account is not checked, don't allow unchecking Type
                        }
                      }}
                    >
                      Type
                    </DropdownMenuCheckboxItem>
                  </>
                ) : (
                  // Pie: radio buttons for single-select
                  <DropdownMenuRadioGroup
                    value={pieGrouping}
                    onValueChange={(value) => setPieGrouping(value as GroupingMode)}
                  >
                    <DropdownMenuRadioItem value="none" iconType="check">
                      None
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                      value="account"
                      iconType="check"
                      disabled={selectedAccount !== "all"}
                    >
                      Account
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="type" iconType="check">
                      Type
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                )}
              </DropdownMenuContent>
            </DropdownMenu> */}

          {/* Chart Type Toggle */}
          {/* <Tooltip
            triggerAsChild
            content="Switch between sunburst and pie chart"
          >
            <Button
              variant="secondary"
              onClick={() =>
                setChartType(chartType === "sunburst" ? "pie" : "sunburst")
              }
              className="h-9"
            >
              {chartType === "sunburst" ? (
                <RiPieChart2Line className="size-4" aria-hidden="true" />
              ) : (
                <RiSunLine className="size-4" aria-hidden="true" />
              )}
            </Button>
          </Tooltip> */}

          {/* Export Menu */}
          <DropdownMenu>
            <Tooltip
              triggerAsChild
              content="Export chart as image or data file"
            >
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="h-9">
                  <RiDownloadLine className="size-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>EXPORT OPTIONS</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport("print")}>
                Print chart
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport("png")}>
                Download PNG image
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("jpeg")}>
                Download JPEG image
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                Download PDF document
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("svg")}>
                Download SVG vector
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                Download CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("xls")}>
                Download XLS
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Fullscreen Button */}
          <Tooltip triggerAsChild content="View chart in fullscreen mode">
            <Button
              variant="secondary"
              onClick={() => handleExport("fullscreen")}
              className="h-9"
            >
              <RiFullscreenLine className="size-4" aria-hidden="true" />
            </Button>
          </Tooltip>
        </div>
      </div>

      <div className="mt-4">
        {filteredHoldings.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                No holdings found
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {selectedAccount === "all"
                  ? "Add holdings to see them here"
                  : "This account has no holdings"}
              </p>
            </div>
          </div>
        ) : (
          <HighchartsReact
            highcharts={Highcharts}
            options={options}
            ref={chartRef}
          />
        )}
      </div>

      {/* Custom Legend */}
      {topGroups.length > 0 && (
        <div className="mt-4">
          <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            {groupingMode === "none"
              ? "Top Holdings"
              : groupingMode === "type"
                ? "Asset Types"
                : groupingMode === "account-type"
                  ? "Accounts"
                  : selectedAccount === "all"
                    ? "Accounts"
                    : "Account"}
          </p>
          <ul className="flex flex-wrap gap-x-10 gap-y-4 text-sm">
            {topGroups.map(([name, value], index) => (
              <li key={name}>
                <span className="text-base font-semibold text-gray-900 dark:text-gray-50">
                  {getLegendDisplayValue(value)}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-sm"
                    style={{
                      backgroundColor: getGroupColor(name, index),
                    }}
                  />
                  <span className="text-sm">{name}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}
