"use client"

import { Card } from "@/components/Card"
import type { Holding } from "@/components/ui/data-table-holdings/types"
import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"
import HighchartsExportData from "highcharts/modules/export-data"
import HighchartsExporting from "highcharts/modules/exporting"
import HighchartsSunburst from "highcharts/modules/sunburst"
import { useTheme } from "next-themes"
import { useEffect, useRef, useState } from "react"

// Initialize Highcharts modules for Next.js
if (typeof Highcharts === "object") {
  if (typeof HighchartsSunburst === "function") {
    HighchartsSunburst(Highcharts)
  }
  if (typeof HighchartsExporting === "function") {
    HighchartsExporting(Highcharts)
  }
  if (typeof HighchartsExportData === "function") {
    HighchartsExportData(Highcharts)
  }
}

interface HoldingsSunburstProps {
  holdings: Holding[]
  height?: number
  animate?: boolean
}

export function HoldingsSunburst({
  holdings,
  height = 350,
  animate = true,
}: HoldingsSunburstProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const chartRef = useRef<HighchartsReact.RefObject>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Color palette for accounts
  const accountColors = [
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#10b981", // emerald
    "#f59e0b", // amber
    "#3b82f6", // blue
  ]

  // Color palette for asset types
  const typeColors = {
    stock: "#3b82f6", // blue
    fund: "#10b981", // emerald
    cash: "#f59e0b", // amber
  }

  // Calculate total portfolio value
  const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0)

  // Transform holdings data to sunburst format
  const transformToSunburstData = (): any[] => {
    const data: any[] = []

    // Root node (center)
    data.push({
      id: "portfolio",
      parent: "",
      name: "Portfolio",
      value: totalValue,
      color: "transparent",
    })

    // Group holdings by account and type
    const accountMap = new Map<string, { holdings: Holding[]; total: number }>()

    holdings.forEach((holding) => {
      if (!accountMap.has(holding.accountId)) {
        accountMap.set(holding.accountId, { holdings: [], total: 0 })
      }
      const account = accountMap.get(holding.accountId)!
      account.holdings.push(holding)
      account.total += holding.marketValue
    })

    // Add account nodes and their children
    let accountIndex = 0
    accountMap.forEach((accountData, accountId) => {
      const accountName =
        accountData.holdings[0]?.accountName || `Account ${accountId}`
      const accountNodeId = `account-${accountId}`
      const accountColor = accountColors[accountIndex % accountColors.length]

      // Add account node
      data.push({
        id: accountNodeId,
        parent: "portfolio",
        name: accountName,
        value: accountData.total,
        color: accountColor,
      })

      // Group holdings by type within this account
      const typeMap = new Map<string, Holding[]>()
      accountData.holdings.forEach((holding) => {
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
            name: holding.ticker || holding.name,
            value: holding.marketValue,
            ticker: holding.ticker,
            fullName: holding.name,
            quantity: holding.quantity,
            lastPrice: holding.lastPrice,
          })
        })
      })

      accountIndex++
    })

    return data
  }

  // Chart options
  const options: Highcharts.Options = {
    chart: {
      type: undefined, // Required for sunburst
      backgroundColor: "transparent",
      height: height,
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
          menuItems: [
            "viewFullscreen",
            "printChart",
            "separator",
            "downloadPNG",
            "downloadJPEG",
            "downloadPDF",
            "downloadSVG",
            "separator",
            "downloadCSV",
            "downloadXLS",
          ],
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
            // color: isDark ? "#f3f4f6" : "#111827",
            fontSize: "14px",
            fontWeight: "600",
            textOutline: "none",
            // textOutline: isDark ? "1px contrast" : "none",
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
      } as any,
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
      pointFormat:
        '<div style="padding: 2px;">' +
        '<div style="font-weight: 600; margin-bottom: 4px;">{point.name}</div>' +
        "<div>Value: <b>${point.value:,.0f}</b></div>" +
        "<div>Portfolio: <b>{point.percentage:.1f}%</b></div>" +
        "</div>",
    },
  }

  if (!isClient) {
    return (
      <Card className="p-6">
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-sm text-gray-500">Loading chart...</div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-base font-medium text-gray-900 dark:text-gray-50">
          Holdings hierarchy
        </h3>
        {/* <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Interactive view of your holdings across all accounts
        </p> */}
      </div>

      <HighchartsReact
        highcharts={Highcharts}
        options={options}
        ref={chartRef}
      />

      {/* Summary stats */}
      {/* <div className="mt-6 grid grid-cols-3 gap-4 border-t border-gray-200 pt-4 dark:border-gray-800">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Value
          </p>
          <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-50">
            {formatValue(totalValue)}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Accounts
          </p>
          <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-50">
            {new Set(holdings.map((h) => h.accountId)).size}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Holdings
          </p>
          <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-50">
            {holdings.length}
          </p>
        </div>
      </div> */}
    </Card>
  )
}
