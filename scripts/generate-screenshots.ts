#!/usr/bin/env tsx

/**
 * Screenshot Generation Script for Onboarding Flow
 *
 * Captures screenshots of the portfolio app in demo mode at
 * mobile and desktop viewport sizes in light and dark themes.
 *
 * Usage: pnpm generate:screenshots
 */

import { chromium, Browser, Page, BrowserContext } from "playwright"
import * as fs from "fs/promises"
import * as path from "path"
import { spawn, ChildProcess } from "child_process"

// Configuration
const OUTPUT_DIR = path.join(process.cwd(), "public", "images", "onboarding")
const BASE_URL = "http://localhost:3000"

// Pages to capture screenshots for
const PAGES = [
  { id: "overview", path: "/overview" },
  { id: "accounts", path: "/accounts" },
  { id: "holdings", path: "/holdings" },
  { id: "exposure", path: "/exposure" },
]

const VIEWPORTS = {
  mobile: { width: 375, height: 812 }, // iPhone X
  desktop: { width: 1280, height: 800 },
}

const THEMES = ["light", "dark"] as const

// Wait for Next.js server to be ready
async function waitForServer(url: string, timeout = 60000): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // Server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  throw new Error(`Server at ${url} did not start within ${timeout}ms`)
}

// Start Next.js dev server (better for pages with useSearchParams)
async function startDevServer(): Promise<ChildProcess> {
  console.log("Starting Next.js dev server...")

  const server = spawn("pnpm", ["dev"], {
    cwd: process.cwd(),
    stdio: "pipe",
    shell: true,
    env: { ...process.env, NODE_ENV: "development" },
  })

  server.stdout?.on("data", (data) => {
    const output = data.toString()
    if (output.includes("Ready") || output.includes("started") || output.includes("Local:")) {
      console.log("  Server ready!")
    }
  })

  server.stderr?.on("data", (data) => {
    const output = data.toString()
    // Suppress noisy dev output but log actual errors
    if (output.includes("Error") && !output.includes("Compiling")) {
      console.error("  Dev error:", output)
    }
  })

  await waitForServer(BASE_URL)
  // Extra wait for dev server to stabilize
  await new Promise((resolve) => setTimeout(resolve, 3000))
  return server
}

// Set up demo mode and theme via localStorage
async function setupPage(
  context: BrowserContext,
  theme: "light" | "dark"
): Promise<Page> {
  const page = await context.newPage()

  // Set localStorage values before navigating
  await context.addInitScript((themeValue: string) => {
    localStorage.setItem("portfolio_demo_mode", "true")
    localStorage.setItem("theme", themeValue)
  }, theme)

  return page
}

// Set theme via document class (for next-themes)
async function applyTheme(page: Page, theme: "light" | "dark"): Promise<void> {
  await page.evaluate((t) => {
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(t)
    // Also update color-scheme for proper rendering
    document.documentElement.style.colorScheme = t
  }, theme)
  // Allow theme transition
  await page.waitForTimeout(500)
}

// Wait for page to be fully loaded with fixed delay
async function waitForPageReady(page: Page, pageId: string): Promise<void> {
  console.log(`    Waiting for ${pageId} to fully load...`)

  // Wait for network idle first
  await page.waitForLoadState("networkidle")

  // Wait for specific content selectors to ensure real content is loaded
  const contentSelectors: Record<string, string> = {
    overview: "text=Portfolio value",
    accounts: "text=Accounts",
    holdings: "#holdings-section",
    exposure: "text=Exposure",
  }

  const selector = contentSelectors[pageId]
  if (selector) {
    try {
      await page.waitForSelector(selector, { timeout: 15000 })
      console.log(`    Content selector found: ${selector}`)
    } catch (e) {
      console.log(`    Warning: Content selector not found: ${selector}`)
    }
  }

  // Additional delay for charts to render
  const delay = pageId === "holdings" ? 5000 : 3000
  await page.waitForTimeout(delay)

  console.log(`    ✓ Page ready`)
}

// Capture screenshots for a single page
async function capturePageScreenshots(
  browser: Browser,
  pageConfig: { id: string; path: string }
): Promise<void> {
  for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
    for (const theme of THEMES) {
      const filename = `${pageConfig.id}-${viewportName}-${theme}.png`
      console.log(`  Capturing ${filename}...`)

      const context = await browser.newContext({
        viewport,
        colorScheme: theme,
      })

      const page = await context.newPage()

      // Listen for critical page errors only
      page.on("pageerror", (error) => {
        // Suppress hydration errors in dev mode - they don't affect final rendering
        if (!error.message.includes("Hydration")) {
          console.log(`    [Page Error] ${error.message}`)
        }
      })

      // Set demo mode via localStorage before navigating
      await context.addInitScript(() => {
        localStorage.setItem("portfolio_demo_mode", "true")
      })

      // Navigate without URL params (demo mode is set via localStorage)
      const url = `${BASE_URL}${pageConfig.path}`
      await page.goto(url, { waitUntil: "networkidle" })

      // Apply theme to document
      await applyTheme(page, theme)

      // Wait for page to be fully loaded
      await waitForPageReady(page, pageConfig.id)

      // Hide Next.js dev error overlay for clean screenshots
      await page.addStyleTag({
        content: `
          nextjs-portal { display: none !important; }
          [data-nextjs-dialog-overlay] { display: none !important; }
        `,
      })

      // Capture screenshot
      const outputPath = path.join(OUTPUT_DIR, filename)
      await page.screenshot({
        path: outputPath,
        fullPage: false, // Capture viewport only
      })

      await context.close()
    }
  }
}

async function main(): Promise<void> {
  console.log("\n📸 Starting Screenshot Generation Pipeline\n")
  console.log("=".repeat(60))

  let server: ChildProcess | null = null
  let browser: Browser | null = null

  try {
    // Ensure output directory exists
    await fs.mkdir(OUTPUT_DIR, { recursive: true })
    console.log(`\n📁 Output directory: ${OUTPUT_DIR}\n`)

    // Start dev server (better handles useSearchParams in Holdings page)
    server = await startDevServer()

    // Launch browser
    console.log("\n🌐 Launching browser...")
    browser = await chromium.launch({
      headless: true,
    })

    // Capture screenshots for each page
    for (const pageConfig of PAGES) {
      console.log(`\n📄 Processing /${pageConfig.id}...`)
      await capturePageScreenshots(browser, pageConfig)
    }

    console.log("\n" + "=".repeat(60))
    console.log("✅ Screenshot generation complete!")
    console.log(`\n📁 Screenshots saved to: ${OUTPUT_DIR}`)
    console.log(
      `   Total files: ${PAGES.length * Object.keys(VIEWPORTS).length * THEMES.length}`
    )
  } catch (error) {
    console.error("\n❌ Error generating screenshots:", error)
    process.exit(1)
  } finally {
    // Cleanup
    if (browser) await browser.close()
    if (server) {
      server.kill()
      console.log("\n🛑 Server stopped")
    }
  }
}

main()
