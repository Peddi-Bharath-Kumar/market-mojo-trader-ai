
import { optionsCalculator, type GreeksInput, type GreeksOutput } from '@/utils/OptionsGreeks';
import { TradingSignal } from './TradingRobotEngine';

export interface OptionsGreeksData {
  symbol: string;
  strikePrice: number;
  optionType: 'call' | 'put';
  greeks: GreeksOutput;
  impliedVolatility: number;
  volume: number;
  openInterest: number;
  lastPrice: number;
  spotPrice: number;
  timeToExpiry: number;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  tradingRecommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
}

export interface PortfolioGreeksRisk {
  totalDelta: number;
  totalGamma: number;
  totalTheta: number;
  totalVega: number;
  totalRho: number;
  portfolioValue: number;
  riskScore: number;
  hedgingRecommendations: string[];
  maxDrawdownRisk: number;
  gammaExposure: 'low' | 'medium' | 'high' | 'extreme';
}

export class OptionsGreeksEngine {
  private optionsData: Map<string, OptionsGreeksData> = new Map();
  private portfolioRisk: PortfolioGreeksRisk | null = null;
  private greeksThresholds = {
    deltaHigh: 0.7,
    gammaHigh: 0.05,
    thetaHigh: -10,
    vegaHigh: 20,
    impliedVolHigh: 0.35,
    impliedVolLow: 0.15
  };

  constructor() {
    this.startRealTimeMonitoring();
  }

  private startRealTimeMonitoring(): void {
    // Simulate real-time options data updates
    setInterval(() => {
      this.updateOptionsData();
      this.calculatePortfolioRisk();
      this.generateGreeksBasedSignals();
    }, 10000); // Update every 10 seconds
  }

  private updateOptionsData(): void {
    const strikes = [17800, 18000, 18200, 18400, 18600];
    const spotPrice = 18000 + (Math.random() - 0.5) * 200; // ±100 points

    strikes.forEach(strike => {
      ['call', 'put'].forEach(type => {
        const key = `NIFTY_${strike}_${type}`;
        const timeToExpiry = 0.0274 + Math.random() * 0.0548; // 10-30 days
        const iv = 0.15 + Math.random() * 0.25; // 15-40% IV
        
        const greeksInput: GreeksInput = {
          spotPrice,
          strikePrice: strike,
          timeToExpiry,
          riskFreeRate: 0.06,
          volatility: iv,
          optionType: type as 'call' | 'put'
        };

        const greeks = optionsCalculator.calculateGreeks(greeksInput);
        
        const optionData: OptionsGreeksData = {
          symbol: key,
          strikePrice: strike,
          optionType: type as 'call' | 'put',
          greeks,
          impliedVolatility: iv,
          volume: Math.floor(1000 + Math.random() * 5000),
          openInterest: Math.floor(10000 + Math.random() * 50000),
          lastPrice: greeks.price,
          spotPrice,
          timeToExpiry,
          riskLevel: this.calculateRiskLevel(greeks, iv),
          tradingRecommendation: this.getTradingRecommendation(greeks, iv, spotPrice, strike)
        };

        this.optionsData.set(key, optionData);
      });
    });
  }

  private calculateRiskLevel(greeks: GreeksOutput, iv: number): 'low' | 'medium' | 'high' | 'extreme' {
    let riskScore = 0;
    
    // High gamma = higher risk
    if (Math.abs(greeks.gamma) > 0.05) riskScore += 2;
    else if (Math.abs(greeks.gamma) > 0.02) riskScore += 1;
    
    // High theta decay = higher risk for buyers
    if (greeks.theta < -15) riskScore += 2;
    else if (greeks.theta < -8) riskScore += 1;
    
    // High vega = higher volatility risk
    if (Math.abs(greeks.vega) > 25) riskScore += 2;
    else if (Math.abs(greeks.vega) > 15) riskScore += 1;
    
    // Extreme IV levels
    if (iv > 0.4 || iv < 0.1) riskScore += 2;
    else if (iv > 0.3 || iv < 0.15) riskScore += 1;

    if (riskScore >= 6) return 'extreme';
    if (riskScore >= 4) return 'high';
    if (riskScore >= 2) return 'medium';
    return 'low';
  }

  private getTradingRecommendation(
    greeks: GreeksOutput, 
    iv: number, 
    spotPrice: number, 
    strikePrice: number
  ): 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell' {
    const moneyness = spotPrice / strikePrice;
    
    // For calls
    if (greeks.delta > 0) {
      // ITM calls with low IV and positive theta
      if (moneyness > 1.02 && iv < 0.2 && greeks.theta > -5) return 'strong_buy';
      if (moneyness > 1.01 && iv < 0.25) return 'buy';
      
      // OTM calls with high IV
      if (moneyness < 0.98 && iv > 0.35) return 'sell';
      if (moneyness < 0.95 && iv > 0.3) return 'strong_sell';
    }
    
