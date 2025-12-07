"use client"
import { Button } from "@/components/Button"
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/Drawer"
import { Input } from "@/components/Input"
import { Label } from "@/components/Label"
import { Switch } from "@/components/Switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Tabs"
import { AccountSelector } from "@/components/ui/AccountSelector"
import { TickerSelector } from "@/components/ui/TickerSelector"
import React from "react"

export interface HoldingFormData {
  id?: string
  accountId: string
  holdingType: "stocks-funds" | "cash"
  // For stocks & funds
  ticker?: string
  shares?: number
  // For cash
  amount?: number
  description?: string
  // For manual entry
  isManualEntry?: boolean
  companyName?: string // For logo lookup
  pricePerShare?: number // Required for manual entry
  isUSStock?: boolean // Default: true
}

interface HoldingsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (holding: HoldingFormData) => void
  accounts?: Array<{
    id: string
    name: string
    institution: string // institution value key (e.g., "fidelity")
    institutionLabel?: string // optional label (e.g., "Fidelity Investments")
  }>
  mode?: "create" | "edit"
  initialData?: HoldingFormData
  title?: string
}

const FormField = ({
  label,
  required = false,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) => (
  <div>
    <Label className="font-medium">
      {label}
      {required && <span className="ml-1 text-red-500">*</span>}
    </Label>
    <div className="mt-2">{children}</div>
  </div>
)

// Common cash position presets
const cashPresets = [
  "Emergency Fund",
  "Short-term Savings",
  "Operating Cash",
  "Money Market",
  "Settlement Fund",
  "Sweep Account",
]

export function HoldingsDrawer({
  open,
  onOpenChange,
  onSubmit,
  accounts = [],
  mode = "create",
  initialData,
  title,
}: HoldingsDrawerProps) {
  const [formData, setFormData] = React.useState<HoldingFormData>({
    accountId: "",
    holdingType: "stocks-funds",
    ticker: "",
    shares: undefined,
    amount: undefined,
    description: "",
    isManualEntry: false,
    companyName: "",
    pricePerShare: undefined,
    isUSStock: true,
  })

  // Reset form when drawer opens/closes with new initial data
  React.useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          ...initialData,
          isManualEntry: initialData.isManualEntry ?? false,
          isUSStock: initialData.isUSStock ?? true,
        })
      } else if (mode === "create") {
        setFormData({
          accountId: "",
          holdingType: "stocks-funds",
          ticker: "",
          shares: undefined,
          amount: undefined,
          description: "",
          isManualEntry: false,
          companyName: "",
          pricePerShare: undefined,
          isUSStock: true,
        })
      }
    }
  }, [open, initialData, mode])

  const handleUpdateForm = (updates: Partial<HoldingFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(formData)
    }
    // Reset form and close drawer
    setFormData({
      accountId: "",
      holdingType: "stocks-funds",
      ticker: "",
      shares: undefined,
      amount: undefined,
      description: "",
      isManualEntry: false,
      companyName: "",
      pricePerShare: undefined,
      isUSStock: true,
    })
    onOpenChange(false)
  }

  const isFormValid = () => {
    if (!formData.accountId) return false

    if (formData.holdingType === "stocks-funds") {
      if (formData.isManualEntry) {
        // Manual entry validation
        return !!(
          formData.ticker &&
          formData.ticker.trim().length > 0 &&
          formData.companyName &&
          formData.companyName.trim().length > 0 &&
          formData.pricePerShare !== undefined &&
          formData.pricePerShare > 0 &&
          formData.shares !== undefined &&
          formData.shares > 0
        )
      } else {
        // Predefined ticker validation
        return !!formData.ticker && formData.shares !== undefined && formData.shares > 0
      }
    } else {
      return (
        formData.amount !== undefined &&
        formData.amount > 0 &&
        !!formData.description &&
        formData.description.trim().length > 0
      )
    }
  }

  const handleCashPresetClick = (preset: string) => {
    setFormData((prev) => ({ ...prev, description: preset }))
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="overflow-x-hidden sm:max-w-lg">
        <DrawerHeader>
          <DrawerTitle>
            <p>{title || (mode === "edit" ? "Edit Holding" : "Add Holdings")}</p>
            <span className="text-sm font-normal text-gray-500 dark:text-gray-500">
              {mode === "edit"
                ? "Update holding information"
                : "Add new stocks, funds, or cash to your accounts"}
            </span>
          </DrawerTitle>
        </DrawerHeader>

        <DrawerBody className="-mx-6 space-y-6 overflow-y-scroll border-t border-gray-200 px-6 dark:border-gray-800">
          <FormField label="Account" required>
            <AccountSelector
              accounts={accounts}
              value={formData.accountId}
              onValueChange={(value) =>
                handleUpdateForm({ accountId: value })
              }
              placeholder="Select an account"
            />
          </FormField>

          <div>
            <Label className="font-medium">Type</Label>
            <Tabs
              value={formData.holdingType}
              onValueChange={(value) =>
                handleUpdateForm({ holdingType: value as "stocks-funds" | "cash" })
              }
              className="mt-2"
            >
              <TabsList variant="solid" className="grid w-full grid-cols-2">
                <TabsTrigger value="stocks-funds">Stocks & Funds</TabsTrigger>
                <TabsTrigger value="cash">Cash</TabsTrigger>
              </TabsList>

              <TabsContent value="stocks-funds" className="mt-4 space-y-4">
                {/* Manual Entry Toggle */}
                <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-800">
                  <div>
                    <Label className="font-medium">Manual Entry</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      For unlisted or foreign stocks
                    </p>
                  </div>
                  <Switch
                    checked={formData.isManualEntry || false}
                    onCheckedChange={(checked) =>
                      handleUpdateForm({
                        isManualEntry: checked,
                        // Reset ticker when switching modes
                        ticker: "",
                        companyName: "",
                        pricePerShare: undefined,
                      })
                    }
                  />
                </div>

                {formData.isManualEntry ? (
                  <>
                    {/* Manual Entry Fields */}
                    <FormField label="Ticker Symbol" required>
                      <Input
                        name="ticker"
                        value={formData.ticker || ""}
                        onChange={(e) =>
                          handleUpdateForm({
                            ticker: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="e.g., AAPL, MSFT"
                      />
                    </FormField>

                    <FormField label="Company Name" required>
                      <Input
                        name="companyName"
                        value={formData.companyName || ""}
                        onChange={(e) =>
                          handleUpdateForm({ companyName: e.target.value })
                        }
                        placeholder="e.g., Apple Inc."
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Used for logo lookup
                      </p>
                    </FormField>

                    <FormField label="Price per Share" required>
                      <Input
                        name="pricePerShare"
                        type="number"
                        step="0.01"
                        value={formData.pricePerShare || ""}
                        onChange={(e) =>
                          handleUpdateForm({
                            pricePerShare: parseFloat(e.target.value),
                          })
                        }
                        placeholder="e.g., 193.60"
                      />
                    </FormField>

                    <FormField label="Number of Shares" required>
                      <Input
                        name="shares"
                        type="number"
                        step="0.0001"
                        value={formData.shares || ""}
                        onChange={(e) =>
                          handleUpdateForm({
                            shares: parseFloat(e.target.value),
                          })
                        }
                        placeholder="e.g., 100, 25.5"
                      />
                    </FormField>

                    {/* US/Non-US Toggle */}
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-800">
                      <div>
                        <Label className="font-medium">US Stock</Label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Toggle off for international stocks
                        </p>
                      </div>
                      <Switch
                        checked={formData.isUSStock ?? true}
                        onCheckedChange={(checked) =>
                          handleUpdateForm({ isUSStock: checked })
                        }
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Predefined Ticker Selector */}
                    <FormField label="Ticker Symbol" required>
                      <TickerSelector
                        value={formData.ticker || ""}
                        onValueChange={(value) =>
                          handleUpdateForm({ ticker: value })
                        }
                        placeholder="Select or enter ticker"
                      />
                    </FormField>

                    <FormField label="Number of Shares" required>
                      <Input
                        name="shares"
                        type="number"
                        step="0.0001"
                        value={formData.shares || ""}
                        onChange={(e) =>
                          handleUpdateForm({
                            shares: parseFloat(e.target.value),
                          })
                        }
                        placeholder="e.g., 100, 25.5"
                      />
                    </FormField>
                  </>
                )}
              </TabsContent>

              <TabsContent value="cash" className="mt-4 space-y-4">
                <FormField label="Amount" required>
                  <Input
                    name="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount || ""}
                    onChange={(e) =>
                      handleUpdateForm({ amount: parseFloat(e.target.value) })
                    }
                    placeholder="e.g., 10000.00"
                  />
                </FormField>

                <FormField label="Description" required>
                  <Input
                    name="description"
                    value={formData.description || ""}
                    onChange={(e) =>
                      handleUpdateForm({ description: e.target.value })
                    }
                    placeholder="e.g., Emergency Fund"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {cashPresets.map((preset) => (
                      <Button
                        key={preset}
                        type="button"
                        variant="secondary"
                        onClick={() => handleCashPresetClick(preset)}
                        className="text-xs"
                      >
                        {preset}
                      </Button>
                    ))}
                  </div>
                </FormField>
              </TabsContent>
            </Tabs>
          </div>
        </DrawerBody>

        <DrawerFooter className="-mx-6 -mb-2 gap-2 px-6 sm:justify-between">
          <DrawerClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DrawerClose>
          <Button onClick={handleSubmit} disabled={!isFormValid()}>
            {mode === "edit" ? "Save Changes" : "Add Holding"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}