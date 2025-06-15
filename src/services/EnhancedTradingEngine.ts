import { TradingSignal } from './TradingRobotEngine';
import { realDataService } from './RealDataService';

export interface SignalScore {
  technicalScore: number;
  volumeScore: number;
  sentimentScore: number;
  volatilityScore: number;
  momentumScore: number;
  riskScore: number;
  totalScore: number;
  confidence: number;
}

export interface MarketRegime {
  type: 'trending_bull' | 'trending_bear' | 'sideways_low_vol' | 'sideways_high_vol' | 'volatile_uncertain' | 'gap_up' | 'gap_down' | 'expiry_day';
  strength: number;
  hurstExponent: number;
  atrSlope: number;
  volatilityRegime: 'low' | 'medium' | 'high' | 'extreme';
  timeOfDay: 'pre_open' | 'opening' | 'morning' | 'afternoon' | 'closing' | 'after_hours';
  expiryDays: number;
}

export interface DynamicAllocation {
  conservative: number;
  moderate: number;
  aggressive: number;
  scalping: number;
  swing: number;
  maxPositions: number;
  maxCapitalPerTrade: number;
  riskPerTrade: number;
}

export interface EnhancedTradingSignal extends TradingSignal {
  signalScore: SignalScore;
  marketRegime: MarketRegime;
  patternConfidence: number;
  riskRewardRatio: number;
  expectedHoldTime: number;
  entryTiming: 'immediate' | 'breakout' | 'pullback' | 'momentum';
  marketCap: 'large' | 'mid' | 'small';
  sector: string;
  correlationRisk: number;
}

export class EnhancedTradingEngine {
  private marketRegime: MarketRegime | null = null;
  private priceHistory: { [symbol: string]: number[] } = {};
  private volumeHistory: { [symbol: string]: number[] } = {};
  private volatilityHistory: number[] = [];
  private dynamicAllocation: DynamicAllocation;
  private marketSchedule = {
    preOpen: { start: 9, end: 9.25 },
    regular: { start: 9.25, end: 15.5 },
    closing: { start: 15.4, end: 15.5 }
  };
  
  constructor() {
    this.dynamicAllocation = this.getBaseAllocation();
  }

  public isMarketOpen(): boolean {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    const hour = now.getHours() + now.getMinutes() / 60;
    
    // Weekend check
    if (day === 0 || day === 6) return false;
    
    // Market hours: 9:15 AM to 3:30 PM IST
    return hour >= this.marketSchedule.preOpen.start && hour <= this.marketSchedule.regular.end;
  }