    // For puts
    if (greeks.delta < 0) {
      // ITM puts with low IV
      if (moneyness < 0.98 && iv < 0.2 && greeks.theta > -5) return 'strong_buy';
      if (moneyness < 0.99 && iv < 0.25) return 'buy';
      
      // OTM puts with high IV
      if (moneyness > 1.02 && iv > 0.35) return 'sell';
      if (moneyness > 1.05 && iv > 0.3) return 'strong_sell';
    }
    
    return 'hold';
  }

  private calculatePortfolioRisk(): void {
    const positions = Array.from(this.optionsData.values());
    
    if (positions.length === 0) {
      this.portfolioRisk = null;
      return;
    }

    // Simulate portfolio positions (in real trading, get from broker)
    const portfolioPositions = [
      { symbol: 'NIFTY_18000_call', quantity: 100 },
      { symbol: 'NIFTY_18000_put', quantity: -50 },
      { symbol: 'NIFTY_18200_call', quantity: 75 }
    ];

    let totalDelta = 0;
    let totalGamma = 0;
    let totalTheta = 0;
    let totalVega = 0;
    let totalRho = 0;
    let portfolioValue = 0;

    portfolioPositions.forEach(pos => {
      const optionData = this.optionsData.get(pos.symbol);
      if (optionData) {
        totalDelta += pos.quantity * optionData.greeks.delta;
        totalGamma += pos.quantity * optionData.greeks.gamma;
        totalTheta += pos.quantity * optionData.greeks.theta;
        totalVega += pos.quantity * optionData.greeks.vega;
        totalRho += pos.quantity * optionData.greeks.rho;
        portfolioValue += pos.quantity * optionData.greeks.price;
      }
    });

    const riskScore = this.calculatePortfolioRiskScore(totalDelta, totalGamma, totalTheta, totalVega);
    const hedgingRecommendations = this.generateHedgingRecommendations(totalDelta, totalGamma, totalVega);
    const gammaExposure = this.calculateGammaExposure(totalGamma);

    this.portfolioRisk = {
      totalDelta,
      totalGamma,
      totalTheta,
      totalVega,
      totalRho,
      portfolioValue,
      riskScore,
      hedgingRecommendations,
      maxDrawdownRisk: this.calculateMaxDrawdownRisk(totalDelta, totalGamma),
      gammaExposure
    };
  }

  private calculatePortfolioRiskScore(delta: number, gamma: number, theta: number, vega: number): number {
    let score = 50; // Base score
    
    // Delta risk
    if (Math.abs(delta) > 100) score += 20;
    else if (Math.abs(delta) > 50) score += 10;
    
    // Gamma risk
    if (Math.abs(gamma) > 5) score += 25;
    else if (Math.abs(gamma) > 2) score += 15;
    
    // Theta decay risk
    if (theta < -100) score += 15;
    else if (theta < -50) score += 8;
    
    // Vega risk
    if (Math.abs(vega) > 200) score += 20;
    else if (Math.abs(vega) > 100) score += 10;
    
    return Math.min(100, Math.max(0, score));
  }

  private generateHedgingRecommendations(delta: number, gamma: number, vega: number): string[] {
    const recommendations: string[] = [];
    
    if (Math.abs(delta) > 50) {
      recommendations.push(`High delta exposure (${delta.toFixed(2)}). Consider delta hedging with underlying.`);
    }
    
    if (Math.abs(gamma) > 3) {
      recommendations.push(`High gamma risk (${gamma.toFixed(4)}). Consider reducing gamma exposure.`);
    }
    
    if (Math.abs(vega) > 150) {
      recommendations.push(`High vega exposure (${vega.toFixed(2)}). Consider volatility hedging.`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Portfolio Greeks are within acceptable risk limits.');
    }
    
    return recommendations;
  }

  private calculateGammaExposure(gamma: number): 'low' | 'medium' | 'high' | 'extreme' {
    const absGamma = Math.abs(gamma);
    if (absGamma > 10) return 'extreme';
    if (absGamma > 5) return 'high';
    if (absGamma > 2) return 'medium';
    return 'low';
  }

  private calculateMaxDrawdownRisk(delta: number, gamma: number): number {
    // Simplified calculation: max risk if underlying moves 5%
    const underlyingMove = 0.05;
    const spotPrice = 18000;
    const deltaRisk = Math.abs(delta * spotPrice * underlyingMove);
    const gammaRisk = Math.abs(0.5 * gamma * Math.pow(spotPrice * underlyingMove, 2));
    
    return deltaRisk + gammaRisk;
  }

  private generateGreeksBasedSignals(): void {
    const signals: TradingSignal[] = [];
    
    this.optionsData.forEach((optionData) => {
      // High IV mean reversion strategy
      if (optionData.impliedVolatility > this.greeksThresholds.impliedVolHigh && 
          optionData.volume > 2000) {
        signals.push({
          symbol: optionData.symbol,
          action: 'sell',
          orderType: 'limit',
          quantity: 1,
          price: optionData.lastPrice,
          confidence: 0.8,
          reason: `High IV (${(optionData.impliedVolatility * 100).toFixed(1)}%) sell opportunity - mean reversion play`,
          strategy: 'Options IV Mean Reversion'
        });
      }
      
      // Low IV expansion strategy
      if (optionData.impliedVolatility < this.greeksThresholds.impliedVolLow && 
          optionData.volume > 1500 && 
          Math.abs(optionData.greeks.delta) > 0.3) {
        signals.push({
          symbol: optionData.symbol,
          action: 'buy',
          orderType: 'limit',
          quantity: 1,
          price: optionData.lastPrice,
          confidence: 0.75,
          reason: `Low IV (${(optionData.impliedVolatility * 100).toFixed(1)}%) expansion opportunity`,
          strategy: 'Options IV Expansion'
        });
      }
      
      // Gamma scalping opportunity
      if (Math.abs(optionData.greeks.gamma) > 0.03 && 
          optionData.timeToExpiry < 0.05 && // Less than ~18 days
          Math.abs(optionData.greeks.delta) > 0.4) {
        signals.push({
          symbol: optionData.symbol,
          action: 'buy',
          orderType: 'market',
          quantity: 1,
          confidence: 0.85,
          reason: `High gamma (${optionData.greeks.gamma.toFixed(4)}) scalping opportunity`,
          strategy: 'Options Gamma Scalping'
        });
      }
    });
    
    if (signals.length > 0) {
      console.log('🎯 Options Greeks Generated Signals:', signals);
    }
  }

  public getOptionsData(): OptionsGreeksData[] {
    return Array.from(this.optionsData.values());
  }

  public getPortfolioRisk(): PortfolioGreeksRisk | null {
    return this.portfolioRisk;
  }

  public getHighRiskOptions(): OptionsGreeksData[] {
    return Array.from(this.optionsData.values())
      .filter(option => option.riskLevel === 'high' || option.riskLevel === 'extreme')
      .sort((a, b) => {
        const riskOrder = { extreme: 4, high: 3, medium: 2, low: 1 };
        return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
      });
  }

  public getTradingOpportunities(): OptionsGreeksData[] {
    return Array.from(this.optionsData.values())
      .filter(option => 
        option.tradingRecommendation === 'strong_buy' || 
        option.tradingRecommendation === 'buy' ||
        option.tradingRecommendation === 'strong_sell'
      )
      .sort((a, b) => {
        const recommendationOrder = { 
          strong_buy: 5, buy: 4, hold: 3, sell: 2, strong_sell: 1 
        };
        return recommendationOrder[b.tradingRecommendation] - recommendationOrder[a.tradingRecommendation];
      });
  }

  public getGreeksAnalysis(symbol: string): {
    riskAssessment: string;
    strategicInsights: string[];
    hedgingOptions: string[];
  } | null {
    const option = this.optionsData.get(symbol);
    if (!option) return null;

    const riskAssessment = this.generateRiskAssessment(option);
    const strategicInsights = this.generateStrategicInsights(option);
    const hedgingOptions = this.generateHedgingOptions(option);

    return { riskAssessment, strategicInsights, hedgingOptions };
  }

  private generateRiskAssessment(option: OptionsGreeksData): string {
    const { greeks, impliedVolatility, riskLevel } = option;
    
    let assessment = `Risk Level: ${riskLevel.toUpperCase()}. `;
    
    if (Math.abs(greeks.gamma) > 0.03) {
      assessment += "High gamma indicates significant acceleration risk. ";
    }
    
    if (greeks.theta < -10) {
      assessment += "High time decay - position losing significant value daily. ";
    }
    
    if (impliedVolatility > 0.3) {
      assessment += "High IV suggests elevated volatility risk. ";
    }
    
    return assessment;
  }

  private generateStrategicInsights(option: OptionsGreeksData): string[] {
    const insights: string[] = [];
    const { greeks, impliedVolatility, timeToExpiry } = option;
    
    if (timeToExpiry < 0.027 && Math.abs(greeks.gamma) > 0.02) {
      insights.push("Near expiry with high gamma - ideal for scalping strategies");
    }
    
    if (impliedVolatility > 0.35 && greeks.vega > 15) {
      insights.push("High IV with significant vega - consider volatility selling strategies");
    }
    
    if (Math.abs(greeks.delta) > 0.7 && impliedVolatility < 0.2) {
      insights.push("Deep ITM with low IV - consider directional strategies");
    }
    
    return insights;
  }

  private generateHedgingOptions(option: OptionsGreeksData): string[] {
    const hedging: string[] = [];
    const { greeks } = option;
    
    if (Math.abs(greeks.delta) > 0.5) {
      hedging.push(`Delta hedge: ${Math.abs(greeks.delta * 100).toFixed(0)} shares of underlying`);
    }
    
    if (Math.abs(greeks.gamma) > 0.03) {
      hedging.push("Consider gamma hedging with opposing gamma positions");
    }
    
    if (Math.abs(greeks.vega) > 20) {
      hedging.push("Vega hedge: Use options with opposite vega exposure");
    }
    
    return hedging;
  }
}

export const optionsGreeksEngine = new OptionsGreeksEngine();
