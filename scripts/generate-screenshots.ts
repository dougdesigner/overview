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

// Set to just holdings to debug, or all pages for full run
const PAGES = [
  // { id: "overview", path: "/overview" },
  // { id: "accounts", path: "/accounts" },
  { id: "holdings", path: "/holdings" },
  // { id: "exposure", path: "/exposure" },
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

// Build and start Next.js production server
async function startProductionServer(): Promise<ChildProcess> {
  console.log("Building Next.js for production...")

  // First build
  await new Promise<void>((resolve, reject) => {
    const build = spawn("pnpm", ["build"], {
      cwd: process.cwd(),
      stdio: "pipe",
      shell: true,
    })

    build.on("close", (code) => {
      if (code === 0) {
        console.log("  Build complete!")
        resolve()
      } else {
        reject(new Error(`Build failed with code ${code}`))
      }
    })

    build.stderr?.on("data", (data) => {
      const output = data.toString()
      if (output.includes("error") || output.includes("Error")) {
        console.error("Build error:", output)
      }
    })
  })

  console.log("Starting Next.js production server...")

  const server = spawn("pnpm", ["start"], {
    cwd: process.cwd(),
    stdio: "pipe",
    shell: true,
  })

  server.stdout?.on("data", (data) => {
    const output = data.toString()
    if (output.includes("Ready") || output.includes("started")) {
      console.log("  Server ready!")
    }
  })

  await waitForServer(BASE_URL)
  // Extra wait for server to stabilize
  await new Promise((resolve) => setTimeout(resolve, 2000))
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

  // Fixed delay to ensure CSS, JS, and charts are fully rendered
  await page.waitForTimeout(8000)

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

      // Navigate directly with ?demo=true URL param (synced with useState initializer)
      const url = `${BASE_URL}${pageConfig.path}?demo=true`
      await page.goto(url, { waitUntil: "networkidle" })

      // Apply theme to document
      await applyTheme(page, theme)

      // Wait for page to be fully loaded
      await waitForPageReady(page, pageConfig.id)

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

    // Build and start production server (no dev error overlays)
    server = await startProductionServer()

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
