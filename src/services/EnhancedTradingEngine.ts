import { TradingSignal } from './TradingRobotEngine';
import { realDataService } from './RealDataService';

export interface SignalScore {
  technicalScore: number;
  volumeScore: number;
  sentimentScore: number;
  volatilityScore: number;
  totalScore: number;
  confidence: number;
}

export interface MarketRegime {
  type: 'trending_bull' | 'trending_bear' | 'sideways_low_vol' | 'sideways_high_vol' | 'volatile_uncertain';
  strength: number;
  hurstExponent: number;
  atrSlope: number;
  volatilityRegime: 'low' | 'medium' | 'high';
}

export interface DynamicAllocation {
  conservative: number;
  moderate: number;
  aggressive: number;
  maxPositions: number;
  riskPerTrade: number;
}

export interface EnhancedTradingSignal extends TradingSignal {
  signalScore: SignalScore;
  marketRegime: MarketRegime;
  patternConfidence: number;
  riskRewardRatio: number;
  expectedHoldTime: number;
}

export class EnhancedTradingEngine {
  private marketRegime: MarketRegime | null = null;
  private priceHistory: number[] = [];
  private volumeHistory: number[] = [];
  private volatilityHistory: number[] = [];
  private dynamicAllocation: DynamicAllocation;
  
  constructor() {
    this.dynamicAllocation = this.getBaseAllocation();
  }

  public analyzeMarketRegime(priceData: number[], volumeData: number[]): MarketRegime {
    // Calculate Hurst Exponent for trend persistence
    const hurstExponent = this.calculateHurstExponent(priceData);
    
    // Calculate ATR slope for volatility trend
    const atrSlope = this.calculateATRSlope(priceData);
    
    // Detect regime type
    let regimeType: MarketRegime['type'];
    let strength = 0;
    
    if (hurstExponent > 0.6 && atrSlope > 0.1) {
      regimeType = 'trending_bull';
      strength = Math.min((hurstExponent - 0.6) * 2.5, 1);
    } else if (hurstExponent > 0.6 && atrSlope < -0.1) {
      regimeType = 'trending_bear';
      strength = Math.min((hurstExponent - 0.6) * 2.5, 1);
    } else if (hurstExponent < 0.4 && Math.abs(atrSlope) < 0.05) {
      regimeType = 'sideways_low_vol';
      strength = Math.min((0.4 - hurstExponent) * 2.5, 1);
    } else if (hurstExponent < 0.4 && Math.abs(atrSlope) > 0.1) {
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
      volatilityRegime
    };

    // Update dynamic allocation based on regime
    this.updateDynamicAllocation();

    console.log(`📊 Market Regime Detected: ${regimeType} (Strength: ${(strength * 100).toFixed(1)}%)`);
    return this.marketRegime;
  }

  public async analyzeMarketRegimeWithRealData(symbol: string = 'NIFTY'): Promise<MarketRegime> {
    try {
      // Get real historical data for regime analysis
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const historicalData = await realDataService.getHistoricalData(symbol, startDate, endDate);
      
      if (historicalData.length > 0) {
        const prices = historicalData.map(d => d.c); // closing prices
        const volumes = historicalData.map(d => d.v); // volumes
        
        console.log(`📊 Analyzing market regime with ${prices.length} real data points for ${symbol}`);
        return this.analyzeMarketRegime(prices, volumes);
      } else {
        console.warn('No real historical data available, using simulation');
        return this.analyzeMarketRegime(this.generateMockPrices(), this.generateMockVolumes());
      }
    } catch (error) {
      console.error('Failed to get real data for regime analysis:', error);
      return this.analyzeMarketRegime(this.generateMockPrices(), this.generateMockVolumes());
    }
  }

