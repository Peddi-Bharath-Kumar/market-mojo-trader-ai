
interface APICredentials {
  // Financial data APIs
  alphaVantage?: {
    apiKey: string;
  };
  finnhub?: {
    apiKey: string;
  };
  newsAPI?: {
    apiKey: string;
  };
  // Social sentiment APIs
  twitterAPI?: {
    bearerToken: string;
  };
  polygonIO?: {
    apiKey: string;
  };
}

interface RealTimePrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
}

interface NewsData {
  title: string;
  description: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  source: string;
  publishedAt: string;
}

interface TechnicalData {
  rsi: number;
  macd: {
    value: number;
    signal: number;
    histogram: number;
  };
  sma20: number;
  ema12: number;
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    position: number; // 0-1 where price is between bands
  };
  stochastic: {
    k: number;
    d: number;
  };
}

export class RealDataService {
  private credentials: APICredentials = {};
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTime = 30000; // 30 seconds cache

  setCredentials(creds: APICredentials) {
    this.credentials = creds;
    console.log('📡 Real data API credentials configured');
  }

  private isValidCache(key: string): boolean {
    const cached = this.cache.get(key);
    return cached ? (Date.now() - cached.timestamp) < this.cacheTime : false;
  }

  // Alpha Vantage for technical indicators
  async getTechnicalIndicators(symbol: string): Promise<TechnicalData> {
    const cacheKey = `tech_${symbol}`;
    if (this.isValidCache(cacheKey)) {
      return this.cache.get(cacheKey)!.data;
    }

    if (!this.credentials.alphaVantage?.apiKey) {
      console.warn('Alpha Vantage API key not configured, using enhanced simulation');
      return this.getSimulatedTechnicalData(symbol);
    }

    try {
      const [rsiData, macdData, smaData, emaData, bbData, stochData] = await Promise.all([
        this.fetchAlphaVantageIndicator(symbol, 'RSI'),
        this.fetchAlphaVantageIndicator(symbol, 'MACD'),
        this.fetchAlphaVantageIndicator(symbol, 'SMA', { time_period: 20 }),
        this.fetchAlphaVantageIndicator(symbol, 'EMA', { time_period: 12 }),
        this.fetchAlphaVantageIndicator(symbol, 'BBANDS'),
        this.fetchAlphaVantageIndicator(symbol, 'STOCH')
      ]);

      const technicalData: TechnicalData = {
        rsi: this.extractLatestValue(rsiData, 'RSI'),
        macd: {
          value: this.extractLatestValue(macdData, 'MACD'),
          signal: this.extractLatestValue(macdData, 'MACD_Signal'),
          histogram: this.extractLatestValue(macdData, 'MACD_Hist')
        },
        sma20: this.extractLatestValue(smaData, 'SMA'),
        ema12: this.extractLatestValue(emaData, 'EMA'),
        bollingerBands: {
          upper: this.extractLatestValue(bbData, 'Real Upper Band'),
          middle: this.extractLatestValue(bbData, 'Real Middle Band'),
          lower: this.extractLatestValue(bbData, 'Real Lower Band'),
          position: 0.5 // Calculate based on current price
        },
        stochastic: {
          k: this.extractLatestValue(stochData, 'SlowK'),
          d: this.extractLatestValue(stochData, 'SlowD')
        }
      };

      this.cache.set(cacheKey, { data: technicalData, timestamp: Date.now() });
      console.log(`📊 Real technical data fetched for ${symbol}`);
      return technicalData;

    } catch (error) {
      console.error('Technical data fetch failed:', error);
      return this.getSimulatedTechnicalData(symbol);
    }
  }

  private async fetchAlphaVantageIndicator(symbol: string, indicator: string, params: any = {}) {
    const baseUrl = 'https://www.alphavantage.co/query';
    const queryParams = new URLSearchParams({
      function: indicator,
      symbol: symbol,
      interval: 'daily',
      apikey: this.credentials.alphaVantage!.apiKey,
      ...params
    });

    const response = await fetch(`${baseUrl}?${queryParams}`);
    if (!response.ok) throw new Error(`Alpha Vantage API error: ${response.status}`);
    
    return response.json();
  }

