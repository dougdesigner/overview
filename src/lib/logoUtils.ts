// Logo utility functions for fetching institution and ticker logos

/**
 * Extract a potential domain from a company name
 * Tries multiple strategies to find a working domain
 * @param companyName - Company name (e.g., "Apple Inc", "American Express Company")
 * @returns Array of potential domains to try (e.g., ["apple.com", "americanexpress.com"])
 */
export function extractDomainsFromCompanyName(companyName: string): string[] {
  if (!companyName) return []

  const domains: string[] = []

  // Common suffixes to remove
  const suffixes = [
    "Inc",
    "Incorporated",
    "Corp",
    "Corporation",
    "Ltd",
    "Limited",
    "LLC",
    "L.L.C.",
    "LP",
    "L.P.",
    "Co",
    "Company",
    "Group",
    "Holding",
    "Holdings",
    "International",
    "Technologies",
    "Systems",
    "Solutions",
    "Services",
    "Enterprises",
  ]

  // Remove common suffixes and clean the name
  let cleanName = companyName.trim()

  // Remove suffixes (case-insensitive)
  for (const suffix of suffixes) {
    const regex = new RegExp(`\\b${suffix}\\b\\.?$`, "i")
    cleanName = cleanName.replace(regex, "").trim()
  }

  // Remove any remaining trailing periods or commas
  cleanName = cleanName.replace(/[.,]+$/, "").trim()

  // Strategy 1: Try first word only (e.g., "Apple" → "apple.com")
  const firstWord = cleanName.split(/\s+/)[0]
  if (firstWord) {
    const firstWordDomain = firstWord.toLowerCase().replace(/[^a-z0-9]/g, "")
    if (firstWordDomain) {
      domains.push(`${firstWordDomain}.com`)
    }
  }

  // Strategy 2: Try first two words (e.g., "American Express" → "americanexpress.com")
  const words = cleanName.split(/\s+/)
  if (words.length >= 2) {
    const twoWords = words.slice(0, 2).join("")
    const twoWordsDomain = twoWords.toLowerCase().replace(/[^a-z0-9]/g, "")
    if (twoWordsDomain && twoWordsDomain !== domains[0]?.replace(".com", "")) {
      domains.push(`${twoWordsDomain}.com`)
    }
  }

  // Strategy 3: Try full name without spaces (e.g., "Bank of America" → "bankofamerica.com")
  if (words.length >= 2) {
    const fullName = words.join("")
    const fullNameDomain = fullName.toLowerCase().replace(/[^a-z0-9]/g, "")
    if (
      fullNameDomain &&
      fullNameDomain !== domains[0]?.replace(".com", "") &&
      fullNameDomain !== domains[1]?.replace(".com", "") &&
      fullNameDomain.length <= 30 // Avoid extremely long domains
    ) {
      domains.push(`${fullNameDomain}.com`)
    }
  }

  return domains
}

