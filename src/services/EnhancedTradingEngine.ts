
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

  public getDynamicAllocation(): DynamicAllocation {
    return this.dynamicAllocation;
  }

  public getMarketRegime(): MarketRegime | null {
    return this.marketRegime;
  }
}

export const enhancedTradingEngine = new EnhancedTradingEngine();