  private extractLatestValue(data: any, key: string): number {
    const timeSeries = data[`Technical Analysis: ${key}`] || data[Object.keys(data)[1]];
    if (!timeSeries) return 0;
    
    const dates = Object.keys(timeSeries).sort().reverse();
    const latestData = timeSeries[dates[0]];
    return parseFloat(latestData[key] || latestData[Object.keys(latestData)[0]] || '0');
  }

  // Finnhub for real-time prices
  async getRealTimePrice(symbol: string): Promise<RealTimePrice> {
    const cacheKey = `price_${symbol}`;
    if (this.isValidCache(cacheKey)) {
      return this.cache.get(cacheKey)!.data;
    }

    if (!this.credentials.finnhub?.apiKey) {
      console.warn('Finnhub API key not configured, using market simulation');
      return this.getSimulatedPrice(symbol);
    }

    try {
      const [quoteResponse, candlesResponse] = await Promise.all([
        fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${this.credentials.finnhub.apiKey}`),
        fetch(`https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${Math.floor(Date.now() / 1000) - 86400}&to=${Math.floor(Date.now() / 1000)}&token=${this.credentials.finnhub.apiKey}`)
      ]);

      const quote = await quoteResponse.json();
      const candles = await candlesResponse.json();

      const priceData: RealTimePrice = {
        symbol,
        price: quote.c || 0, // Current price
        change: quote.d || 0, // Change
        changePercent: quote.dp || 0, // Change percent
        volume: candles.v?.[candles.v.length - 1] || 0,
        timestamp: Date.now()
      };

      this.cache.set(cacheKey, { data: priceData, timestamp: Date.now() });
      console.log(`💰 Real price data fetched for ${symbol}: ₹${priceData.price}`);
      return priceData;

    } catch (error) {
      console.error('Price data fetch failed:', error);
      return this.getSimulatedPrice(symbol);
    }
  }

  // News API for market sentiment
  async getMarketSentiment(query: string = 'stock market india'): Promise<NewsData[]> {
    const cacheKey = `news_${query}`;
    if (this.isValidCache(cacheKey)) {
      return this.cache.get(cacheKey)!.data;
    }

    if (!this.credentials.newsAPI?.apiKey) {
      console.warn('News API key not configured, using simulated sentiment');
      return this.getSimulatedNews();
    }

    try {
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&pageSize=10&apiKey=${this.credentials.newsAPI.apiKey}`
      );

      const data = await response.json();
      
      const newsData: NewsData[] = data.articles?.map((article: any) => ({
        title: article.title,
        description: article.description,
        sentiment: this.analyzeSentiment(article.title + ' ' + article.description),
        score: Math.random() * 100, // This would be replaced with actual sentiment analysis
        source: article.source.name,
        publishedAt: article.publishedAt
      })) || [];

      this.cache.set(cacheKey, { data: newsData, timestamp: Date.now() });
      console.log(`📰 Real news sentiment fetched: ${newsData.length} articles`);
      return newsData;

    } catch (error) {
      console.error('News sentiment fetch failed:', error);
      return this.getSimulatedNews();
    }
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['growth', 'profit', 'gain', 'bull', 'rise', 'up', 'strong', 'good'];
    const negativeWords = ['loss', 'fall', 'bear', 'down', 'weak', 'crash', 'decline'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  // Polygon.io for historical data and backtesting
  async getHistoricalData(symbol: string, from: string, to: string): Promise<any[]> {
    if (!this.credentials.polygonIO?.apiKey) {
      console.warn('Polygon.io API key not configured, using simulated historical data');
      return this.getSimulatedHistoricalData(symbol, from, to);
    }

    try {
      const response = await fetch(
        `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${from}/${to}?adjusted=true&sort=asc&apikey=${this.credentials.polygonIO.apiKey}`
      );

      const data = await response.json();
      console.log(`📈 Real historical data fetched for ${symbol}: ${data.results?.length || 0} data points`);
      return data.results || [];

    } catch (error) {
      console.error('Historical data fetch failed:', error);
      return this.getSimulatedHistoricalData(symbol, from, to);
    }
  }

  // Fallback simulation methods with more realistic data
  private getSimulatedTechnicalData(symbol: string): TechnicalData {
    const basePrice = this.getBasePriceForSymbol(symbol);
    const volatility = 0.02;
    
    return {
      rsi: 30 + Math.random() * 40, // More realistic RSI range
      macd: {
        value: (Math.random() - 0.5) * 2,
        signal: (Math.random() - 0.5) * 1.8,
        histogram: (Math.random() - 0.5) * 0.5
      },
      sma20: basePrice * (0.98 + Math.random() * 0.04),
      ema12: basePrice * (0.99 + Math.random() * 0.02),
      bollingerBands: {
        upper: basePrice * (1 + volatility),
        middle: basePrice,
        lower: basePrice * (1 - volatility),
        position: Math.random()
      },
      stochastic: {
        k: Math.random() * 100,
        d: Math.random() * 100
      }
    };
  }

  private getSimulatedPrice(symbol: string): RealTimePrice {
    const basePrice = this.getBasePriceForSymbol(symbol);
    const change = (Math.random() - 0.5) * basePrice * 0.03; // ±3% change
    
    return {
      symbol,
      price: basePrice + change,
      change,
      changePercent: (change / basePrice) * 100,
      volume: Math.floor(Math.random() * 1000000) + 100000,
      timestamp: Date.now()
    };
  }

  private getSimulatedNews(): NewsData[] {
    return [
      {
        title: 'Indian Stock Market Shows Strong Performance',
        description: 'Market indicators suggest positive momentum in key sectors',
        sentiment: 'positive',
        score: 75 + Math.random() * 20,
        source: 'Economic Times',
        publishedAt: new Date().toISOString()
      },
      {
        title: 'Banking Sector Analysis: Growth Prospects',
        description: 'Financial institutions report improved quarterly results',
        sentiment: 'positive',
        score: 70 + Math.random() * 25,
        source: 'Business Standard',
        publishedAt: new Date().toISOString()
      }
    ];
  }

  private getSimulatedHistoricalData(symbol: string, from: string, to: string): any[] {
    const days = Math.floor((new Date(to).getTime() - new Date(from).getTime()) / (24 * 60 * 60 * 1000));
    const basePrice = this.getBasePriceForSymbol(symbol);
    const data = [];
    
    for (let i = 0; i < days; i++) {
      const price = basePrice * (0.95 + Math.random() * 0.1); // ±5% variation
      data.push({
        c: price, // close
        h: price * (1 + Math.random() * 0.02), // high
        l: price * (1 - Math.random() * 0.02), // low
        o: price * (0.99 + Math.random() * 0.02), // open
        v: Math.floor(Math.random() * 1000000), // volume
        t: new Date(from).getTime() + (i * 24 * 60 * 60 * 1000) // timestamp
      });
    }
    
    return data;
  }

  private getBasePriceForSymbol(symbol: string): number {
    const basePrices: { [key: string]: number } = {
      'NIFTY': 19800,
      'BANKNIFTY': 45200,
      'RELIANCE': 2450,
      'TCS': 3890,
      'HDFC': 1680,
      'INFY': 1850,
      'ITC': 456,
      'ICICIBANK': 985,
      'SBIN': 625,
      'BHARTIARTL': 895,
      // Crude oil symbols
      'CL': 75, // WTI Crude
      'BZ': 78  // Brent Crude
    };
    
    return basePrices[symbol] || 100 + Math.random() * 1000;
  }

  getConnectionStatus() {
    const configuredAPIs = Object.keys(this.credentials).filter(
      key => this.credentials[key as keyof APICredentials]
    );
    
    return {
      configured: configuredAPIs,
      hasRealData: configuredAPIs.length > 0,
      supportedAPIs: ['alphaVantage', 'finnhub', 'newsAPI', 'polygonIO', 'twitterAPI']
    };
  }
}

export const realDataService = new RealDataService();
export type { APICredentials, RealTimePrice, NewsData, TechnicalData };
