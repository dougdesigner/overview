import { NextResponse } from "next/server"
import { alphaVantageClient } from "@/lib/alphaVantage"

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

    // Fetch company overviews for all symbols in parallel
    const overviews = await Promise.all(
      symbols.map(symbol => alphaVantageClient.getCompanyOverview(symbol.toUpperCase()))
    )

    // Create a map of symbol to overview data
    const result = symbols.reduce((acc, symbol, index) => {
      const overview = overviews[index]
      if (overview) {
        acc[symbol.toUpperCase()] = {
          sector: overview.Sector,
          industry: overview.Industry
        }
      }
      return acc
    }, {} as Record<string, { sector: string; industry: string }>)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in company overview API route:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}