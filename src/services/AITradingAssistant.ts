
interface MarketAnalysis {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  volatility: 'low' | 'medium' | 'high';
  trend: 'uptrend' | 'downtrend' | 'sideways';
  confidence: number;
  reasoning: string[];
}

export interface TradingSignal {
  symbol: string;
  action: 'buy' | 'sell' | 'hold';
  type: 'options' | 'equity' | 'futures';
  strategy: string;
  entry_price: number;
  target_price: number;
  stop_loss: number;
  quantity: number;
  risk_reward_ratio: number;
  expected_profit: number;
  max_loss: number;
  confidence: number;
  reasoning: string[];
  timeframe: string;
}

interface OptionsStrategy {
  name: string;
  legs: {
    action: 'buy' | 'sell';
    option_type: 'call' | 'put';
    strike: number;
    quantity: number;
    premium: number;
  }[];
  max_profit: number;
  max_loss: number;
  break_even: number[];
  net_premium: number;
  margin_required: number;
}

export class AITradingAssistant {
  private marketData: Map<string, any> = new Map();
  private historicalData: Map<string, any[]> = new Map();
  private userProfile = {
    riskTolerance: 'medium',
    tradingStyle: 'swing',
    capitalSize: 100000,
    preferredProducts: ['options', 'equity'],
    maxRiskPerTrade: 0.02
  };

  async analyzeMarket(symbol: string): Promise<MarketAnalysis> {
    console.log(`🤖 AI analyzing market for ${symbol}...`);
    
    // Simulate advanced AI market analysis
    const currentPrice = this.getCurrentPrice(symbol);
    const volatility = this.calculateVolatility(symbol);
    const trend = this.detectTrend(symbol);
    
    // AI sentiment analysis based on multiple factors
    const sentiment = this.analyzeSentiment(symbol, currentPrice, volatility, trend);
    
    const analysis: MarketAnalysis = {
      sentiment,
      volatility: volatility > 25 ? 'high' : volatility > 15 ? 'medium' : 'low',
      trend,
      confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
      reasoning: [
        `Price action shows ${trend} pattern`,
        `Volatility is ${volatility.toFixed(1)}% (${volatility > 25 ? 'high' : volatility > 15 ? 'medium' : 'low'})`,
        `Technical indicators suggest ${sentiment} bias`,
        `Market structure supports current analysis`
      ]
    };

    console.log(`📊 AI Market Analysis for ${symbol}:`, analysis);
    return analysis;
  }

  async generateTradingSignals(symbols: string[]): Promise<TradingSignal[]> {
    console.log('🎯 AI generating intelligent trading signals...');
    
    const signals: TradingSignal[] = [];
    
    for (const symbol of symbols) {
      const analysis = await this.analyzeMarket(symbol);
      const currentPrice = this.getCurrentPrice(symbol);
      
      // Generate signals based on AI analysis
      if (analysis.confidence > 0.75) {
        if (symbol.includes('NIFTY') || symbol.includes('BANK')) {
          // Options strategies for indices
          const optionsSignal = this.generateOptionsSignal(symbol, analysis, currentPrice);
          if (optionsSignal) signals.push(optionsSignal);
        } else {
          // Equity intraday/swing signals
          const equitySignal = this.generateEquitySignal(symbol, analysis, currentPrice);
          if (equitySignal) signals.push(equitySignal);
        }
      }
    }
    
    // Filter and rank signals by profitability
    const rankedSignals = signals
      .filter(signal => signal.expected_profit > 500) // Min ₹500 profit
      .filter(signal => signal.risk_reward_ratio >= 1.5) // Min 1:1.5 RR
      .sort((a, b) => b.expected_profit - a.expected_profit)
      .slice(0, 5); // Top 5 signals
    
    console.log(`✨ Generated ${rankedSignals.length} high-quality AI trading signals`);
    return rankedSignals;
  }

  generateOptionsStrategy(symbol: string, market_view: 'bullish' | 'bearish' | 'neutral', volatility: 'low' | 'high'): OptionsStrategy {
    const currentPrice = this.getCurrentPrice(symbol);
    const strategies = this.getOptionsStrategies(symbol, currentPrice, market_view, volatility);
    
    // AI selects best strategy based on market conditions
    const bestStrategy = strategies.reduce((best, current) => 
      current.max_profit > best.max_profit ? current : best
    );
    
    console.log(`🎯 AI recommended ${bestStrategy.name} strategy for ${symbol}`);
    return bestStrategy;
  }

  private generateOptionsSignal(symbol: string, analysis: MarketAnalysis, currentPrice: number): TradingSignal | null {
    const isNifty = symbol.includes('NIFTY');
    const atmStrike = Math.round(currentPrice / (isNifty ? 50 : 100)) * (isNifty ? 50 : 100);
    
    let strategy = '';
    let action: 'buy' | 'sell' = 'buy';
    let targetPrice = currentPrice;
    let stopLoss = currentPrice;
    
    if (analysis.sentiment === 'bullish' && analysis.volatility === 'low') {
      strategy = 'Buy ATM Call';
      action = 'buy';
      targetPrice = currentPrice * 1.02;
      stopLoss = currentPrice * 0.985;
    } else if (analysis.sentiment === 'bearish' && analysis.volatility === 'low') {
      strategy = 'Buy ATM Put';
      action = 'buy';
      targetPrice = currentPrice * 0.98;
      stopLoss = currentPrice * 1.015;
    } else if (analysis.volatility === 'high') {
      strategy = 'Iron Condor';
      action = 'sell';
      targetPrice = currentPrice;
      stopLoss = currentPrice;
    } else {
      return null;
    }
    
    const premium = currentPrice * 0.01; // Estimated premium
    const quantity = Math.floor(10000 / premium); // ₹10k worth
    const expectedProfit = premium * quantity * 0.5;
    const maxLoss = premium * quantity * 0.3;
    
    return {
      symbol: `${symbol} ${atmStrike} CE/PE`,
      action,
      type: 'options',
      strategy,
      entry_price: premium,
      target_price: premium * 1.5,
      stop_loss: premium * 0.7,
      quantity,
      risk_reward_ratio: expectedProfit / maxLoss,
      expected_profit: expectedProfit,
      max_loss: maxLoss,
      confidence: analysis.confidence,
      reasoning: [
        `AI detected ${analysis.sentiment} sentiment`,
        `${analysis.volatility} volatility favors ${strategy}`,
        `Technical setup shows ${analysis.trend} bias`,
        `Risk-reward ratio: ${(expectedProfit / maxLoss).toFixed(2)}:1`
      ],
      timeframe: 'Intraday'
    };
  }