  public isExpiryWeek(): boolean {
    const now = new Date();
    const thursday = new Date(now);
    thursday.setDate(now.getDate() + (4 - now.getDay()));
    const daysToExpiry = Math.ceil((thursday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysToExpiry <= 2;
  }

  public getTimeOfDay(): MarketRegime['timeOfDay'] {
    const hour = new Date().getHours() + new Date().getMinutes() / 60;
    
    if (hour < 9.25) return 'pre_open';
    if (hour >= 9.25 && hour < 10.5) return 'opening';
    if (hour >= 10.5 && hour < 13) return 'morning';
    if (hour >= 13 && hour < 15.4) return 'afternoon';
    if (hour >= 15.4 && hour <= 15.5) return 'closing';
    return 'after_hours';
  }

  public analyzeMarketRegime(priceData: number[], volumeData: number[]): MarketRegime {
    const hurstExponent = this.calculateHurstExponent(priceData);
    const atrSlope = this.calculateATRSlope(priceData);
    const gapAnalysis = this.analyzeGap(priceData);
    const timeOfDay = this.getTimeOfDay();
    const expiryDays = this.getDaysToExpiry();
    
    let regimeType: MarketRegime['type'];
    let strength = 0;
    
    // Gap analysis first
    if (gapAnalysis.gapPercent > 1.5) {
      regimeType = 'gap_up';
      strength = Math.min(gapAnalysis.gapPercent / 3, 1);
    } else if (gapAnalysis.gapPercent < -1.5) {
      regimeType = 'gap_down';
      strength = Math.min(Math.abs(gapAnalysis.gapPercent) / 3, 1);
    } else if (expiryDays <= 1) {
      regimeType = 'expiry_day';
      strength = 0.8;
    } else if (hurstExponent > 0.65 && atrSlope > 0.15) {
      regimeType = 'trending_bull';
      strength = Math.min((hurstExponent - 0.6) * 2.5, 1);
    } else if (hurstExponent > 0.65 && atrSlope < -0.15) {
      regimeType = 'trending_bear';
      strength = Math.min((hurstExponent - 0.6) * 2.5, 1);
    } else if (hurstExponent < 0.35 && Math.abs(atrSlope) < 0.08) {
      regimeType = 'sideways_low_vol';
      strength = Math.min((0.4 - hurstExponent) * 2.5, 1);
    } else if (hurstExponent < 0.35 && Math.abs(atrSlope) > 0.15) {
      regimeType = 'sideways_high_vol';
      strength = Math.min((0.4 - hurstExponent) * 2.5, 1);
    } else {
      regimeType = 'volatile_uncertain';
      strength = 0.3;
    }

    const volatilityRegime = this.classifyVolatilityRegime(priceData);

    this.marketRegime = {
      type: regimeType,
      strength,
      hurstExponent,
      atrSlope,
      volatilityRegime,
      timeOfDay,
      expiryDays
    };

    this.updateDynamicAllocation();
    console.log(`📊 Market Regime: ${regimeType} | Time: ${timeOfDay} | Strength: ${(strength * 100).toFixed(1)}%`);
    return this.marketRegime;
  }

  private analyzeGap(prices: number[]): { gapPercent: number, gapType: 'up' | 'down' | 'none' } {
    if (prices.length < 2) return { gapPercent: 0, gapType: 'none' };
    
    const previousClose = prices[prices.length - 2];
    const currentOpen = prices[prices.length - 1];
    const gapPercent = ((currentOpen - previousClose) / previousClose) * 100;
    
    return {
      gapPercent,
      gapType: gapPercent > 0.5 ? 'up' : gapPercent < -0.5 ? 'down' : 'none'
    };
  }

  private getDaysToExpiry(): number {
    const now = new Date();
    const thursday = new Date(now);
    thursday.setDate(now.getDate() + (4 - now.getDay()));
    return Math.ceil((thursday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  public calculateHurstExponent(prices: number[]): number {
    if (prices.length < 20) return 0.5;
    
    // Simplified Hurst calculation using R/S analysis
    const returns = prices.slice(1).map((price, i) => Math.log(price / prices[i]));
    const n = returns.length;
    const mean = returns.reduce((sum, r) => sum + r, 0) / n;
    
    // Calculate cumulative deviations
    let cumDev = 0;
    const cumDeviations = returns.map(r => {
      cumDev += (r - mean);
      return cumDev;
    });
    
    // Calculate range and standard deviation
    const range = Math.max(...cumDeviations) - Math.min(...cumDeviations);
    const stdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / n);
    
    if (stdDev === 0) return 0.5;
    
    const rs = range / stdDev;
    return Math.log(rs) / Math.log(n);
  }

  public calculateATRSlope(prices: number[]): number {
    if (prices.length < 14) return 0;
    
    const atrValues = [];
    for (let i = 13; i < prices.length; i++) {
      const slice = prices.slice(i - 13, i + 1);
      const ranges = slice.slice(1).map((price, idx) => Math.abs(price - slice[idx]));
      const atr = ranges.reduce((sum, range) => sum + range, 0) / ranges.length;
      atrValues.push(atr);
    }
    
    if (atrValues.length < 5) return 0;
    
    // Simple slope calculation
    const recent = atrValues.slice(-5);
    const older = atrValues.slice(-10, -5);
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
    
    return (recentAvg - olderAvg) / olderAvg;
  }

  public classifyVolatilityRegime(prices: number[]): 'low' | 'medium' | 'high' | 'extreme' {
    if (prices.length < 20) return 'medium';
    
    const returns = prices.slice(1).map((price, i) => Math.log(price / prices[i]));
    const volatility = Math.sqrt(returns.reduce((sum, r) => sum + r * r, 0) / returns.length) * Math.sqrt(252);
    
    if (volatility < 0.15) return 'low';
    if (volatility > 0.30) return 'high';
    return 'medium';
  }

  private updateDynamicAllocation(): void {
    if (!this.marketRegime) return;

    const timeOfDay = this.marketRegime.timeOfDay;
    const regimeType = this.marketRegime.type;

    // Base allocation
    let allocation = this.getBaseAllocation();

    // Time-based adjustments
    if (timeOfDay === 'opening') {
      allocation.aggressive = 30; // More aggressive in opening
      allocation.maxPositions = 8;
      allocation.riskPerTrade = 1.5;
    } else if (timeOfDay === 'closing') {
      allocation.conservative = 80; // Conservative near close
      allocation.maxPositions = 3;
      allocation.riskPerTrade = 0.5;
    }

    // Regime-based adjustments
    switch (regimeType) {
      case 'trending_bull':
        allocation = {
          conservative: 20, moderate: 35, aggressive: 25, scalping: 15, swing: 5,
          maxPositions: 10, maxCapitalPerTrade: 15, riskPerTrade: 2.0
        };
        break;
      case 'expiry_day':
        allocation = {
          conservative: 70, moderate: 20, aggressive: 10, scalping: 0, swing: 0,
          maxPositions: 5, maxCapitalPerTrade: 8, riskPerTrade: 0.8
        };
        break;
      case 'gap_up':
      case 'gap_down':
        allocation = {
          conservative: 40, moderate: 30, aggressive: 20, scalping: 10, swing: 0,
          maxPositions: 6, maxCapitalPerTrade: 12, riskPerTrade: 1.2
        };
        break;
    }

    this.dynamicAllocation = allocation;
    console.log(`🎯 Dynamic Allocation Updated for ${regimeType}:`, allocation);
  }

  public calculatePositionSize(symbol: string, price: number, confidence: number, accountBalance: number = 500000): number {
    const allocation = this.dynamicAllocation;
    const riskAmount = accountBalance * (allocation.riskPerTrade / 100);
    const maxCapital = accountBalance * (allocation.maxCapitalPerTrade / 100);
    
    // Volatility-adjusted position sizing
    const volatility = this.getSymbolVolatility(symbol);
    const volatilityMultiplier = volatility > 0.25 ? 0.7 : volatility < 0.15 ? 1.3 : 1.0;
    
    // Confidence-based sizing
    const confidenceMultiplier = 0.5 + (confidence * 0.5); // 0.5 to 1.0
    
    // Market cap adjustment
    const marketCapMultiplier = this.getMarketCapMultiplier(symbol);
    
    // Calculate base quantity
    const adjustedRisk = riskAmount * volatilityMultiplier * confidenceMultiplier * marketCapMultiplier;
    const maxQuantity = Math.floor(maxCapital / price);
    const riskBasedQuantity = Math.floor(adjustedRisk / (price * 0.02)); // 2% stop loss assumption
    
    const finalQuantity = Math.min(maxQuantity, riskBasedQuantity);
    
    console.log(`📊 Position Size for ${symbol}: ${finalQuantity} (Risk: ₹${adjustedRisk.toFixed(0)}, Confidence: ${confidence})`);
    return Math.max(1, finalQuantity);
  }

  private getSymbolVolatility(symbol: string): number {
    const prices = this.priceHistory[symbol];
    if (!prices || prices.length < 20) return 0.20; // Default 20%
    
    const returns = prices.slice(1).map((price, i) => Math.log(price / prices[i]));
    const variance = returns.reduce((sum, r) => sum + r * r, 0) / returns.length;
    return Math.sqrt(variance * 252); // Annualized volatility
  }

  private getMarketCapMultiplier(symbol: string): number {
    // Large cap stocks (higher allocation)
    const largeCap = ['RELIANCE', 'TCS', 'HDFC', 'INFY', 'ICICI', 'SBI', 'ITC'];
    if (largeCap.includes(symbol)) return 1.2;
    
    // Mid cap (normal allocation)
    const midCap = ['ZOMATO', 'PAYTM', 'NAUKRI', 'MINDTREE'];
    if (midCap.includes(symbol)) return 1.0;
    
    // Small cap (reduced allocation)
    return 0.7;
  }

  public scoreSignal(signal: TradingSignal, technicalData: any): SignalScore {
    let technicalScore = 0;
    let volumeScore = 0;
    let sentimentScore = 0;
    let volatilityScore = 0;
    let momentumScore = 0;
    let riskScore = 0;

    // Enhanced Technical Analysis (0-35 points)
    const indicators = technicalData.indicators || {};
    
    // RSI with divergence
    if (indicators.rsi) {
      if (signal.action === 'buy' && indicators.rsi < 30) technicalScore += 15;
      else if (signal.action === 'buy' && indicators.rsi < 40) technicalScore += 10;
      else if (signal.action === 'sell' && indicators.rsi > 70) technicalScore += 15;
      else if (signal.action === 'sell' && indicators.rsi > 60) technicalScore += 10;
    }
    
    // MACD with histogram
    if (indicators.macd) {
      if (indicators.macd.signal === signal.action) technicalScore += 10;
      if (indicators.macd.histogram > 0 && signal.action === 'buy') technicalScore += 5;
      if (indicators.macd.histogram < 0 && signal.action === 'sell') technicalScore += 5;
    }
    
    // Support/Resistance levels
    if (indicators.supportResistance) {
      if (signal.action === 'buy' && indicators.supportResistance.nearSupport) technicalScore += 5;
      if (signal.action === 'sell' && indicators.supportResistance.nearResistance) technicalScore += 5;
    }

    // Volume Analysis (0-20 points)
    if (technicalData.volume) {
      const volumeRatio = technicalData.volume.current / technicalData.volume.average;
      if (volumeRatio > 2.0) volumeScore += 20;
      else if (volumeRatio > 1.5) volumeScore += 15;
      else if (volumeRatio > 1.2) volumeScore += 10;
      
      // Price-volume confirmation
      if (technicalData.volume.priceVolumeAlignment) volumeScore += 5;
    }

    // Market Sentiment (0-15 points)
    if (technicalData.sentiment) {
      const sentimentAlignment = 
        (signal.action === 'buy' && technicalData.sentiment > 0.65) ||
        (signal.action === 'sell' && technicalData.sentiment < 0.35);
      
      if (sentimentAlignment) sentimentScore += 15;
      else if (Math.abs(technicalData.sentiment - 0.5) > 0.15) sentimentScore += 8;
    }

    // Momentum Analysis (0-15 points)
    if (indicators.momentum) {
      if (signal.action === 'buy' && indicators.momentum.trending > 0.7) momentumScore += 15;
      if (signal.action === 'sell' && indicators.momentum.trending < -0.7) momentumScore += 15;
    }

    // Risk Assessment (0-10 points)
    if (this.marketRegime) {
      if (this.marketRegime.volatilityRegime === 'low') riskScore += 10;
      else if (this.marketRegime.volatilityRegime === 'medium') riskScore += 7;
      else if (this.marketRegime.volatilityRegime === 'high') riskScore += 3;
    }

    // Volatility Score (0-5 points)
    if (technicalData.volatility) {
      if (technicalData.volatility > 0.15 && technicalData.volatility < 0.30) {
        volatilityScore += 5;
      } else if (technicalData.volatility > 0.10 && technicalData.volatility < 0.40) {
        volatilityScore += 3;
      }
    }

    const totalScore = technicalScore + volumeScore + sentimentScore + volatilityScore + momentumScore + riskScore;
    const confidence = Math.min(totalScore / 100, 0.98);

    return {
      technicalScore,
      volumeScore,
      sentimentScore,
      volatilityScore,
      momentumScore,
      riskScore,
      totalScore,
      confidence
    };
  }

  public shouldTakeSignal(signalScore: SignalScore, strategy: string): boolean {
    const timeOfDay = this.getTimeOfDay();
    
    // Don't trade during pre-open or after hours
    if (timeOfDay === 'pre_open' || timeOfDay === 'after_hours') {
      return false;
    }
    
    // More lenient thresholds for better opportunity capture
    const baseThresholds = {
      'Scalping': { score: 70, confidence: 0.70 },
      'Intraday Momentum': { score: 65, confidence: 0.65 },
      'Options Iron Condor': { score: 60, confidence: 0.60 },
      'Options Long Straddle': { score: 75, confidence: 0.75 },
      'Swing Trading': { score: 70, confidence: 0.70 },
      'Gap Trading': { score: 65, confidence: 0.65 },
      'Breakout': { score: 70, confidence: 0.70 }
    };

    const threshold = baseThresholds[strategy] || { score: 65, confidence: 0.65 };
    
    // Time-based adjustments
    if (timeOfDay === 'opening') {
      threshold.score -= 5; // More lenient during opening volatility
    } else if (timeOfDay === 'closing') {
      threshold.score += 10; // More strict near close
    }
    
    const meetsThreshold = signalScore.totalScore >= threshold.score && 
                          signalScore.confidence >= threshold.confidence;
    
    if (meetsThreshold) {
      console.log(`✅ Signal accepted: ${strategy} (Score: ${signalScore.totalScore}, Confidence: ${(signalScore.confidence * 100).toFixed(1)}%)`);
    } else {
      console.log(`❌ Signal rejected: ${strategy} (Score: ${signalScore.totalScore}/${threshold.score}, Confidence: ${(signalScore.confidence * 100).toFixed(1)}%/${(threshold.confidence * 100).toFixed(1)}%)`);
    }
    
    return meetsThreshold;
  }

  public enhanceSignal(baseSignal: TradingSignal, technicalData: any): EnhancedTradingSignal {
    const signalScore = this.scoreSignal(baseSignal, technicalData);
    
    // Calculate risk-reward ratio
    const riskRewardRatio = baseSignal.target && baseSignal.stopLoss ? 
      Math.abs(baseSignal.target - (baseSignal.price || 0)) / Math.abs((baseSignal.price || 0) - baseSignal.stopLoss) : 2.0;

    // Estimate hold time based on strategy and market regime
    let expectedHoldTime = 240; // Default 4 hours
    if (baseSignal.strategy.includes('Scalping')) expectedHoldTime = 15;
    else if (baseSignal.strategy.includes('Intraday')) expectedHoldTime = 120;
    else if (baseSignal.strategy.includes('Swing')) expectedHoldTime = 2880; // 2 days

    // Adjust based on market regime
    if (this.marketRegime?.type.includes('trending')) {
      expectedHoldTime *= 1.5; // Hold longer in trends
    }

    // Determine entry timing based on strategy
    let entryTiming: 'immediate' | 'breakout' | 'pullback' | 'momentum' = 'immediate';
    if (baseSignal.strategy.includes('Breakout')) entryTiming = 'breakout';
    else if (baseSignal.strategy.includes('Scalping')) entryTiming = 'momentum';
    else if (baseSignal.strategy.includes('Swing')) entryTiming = 'pullback';

    // Determine market cap
    const marketCap = this.getMarketCapForSymbol(baseSignal.symbol);
    
    // Get sector
    const sector = this.getSectorForSymbol(baseSignal.symbol);
    
    // Calculate correlation risk
    const correlationRisk = Math.random() * 0.5; // Simplified for now

    return {
      ...baseSignal,
      signalScore,
      marketRegime: this.marketRegime!,
      patternConfidence: signalScore.confidence,
      riskRewardRatio,
      expectedHoldTime,
      entryTiming,
      marketCap,
      sector,
      correlationRisk
    };
  }

  private getMarketCapForSymbol(symbol: string): 'large' | 'mid' | 'small' {
    const largeCap = ['RELIANCE', 'TCS', 'HDFC', 'INFY', 'ICICI', 'SBI', 'ITC', 'NIFTY', 'BANKNIFTY'];
    const midCap = ['ZOMATO', 'PAYTM', 'NAUKRI', 'MINDTREE'];
    
    if (largeCap.includes(symbol)) return 'large';
    if (midCap.includes(symbol)) return 'mid';
    return 'small';
  }

  private getSectorForSymbol(symbol: string): string {
    const sectorMap: { [key: string]: string } = {
      'RELIANCE': 'Energy',
      'TCS': 'IT', 'INFY': 'IT', 'WIPRO': 'IT',
      'HDFC': 'Banking', 'ICICI': 'Banking', 'SBI': 'Banking',
      'ITC': 'FMCG', 'HUL': 'FMCG',
      'NIFTY': 'Index', 'BANKNIFTY': 'Index'
    };
    return sectorMap[symbol] || 'Others';
  }

  public async analyzeMarketRegimeWithRealData(symbol: string): Promise<MarketRegime> {
    try {
      const prices = this.generateMockPrices(); // Using mock for now
      const volumes = this.generateMockVolumes();
      return this.analyzeMarketRegime(prices, volumes);
    } catch (error) {
      console.warn('Failed to analyze market regime with real data, using mock data');
      const prices = this.generateMockPrices();
      const volumes = this.generateMockVolumes();
      return this.analyzeMarketRegime(prices, volumes);
    }
  }

  public getMarketRegime(): MarketRegime | null {
    return this.marketRegime;
  }

  public getDynamicAllocation(): DynamicAllocation {
    return this.dynamicAllocation;
  }

  private generateMockSignal(symbol: string): TradingSignal {
    const action = Math.random() > 0.5 ? 'buy' : 'sell';
    const price = 100 + Math.random() * 400;
    
    return {
      symbol,
      action,
      orderType: 'limit',
      quantity: Math.floor(Math.random() * 100) + 10,
      price,
      confidence: 0.6 + Math.random() * 0.3,
      reason: `Mock ${action} signal for simulation`,
      strategy: 'Enhanced Market Simulation',
      target: action === 'buy' ? price * 1.02 : price * 0.98,
      stopLoss: action === 'buy' ? price * 0.98 : price * 1.02
    };
  }

  private generateMockPrices(): number[] {
    const prices = [];
    let price = 19800; // Starting NIFTY price
    
    for (let i = 0; i < 30; i++) {
      price += (Math.random() - 0.5) * price * 0.02; // ±2% daily change
      prices.push(price);
    }
    
    return prices;
  }

  private generateMockVolumes(): number[] {
    return Array.from({ length: 30 }, () => Math.floor(Math.random() * 1000000) + 500000);
  }

  public calculateSignalScore(scoreComponents: {
    technicalScore: number;
    volumeScore: number;
    sentimentScore: number;
    volatilityScore: number;
  }): number {
    const { technicalScore, volumeScore, sentimentScore, volatilityScore } = scoreComponents;
    const totalScore = technicalScore + volumeScore + sentimentScore + volatilityScore;
    
    // Apply market regime multiplier
    let regimeMultiplier = 1.0;
    if (this.marketRegime) {
      switch (this.marketRegime.type) {
        case 'trending_bull':
        case 'trending_bear':
          regimeMultiplier = 1.1; // Boost trending signals
          break;
        case 'sideways_low_vol':
          regimeMultiplier = 0.9; // Reduce sideways signals
          break;
        case 'volatile_uncertain':
          regimeMultiplier = 0.8; // Penalize uncertain signals
          break;
      }
    }
    
    return Math.min(100, totalScore * regimeMultiplier);
  }

  private getBaseAllocation(): DynamicAllocation {
    return {
      conservative: 50,
      moderate: 25,
      aggressive: 15,
      scalping: 7,
      swing: 3,
      maxPositions: 6,
      maxCapitalPerTrade: 10,
      riskPerTrade: 1.0
    };
  }
}

export const enhancedTradingEngine = new EnhancedTradingEngine();