  private calculateHurstExponent(prices: number[]): number {
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

  private calculateATRSlope(prices: number[]): number {
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

  private classifyVolatilityRegime(prices: number[]): 'low' | 'medium' | 'high' {
    if (prices.length < 20) return 'medium';
    
    const returns = prices.slice(1).map((price, i) => Math.log(price / prices[i]));
    const volatility = Math.sqrt(returns.reduce((sum, r) => sum + r * r, 0) / returns.length) * Math.sqrt(252);
    
    if (volatility < 0.15) return 'low';
    if (volatility > 0.30) return 'high';
    return 'medium';
  }

  private updateDynamicAllocation(): void {
    if (!this.marketRegime) return;

    switch (this.marketRegime.type) {
      case 'trending_bull':
        this.dynamicAllocation = {
          conservative: 40, // Reduce conservative in trending markets
          moderate: 40,     // Increase moderate for momentum
          aggressive: 20,   // Increase aggressive for trends
          maxPositions: 7,  // Allow more positions in trending
          riskPerTrade: 1.2 // Slightly higher risk in trending
        };
        break;
        
      case 'trending_bear':
        this.dynamicAllocation = {
          conservative: 45,
          moderate: 35,
          aggressive: 20,
          maxPositions: 6,
          riskPerTrade: 1.0
        };
        break;
        
      case 'sideways_low_vol':
        this.dynamicAllocation = {
          conservative: 80, // Heavy on Iron Condors
          moderate: 15,
          aggressive: 5,
          maxPositions: 4,
          riskPerTrade: 0.8
        };
        break;
        
      case 'sideways_high_vol':
        this.dynamicAllocation = {
          conservative: 70,
          moderate: 20,
          aggressive: 10,
          maxPositions: 5,
          riskPerTrade: 0.9
        };
        break;
        
      default:
        this.dynamicAllocation = this.getBaseAllocation();
    }

    console.log(`🎯 Dynamic Allocation Updated:`, this.dynamicAllocation);
  }

  private getBaseAllocation(): DynamicAllocation {
    return {
      conservative: 60,
      moderate: 30,
      aggressive: 10,
      maxPositions: 5,
      riskPerTrade: 1.0
    };
  }

  public scoreSignal(signal: TradingSignal, technicalData: any): SignalScore {
    let technicalScore = 0;
    let volumeScore = 0;
    let sentimentScore = 0;
    let volatilityScore = 0;

    // Technical Analysis Confluence (0-40 points)
    const indicators = technicalData.indicators || {};
    
    if (indicators.rsi && signal.action === 'buy' && indicators.rsi < 35) technicalScore += 10;
    if (indicators.rsi && signal.action === 'sell' && indicators.rsi > 65) technicalScore += 10;
    
    if (indicators.macd && indicators.macd.signal === signal.action) technicalScore += 10;
    if (indicators.bollingerBands && indicators.bollingerBands.breakout) technicalScore += 10;
    if (indicators.movingAverages && indicators.movingAverages.alignment === signal.action) technicalScore += 10;

    // Volume Analysis (0-25 points)
    if (technicalData.volume) {
      const volumeRatio = technicalData.volume.current / technicalData.volume.average;
      if (volumeRatio > 1.5) volumeScore += 15; // High volume confirmation
      if (volumeRatio > 2.0) volumeScore += 10; // Very high volume
    }

    // Sentiment Score (0-20 points)
    if (technicalData.sentiment) {
      const sentimentAlignment = 
        (signal.action === 'buy' && technicalData.sentiment > 0.6) ||
        (signal.action === 'sell' && technicalData.sentiment < 0.4);
      
      if (sentimentAlignment) sentimentScore += 20;
      else if (Math.abs(technicalData.sentiment - 0.5) > 0.2) sentimentScore += 10;
    }

    // Volatility Score (0-15 points)
    if (technicalData.volatility) {
      // Prefer moderate volatility for most strategies
      if (technicalData.volatility > 0.15 && technicalData.volatility < 0.35) {
        volatilityScore += 15;
      } else if (technicalData.volatility > 0.10 && technicalData.volatility < 0.50) {
        volatilityScore += 10;
      }
    }

    const totalScore = technicalScore + volumeScore + sentimentScore + volatilityScore;
    const confidence = Math.min(totalScore / 100, 0.95); // Cap at 95%

    return {
      technicalScore,
      volumeScore,
      sentimentScore,
      volatilityScore,
      totalScore,
      confidence
    };
  }

  public shouldTakeSignal(signalScore: SignalScore, strategy: string): boolean {
    // High-quality filter: Only take trades with score > 80
    if (signalScore.totalScore < 80) {
      console.log(`❌ Signal rejected: Score ${signalScore.totalScore} < 80 threshold`);
      return false;
    }

    // Strategy-specific thresholds
    const thresholds = {
      'Intraday Momentum': 85,
      'Options Iron Condor': 75,
      'Options Long Straddle': 90,
      'Swing Trading': 80
    };

    const threshold = thresholds[strategy] || 80;
    
    if (signalScore.totalScore >= threshold) {
      console.log(`✅ High-quality signal accepted: ${signalScore.totalScore} >= ${threshold} for ${strategy}`);
      return true;
    }

    return false;
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

    return {
      ...baseSignal,
      signalScore,
      marketRegime: this.marketRegime!,
      patternConfidence: signalScore.confidence,
      riskRewardRatio,
      expectedHoldTime
    };
  }

  public generateEnhancedSignals(): Promise<TradingSignal[]> {
    // Return the promise directly
    return this.generateEnhancedSignalsWithRealData().catch(() => {
      console.warn('Real data generation failed, using mock signals');
      const signals: TradingSignal[] = [];
      const mockSymbols = ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'TCS', 'INFY'];
      
      mockSymbols.forEach(symbol => {
        if (Math.random() > 0.7) {
          signals.push(this.generateMockSignal(symbol));
        }
      });
      
      return signals;
    });
  }

  public async generateEnhancedSignalsWithRealData(): Promise<TradingSignal[]> {
    const signals: TradingSignal[] = [];
    const symbols = ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'TCS', 'INFY'];
    
    console.log('🎯 Generating enhanced signals with real market data...');
    
    for (const symbol of symbols) {
      try {
        // Get real technical data
        const technicalData = await realDataService.getTechnicalIndicators(symbol);
        const priceData = await realDataService.getRealTimePrice(symbol);
        
        // Enhanced signal generation based on real data
        const signal = this.generateSignalFromRealData(symbol, technicalData, priceData);
        
        if (signal) {
          signals.push(signal);
          console.log(`📈 Generated real data signal for ${symbol}: ${signal.action.toUpperCase()}`);
        }
      } catch (error) {
        console.warn(`Failed to generate real signal for ${symbol}, using simulation:`, error);
        // Fallback to existing mock signal generation
        if (Math.random() > 0.7) {
          const mockSignal = this.generateMockSignal(symbol);
          signals.push(mockSignal);
        }
      }
    }
    
    console.log(`🎯 Generated ${signals.length} enhanced signals (real + simulated)`);
    return signals;
  }