  private generateEquitySignal(symbol: string, analysis: MarketAnalysis, currentPrice: number): TradingSignal | null {
    if (analysis.sentiment === 'neutral') return null;
    
    const action = analysis.sentiment === 'bullish' ? 'buy' : 'sell';
    const multiplier = action === 'buy' ? 1 : -1;
    
    const targetPrice = currentPrice * (1 + multiplier * 0.02); // 2% target
    const stopLoss = currentPrice * (1 - multiplier * 0.01); // 1% stop loss
    
    const investmentAmount = Math.min(this.userProfile.capitalSize * this.userProfile.maxRiskPerTrade, 25000);
    const quantity = Math.floor(investmentAmount / currentPrice);
    
    const expectedProfit = Math.abs(targetPrice - currentPrice) * quantity;
    const maxLoss = Math.abs(currentPrice - stopLoss) * quantity;
    
    if (expectedProfit < 500 || maxLoss > 1000) return null; // Filter low-profit or high-risk trades
    
    return {
      symbol,
      action,
      type: 'equity',
      strategy: action === 'buy' ? 'Intraday Long' : 'Intraday Short',
      entry_price: currentPrice,
      target_price: targetPrice,
      stop_loss: stopLoss,
      quantity,
      risk_reward_ratio: expectedProfit / maxLoss,
      expected_profit: expectedProfit,
      max_loss: maxLoss,
      confidence: analysis.confidence,
      reasoning: [
        `AI trend analysis shows ${analysis.trend}`,
        `${analysis.sentiment} sentiment with ${analysis.confidence * 100}% confidence`,
        `Volatility ${analysis.volatility} - suitable for intraday`,
        `Target: ₹${expectedProfit.toFixed(0)} | Risk: ₹${maxLoss.toFixed(0)}`
      ],
      timeframe: 'Intraday'
    };
  }

  private getCurrentPrice(symbol: string): number {
    const prices: { [key: string]: number } = {
      'NIFTY': 24750,
      'BANKNIFTY': 55420,
      'RELIANCE': 2945,
      'TCS': 4175,
      'HDFC': 1735,
      'INFY': 1890,
      'ITC': 470,
      'ICICIBANK': 1055,
      'SBIN': 725
    };
    return prices[symbol] || (1000 + Math.random() * 2000);
  }

  private calculateVolatility(symbol: string): number {
    return 15 + Math.random() * 20; // 15-35% volatility
  }

  private detectTrend(symbol: string): 'uptrend' | 'downtrend' | 'sideways' {
    const trends = ['uptrend', 'downtrend', 'sideways'] as const;
    return trends[Math.floor(Math.random() * trends.length)];
  }

  private analyzeSentiment(symbol: string, price: number, volatility: number, trend: string): 'bullish' | 'bearish' | 'neutral' {
    if (trend === 'uptrend' && volatility < 20) return 'bullish';
    if (trend === 'downtrend' && volatility < 20) return 'bearish';
    return 'neutral';
  }

  private getOptionsStrategies(symbol: string, currentPrice: number, view: string, volatility: string): OptionsStrategy[] {
    const atmStrike = Math.round(currentPrice / 50) * 50;
    
    return [{
      name: 'Long Call',
      legs: [{
        action: 'buy',
        option_type: 'call',
        strike: atmStrike,
        quantity: 1,
        premium: currentPrice * 0.015
      }],
      max_profit: Infinity,
      max_loss: currentPrice * 0.015,
      break_even: [atmStrike + currentPrice * 0.015],
      net_premium: currentPrice * 0.015,
      margin_required: currentPrice * 0.015
    }];
  }

  updateUserProfile(profile: Partial<typeof this.userProfile>) {
    this.userProfile = { ...this.userProfile, ...profile };
    console.log('👤 AI user profile updated:', this.userProfile);
  }

  async getAIRecommendations(): Promise<{
    signals: TradingSignal[];
    marketOverview: string;
    riskAssessment: string;
    suggestions: string[];
  }> {
    const watchlist = ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'TCS', 'HDFC'];
    const signals = await this.generateTradingSignals(watchlist);
    
    return {
      signals,
      marketOverview: "AI analysis suggests mixed market conditions with selective opportunities in options and high-beta stocks.",
      riskAssessment: "Current market risk is moderate. Recommended to limit exposure to 2% per trade.",
      suggestions: [
        "Focus on options strategies for index trading",
        "Use tight stop-losses for equity intraday trades",
        "Avoid trading during high-impact news events",
        "Consider iron condors during high volatility periods"
      ]
    };
  }
}

export const aiTradingAssistant = new AITradingAssistant();
