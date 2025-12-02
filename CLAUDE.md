# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Next.js 15 application template from Tremor called "Overview" - a dashboard application that includes:
- **Portfolio Management**: Account and holdings tracking with real-time price updates
- **Exposure Analysis**: Asset class allocation, sector exposure, institution exposure visualizations
- **Original Dashboard Areas**: Agents, retention, support, and workflow management

## Tech Stack

- **Framework**: Next.js 15.1.4 with App Router
- **UI Components**: Tremor Raw (built on Radix UI primitives)
- **Charts**: Recharts and Highcharts
- **Styling**: Tailwind CSS 3.4 with tailwind-variants
- **Tables**: TanStack Table v8
- **TypeScript**: Strict mode enabled
- **State Management**: React hooks and context
- **Theme**: Dark mode support via next-themes

## Development Commands

```bash
# Install dependencies (pnpm preferred)
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Start production server
pnpm run start

# Run linter
pnpm run lint

# Generate mock data
pnpm run generate:agents    # Generate agent data
pnpm run generate:workflow  # Generate workflow data
pnpm run generate:support   # Generate support tickets
pnpm run generate:retention # Generate retention cohorts
```

## Architecture

### Directory Structure
- `src/app/` - Next.js app router pages and layouts
  - `(dashboard)/` - Dashboard pages (agents, retention, support, workflow)
  - `login/` - Login page
  - `globals.css` - Global styles with Tailwind directives
  
- `src/components/` - Reusable UI components
  - UI primitives (Button, Card, Dialog, Input, etc.) built on Radix UI
  - Chart components (LineChart, CategoryBar, ProgressCircle)
  - Data tables with filtering, sorting, and pagination
  
- `src/data/` - Data schemas, generators, and mock data
  - Each section has: `schema.ts`, `generator.ts`, and data files
  - Uses Zod for schema validation
  - Faker.js for generating mock data

- `src/lib/` - Utility functions
  - `utils.ts` - cx() function for class merging, focusRing/focusInput utilities
  - `formatters.ts` - Number and date formatting utilities
  - `chartUtils.ts` - Chart color palette and configuration helpers
  - `assetClassColors.ts` - Centralized asset class color configuration for all visualizations
  - `logoUtils.ts` - Ticker and institution logo URLs via logo.dev API
  - `institutionUtils.ts` - Institution brand colors, labels, and initials helpers
  - `localStorage.ts` - Versioned localStorage operations with migration support
  - `indexedDBBackup.ts` - IndexedDB backup/recovery for storage resilience
  - `stockPriceService.ts` - Stock price lookup with caching
  - `etfDataService.ts` - ETF holdings and composition data
  - `etfMetadataService.ts` - ETF metadata lookups
  - `exposureCalculator.ts` - Portfolio exposure calculations
  - `alphaVantage.ts` - Alpha Vantage API integration

- `src/hooks/` - Custom React hooks
  - `usePortfolioStore.ts` - Central state management for portfolio data
  - `useExposureCalculations.ts` - Portfolio exposure analysis calculations

### Key Patterns

1. **Component Structure**: All components use TypeScript with explicit prop interfaces and forwardRef pattern for composability

2. **Styling**: Uses tailwind-merge and clsx via `cx()` utility for conditional classes

3. **Data Generation**: Mock data generators use Faker.js and follow defined Zod schemas

4. **Path Aliases**: `@/*` maps to `./src/*` for clean imports

5. **Dark Mode**: Implemented with next-themes, class-based switching

6. **Tables**: TanStack Table with server-side features, custom column definitions, and filtering

7. **Storage Events**: Cross-tab synchronization via window storage events

8. **Price Updates**: Holdings auto-update prices via polling with configurable intervals

9. **Logo Fallbacks**: Logo components gracefully degrade to initials with brand colors

### TypeScript Configuration

- Strict mode enabled with no unused locals/parameters
- Path alias: `@/*` → `./src/*`
- Separate tsconfig for scripts (`tsconfig.scripts.json`)

