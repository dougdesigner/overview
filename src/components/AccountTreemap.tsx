"use client"

import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"
import HighchartsTreemap from "highcharts/modules/treemap"
import HighchartsExporting from "highcharts/modules/exporting"
import HighchartsExportData from "highcharts/modules/export-data"
import { useTheme } from "next-themes"
import { useEffect, useRef, useState, useMemo, useCallback, RefObject } from "react"
// Format large numbers with K/M suffixes
const formatSI = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

// Type for Highcharts module initializers
type HighchartsModule = (H: typeof Highcharts) => void

// Initialize modules only when Highcharts is loaded as an object
if (typeof Highcharts === "object") {
  // Cast modules to callable functions before checking and calling
  const treemapInit = HighchartsTreemap as unknown as HighchartsModule
  const exportingInit = HighchartsExporting as unknown as HighchartsModule
  const exportDataInit = HighchartsExportData as unknown as HighchartsModule

  if (typeof treemapInit === "function") {
    treemapInit(Highcharts)
  }
  if (typeof exportingInit === "function") {
    exportingInit(Highcharts)
  }
  if (typeof exportDataInit === "function") {
    exportDataInit(Highcharts)
  }
}

export type AccountGrouping = "institution" | "type" | "institution-type"
export type AccountDisplayValue = "value" | "allocation" | "none"

// TreemapPoint interface for Highcharts data
interface TreemapPoint {
  id: string
  name: string
  parent?: string
  value: number
  color?: string
  institution?: string
  accountType?: string
  allocation?: number
}

interface AccountTreemapProps {
  accounts: Array<{
    id: string
    name: string
    institution: string
    institutionLabel: string
    accountType: string
    accountTypeLabel: string
    totalValue: number
    assetAllocation: {
      usStocks: number
      nonUsStocks: number
      fixedIncome: number
      cash: number
    }
  }>
  selectedAccounts?: string[] // Filter by specific accounts
  groupBy?: AccountGrouping
  displayValue?: AccountDisplayValue
  height?: number
  chartRef?: RefObject<HighchartsReact.RefObject>
}

// Bright color palette matching exposure treemap
const colors = [
  "#3b82f6",  // bright blue
  "#10b981",  // bright green
  "#8b5cf6",  // bright purple
  "#f59e0b",  // bright amber
  "#ec4899",  // bright pink
  "#06b6d4",  // bright cyan
  "#f97316",  // bright orange
  "#84cc16",  // bright lime
]

