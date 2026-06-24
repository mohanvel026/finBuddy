const axios = require('axios');

/**
 * Fetch the current live spot price for a given ticker symbol.
 */
const getLivePrice = async (symbol) => {
  try {
    let targetSymbol = symbol.trim().toUpperCase();
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${targetSymbol}?range=1d&interval=1m`;
    const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 5000 });
    return res.data?.chart?.result?.[0]?.meta?.regularMarketPrice || null;
  } catch (err) {
    console.warn(`Yahoo Live price fetch failed for ${symbol}:`, err.message);
    return null;
  }
};

/**
 * Fetch daily OHLCV candlestick data for backtesting and strategy lab.
 */
const fetchHistoricalData = async (symbol, fromDate, toDate) => {
  let targetSymbol = symbol.trim().toUpperCase();
  // Safe default for standard Indian stock queries without Bo/NSE suffix
  const US_STOCKS = [
    'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX', 
    'BRK.B', 'BRK.A', 'AMD', 'JPM', 'V', 'MA', 'DIS', 'PYPL', 'BABA', 'WMT', 
    'KO', 'PEP', 'SPY', 'QQQ', 'INTC', 'CSCO', 'ADBE', 'ORCL', 'CMG', 'COIN',
    'GC=F', 'SI=F'
  ];
  if (!targetSymbol.includes('.') && !US_STOCKS.includes(targetSymbol)) {
    targetSymbol = `${targetSymbol}.NS`;
  }
  const from = Math.floor(new Date(fromDate).getTime() / 1000);
  const to = Math.floor(new Date(toDate).getTime() / 1000);

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${targetSymbol}?period1=${from}&period2=${to}&interval=1d`;

  try {
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000
    });

    const chart = res.data?.chart?.result?.[0];
    if (!chart) return null;

    const timestamps = chart.timestamp || [];
    const ohlcv = chart.indicators?.quote?.[0] || {};

    return timestamps.map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().split('T')[0],
      open: ohlcv.open?.[i],
      high: ohlcv.high?.[i],
      low: ohlcv.low?.[i],
      close: ohlcv.close?.[i],
      volume: ohlcv.volume?.[i]
    })).filter(c => c.close != null && c.high != null && c.low != null);
  } catch (err) {
    console.error(`Yahoo chart fetch error for ${targetSymbol}:`, err.message);
    return null;
  }
};

/**
 * Autocomplete search for ticker symbols from Yahoo.
 */
const searchSymbols = async (q) => {
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&newsCount=0`;
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 5000
    });
    return response.data?.quotes || [];
  } catch (err) {
    console.error(`Yahoo autocomplete search error for query '${q}':`, err.message);
    return [];
  }
};

/**
 * Fetch live quotes for multiple symbols concurrently using v8 chart endpoint
 */
const getMultipleLiveQuotes = async (symbolsArray) => {
  try {
    const US_STOCKS = [
      'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX', 
      'BRK.B', 'BRK.A', 'AMD', 'JPM', 'V', 'MA', 'DIS', 'PYPL', 'BABA', 'WMT', 
      'KO', 'PEP', 'SPY', 'QQQ', 'INTC', 'CSCO', 'ADBE', 'ORCL', 'CMG', 'COIN',
      'GC=F', 'SI=F'
    ];

    const promises = symbolsArray.map(async (symbol) => {
      try {
        const upperSymbol = symbol.toUpperCase();
        let targetYahooSymbol = upperSymbol;
        if (upperSymbol === 'GOLD') targetYahooSymbol = 'GC=F';
        else if (upperSymbol === 'SILVER') targetYahooSymbol = 'SI=F';
        else {
          const isCleanIndianStock = !symbol.includes('.') && !US_STOCKS.includes(upperSymbol);
          targetYahooSymbol = isCleanIndianStock ? `${upperSymbol}.NS` : upperSymbol;
        }

        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${targetYahooSymbol}?range=1d&interval=1d`;
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 5000 });
        const meta = res.data?.chart?.result?.[0]?.meta;
        if (!meta) return null;

        let price = meta.regularMarketPrice || 0;
        let prevClose = meta.chartPreviousClose || meta.previousClose || price;
        let change = price - prevClose;
        let changePercent = prevClose !== 0 ? ((price - prevClose) / prevClose) * 100 : 0;

        // Convert Gold / Silver USD ounce to INR gram
        if (upperSymbol === 'GOLD') {
          const pricePerGramUSD = price / 31.1035;
          price = pricePerGramUSD * 83.5;
          change = (change / 31.1035) * 83.5;
        } else if (upperSymbol === 'SILVER') {
          const pricePerGramUSD = price / 31.1035;
          price = pricePerGramUSD * 83.5;
          change = (change / 31.1035) * 83.5;
        }

        const open = meta.regularMarketOpen || price;
        const high = meta.regularMarketDayHigh || price;
        const low = meta.regularMarketDayLow || price;
        const volume = meta.regularMarketVolume || 0;
        const avgVolume = meta.averageDailyVolume3Month || volume;
        const marketCap = meta.marketCap || 0;
        const trailingPE = meta.trailingPE || null;
        const fiftyTwoWeekHigh = meta.fiftyTwoWeekHigh || price;
        const fiftyTwoWeekLow = meta.fiftyTwoWeekLow || price;

        return {
          symbol: symbol,
          yahooSymbol: meta.symbol,
          name: upperSymbol === 'GOLD' ? 'Gold Spot' : upperSymbol === 'SILVER' ? 'Silver Spot' : (meta.symbol?.replace('.NS', '').replace('.BO', '')),
          price: parseFloat(price.toFixed(2)),
          change: parseFloat(change.toFixed(2)),
          changePercent: Math.round(changePercent * 100) / 100,
          isUp: changePercent >= 0,
          regularMarketPrice: parseFloat(price.toFixed(2)),
          regularMarketChangePercent: changePercent,
          regularMarketOpen: open,
          regularMarketDayHigh: high,
          regularMarketDayLow: low,
          regularMarketVolume: volume,
          averageVolume: avgVolume,
          marketCap: marketCap,
          trailingPE: trailingPE ? parseFloat(trailingPE.toFixed(1)) : null,
          fiftyTwoWeekHigh: parseFloat(fiftyTwoWeekHigh.toFixed(2)),
          fiftyTwoWeekLow: parseFloat(fiftyTwoWeekLow.toFixed(2))
        };
      } catch (err) {
        console.warn(`Failed to fetch quote for ${symbol}:`, err.message);
        return null;
      }
    });

    const results = await Promise.all(promises);
    return results.filter(Boolean);
  } catch (err) {
    console.error('getMultipleLiveQuotes failed:', err.message);
    return [];
  }
};

module.exports = { getLivePrice, fetchHistoricalData, searchSymbols, getMultipleLiveQuotes };

