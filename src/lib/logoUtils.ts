// Logo utility functions for fetching institution and ticker logos

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

  // Telecom/Media
  T: "att.com",
  VZ: "verizon.com",
  CMCSA: "comcast.com",
  TMUS: "t-mobile.com",

  // Berkshire variants
  // Note: BRK.B and BRK-B use custom text logo in components
  "BRK.A": "berkshirehathaway.com",
  // "BRK.B": "berkshirehathaway.com",  // Using custom BH text logo
  "BRK-A": "berkshirehathaway.com",
  // "BRK-B": "berkshirehathaway.com",  // Using custom BH text logo
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

// Map institution names to their domain names for logo.dev API
const institutionDomains: Record<string, string | null> = {
  "Ally Bank": "ally.com",
  "American Express": "americanexpress.com",
  "Bank of America": "bankofamerica.com",
  Betterment: "betterment.com",
  "Capital One": "capitalone.com",
  "Charles Schwab": "schwab.com",
  Chase: "chase.com",
  Citibank: "citi.com",
  "E*TRADE": "etrade.com",
  "Fidelity Investments": "fidelity.com",
  "Merrill Edge": "ml.com",
  "PNC Bank": "pnc.com",
  Robinhood: "robinhood.com",
  "TD Ameritrade": "tdameritrade.com",
  Vanguard: "vanguard.com",
  Wealthfront: "wealthfront.com",
  "Wells Fargo": "wellsfargo.com",
  Other: null, // No logo for "Other"
}

/**
 * Get the logo URL for an institution using the logo.dev API
 * @param institution - The name of the institution
 * @returns The logo URL or null if not available
 */
export function getInstitutionLogoUrl(institution: string): string | null {
  const domain = institutionDomains[institution]
  const token = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN

  if (!domain || !token) return null

  // Logo.dev API with optimized parameters for high resolution
  return `https://img.logo.dev/${domain}?token=${token}&retina=true&fallback=monogram&format=webp&size=400`
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

  // 4. Return null for unknown (will trigger API lookup or use fallback)
  return null
}