// Stock ticker overrides for better logo matching
// These take precedence over Alpha Vantage's OfficialSite to avoid API limits
const stockDomainOverrides: Record<string, string> = {
  // Tech Giants
  AAPL: "apple.com.cn",
  MSFT: "office.com",
  GOOGL: "google.com",
  GOOG: "google.com",
  META: "meta.com",
  AMZN: "amazon.com",
  NVDA: "nvidia.com",
  TSLA: "tesla.com",
  NFLX: "netflix.com",

  // More Tech
  AMD: "amd.com",
  INTC: "intel.com",
  ORCL: "oracle.com",
  ADBE: "adobe.com",
  CRM: "salesforce.com",
  PYPL: "paypal.com",
  CSCO: "cisco.com",
  IBM: "ibm.com",
  AVGO: "broadcom.com",
  QCOM: "qualcomm.com",
  TXN: "ti.com",
  UBER: "uber.com",
  SHOP: "shopify.com",
  SQ: "square.com",
  SNAP: "snap.com",
  SPOT: "spotify.com",
  TWTR: "twitter.com",
  ZM: "zoom.com",
  DOCU: "docusign.com",
  PLTR: "palantir.com",
  APP: "applovin.com",
  INTU: "intuit.com",
  NOW: "service-now.com",
  ACN: "accenture.com",
  PANW: "paloaltonetworks.com",
  CRWD: "crowdstrike.com",
  AMAT: "appliedmaterials.com",
  LRCX: "lamresearch.com",
  MU: "micron.com",
  KLAC: "kla.com",
  ADI: "analog.com",
  CDNS: "cadence.com",
  MSTR: "microstrategy.com",

  // Financial
  JPM: "jpmorganchase.com",
  BAC: "bankofamerica.com",
  WFC: "wellsfargo.com",
  GS: "goldmansachs.com",
  MS: "morganstanley.com",
  C: "citi.com",
  V: "visa.com",
  MA: "mastercard.com",
  AXP: "americanexpress.com",
  SCHW: "schwab.com",
  BLK: "blackrock.com",
  SPGI: "spglobal.com",
  BX: "blackstone.com",
  COF: "capitalone.com",
  RY: "royalbank.com",
  PGR: "progressive.com",
  ADP: "adp.com",
  MMC: "marshmclennan.com",

  // Consumer
  WMT: "walmart.com",
  HD: "homedepot.com",
  DIS: "disney.com",
  NKE: "nike.com",
  MCD: "mcdonalds.com",
  SBUX: "starbucks.com",
  KO: "coca-cola.com",
  PEP: "pepsi.com",
  PG: "pg.com",
  COST: "costco.com",
  TGT: "target.com",
  LOW: "lowes.com",
  TJX: "tjx.com",
  CVX: "chevron.com",
  XOM: "exxonmobil.com",
  LIN: "linde.com",
  BKNG: "booking.com",
  PM: "pmi.com",
  PMI: "pmi.com",
  MDLZ: "mondelez-professional.de",
  COP: "conocophillips.com",

  // Healthcare
  JNJ: "jnj.com",
  PFE: "pfizer.com",
  UNH: "unitedhealthgroup.com",
  CVS: "cvs.com",
  ABBV: "abbvie.com",
  MRK: "merck.com",
  TMO: "thermofisher.com",
  ABT: "abbott.com",
  MDT: "medtronic.com",
  DHR: "danaher.com",
  LLY: "lilly.com",
  BMY: "bms.com",
  ISRG: "intuitive.com",
  AMGN: "amgen.com",
  GILD: "gilead.com",
  VRTX: "vertexpharmaceuticals.com",
  BSX: "bostonscientific.com",
  SYK: "stryker.com",

  // Industrial
  BA: "boeing.com",
  CAT: "caterpillar.com",
  GE: "ge.com",
  HON: "honeywell.com",
  UPS: "ups.com",
  FDX: "fedex.com",
  LMT: "lockheedmartin.com",
  RTX: "rtx.com",
  MMM: "3m.com",
  CRH: "crh.com",
  UNP: "up.com",
  ETN: "eaton.com",
  DE: "deere.com",

  // Telecom/Media
  T: "att.com",
  VZ: "verizon.com",
  CMCSA: "comcast.com",
  TMUS: "t-mobile.com",

  // Utilities/Energy
  NEE: "nexteraenergy.com",

  // Berkshire variants
  "BRK.A": "berkshirehathaway.com",
  "BRK.B": "berkshirehathaway.com",
  "BRK-A": "berkshirehathaway.com",
  "BRK-B": "berkshirehathaway.com",
}

// Export for use in other components
export { stockDomainOverrides }