## Highcharts Implementation in Next.js

### Important: Module Loading Pattern

Next.js executes code twice - on server-side and then client-side. This causes issues with Highcharts modules that need to extend the Highcharts object. To prevent "Cannot read properties of undefined (reading 'prototype')" errors, follow this pattern:

```typescript
"use client"

import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"
// Import modules as functions
import HighchartsSankey from "highcharts/modules/sankey"
import HighchartsExporting from "highcharts/modules/exporting"
import HighchartsExportData from "highcharts/modules/export-data"

// Initialize modules only when Highcharts is loaded as an object
if (typeof Highcharts === "object") {
  // Check each module is a function before calling
  if (typeof HighchartsSankey === "function") {
    HighchartsSankey(Highcharts)
  }
  if (typeof HighchartsExporting === "function") {
    HighchartsExporting(Highcharts)
  }
  if (typeof HighchartsExportData === "function") {
    HighchartsExportData(Highcharts)
  }
}
```

### Common Highcharts Modules

- `highcharts/modules/sankey` - For Sankey diagrams
- `highcharts/modules/sunburst` - For Sunburst charts
- `highcharts/modules/treemap` - For Treemap visualizations
- `highcharts/modules/exporting` - For export functionality
- `highcharts/modules/export-data` - For data export options

### DO NOT Use These Patterns

```typescript
// ❌ Wrong - ES6 side-effect imports
import "highcharts/modules/sankey"

// ❌ Wrong - Direct function call without checks
import HighchartsSankey from "highcharts/modules/sankey"
HighchartsSankey(Highcharts)

// ❌ Wrong - Using require without checks
require("highcharts/modules/sankey")(Highcharts)
```

## Image and Logo Best Practices

### High-Resolution Images for Retina Displays

When using Next.js Image component, decouple source resolution from display size:

```typescript
// ✅ Correct - Fetch high-res, display at desired size
<Image
  src={logoUrl}
  alt="Logo"
  width={48}    // Fetch 48x48px image (2x for retina)
  height={48}
  className="size-6"  // Display at 24x24px via CSS
/>

// ❌ Wrong - Low resolution on retina displays
<Image
  src={logoUrl}
  alt="Logo"
  width={24}    // Only fetches 24x24px
  height={24}
  className="size-6"
/>
```

### Logo Infrastructure

- **Logo fetching**: Use `getInstitutionLogoUrl()` and `getTickerLogoUrl()` from `src/lib/logoUtils.ts`
- **Institution utilities**: Use helpers from `src/lib/institutionUtils.ts` for brand colors and labels
- **Logo components**: See `InstitutionLogo` component for reusable logo with fallback to initials

## Component Organization and Refactoring

### When to Create Shared Components

Extract shared components when:
- Code is duplicated in 2+ places
- Component has clear, reusable purpose
- Reduces maintenance burden

### File Organization

```
src/
├── components/
│   ├── ui/                    # Shared UI components
│   │   ├── AccountSelector.tsx
│   │   ├── InstitutionLogo.tsx
│   │   └── data-table-*/      # Table-specific components
│   │       ├── columns.tsx    # Column definitions
│   │       ├── types.ts       # TypeScript interfaces
│   │       └── TableName.tsx  # Main table component
│   └── [PageComponents].tsx   # Page-specific components
└── lib/
    ├── utils.ts               # General utilities
    ├── institutionUtils.ts    # Domain-specific utilities
    └── logoUtils.ts           # API integrations
```

## Data Table Patterns

### TanStack Table Structure

Each data table should follow this pattern:

1. **types.ts** - Define interfaces for data and props
2. **columns.tsx** - Column definitions with proper typing
3. **MainTable.tsx** - Table component with:
   - Filtering, sorting, pagination via TanStack Table
   - Proper TypeScript typing
   - Memoized column definitions

### Performance Optimizations

