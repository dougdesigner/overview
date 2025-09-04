# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Next.js 15 application template from Tremor called "Overview" - a dashboard application for summarizing data across four main areas: agents, retention, support, and workflow management.

## Tech Stack

- **Framework**: Next.js 15.1.4 with App Router
- **UI Components**: Tremor Raw (built on Radix UI primitives)
- **Charts**: Recharts
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
  - `utils.ts` - cn() function for class merging
  - `formatters.ts` - Number and date formatting utilities
  - `chartUtils.ts` - Chart configuration helpers

### Key Patterns

1. **Component Structure**: All components use TypeScript with explicit prop interfaces and forwardRef pattern for composability

2. **Styling**: Uses tailwind-merge and clsx via `cn()` utility for conditional classes

3. **Data Generation**: Mock data generators use Faker.js and follow defined Zod schemas

4. **Path Aliases**: `@/*` maps to `./src/*` for clean imports

5. **Dark Mode**: Implemented with next-themes, class-based switching

6. **Tables**: TanStack Table with server-side features, custom column definitions, and filtering

### TypeScript Configuration

- Strict mode enabled with no unused locals/parameters
- Path alias: `@/*` → `./src/*`
- Separate tsconfig for scripts (`tsconfig.scripts.json`)

## Important Notes

- This is a commercial Tremor template (check LICENSE.md)
- Uses React 19 with new features
- Geist Sans font is auto-optimized via next/font
- No testing framework is currently set up