// Map ETF tickers to their provider domains for logo.dev API
const etfProviderDomains: Record<string, string> = {
  // Vanguard ETFs
  VOO: "vanguard.com",
  VTI: "vanguard.com",
  VTV: "vanguard.com",
  VUG: "vanguard.com",
  VIG: "vanguard.com",
  VYM: "vanguard.com",
  BND: "vanguard.com",
  VXUS: "vanguard.com",
  VNQ: "vanguard.com",
  VO: "vanguard.com",
  VB: "vanguard.com",
  VEA: "vanguard.com",
  VWO: "vanguard.com",
  VTEB: "vanguard.com",
  VGT: "vanguard.com",

  // BlackRock/iShares ETFs
  IVV: "blackrock.com",
  IWM: "blackrock.com",
  EFA: "blackrock.com",
  AGG: "blackrock.com",
  IEMG: "blackrock.com",
  IJH: "blackrock.com",
  IJR: "blackrock.com",
  IEFA: "blackrock.com",
  EEM: "blackrock.com",
  IWF: "blackrock.com",
  IWD: "blackrock.com",
  LQD: "blackrock.com",
  TIP: "blackrock.com",
  HYG: "blackrock.com",
  MUB: "blackrock.com",

  // State Street (SPDR) ETFs
  SPY: "statestreet.com",
  GLD: "statestreet.com",
  XLF: "statestreet.com",
  XLE: "statestreet.com",
  XLK: "statestreet.com",
  XLV: "statestreet.com",
  XLI: "statestreet.com",
  XLY: "statestreet.com",
  XLP: "statestreet.com",
  XLB: "statestreet.com",
  XLU: "statestreet.com",
  XLRE: "statestreet.com",
  MDY: "statestreet.com",
  DIA: "statestreet.com",

  // Invesco ETFs
  QQQ: "invesco.com",
  QQQM: "invesco.com",  // Invesco NASDAQ 100 ETF (lower fee version of QQQ)
  RSP: "invesco.com",
  PBW: "invesco.com",
  QQM: "invesco.com",
  QQEW: "invesco.com",
  SPHQ: "invesco.com",

  // ARK Invest ETFs
  ARKK: "ark-invest.com",
  ARKG: "ark-invest.com",
  ARKW: "ark-invest.com",
  ARKF: "ark-invest.com",
  ARKQ: "ark-invest.com",
  ARKX: "ark-invest.com",

  // Fidelity ETFs
  FDIS: "fidelity.com",
  FTEC: "fidelity.com",
  FHLC: "fidelity.com",
  FNCL: "fidelity.com",
  FCOM: "fidelity.com",
  FIDU: "fidelity.com",
  FENY: "fidelity.com",
  FMAT: "fidelity.com",
  FSTA: "fidelity.com",
  FUTY: "fidelity.com",
  FREL: "fidelity.com",
  FDVV: "fidelity.com",
  FVAL: "fidelity.com",
  ONEQ: "fidelity.com",
  FBND: "fidelity.com",
  FXNAX: "fidelity.com",
  FDLO: "fidelity.com",
  FDRR: "fidelity.com",

  // ProShares ETFs
  TQQQ: "proshares.com",
  SQQQ: "proshares.com",
  UPRO: "proshares.com",
  QLD: "proshares.com",
  SPXU: "proshares.com",
  SH: "proshares.com",

  // Charles Schwab ETFs
  SCHB: "schwab.com",
  SCHX: "schwab.com",
  SCHD: "schwab.com",
  SCHF: "schwab.com",
  SCHE: "schwab.com",
  SCHM: "schwab.com",
  SCHA: "schwab.com",
  SCHG: "schwab.com",
  SCHV: "schwab.com",
  SCHH: "schwab.com",

  // WisdomTree ETFs
  DXJ: "wisdomtree.com",
  HEDJ: "wisdomtree.com",
  EPI: "wisdomtree.com",
  DHS: "wisdomtree.com",

  // VanEck ETFs
  GDX: "vaneck.com",
  GDXJ: "vaneck.com",
  SMH: "vaneck.com",
  MOAT: "vaneck.com",

  // First Trust ETFs
  FDN: "ftportfolios.com",
  FXL: "ftportfolios.com",
  FXH: "ftportfolios.com",
  FXI: "ftportfolios.com",
}

// Map mutual fund tickers to their provider domains for logo.dev API
const mutualFundProviderDomains: Record<string, string> = {
  // Vanguard Mutual Funds
  VFFVX: "vanguard.com", // Target Retirement 2055
  VTSAX: "vanguard.com", // Total Stock Market Index Admiral
  VTIAX: "vanguard.com", // Total International Stock Index Admiral
  VFIAX: "vanguard.com", // 500 Index Admiral
  VFIFX: "vanguard.com", // Target Retirement 2050
  VFORX: "vanguard.com", // Target Retirement 2040
  VTHRX: "vanguard.com", // Target Retirement 2030
  VTTSX: "vanguard.com", // Target Retirement 2060
  VTIVX: "vanguard.com", // Target Retirement Income
  VBIAX: "vanguard.com", // Balanced Index Admiral
  VWELX: "vanguard.com", // Wellington

  // Fidelity Mutual Funds
  FZROX: "fidelity.com", // ZERO Total Market Index
  FXAIX: "fidelity.com", // 500 Index
  FBALX: "fidelity.com", // Balanced
  FDKLX: "fidelity.com", // Freedom 2060

  // Schwab Mutual Funds
  SWTSX: "schwab.com", // Total Stock Market Index
  SWPPX: "schwab.com", // S&P 500 Index

  // T. Rowe Price Mutual Funds
  TRRBX: "troweprice.com", // Retirement 2040
}