```typescript
// Cache expensive operations
const domainCache = new Map<string, string>()

// Memoize calculations
const columns = React.useMemo(
  () => createColumns({ onEdit, onDelete }),
  [onEdit, onDelete]
)

// Conditional API calls
if (!domainCache.has(ticker)) {
  // Fetch only if not cached
}
```

## TypeScript Patterns

### Table References

When dealing with circular dependencies in tables:

```typescript
// Use ref with any type to avoid circular deps
const tableRef = React.useRef<any>(null)

// Store table instance after creation
React.useEffect(() => {
  tableRef.current = table
}, [table])
```

### Component Props

Always define explicit interfaces:

```typescript
interface ComponentProps {
  data: DataType[]
  onAction?: (item: DataType) => void
  className?: string
}
```

## Next.js Specific Patterns

### Client Components

Always mark client-side components:

```typescript
"use client"  // Required at top of file

import { useState } from "react"
// ... rest of component
```

### Dynamic Imports

For heavy libraries or conditional loading:

```typescript
const HeavyComponent = dynamic(
  () => import("@/components/HeavyComponent"),
  { ssr: false }
)
```

## Important Notes

- This is a commercial Tremor template (check LICENSE.md)
- Uses React 19 with new features
- Geist Sans font is auto-optimized via next/font
- No testing framework is currently set up

## API Routes

Serverless API endpoints in `src/app/api/`:

- `/api/logo-url` - Batch logo URL validation and caching
- `/api/stock-price` - Stock price lookups via Alpha Vantage
- `/api/etf-data` - ETF holdings and composition data
- `/api/etf-metadata` - ETF metadata service
- `/api/etf-holdings` - ETF holdings lookup
- `/api/company-overview` - Company profile information

## Custom Hooks

### usePortfolioStore

Central state management hook for portfolio data (`src/hooks/usePortfolioStore.ts`):
- Manages accounts, holdings, and derived calculations
- Implements layered storage: localStorage (primary) → IndexedDB (backup) → defaults (fallback)
- Auto-saves on data changes
- Cross-tab synchronization via storage events
- Price update polling (every 5 minutes)

### useExposureCalculations

Portfolio exposure analysis hook (`src/hooks/useExposureCalculations.ts`):
- Calculates asset class, sector, and institution exposures
- Memoized for performance

## Storage Patterns

### Layered Storage Strategy

Portfolio data uses a resilient layered storage approach:

```
Storage priority (highest to lowest):
LocalStorage (primary) → IndexedDB (backup) → Default data (fallback)
```

### Versioned Storage

All localStorage operations use versioned wrappers for future migrations:

```typescript
interface StorageData<T> {
  version: string
  data: T
  timestamp: number
}

// Use helpers from src/lib/localStorage.ts
import { getFromStorage, setToStorage } from "@/lib/localStorage"
```

## Asset Class Colors

Centralized color configuration in `src/lib/assetClassColors.ts`:

```typescript
import {
  ASSET_CLASS_COLORS,        // Chart color keys (for Recharts)
  ASSET_CLASS_HEX_COLORS,    // Hex values (for Highcharts)
  ASSET_CLASS_BG_COLORS,     // Tailwind bg classes
  getAssetClassColor,        // Helper function
} from "@/lib/assetClassColors"
```

This ensures consistent colors for asset classes across all visualizations (Recharts, Highcharts, badges).

## Client Hydration Pattern

For charts and components that need DOM access, ensure hydration is complete before rendering:

```typescript
const [isClient, setIsClient] = React.useState(false)

React.useEffect(() => {
  setIsClient(true)
}, [])

if (!isClient) {
  return <LoadingPlaceholder />
}

return <ChartComponent />
```

## Styling with cx()

The `cx()` utility (from `src/lib/utils.ts`) combines clsx and tailwind-merge:

```typescript
import { cx } from "@/lib/utils"

className={cx(
  // base styles
  "flex items-center gap-2",
  // theme aware
  "text-gray-900 dark:text-gray-50",
  "bg-white dark:bg-gray-950",
  // conditional
  isActive && "font-bold",
  // override safe
  className,
)}
```