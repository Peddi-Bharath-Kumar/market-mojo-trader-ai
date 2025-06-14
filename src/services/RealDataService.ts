import { APICredentials } from './TradingRobotEngine';

interface MarketTick {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  timestamp: number;
  bid: number;
  ask: number;
  ltp: number; // Last Traded Price
}

interface OptionChain {
  symbol: string;
  expiry: string;
  strikePrice: number;
  callPrice: number;
  putPrice: number;
  callVolume: number;
  putVolume: number;
  callOI: number; // Open Interest
  putOI: number;
  iv: number; // Implied Volatility
}

interface BrokerConfig {
  broker: string;
  apiKey: string;
  apiSecret: string;
  accessToken?: string;
}

interface Position {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  type: 'long' | 'short';
}

export interface NewsData {
  title: string;
  description: string;
  source: string;
  publishedAt: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  url?: string;
}

export interface TechnicalData extends TechnicalIndicators {
  // Alias for compatibility
}

export interface TechnicalIndicators {
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
    position: number;
  };
  stochastic: {
    k: number;
    d: number;
  };
  volume: number;
  volatility: number;
}

class RealDataService {
  private credentials: APICredentials = {
    alphaVantage: process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || '',
    newsAPI: process.env.NEXT_PUBLIC_NEWS_API_KEY || '',
    trueData: process.env.NEXT_PUBLIC_TRUE_DATA_API_KEY || '',
    gnews: process.env.NEXT_PUBLIC_GNEWS_API_KEY || ''
  };

  constructor() {
    console.log('🔑 Real Data Service initialized');
    console.log('Alpha Vantage API Key:', this.credentials.alphaVantage ? '✅ Configured' : '❌ Not configured');
    console.log('News API Key:', this.credentials.newsAPI ? '✅ Configured' : '❌ Not configured');
    console.log('TrueData API Key:', this.credentials.trueData ? '✅ Configured' : '❌ Not configured');
    console.log('GNews API Key:', this.credentials.gnews ? '✅ Configured' : '❌ Not configured');
  }

  getCredentials() {
    return this.credentials;
  }

  getConnectionStatus() {
    const configuredAPIs = Object.keys(this.credentials).filter(key => 
      this.credentials[key as keyof APICredentials] && 
      typeof this.credentials[key as keyof APICredentials] === 'string' &&
      this.credentials[key as keyof APICredentials] !== ''
    );

    return {
      hasRealData: configuredAPIs.length > 0,
      configured: configuredAPIs,
      totalAPIs: Object.keys(this.credentials).length
    };
  }

  async getRealTimePrice(symbol: string): Promise<{ price: number; volume: number }> {
    // Placeholder for fetching real-time price from a broker API
    // Replace with actual API call
    return new Promise(resolve => {
      setTimeout(() => {
        const price = 100 + Math.random() * 10;
        const volume = Math.floor(Math.random() * 1000);
        resolve({ price, volume });
      }, 500);
    });
  }

  async getMarketSentiment(query: string = 'indian stock market'): Promise<NewsData[]> {
    console.log(`📰 Fetching market sentiment for: "${query}"`);

    // Try GNews API first
    if (this.credentials.gnews) {
      try {
        return await this.fetchGNewsData(query);
      } catch (error) {
        console.warn('GNews API failed, falling back to simulation:', error);
      }
    }

    // Try News API
    if (this.credentials.newsAPI) {
      try {
        return await this.fetchNewsAPIData(query);
      } catch (error) {
        console.warn('News API failed, falling back to simulation:', error);
      }
    }

    // Fallback to enhanced simulation
    return this.simulateNewsData(query);
  }

