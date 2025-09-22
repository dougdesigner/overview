import { NextResponse } from "next/server"
import { alphaVantageClient } from "@/lib/alphaVantage"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get("symbol")

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol parameter is required" },
        { status: 400 }
      )
    }

    const profile = await alphaVantageClient.getETFProfile(symbol.toUpperCase())

    if (!profile) {
      return NextResponse.json(
        { error: `ETF profile not found for symbol: ${symbol}` },
        { status: 404 }
      )
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Error in ETF data API route:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { symbols } = body

    if (!symbols || !Array.isArray(symbols)) {
      return NextResponse.json(
        { error: "Symbols array is required" },
        { status: 400 }
      )
    }

    const profiles = await Promise.all(
      symbols.map(symbol => alphaVantageClient.getETFProfile(symbol.toUpperCase()))
    )

    const result = symbols.reduce((acc, symbol, index) => {
      if (profiles[index]) {
        acc[symbol.toUpperCase()] = profiles[index]
      }
      return acc
    }, {} as Record<string, ReturnType<typeof alphaVantageClient.getETFProfile> extends Promise<infer T> ? T : never>)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in ETF data API route:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}