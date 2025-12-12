import { NextRequest, NextResponse } from "next/server"
import { alphaVantageClient } from "@/lib/alphaVantage"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const keywords = searchParams.get("keywords")

    if (!keywords || keywords.length < 3) {
      return NextResponse.json({ matches: [] })
    }

    const results = await alphaVantageClient.searchSymbols(keywords)
    return NextResponse.json({ matches: results })
  } catch (error) {
    console.error("Error in symbol search API:", error)
    return NextResponse.json(
      { error: "Failed to search symbols" },
      { status: 500 }
    )
  }
}
