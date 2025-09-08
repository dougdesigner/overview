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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select"
import React from "react"
import { Input } from "../Input"
import { Label } from "../Label"

// Account types and institutions
const accountTypes = [
  // Cash accounts
  { value: "checking", label: "Checking Account" },
  { value: "savings", label: "Savings Account" },
  { value: "bank", label: "Bank Account" },
  { value: "cash", label: "Cash" },
  { value: "rewards", label: "Rewards Account" },
  
  // Investment accounts
  { value: "personal-investment", label: "Personal Investment" },
  { value: "individual", label: "Individual Brokerage" },
  { value: "joint-investment", label: "Joint Investment" },
  { value: "joint", label: "Joint Brokerage" },
  { value: "investment", label: "Investment Account" },
  { value: "brokerage-corporate-non-taxable", label: "Brokerage Corporate Non-Taxable" },
  { value: "brokerage-corporate-taxable", label: "Brokerage Corporate Taxable" },
  { value: "brokerage-stock-plan", label: "Brokerage Stock Plan" },
  { value: "brokerage-pension", label: "Brokerage Pension" },
  { value: "brokerage-variable-annuity", label: "Brokerage Variable Annuity" },
  { value: "other-non-taxable", label: "Other Non-Taxable" },
  { value: "other-taxable", label: "Other Taxable" },
  { value: "cryptocurrency", label: "Cryptocurrency" },
  
  // Asset accounts - Retirement
  { value: "traditional-401k", label: "Traditional 401(k)" },
  { value: "roth-401k", label: "Roth 401(k)" },
  { value: "401a", label: "401(a)" },
  { value: "403b", label: "403(b)" },
  { value: "457b", label: "457(b)" },
  { value: "thrift-savings-plan", label: "Thrift Savings Plan" },
  { value: "traditional-ira", label: "Traditional IRA" },
  { value: "roth-ira", label: "Roth IRA" },
  { value: "sep-ira", label: "SEP IRA" },
  { value: "simple-ira", label: "SIMPLE IRA" },
  
  // Asset accounts - Education & Health
  { value: "529", label: "529 Education Savings" },
  { value: "hsa", label: "Health Savings Account" },
  { value: "coverdell-esa", label: "Coverdell ESA" },
  
  // Asset accounts - Insurance & Annuities
  { value: "insurance", label: "Insurance" },
  { value: "fixed-annuity", label: "Fixed Annuity" },
  { value: "annuity", label: "Annuity" },
  
  // Asset accounts - Tangible
  { value: "art", label: "Art" },
  { value: "wine", label: "Wine" },
  { value: "jewelry", label: "Jewelry" },
  { value: "collectible", label: "Collectible" },
  { value: "car", label: "Car" },
  { value: "other-asset", label: "Other Asset" },
  
  // Asset accounts - Trust & Specialized
  { value: "trust", label: "Trust Account" },
  
  // Liability accounts
  { value: "credit-card", label: "Credit Card" },
  { value: "heloc", label: "HELOC" },
  { value: "loan", label: "Loan" },
  { value: "student-loan", label: "Student Loan" },
  { value: "auto-loan", label: "Auto Loan" },
  { value: "mortgage", label: "Mortgage" },
  { value: "other-liability", label: "Other Liability" },
]

const institutions = [
  { value: "fidelity", label: "Fidelity Investments" },
  { value: "vanguard", label: "Vanguard" },
  { value: "schwab", label: "Charles Schwab" },
  { value: "etrade", label: "E*TRADE" },
  { value: "td-ameritrade", label: "TD Ameritrade" },
  { value: "merrill", label: "Merrill Edge" },
  { value: "wealthfront", label: "Wealthfront" },
  { value: "betterment", label: "Betterment" },
  { value: "robinhood", label: "Robinhood" },
  { value: "chase", label: "Chase" },
  { value: "bofa", label: "Bank of America" },
  { value: "wells-fargo", label: "Wells Fargo" },
  { value: "citi", label: "Citibank" },
  { value: "amex", label: "American Express" },
  { value: "other", label: "Other" },
]

export interface AccountFormData {
  institution: string
  accountType: string
  accountName: string
}

interface AccountDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (account: AccountFormData) => void
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
      {required && <span className="text-red-500 ml-1">*</span>}
    </Label>
    <div className="mt-2">{children}</div>
  </div>
)

export function AccountDrawer({ open, onOpenChange, onSubmit }: AccountDrawerProps) {
  const [formData, setFormData] = React.useState<AccountFormData>({
    institution: "",
    accountType: "",
    accountName: "",
  })

  // Auto-populate account name when account type changes
  React.useEffect(() => {
    if (formData.accountType && !formData.accountName) {
      const selectedType = accountTypes.find(t => t.value === formData.accountType)
      if (selectedType) {
        setFormData(prev => ({ ...prev, accountName: selectedType.label }))
      }
    }
  }, [formData.accountType])

  const handleUpdateForm = (updates: Partial<AccountFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(formData)
    }
    // Reset form and close drawer
    setFormData({
      institution: "",
      accountType: "",
      accountName: "",
    })
    onOpenChange(false)
  }

  const isFormValid = () => {
    return formData.institution && formData.accountType
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="overflow-x-hidden sm:max-w-lg">
        <DrawerHeader>
          <DrawerTitle>
            <p>Add Account</p>
            <span className="text-sm font-normal text-gray-500 dark:text-gray-500">
              Create a new investment account
            </span>
          </DrawerTitle>
        </DrawerHeader>
        
        <DrawerBody className="-mx-6 space-y-6 overflow-y-scroll border-t border-gray-200 px-6 dark:border-gray-800">
          <FormField label="Institution" required>
            <Select
              value={formData.institution}
              onValueChange={(value) => handleUpdateForm({ institution: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Institution" />
              </SelectTrigger>
              <SelectContent>
                {institutions.map((inst) => (
                  <SelectItem key={inst.value} value={inst.value}>
                    {inst.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Account Type" required>
            <Select
              value={formData.accountType}
              onValueChange={(value) => {
                const selectedType = accountTypes.find(t => t.value === value)
                handleUpdateForm({ 
                  accountType: value,
                  accountName: selectedType?.label || ""
                })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Account Type" />
              </SelectTrigger>
              <SelectContent>
                {accountTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Account Name">
            <Input
              name="accountName"
              value={formData.accountName}
              onChange={(e) => handleUpdateForm({ accountName: e.target.value })}
              placeholder="Enter custom name (optional)"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Defaults to account type if left empty
            </p>
          </FormField>
        </DrawerBody>

        <DrawerFooter className="-mx-6 -mb-2 gap-2 px-6 sm:justify-between">
          <DrawerClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DrawerClose>
          <Button 
            onClick={handleSubmit}
            disabled={!isFormValid()}
          >
            Add Account
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}