export default function AccountTreemap({
  accounts,
  selectedAccounts,
  groupBy = "institution",
  displayValue = "value",
  height = 400,
  chartRef: externalChartRef,
}: AccountTreemapProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const internalChartRef = useRef<HighchartsReact.RefObject>(null)
  const chartRef = externalChartRef || internalChartRef
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Filter accounts based on selection
  const filteredAccounts = useMemo(() => {
    if (!selectedAccounts || selectedAccounts.length === 0) {
      return accounts
    }
    return accounts.filter(account => selectedAccounts.includes(account.id))
  }, [accounts, selectedAccounts])

  // Dynamic color assignment function
  const getGroupColor = useCallback((groupName: string, groupType: 'institution' | 'type' | 'both'): string => {
    // Get all groups and sort by total value for consistent color assignment
    const groups = new Map<string, number>()
    filteredAccounts.forEach(account => {
      let group: string
      if (groupType === 'institution') {
        group = account.institutionLabel
      } else if (groupType === 'type') {
        group = account.accountTypeLabel
      } else {
        // For 'both', use institution as primary grouping
        group = account.institutionLabel
      }
      groups.set(group, (groups.get(group) || 0) + account.totalValue)
    })

    const sortedGroups = Array.from(groups.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name)

    const index = sortedGroups.indexOf(groupName)
    return colors[index % colors.length]
  }, [filteredAccounts])

  // Transform data for treemap
  const treemapData = useMemo(() => {
    // Calculate total portfolio value
    const totalValue = filteredAccounts.reduce(
      (sum, account) => sum + account.totalValue,
      0
    )

    if (totalValue === 0) {
      return []
    }

    // Group data based on groupBy setting
    if (groupBy === "institution") {
      // Group by institution only
      const institutionGroups = new Map<string, typeof filteredAccounts>()

      filteredAccounts.forEach(account => {
        const institution = account.institutionLabel
        if (!institutionGroups.has(institution)) {
          institutionGroups.set(institution, [])
        }
        institutionGroups.get(institution)!.push(account)
      })

      const data: TreemapPoint[] = []
      institutionGroups.forEach((accounts, institution) => {
        const institutionTotal = accounts.reduce((sum, acc) => sum + acc.totalValue, 0)

        // Add institution parent
        data.push({
          id: institution,
          name: institution,
          parent: undefined,
          value: institutionTotal,
          color: getGroupColor(institution, 'institution'),
        })

        // Add accounts as children
        accounts.forEach(account => {
          data.push({
            id: account.id,
            name: account.name,
            parent: institution,
            value: account.totalValue,
            institution: institution,
            accountType: account.accountTypeLabel,
            allocation: (account.totalValue / totalValue) * 100,
          })
        })
      })

      return data
    } else if (groupBy === "type") {
      // Group by account type only
      const typeGroups = new Map<string, typeof filteredAccounts>()

      filteredAccounts.forEach(account => {
        const accountType = account.accountTypeLabel
        if (!typeGroups.has(accountType)) {
          typeGroups.set(accountType, [])
        }
        typeGroups.get(accountType)!.push(account)
      })

      const data: TreemapPoint[] = []
      typeGroups.forEach((accounts, accountType) => {
        const typeTotal = accounts.reduce((sum, acc) => sum + acc.totalValue, 0)

        // Add account type parent
        data.push({
          id: accountType,
          name: accountType,
          parent: undefined,
          value: typeTotal,
          color: getGroupColor(accountType, 'type'),
        })

        // Add accounts as children
        accounts.forEach(account => {
          data.push({
            id: account.id,
            name: account.name,
            parent: accountType,
            value: account.totalValue,
            institution: account.institutionLabel,
            accountType: accountType,
            allocation: (account.totalValue / totalValue) * 100,
          })
        })
      })

      return data
    } else {
      // Group by institution and then type
      const institutionGroups = new Map<string, Map<string, typeof filteredAccounts>>()

      filteredAccounts.forEach(account => {
        const institution = account.institutionLabel
        const accountType = account.accountTypeLabel

        if (!institutionGroups.has(institution)) {
          institutionGroups.set(institution, new Map())
        }
        if (!institutionGroups.get(institution)!.has(accountType)) {
          institutionGroups.get(institution)!.set(accountType, [])
        }
        institutionGroups.get(institution)!.get(accountType)!.push(account)
      })

      const data: any[] = []
      institutionGroups.forEach((typeGroups, institution) => {
        const institutionTotal = Array.from(typeGroups.values())
          .flat()
          .reduce((sum, acc) => sum + acc.totalValue, 0)

        // Add institution parent
        data.push({
          id: institution,
          name: institution,
          parent: undefined,
          value: institutionTotal,
          color: getGroupColor(institution, 'both'),
          drillUpButton: false,
        })

        // Add account types as mid-level
        typeGroups.forEach((accounts, accountType) => {
          const typeTotal = accounts.reduce((sum, acc) => sum + acc.totalValue, 0)
          const typeId = `${institution}-${accountType}`

          data.push({
            id: typeId,
            name: accountType,
            parent: institution,
            value: typeTotal,
          })

          // Add accounts as children
          accounts.forEach(account => {
            data.push({
              id: account.id,
              name: account.name,
              parent: typeId,
              value: account.totalValue,
              institution: institution,
              accountType: accountType,
              allocation: (account.totalValue / totalValue) * 100,
            })
          })
        })
      })

      return data
    }
  }, [filteredAccounts, groupBy, getGroupColor])

  // Create chart options
  const options: Highcharts.Options = useMemo(() => ({
    chart: {
      type: "treemap",
      backgroundColor: "transparent",
      height: height,
      margin: [0, 0, 0, 0],
      events: {
        fullscreenOpen: function(this: Highcharts.Chart) {
          // Read theme from DOM to get current theme state
          const currentIsDark = document.documentElement.classList.contains('dark')

          // Update chart background for fullscreen
          this.update({
            chart: {
              backgroundColor: currentIsDark ? "#111827" : "#ffffff"
            }
          })
        },
        fullscreenClose: function() {
          // No need to update - chart returns to normal state automatically
        }
      },
      style: {
        fontFamily: "inherit",
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
        type: "treemap",
        name: "Portfolio",
        layoutAlgorithm: "strip",
        alternateStartingDirection: true,
        allowTraversingTree: true,
        animationLimit: 1000,
        borderRadius: 3,
        levels: [
          {
            level: 1,
            layoutAlgorithm: "squarified",
            dataLabels: {
              enabled: true,
              headers: true,  // Use headers mode for clean parent labels
              style: {
                textOutline: "none",
                color: isDark ? "#f3f4f6" : "#111827",
              },
            },
            borderWidth: 3,
            borderRadius: 3,
            borderColor: isDark ? "#1f2937" : "#f3f4f6",
          },
          {
            level: 2,
            dataLabels: {
              enabled: true,
              align: "center",
              verticalAlign: "middle",
              useHTML: true,
              style: {
                fontSize: "11px",
                fontWeight: "500",
                color: "#f3f4f6",  // White text on colored backgrounds
              },
              formatter: function(this: { point: TreemapPoint }) {
                const point = this.point
                const name = point.name
                const value = point.value
                const allocation = point.allocation

                // Format display based on displayValue setting
                let label = `<div style="text-align: center; line-height: 1.3;">
                  <div style="font-weight: 600; margin-bottom: 2px; color: #f3f4f6;">${name}</div>`

                if (displayValue === "value") {
                  label += `<div style="font-size: 11px; opacity: 0.9; color: #f3f4f6;">${formatSI(value)}</div>`
                } else if (displayValue === "allocation") {
                  label += `<div style="font-size: 11px; opacity: 0.9; color: #f3f4f6;">${allocation?.toFixed(1)}%</div>`
                }

                label += `</div>`
                return label
              },
            },
            borderColor: isDark ? "#374151" : "#e5e7eb",  // Lighter border for hierarchy
            borderWidth: 3,
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
        data: treemapData,
        tooltip: {
          useHTML: true,
          pointFormatter: function() {
            const point = this as any
            const institution = point.institution || point.name
            const accountType = point.accountType || ""
            const value = point.value
            const allocation = point.allocation

            let tooltip = `<div style="padding: 4px;">
              <div style="font-weight: 600; margin-bottom: 4px;">${point.name}</div>`

            if (institution && point.parent) {
              tooltip += `<div style="font-size: 12px; opacity: 0.8; margin-bottom: 2px;">Institution: ${institution}</div>`
            }
            if (accountType && point.parent) {
              tooltip += `<div style="font-size: 12px; opacity: 0.8; margin-bottom: 2px;">Type: ${accountType}</div>`
            }

            tooltip += `<div style="margin-top: 4px;">
              <div>Value: <b>${formatSI(value)}</b></div>`

            if (allocation) {
              tooltip += `<div>Allocation: <b>${allocation.toFixed(2)}%</b></div>`
            }

            tooltip += `</div></div>`
            return tooltip
          },
        },
      },
    ],
    tooltip: {
      backgroundColor: isDark ? "#1f2937" : "#ffffff",
      borderColor: isDark ? "#4b5563" : "#e5e7eb",
      borderRadius: 6,
      borderWidth: 1,
      outside: true,
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
    },
    legend: {
      enabled: false,
    },
  }), [treemapData, isDark, displayValue, height])

  if (!isClient) {
    return (
      <div
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>
          Loading chart...
        </div>
      </div>
    )
  }

  return (
    <div style={{ height }}>
      <HighchartsReact
        highcharts={Highcharts}
        options={options}
        ref={chartRef}
      />
    </div>
  )
}