// Map institution keys to local logo paths (stored in /public/logos/institutions/)
const institutionLogoPaths: Record<string, string | null> = {
  ally: "/logos/institutions/ally.png",
  amex: "/logos/institutions/amex.png",
  bofa: "/logos/institutions/bofa.png",
  betterment: "/logos/institutions/betterment.png",
  "capital-one": "/logos/institutions/capital-one.png",
  carta: "/logos/institutions/carta.png",
  schwab: "/logos/institutions/schwab.png",
  chase: "/logos/institutions/chase.png",
  citi: "/logos/institutions/citi.png",
  etrade: "/logos/institutions/etrade.png",
  fidelity: "/logos/institutions/fidelity.png",
  merrill: "/logos/institutions/merrill.png",
  pnc: "/logos/institutions/pnc.png",
  robinhood: "/logos/institutions/robinhood.png",
  "td-ameritrade": "/logos/institutions/td-ameritrade.png",
  vanguard: "/logos/institutions/vanguard.png",
  wealthfront: "/logos/institutions/wealthfront.png",
  "wells-fargo": "/logos/institutions/wells-fargo.png",
  other: null, // No logo for "Other"
}

/**
 * Get the logo URL for an institution (uses local assets)
 * @param institutionKey - The institution key (e.g., "fidelity", "vanguard")
 * @returns The local logo path or null if not available
 */
export function getInstitutionLogoUrl(institutionKey: string): string | null {
  return institutionLogoPaths[institutionKey] || null
}

/**
 * Get the logo URL for a stock ticker using the logo.dev API
 * @param ticker - The stock ticker symbol
 * @param domain - Optional company domain/website URL
 * @returns The logo URL
 */
export function getTickerLogoUrl(
  ticker: string,
  domain?: string,
): string | null {
  const token = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN

  if (!ticker || !token) return null

  const upperTicker = ticker.toUpperCase()

  // 1. Check for stock domain overrides first
  const override = stockDomainOverrides[upperTicker]
  if (override) {
    return `https://img.logo.dev/${override}?token=${token}&retina=true&fallback=monogram&format=webp&size=400`
  }

  // 2. If domain is provided (from Alpha Vantage), use it
  if (domain) {
    // Extract domain from full URL (e.g., "https://www.ibm.com" → "ibm.com")
    let cleanDomain = domain
      .replace(/^https?:\/\/(www\.)?/, "")
      .replace(/\/$/, "")

    // Map ssga.com domains to statestreet.com for proper logo display
    if (cleanDomain === "ssga.com" || cleanDomain.endsWith(".ssga.com")) {
      cleanDomain = "statestreet.com"
    }

    return `https://img.logo.dev/${cleanDomain}?token=${token}&retina=true&fallback=monogram&format=webp&size=400`
  }

  // 3. Check if it's an ETF and use the provider domain
  let etfDomain = etfProviderDomains[upperTicker]
  if (etfDomain) {
    // Map ssga.com domains to statestreet.com for proper logo display
    if (etfDomain === "ssga.com" || etfDomain.endsWith(".ssga.com")) {
      etfDomain = "statestreet.com"
    }
    return `https://img.logo.dev/${etfDomain}?token=${token}&retina=true&fallback=monogram&format=webp&size=400`
  }

  // 4. Check if it's a mutual fund and use the provider domain
  const mutualFundDomain = mutualFundProviderDomains[upperTicker]
  if (mutualFundDomain) {
    return `https://img.logo.dev/${mutualFundDomain}?token=${token}&retina=true&fallback=monogram&format=webp&size=400`
  }

  // 5. Return null for unknown (will trigger API lookup or use fallback)
  return null
}

/**
 * Batch fetch logo URLs with caching support (client-side only)
 * @param tickers - Array of ticker symbols
 * @param domains - Optional array of company domains (parallel to tickers)
 * @returns Promise resolving to map of ticker -> logo URL
 */
export async function getCachedLogoUrls(
  tickers: string[],
  domains?: (string | undefined)[]
): Promise<Record<string, string | null>> {
  try {
    const response = await fetch("/api/logo-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tickers, domains }),
    })

    if (!response.ok) {
      console.error("Failed to fetch logo URLs from cache")
      // Fallback to direct URL generation
      const fallbackResults: Record<string, string | null> = {}
      tickers.forEach((ticker, index) => {
        fallbackResults[ticker.toUpperCase()] = getTickerLogoUrl(
          ticker,
          domains?.[index]
        )
      })
      return fallbackResults
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching cached logo URLs:", error)
    // Fallback to direct URL generation
    const fallbackResults: Record<string, string | null> = {}
    tickers.forEach((ticker, index) => {
      fallbackResults[ticker.toUpperCase()] = getTickerLogoUrl(
        ticker,
        domains?.[index]
      )
    })
    return fallbackResults
  }
}