  private async fetchGNewsData(query: string): Promise<NewsData[]> {
    const response = await fetch(
      `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&country=in&max=20&apikey=${this.credentials.gnews}`
    );

    if (!response.ok) {
      throw new Error(`GNews API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.articles?.map((article: any) => ({
      title: article.title,
      description: article.description || '',
      source: article.source?.name || 'Unknown',
      publishedAt: article.publishedAt,
      sentiment: this.analyzeSentiment(article.title + ' ' + article.description),
      score: Math.random() * 100, // Would use actual sentiment analysis
      url: article.url
    })) || [];
  }

  private async fetchNewsAPIData(query: string): Promise<NewsData[]> {
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&apiKey=${this.credentials.newsAPI}`
    );

    if (!response.ok) {
      throw new Error(`News API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.articles?.slice(0, 20).map((article: any) => ({
      title: article.title,
      description: article.description || '',
      source: article.source?.name || 'Unknown',
      publishedAt: article.publishedAt,
      sentiment: this.analyzeSentiment(article.title + ' ' + article.description),
      score: Math.random() * 100,
      url: article.url
    })) || [];
  }

  private simulateNewsData(query: string): NewsData[] {
    const sources = ['Economic Times', 'Business Standard', 'Moneycontrol', 'Livemint', 'CNBC-TV18'];
    const sentiments: ('positive' | 'negative' | 'neutral')[] = ['positive', 'negative', 'neutral'];
    
    return Array.from({ length: 15 }, (_, i) => ({
      title: `${query} market analysis - ${sources[i % sources.length]} report`,
      description: `Detailed analysis of ${query} trends and market movements`,
      source: sources[i % sources.length],
      publishedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
      score: 20 + Math.random() * 60
    }));
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['growth', 'bullish', 'rise', 'gain', 'profit', 'strong', 'boom'];
    const negativeWords = ['fall', 'bearish', 'decline', 'loss', 'weak', 'crash', 'drop'];
    
    const lowerText = text.toLowerCase();
    const positiveScore = positiveWords.reduce((score, word) => 
      score + (lowerText.includes(word) ? 1 : 0), 0);
    const negativeScore = negativeWords.reduce((score, word) => 
      score + (lowerText.includes(word) ? 1 : 0), 0);
    
    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  async getTechnicalIndicators(symbol: string): Promise<TechnicalIndicators> {
    console.log(`📊 Fetching technical indicators for ${symbol}...`);

    // Try Alpha Vantage first
    if (this.credentials.alphaVantage) {
      try {
        return await this.fetchAlphaVantageTechnicals(symbol);
      } catch (error) {
        console.warn('Alpha Vantage failed, falling back to simulation:', error);
      }
    }

    // Try TrueData
    if (this.credentials.trueData) {
      try {
        return await this.fetchTrueDataTechnicals(symbol);
      } catch (error) {
        console.warn('TrueData failed, falling back to simulation:', error);
      }
    }

    // Fallback to realistic simulation
    return this.simulateTechnicalIndicators(symbol);
  }

  private async fetchAlphaVantageTechnicals(symbol: string): Promise<TechnicalIndicators> {
    // Fetch multiple indicators from Alpha Vantage
    const [rsiData, macdData, smaData, emaData, bbandData, stochData] = await Promise.all([
      this.fetchAlphaVantageIndicator(symbol, 'RSI'),
      this.fetchAlphaVantageIndicator(symbol, 'MACD'),
      this.fetchAlphaVantageIndicator(symbol, 'SMA', '20'),
      this.fetchAlphaVantageIndicator(symbol, 'EMA', '12'),
      this.fetchAlphaVantageIndicator(symbol, 'BBANDS'),
      this.fetchAlphaVantageIndicator(symbol, 'STOCH')
    ]);

    // Parse and return the data
    const latestDate = Object.keys(rsiData['Technical Analysis: RSI'] || {})[0];
    
    return {
      rsi: parseFloat(rsiData['Technical Analysis: RSI']?.[latestDate]?.['RSI'] || '50'),
      macd: {
        value: parseFloat(macdData['Technical Analysis: MACD']?.[latestDate]?.['MACD'] || '0'),
        signal: parseFloat(macdData['Technical Analysis: MACD']?.[latestDate]?.['MACD_Signal'] || '0'),
        histogram: parseFloat(macdData['Technical Analysis: MACD']?.[latestDate]?.['MACD_Hist'] || '0')
      },
      sma20: parseFloat(smaData['Technical Analysis: SMA']?.[latestDate]?.['SMA'] || '0'),
      ema12: parseFloat(emaData['Technical Analysis: EMA']?.[latestDate]?.['EMA'] || '0'),
      bollingerBands: {
        upper: parseFloat(bbandData['Technical Analysis: BBANDS']?.[latestDate]?.['Real Upper Band'] || '0'),
        middle: parseFloat(bbandData['Technical Analysis: BBANDS']?.[latestDate]?.['Real Middle Band'] || '0'),
        lower: parseFloat(bbandData['Technical Analysis: BBANDS']?.[latestDate]?.['Real Lower Band'] || '0'),
        position: 0.5 // Calculate based on current price
      },
      stochastic: {
        k: parseFloat(stochData['Technical Analysis: STOCH']?.[latestDate]?.['SlowK'] || '50'),
        d: parseFloat(stochData['Technical Analysis: STOCH']?.[latestDate]?.['SlowD'] || '50')
      },
      volume: Math.floor(Math.random() * 1000000) + 500000,
      volatility: 0.15 + Math.random() * 0.1
    };
  }

  private async fetchAlphaVantageIndicator(symbol: string, indicator: string, period?: string): Promise<any> {
    const baseUrl = 'https://www.alphavantage.co/query';
    const params = new URLSearchParams({
      function: indicator,
      symbol: symbol,
      interval: 'daily',
      apikey: this.credentials.alphaVantage!
    });

    if (period) {
      params.append('time_period', period);
    }

    const response = await fetch(`${baseUrl}?${params}`);
    if (!response.ok) {
      throw new Error(`Alpha Vantage ${indicator} error: ${response.status}`);
    }

    return response.json();
  }

  private async fetchTrueDataTechnicals(symbol: string): Promise<TechnicalIndicators> {
    // TrueData API implementation would go here
    throw new Error('TrueData API not implemented yet');
  }

  private simulateTechnicalIndicators(symbol: string): TechnicalIndicators {
    const rsi = 30 + Math.random() * 40; // 30-70 range
    const macdValue = (Math.random() - 0.5) * 0.02;
    const macdSignal = macdValue + (Math.random() - 0.5) * 0.01;
    
    return {
      rsi,
      macd: {
        value: macdValue,
        signal: macdSignal,
        histogram: macdValue - macdSignal
      },
      sma20: 19500 + Math.random() * 1000,
      ema12: 19400 + Math.random() * 1000,
      bollingerBands: {
        upper: 19800,
        middle: 19500,
        lower: 19200,
        position: Math.random() // 0-1, where current price sits in the band
      },
      stochastic: {
        k: Math.random() * 100,
        d: Math.random() * 100
      },
      volume: Math.floor(Math.random() * 1000000) + 500000,
      volatility: 0.15 + Math.random() * 0.1
    };
  }
}

export const realDataService = new RealDataService();
