// Popular stock and ETF tickers for the selector

export interface TickerOption {
  symbol: string
  name: string
  type: "stock" | "etf"
}

export const popularTickers = [
  // Popular Stocks
  { symbol: "AAPL", name: "Apple Inc.", type: "stock" },
  { symbol: "MSFT", name: "Microsoft Corporation", type: "stock" },
  { symbol: "GOOGL", name: "Alphabet Inc. Class A", type: "stock" },
  { symbol: "AMZN", name: "Amazon.com Inc.", type: "stock" },
  { symbol: "META", name: "Meta Platforms Inc.", type: "stock" },
  { symbol: "NVDA", name: "NVIDIA Corporation", type: "stock" },
  { symbol: "TSLA", name: "Tesla Inc.", type: "stock" },
  { symbol: "BRK.B", name: "Berkshire Hathaway B", type: "stock" },
  { symbol: "JPM", name: "JPMorgan Chase", type: "stock" },
  { symbol: "V", name: "Visa Inc.", type: "stock" },
  { symbol: "MA", name: "Mastercard", type: "stock" },
  { symbol: "JNJ", name: "Johnson & Johnson", type: "stock" },
  { symbol: "WMT", name: "Walmart Inc.", type: "stock" },
  { symbol: "PG", name: "Procter & Gamble", type: "stock" },
  { symbol: "UNH", name: "UnitedHealth Group", type: "stock" },
  { symbol: "HD", name: "Home Depot", type: "stock" },
  { symbol: "DIS", name: "Walt Disney", type: "stock" },
  { symbol: "BAC", name: "Bank of America", type: "stock" },
  { symbol: "NFLX", name: "Netflix Inc.", type: "stock" },
  { symbol: "ADBE", name: "Adobe Inc.", type: "stock" },
  { symbol: "CRM", name: "Salesforce Inc.", type: "stock" },
  { symbol: "PFE", name: "Pfizer Inc.", type: "stock" },
  { symbol: "ABBV", name: "AbbVie Inc.", type: "stock" },
  { symbol: "KO", name: "Coca-Cola", type: "stock" },
  { symbol: "PEP", name: "PepsiCo", type: "stock" },
  { symbol: "CVX", name: "Chevron", type: "stock" },
  { symbol: "XOM", name: "ExxonMobil", type: "stock" },
  { symbol: "COST", name: "Costco", type: "stock" },
  { symbol: "NKE", name: "Nike Inc.", type: "stock" },
  { symbol: "MCD", name: "McDonald's", type: "stock" },
  { symbol: "INTC", name: "Intel Corporation", type: "stock" },
  { symbol: "AMD", name: "Advanced Micro Devices", type: "stock" },
  { symbol: "PYPL", name: "PayPal Holdings", type: "stock" },
  { symbol: "CSCO", name: "Cisco Systems", type: "stock" },
  { symbol: "ORCL", name: "Oracle Corporation", type: "stock" },
  { symbol: "IBM", name: "IBM Corporation", type: "stock" },
  { symbol: "GE", name: "General Electric", type: "stock" },
  { symbol: "BA", name: "Boeing", type: "stock" },
  { symbol: "CAT", name: "Caterpillar", type: "stock" },
  { symbol: "GS", name: "Goldman Sachs", type: "stock" },

  // Popular ETFs
  { symbol: "SPY", name: "SPDR S&P 500 ETF", type: "etf" },
  { symbol: "VOO", name: "Vanguard S&P 500 ETF", type: "etf" },
  { symbol: "QQQ", name: "Invesco QQQ Trust", type: "etf" },
  { symbol: "QQQM", name: "Invesco NASDAQ 100 ETF", type: "etf" },
  { symbol: "VTI", name: "Vanguard Total Stock Market ETF", type: "etf" },
  { symbol: "IVV", name: "iShares Core S&P 500 ETF", type: "etf" },
  { symbol: "VEA", name: "Vanguard Developed Markets ETF", type: "etf" },
  { symbol: "IEFA", name: "iShares Core MSCI EAFE ETF", type: "etf" },
  { symbol: "VWO", name: "Vanguard Emerging Markets ETF", type: "etf" },
  { symbol: "BND", name: "Vanguard Total Bond Market ETF", type: "etf" },
  { symbol: "AGG", name: "iShares Core US Aggregate Bond ETF", type: "etf" },
  { symbol: "VUG", name: "Vanguard Growth ETF", type: "etf" },
  { symbol: "VTV", name: "Vanguard Value ETF", type: "etf" },
  { symbol: "IWF", name: "iShares Russell 1000 Growth ETF", type: "etf" },
  { symbol: "IWD", name: "iShares Russell 1000 Value ETF", type: "etf" },
  { symbol: "VIG", name: "Vanguard Dividend Appreciation ETF", type: "etf" },
  { symbol: "VYM", name: "Vanguard High Dividend Yield ETF", type: "etf" },
  { symbol: "SCHD", name: "Schwab US Dividend Equity ETF", type: "etf" },
  { symbol: "GLD", name: "SPDR Gold Trust", type: "etf" },
  { symbol: "IWM", name: "iShares Russell 2000 ETF", type: "etf" },
  { symbol: "EFA", name: "iShares MSCI EAFE ETF", type: "etf" },
  { symbol: "EEM", name: "iShares MSCI Emerging Markets ETF", type: "etf" },
  { symbol: "VXUS", name: "Vanguard Total Intl Stock ETF", type: "etf" },
  { symbol: "VNQ", name: "Vanguard Real Estate ETF", type: "etf" },
  { symbol: "ARKK", name: "ARK Innovation ETF", type: "etf" },
  { symbol: "XLF", name: "Financial Select Sector SPDR", type: "etf" },
  { symbol: "XLK", name: "Technology Select Sector SPDR", type: "etf" },
  { symbol: "XLE", name: "Energy Select Sector SPDR", type: "etf" },
  { symbol: "XLV", name: "Health Care Select Sector SPDR", type: "etf" },
  { symbol: "VGT", name: "Vanguard Info Tech ETF", type: "etf" },
  { symbol: "IJH", name: "iShares Core S&P Mid-Cap ETF", type: "etf" },
  { symbol: "IJR", name: "iShares Core S&P Small-Cap ETF", type: "etf" },
  { symbol: "VO", name: "Vanguard Mid-Cap ETF", type: "etf" },
  { symbol: "VB", name: "Vanguard Small-Cap ETF", type: "etf" },
  { symbol: "IEMG", name: "iShares Emerging Markets ETF", type: "etf" },
  { symbol: "TIP", name: "iShares TIPS Bond ETF", type: "etf" },
  { symbol: "LQD", name: "iShares Investment Grade Bond ETF", type: "etf" },
  { symbol: "HYG", name: "iShares High Yield Bond ETF", type: "etf" },
  { symbol: "MUB", name: "iShares National Muni Bond ETF", type: "etf" },
  { symbol: "SCHX", name: "Schwab US Large-Cap ETF", type: "etf" },
  { symbol: "SCHB", name: "Schwab US Broad Market ETF", type: "etf" },
] as TickerOption[]

popularTickers.sort((a, b) => {
  // Sort by type (stocks first) then alphabetically
  if (a.type !== b.type) {
    return a.type === "stock" ? -1 : 1
  }
  return a.symbol.localeCompare(b.symbol)
})