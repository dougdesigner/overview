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
import { institutionLabels } from "@/lib/institutionUtils"
import {
  RiDonutChartLine,
  RiDownloadLine,
  RiFullscreenLine,
  RiSunLine,
} from "@remixicon/react"
import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"
import HighchartsSunburst from "highcharts/modules/sunburst"
import HighchartsDrilldown from "highcharts/modules/drilldown"
import HighchartsExporting from "highcharts/modules/exporting"
import HighchartsExportData from "highcharts/modules/export-data"
import { useTheme } from "next-themes"
import { useEffect, useMemo, useRef, useState } from "react"

// Track if modules are initialized globally to prevent duplicate initialization
let modulesInitialized = false

// Type assertion for module initialization functions
type HighchartsModule = (H: typeof Highcharts) => void

// Chart and control types
type ChartType = "drilldown" | "sunburst" | "pie"
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

  // Responsive height: 350 on mobile (<640px), use prop height on desktop
  const [responsiveHeight, setResponsiveHeight] = useState(height)
  // Hide data labels - rely on legend and tooltips
  const [showDataLabels, setShowDataLabels] = useState(false)

  useEffect(() => {
    const updateResponsive = () => {
      const isMobile = window.innerWidth < 640
      setResponsiveHeight(isMobile ? 350 : height)
    }
    updateResponsive()
    window.addEventListener("resize", updateResponsive)
    return () => window.removeEventListener("resize", updateResponsive)
  }, [height])

  // Control states
  const [chartType, setChartType] = useState<ChartType>("pie")
  const [sunburstGrouping, setSunburstGrouping] =
    useState<GroupingMode>("account")
  const [pieGrouping, setPieGrouping] = useState<GroupingMode>("account")
  const [selectedAccount, setSelectedAccount] =
    useState<string>(selectedAccountId)

  // Sync internal state with prop when it changes from parent
  useEffect(() => {
    setSelectedAccount(selectedAccountId)
  }, [selectedAccountId])

  // Track the currently drilled-down node for legend updates
  const [drilledNodeId, setDrilledNodeId] = useState<string | null>(null)

  // Active grouping mode based on chart type
  const groupingMode = chartType === "sunburst" ? sunburstGrouping : pieGrouping

  // Initialize Highcharts modules on client-side
  useEffect(() => {
    if (!modulesInitialized && typeof Highcharts === "object") {
      try {
        // Cast modules to callable functions
        const sunburstInit = HighchartsSunburst as unknown as HighchartsModule
        const drilldownInit = HighchartsDrilldown as unknown as HighchartsModule
        const exportingInit = HighchartsExporting as unknown as HighchartsModule
        const exportDataInit = HighchartsExportData as unknown as HighchartsModule

        if (typeof sunburstInit === "function") {
          sunburstInit(Highcharts)
        }
        if (typeof drilldownInit === "function") {
          drilldownInit(Highcharts)
        }
        if (typeof exportingInit === "function") {
          exportingInit(Highcharts)
        }
        if (typeof exportDataInit === "function") {
          exportDataInit(Highcharts)
        }
        modulesInitialized = true
      } catch (e) {
        // Modules may already be initialized
        console.log("Highcharts modules initialization:", e)
      }
    }
    setIsClient(true)
    setModulesLoaded(true)
  }, [])

  // Reset drilled state when chart type or selected account changes
  useEffect(() => {
    setDrilledNodeId(null)
  }, [chartType, selectedAccount])

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

  // Get display name for institution (converts internal key to label)
  const getInstitutionDisplayName = (institutionKey: string): string => {
    return institutionLabels[institutionKey] || institutionKey
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

    // For sunburst charts, show different items based on drill level
    if (chartType === "sunburst") {
      // Determine what level we're at based on drilledNodeId
      if (!drilledNodeId || drilledNodeId === "portfolio") {
        // At root - show institutions
        const institutionGroups = new Map<string, number>()
        filteredHoldings.forEach((h) => {
          const account = accounts.find((a) => a.id === h.accountId)
          const institution = account?.institution || "Unknown"
          const current = institutionGroups.get(institution) || 0
          institutionGroups.set(institution, current + h.marketValue)
        })

        return Array.from(institutionGroups.entries())
          .filter(([_, value]) => value > 0)
          .sort((a, b) => b[1] - a[1])
          .map(([name, value]) => [getInstitutionDisplayName(name), value] as [string, number])
      } else if (drilledNodeId.startsWith("inst-") && !drilledNodeId.includes("-account-")) {
        // Drilled into an institution - show accounts for that institution
        const institutionKey = drilledNodeId.replace("inst-", "")
        const accountGroups = new Map<string, { name: string; value: number }>()

        filteredHoldings.forEach((h) => {
          const account = accounts.find((a) => a.id === h.accountId)
          if (account?.institution === institutionKey) {
            if (!accountGroups.has(h.accountId)) {
              accountGroups.set(h.accountId, { name: h.accountName, value: 0 })
            }
            accountGroups.get(h.accountId)!.value += h.marketValue
          }
        })

        return Array.from(accountGroups.entries())
          .map(([_, group]) => [group.name, group.value] as [string, number])
          .filter(([_, value]) => value > 0)
          .sort((a, b) => b[1] - a[1])
      } else if (drilledNodeId.includes("-account-")) {
        // Drilled into an account - show holdings for that account
        const accountId = drilledNodeId.split("-account-")[1]

        return filteredHoldings
          .filter((h) => h.accountId === accountId)
          .sort((a, b) => b.marketValue - a.marketValue)
          .map((h) => [h.ticker || h.name, h.marketValue] as [string, number])
      }
    }

    // For drilldown charts, show institutions
    if (chartType === "drilldown") {
      const institutionGroups = new Map<string, number>()
      filteredHoldings.forEach((h) => {
        const account = accounts.find((a) => a.id === h.accountId)
        const institution = account?.institution || "Unknown"
        const current = institutionGroups.get(institution) || 0
        institutionGroups.set(institution, current + h.marketValue)
      })

      return Array.from(institutionGroups.entries())
        .filter(([_, value]) => value > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => [getInstitutionDisplayName(name), value] as [string, number])
    }

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
  }, [filteredHoldings, groupingMode, chartType, accounts, drilledNodeId])

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
      // Group by institution → account → holdings (4-level hierarchy)
      const institutionMap = new Map<
        string,
        {
          name: string
          totalValue: number
          accounts: Map<
            string,
            {
              id: string
              name: string
              totalValue: number
              holdings: Holding[]
            }
          >
        }
      >()

      filteredHoldings.forEach((holding) => {
        const account = accounts.find((a) => a.id === holding.accountId)
        const institution = account?.institution || "Unknown"
        const accountId = holding.accountId
        const accountName = holding.accountName

        // Initialize institution if needed
        if (!institutionMap.has(institution)) {
          institutionMap.set(institution, {
            name: institution,
            totalValue: 0,
            accounts: new Map(),
          })
        }

        const inst = institutionMap.get(institution)!
        inst.totalValue += holding.marketValue

        // Initialize account within institution if needed
        if (!inst.accounts.has(accountId)) {
          inst.accounts.set(accountId, {
            id: accountId,
            name: accountName,
            totalValue: 0,
            holdings: [],
          })
        }

        const acct = inst.accounts.get(accountId)!
        acct.totalValue += holding.marketValue
        acct.holdings.push(holding)
      })

      // Build sunburst data: Portfolio → Institution → Account → Holdings
      // Sort institutions by value
      const sortedInstitutions = Array.from(institutionMap.entries()).sort(
        (a, b) => b[1].totalValue - a[1].totalValue,
      )

      sortedInstitutions.forEach(([instKey, inst], instIndex) => {
        const instNodeId = `inst-${instKey}`
        const instColor = colors[instIndex % colors.length]

        // Add institution node
        data.push({
          id: instNodeId,
          parent: "portfolio",
          name: getInstitutionDisplayName(inst.name),
          value: inst.totalValue,
          color: instColor,
        })

        // Sort accounts within institution
        const sortedAccounts = Array.from(inst.accounts.entries()).sort(
          (a, b) => b[1].totalValue - a[1].totalValue,
        )

        sortedAccounts.forEach(([acctId, acct]) => {
          const accountNodeId = `${instNodeId}-account-${acctId}`

          // Add account node under institution
          data.push({
            id: accountNodeId,
            parent: instNodeId,
            name: acct.name,
            value: acct.totalValue,
          })

          // Add holdings under account
          acct.holdings.forEach((holding) => {
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
        })
      })
    }

    return data
  }

  interface PieDataPoint {
    name: string
    y: number
    color: string
    ticker?: string
    fullName?: string
    accountName?: string
    marketValue?: number
  }

  // Transform holdings data to pie format
  const transformToPieData = () => {
    const data: PieDataPoint[] = []

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

  // Transform holdings data to drilldown format (3 levels: Institution → Account → Holdings)
  const transformToDrilldownData = () => {
    // Group accounts by institution, then holdings by account
    const institutionMap = new Map<
      string,
      {
        name: string
        totalValue: number
        accounts: Map<
          string,
          {
            id: string
            name: string
            totalValue: number
            holdings: Holding[]
          }
        >
      }
    >()

    filteredHoldings.forEach((holding) => {
      const account = accounts.find((a) => a.id === holding.accountId)
      const institution = account?.institution || "Unknown"
      const accountId = holding.accountId
      const accountName = holding.accountName

      // Initialize institution if needed
      if (!institutionMap.has(institution)) {
        institutionMap.set(institution, {
          name: institution,
          totalValue: 0,
          accounts: new Map(),
        })
      }

      const inst = institutionMap.get(institution)!
      inst.totalValue += holding.marketValue

      // Initialize account within institution if needed
      if (!inst.accounts.has(accountId)) {
        inst.accounts.set(accountId, {
          id: accountId,
          name: accountName,
          totalValue: 0,
          holdings: [],
        })
      }

      const acct = inst.accounts.get(accountId)!
      acct.totalValue += holding.marketValue
      acct.holdings.push(holding)
    })

    // Create top-level series data (institutions)
    const seriesData: Array<{
      name: string
      y: number
      drilldown: string
      color: string
    }> = []

    // Create drilldown series (accounts per institution + holdings per account)
    const drilldownSeries: Array<{
      id: string
      name: string
      type?: string
      data: Array<{ name: string; y: number; drilldown?: string; color?: string }>
    }> = []

    // Sort institutions by total value for consistent color assignment
    const sortedInstitutions = Array.from(institutionMap.entries()).sort(
      (a, b) => b[1].totalValue - a[1].totalValue
    )

    sortedInstitutions.forEach(([instKey, inst], colorIndex) => {
      const color = colors[colorIndex % colors.length]

      // Level 1: Institution slice
      seriesData.push({
        name: getInstitutionDisplayName(inst.name),
        y: inst.totalValue,
        drilldown: `inst-${instKey}`,
        color: color,
      })

      // Level 2: Accounts within this institution
      const accountsData: Array<{ name: string; y: number; drilldown: string }> =
        []

      // Sort accounts by value
      const sortedAccounts = Array.from(inst.accounts.entries()).sort(
        (a, b) => b[1].totalValue - a[1].totalValue
      )

      sortedAccounts.forEach(([acctId, acct]) => {
        accountsData.push({
          name: acct.name,
          y: acct.totalValue,
          drilldown: `acct-${acctId}`,
        })

        // Level 3: Holdings within this account
        const holdingsData = acct.holdings
          .sort((a, b) => b.marketValue - a.marketValue)
          .map((h) => ({
            name: h.ticker || h.name,
            y: h.marketValue,
          }))

        drilldownSeries.push({
          id: `acct-${acctId}`,
          name: acct.name,
          data: holdingsData,
        })
      })

      drilldownSeries.push({
        id: `inst-${instKey}`,
        name: inst.name,
        data: accountsData,
      })
    })

    return { seriesData, drilldownSeries }
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
      height: responsiveHeight,
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
        render: function () {
          // Sync legend with current root node after any chart update
          // This fires after breadcrumb navigation and all other updates
          const chart = this as any
          const series = chart.series?.[0]
          if (series) {
            const rootNode = series.rootNode || ""
            const newDrilledId =
              rootNode === "" || rootNode === "portfolio" ? null : rootNode
            // Only update if different to avoid infinite loops
            setDrilledNodeId((prev: string | null) =>
              prev !== newDrilledId ? newDrilledId : prev
            )
          }
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
          enabled: showDataLabels,
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
        fontSize: "14px",
      },
      pointFormatter: function () {
        const point = this as any
        const value = point.value || 0
        const percentage = ((value / totalValue) * 100).toFixed(1)
        const ticker = point.ticker || point.name
        const fullName = point.fullName || ""

        return `<div style="padding: 2px; font-size: 14px;">
                  <div style="font-weight: 600; margin-bottom: 4px;">${ticker}</div>
                  ${fullName ? `<div style="font-size: 12px; color: ${isDark ? "#9ca3af" : "#6b7280"}">${fullName}</div>` : ""}
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
      height: responsiveHeight,
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
        innerSize: "60%",
        borderRadius: 4,
        borderColor: isDark ? "#1f2937" : "#f3f4f6",
        borderWidth: 2,
        dataLabels: {
          enabled: showDataLabels,
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
        fontSize: "14px",
      },
      pointFormatter: function () {
        const point = this as any
        const value = point.y || 0
        const percentage = ((value / totalValue) * 100).toFixed(1)
        const name = point.name
        const ticker = point.ticker
        const fullName = point.fullName

        return `<div style="padding: 2px; font-size: 14px;">
                  <div style="font-weight: 600; margin-bottom: 4px;">${name}</div>
                  ${fullName && name !== fullName ? `<div style="font-size: 12px; color: ${isDark ? "#9ca3af" : "#6b7280"}">${fullName}</div>` : ""}
                  <div>Value: <b>${formatValue(value)}</b></div>
                  <div>Portfolio: <b>${percentage}%</b></div>
                </div>`
      },
    },
  })

  // Chart options for drilldown (3 levels: Institution → Account → Holdings)
  const getDrilldownOptions = (): Highcharts.Options => {
    const { seriesData, drilldownSeries } = transformToDrilldownData()

    return {
      chart: {
        type: "pie",
        backgroundColor: "transparent",
        height: responsiveHeight,
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
      accessibility: {
        announceNewData: { enabled: true },
        point: { valueSuffix: "%" },
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: "pointer",
          borderRadius: 5,
          borderWidth: 2,
          borderColor: isDark ? "#1f2937" : "#ffffff",
          dataLabels: {
            enabled: false,
          },
          showInLegend: false,
        },
        series: {
          dataLabels: {
            enabled: false,
          },
        },
      },
      tooltip: {
        useHTML: true,
        headerFormat: '<span style="font-size:14px">{series.name}</span><br>',
        pointFormat:
          '<span style="color:{point.color}; font-size:14px">{point.name}</span>: ' +
          "<b>${point.y:,.0f}</b> ({point.percentage:.1f}%)<br/>",
        backgroundColor: isDark ? "#1f2937" : "#ffffff",
        borderColor: isDark ? "#4b5563" : "#e5e7eb",
        borderRadius: 6,
        borderWidth: 1,
        style: {
          color: isDark ? "#f3f4f6" : "#111827",
          fontSize: "14px",
        },
      },
      series: [
        {
          type: "pie",
          name: "Institutions",
          colorByPoint: true,
          data: seriesData,
        } as Highcharts.SeriesPieOptions,
      ],
      drilldown: {
        activeAxisLabelStyle: {
          textDecoration: "none",
          color: isDark ? "#f3f4f6" : "#111827",
        },
        activeDataLabelStyle: {
          textDecoration: "none",
          color: isDark ? "#f3f4f6" : "#111827",
        },
        breadcrumbs: {
          position: { align: "right" },
          buttonTheme: {
            fill: isDark ? "#374151" : "#f3f4f6",
            style: {
              color: isDark ? "#f3f4f6" : "#111827",
            },
            states: {
              hover: {
                fill: isDark ? "#4b5563" : "#e5e7eb",
              },
            },
          },
        },
        series: drilldownSeries as Highcharts.SeriesPieOptions[],
      },
      exporting: {
        buttons: {
          contextButton: {
            enabled: false,
          },
        },
      },
    }
  }

  // Get the appropriate chart options based on chart type
  const getChartOptions = () => {
    switch (chartType) {
      case "pie":
        return getPieOptions()
      case "drilldown":
        return getDrilldownOptions()
      default:
        return getSunburstOptions()
    }
  }

  const options = useMemo(() => {
    return getChartOptions()
  }, [
    chartType,
    isDark,
    responsiveHeight,
    selectedAccount,
    groupingMode,
    filteredHoldings,
    showDataLabels,
  ])

  if (!isClient || !modulesLoaded) {
    return (
      <Card className="pb-4 pt-6">
        <div className="flex items-center justify-center" style={{ height: responsiveHeight }}>
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
          <Tooltip
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
                <RiDonutChartLine className="size-4" aria-hidden="true" />
              ) : (
                <RiSunLine className="size-4" aria-hidden="true" />
              )}
            </Button>
          </Tooltip>

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
          <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-gray-700" style={{ height: responsiveHeight }}>
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
            {chartType === "sunburst"
              ? !drilledNodeId || drilledNodeId === "portfolio"
                ? "Institutions"
                : drilledNodeId.includes("-account-")
                  ? "Holdings"
                  : "Accounts"
              : chartType === "drilldown"
                ? "Institutions"
                : groupingMode === "none"
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
            {topGroups.map(([name, value], index) => {
              // Only show color blocks at root level where colors match the chart
              const isAtRootLevel = !drilledNodeId || drilledNodeId === "portfolio"

              return (
                <li key={`${name}-${index}`}>
                  <span className="text-base font-semibold text-gray-900 dark:text-gray-50">
                    {getLegendDisplayValue(value)}
                  </span>
                  <div className="flex items-center gap-2">
                    {isAtRootLevel && (
                      <span
                        className="size-2.5 shrink-0 rounded-sm"
                        style={{
                          backgroundColor: getGroupColor(name, index),
                        }}
                      />
                    )}
                    <span className="text-sm">{name}</span>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </Card>
  )
}
