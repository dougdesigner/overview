# Overview – Portfolio Dashboard

A modern portfolio management dashboard built with [Next.js 15](https://nextjs.org) and [Tremor Raw](https://tremor.so). Track accounts, holdings, and analyze portfolio exposure across asset classes, sectors, and institutions.

## Features

### Portfolio Management
- **Account Tracking**: Manage multiple brokerage accounts with institution branding
- **Holdings Management**: Track stocks, ETFs, mutual funds, and other securities
- **Real-time Prices**: Auto-updating stock prices with configurable polling
- **Cross-tab Sync**: Changes sync across browser tabs automatically

### Exposure Analysis
- **Asset Class Allocation**: Visualize portfolio distribution across U.S. stocks, international stocks, fixed income, and cash
- **Sector Exposure**: Break down holdings by market sector
- **Institution Exposure**: See allocation across brokerage accounts
- **Interactive Charts**: Treemaps, sunbursts, Sankey diagrams, and donut charts

### Dashboard Areas
- **Overview**: Portfolio summary with key metrics and visualizations
- **Accounts**: Manage brokerage accounts and view account-level details
- **Holdings**: Full holdings table with filtering, sorting, and bulk operations
- **Exposure**: Deep-dive into portfolio allocation analysis

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org) with App Router
- **UI Components**: [Tremor Raw](https://tremor.so) (built on [Radix UI](https://www.radix-ui.com))
- **Charts**: [Recharts](https://recharts.org) and [Highcharts](https://www.highcharts.com)
- **Tables**: [TanStack Table v8](https://tanstack.com/table)
- **Styling**: [Tailwind CSS 3.4](https://tailwindcss.com)
- **Language**: TypeScript with strict mode
- **Theme**: Dark mode support via [next-themes](https://github.com/pacocoursey/next-themes)

## Getting Started

1. Install dependencies (pnpm recommended):

```bash
pnpm install
```

2. Start the development server:

```bash
pnpm run dev
```

3. Visit [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Available Scripts

```bash
pnpm run dev          # Start development server
pnpm run build        # Build for production
pnpm run start        # Start production server
pnpm run lint         # Run ESLint
```

### Data Generation

```bash
pnpm run generate:agents     # Generate agent mock data
pnpm run generate:workflow   # Generate workflow mock data
pnpm run generate:support    # Generate support ticket data
pnpm run generate:retention  # Generate retention cohort data
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/        # Dashboard pages (overview, accounts, holdings, exposure)
│   ├── api/                # API routes (stock prices, ETF data, logos)
│   └── login/              # Authentication page
├── components/             # React components
│   ├── ui/                 # Shared UI components and data tables
│   └── *.tsx               # Feature-specific components
├── data/                   # Data schemas, generators, and mock data
├── hooks/                  # Custom React hooks
│   ├── usePortfolioStore.ts      # Central portfolio state management
│   └── useExposureCalculations.ts # Portfolio exposure calculations
└── lib/                    # Utility functions and services
    ├── utils.ts            # Core utilities (cx, focusRing, etc.)
    ├── assetClassColors.ts # Centralized color configuration
    ├── logoUtils.ts        # Logo fetching via logo.dev
    └── ...                 # Storage, API services, calculators
```

## Key Features

### Resilient Storage
Portfolio data uses a layered storage strategy:
- **Primary**: localStorage for fast access
- **Backup**: IndexedDB for resilience
- **Fallback**: Default data if storage is unavailable

### Real-time Price Updates
Holdings automatically fetch updated prices via the Alpha Vantage API with intelligent caching and rate limiting.

### Logo Integration
Institution and ticker logos are fetched from logo.dev with graceful fallbacks to branded initials when logos are unavailable.

## Notes

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Geist Sans.

## License

This site template is a commercial product and is licensed under the [Tremor License](https://blocks.tremor.so/license).

## Learn More

- [Tremor Raw](https://tremor.so) – Component library documentation
- [Next.js](https://nextjs.org/docs) – Framework documentation
- [Tailwind CSS](https://tailwindcss.com) – Utility-first CSS framework
- [Radix UI](https://www.radix-ui.com) – Accessible component primitives
- [Recharts](https://recharts.org) – Composable charting library
- [Highcharts](https://www.highcharts.com) – Advanced visualization library
- [TanStack Table](https://tanstack.com/table) – Headless table library