  private generateSignalFromRealData(symbol: string, technicalData: any, priceData: any): TradingSignal | null {
    let signalStrength = 0;
    let action: 'buy' | 'sell' | null = null;
    const reasons: string[] = [];

    // RSI Analysis
    if (technicalData.rsi < 30) {
      signalStrength += 25;
      action = 'buy';
      reasons.push(`RSI oversold (${technicalData.rsi.toFixed(1)})`);
    } else if (technicalData.rsi > 70) {
      signalStrength += 25;
      action = 'sell';
      reasons.push(`RSI overbought (${technicalData.rsi.toFixed(1)})`);
    }

    // MACD Analysis
    if (technicalData.macd.value > technicalData.macd.signal) {
      signalStrength += 20;
      if (!action) action = 'buy';
      reasons.push('MACD bullish crossover');
    } else if (technicalData.macd.value < technicalData.macd.signal) {
      signalStrength += 20;
      if (!action) action = 'sell';
      reasons.push('MACD bearish crossover');
    }

    // Bollinger Bands Analysis
    if (technicalData.bollingerBands.position < 0.2) {
      signalStrength += 15;
      if (!action) action = 'buy';
      reasons.push('Price near lower Bollinger Band');
    } else if (technicalData.bollingerBands.position > 0.8) {
      signalStrength += 15;
      if (!action) action = 'sell';
      reasons.push('Price near upper Bollinger Band');
    }

    // Volume confirmation
    if (priceData.volume > 500000) { // High volume
      signalStrength += 10;
      reasons.push('High volume confirmation');
    }

    // Only generate signal if strength is sufficient
    if (signalStrength >= 30 && action) {
      const confidence = Math.min(0.95, signalStrength / 100);
      
      return {
        symbol,
        action,
        orderType: 'limit',
        quantity: this.calculatePositionSize(symbol, priceData.price, confidence),
        price: priceData.price,
        confidence,
        reason: `Real data analysis: ${reasons.join(', ')}`,
        strategy: 'Enhanced Real Data Analysis',
        target: action === 'buy' ? priceData.price * 1.02 : priceData.price * 0.98,
        stopLoss: action === 'buy' ? priceData.price * 0.98 : priceData.price * 1.02
      };
    }

    return null;
  }

  private calculatePositionSize(symbol: string, price: number, confidence: number): number {
    const baseAmount = 10000; // ₹10,000 per trade
    const confidenceMultiplier = confidence;
    const positionValue = baseAmount * confidenceMultiplier;
    
    return Math.max(1, Math.floor(positionValue / price));
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

  public getDynamicAllocation(): DynamicAllocation {
    return this.dynamicAllocation;
  }

  public getMarketRegime(): MarketRegime | null {
    return this.marketRegime;
  }
}

export const enhancedTradingEngine = new EnhancedTradingEngine();
