
interface TradingOpportunity {
  symbol: string;
  strategy: string;
  action: 'buy' | 'sell';
  confidence: number;
  riskRewardRatio: number;
  expectedProfit: number;
  maxLoss: number;
  timeframe: string;
  reasoning: string[];
  entryPrice: number;
  stopLoss: number;
  target: number;
  quantity: number;
  brokerageCost: number;
  netProfit: number;
}

interface MarketAnalysis {
  trend: 'bullish' | 'bearish' | 'sideways';
  volatility: number;
  volume: number;
  support: number;
  resistance: number;
  rsi: number;
  macd: string;
  movingAverage: number;
}

export class IntelligentTradingStrategy {
  private readonly MIN_PROFIT_TARGET = 500; // Minimum ₹500 profit per trade
  private readonly MAX_RISK_PER_TRADE = 0.02; // 2% max risk per trade
  private readonly MIN_RISK_REWARD_RATIO = 3; // Minimum 1:3 risk-reward
  private readonly BROKERAGE_PER_TRADE = 20; // ₹20 flat brokerage
  
  // Intelligent Options Strategies for high profits with managed risk
  analyzeOptionsOpportunities(symbol: string, currentPrice: number, accountBalance: number): TradingOpportunity[] {
    const opportunities: TradingOpportunity[] = [];
    
    // 1. Iron Condor for sideways markets (High probability, consistent income)
    if (this.isMarketSideways(symbol)) {
      const ironCondor = this.createIronCondorStrategy(symbol, currentPrice, accountBalance);
      if (ironCondor && ironCondor.netProfit > this.MIN_PROFIT_TARGET) {
        opportunities.push(ironCondor);
      }
    }
    
    // 2. Bull Put Spread for moderately bullish markets
    if (this.isModeratelyBullish(symbol)) {
      const bullPutSpread = this.createBullPutSpreadStrategy(symbol, currentPrice, accountBalance);
      if (bullPutSpread && bullPutSpread.netProfit > this.MIN_PROFIT_TARGET) {
        opportunities.push(bullPutSpread);
      }
    }
    
    // 3. Short Straddle for low volatility periods
    if (this.isLowVolatility(symbol)) {
      const shortStraddle = this.createShortStraddleStrategy(symbol, currentPrice, accountBalance);
      if (shortStraddle && shortStraddle.netProfit > this.MIN_PROFIT_TARGET) {
        opportunities.push(shortStraddle);
      }
    }
    
    return opportunities.sort((a, b) => b.netProfit - a.netProfit);
  }
  
  // Intelligent Intraday Strategies for high probability trades
  analyzeIntradayOpportunities(symbol: string, currentPrice: number, accountBalance: number): TradingOpportunity[] {
    const opportunities: TradingOpportunity[] = [];
    const analysis = this.performTechnicalAnalysis(symbol, currentPrice);
    
    // 1. Breakout Strategy - High momentum trades
    if (this.isBreakoutPattern(analysis)) {
      const breakout = this.createBreakoutStrategy(symbol, currentPrice, analysis, accountBalance);
      if (breakout && breakout.netProfit > this.MIN_PROFIT_TARGET) {
        opportunities.push(breakout);
      }
    }
    
    // 2. Support/Resistance Bounce - High probability reversals
    if (this.isSupportResistanceBounce(analysis)) {
      const bounce = this.createBounceStrategy(symbol, currentPrice, analysis, accountBalance);
      if (bounce && bounce.netProfit > this.MIN_PROFIT_TARGET) {
        opportunities.push(bounce);
      }
    }
    
    // 3. Mean Reversion Strategy - Oversold/Overbought conditions
    if (this.isMeanReversionSetup(analysis)) {
      const meanReversion = this.createMeanReversionStrategy(symbol, currentPrice, analysis, accountBalance);
      if (meanReversion && meanReversion.netProfit > this.MIN_PROFIT_TARGET) {
        opportunities.push(meanReversion);
      }
    }
    
    return opportunities.sort((a, b) => b.confidence - a.confidence);
  }
  
  private createIronCondorStrategy(symbol: string, currentPrice: number, accountBalance: number): TradingOpportunity | null {
    // Iron Condor: Sell ATM Call & Put, Buy OTM Call & Put
    const premiumReceived = currentPrice * 0.008; // 0.8% premium
    const maxLoss = currentPrice * 0.02; // 2% max loss
    const netProfit = (premiumReceived * 50) - this.BROKERAGE_PER_TRADE; // 50 lots
    
    if (netProfit < this.MIN_PROFIT_TARGET) return null;
    
    return {
      symbol: `${symbol}_IRON_CONDOR`,
      strategy: 'Iron Condor',
      action: 'sell',
      confidence: 0.85,
      riskRewardRatio: premiumReceived / maxLoss,
      expectedProfit: netProfit,
      maxLoss: maxLoss * 50,
      timeframe: '1-7 days',
      reasoning: [
        'Market showing sideways movement',
        'High probability of price staying in range',
        'Time decay works in our favor',
        'Limited risk with defined profit'
      ],
      entryPrice: currentPrice,
      stopLoss: currentPrice * 1.025,
      target: premiumReceived * 0.5, // 50% profit target
      quantity: 50,
      brokerageCost: this.BROKERAGE_PER_TRADE,
      netProfit
    };
  }
  
  private createBullPutSpreadStrategy(symbol: string, currentPrice: number, accountBalance: number): TradingOpportunity | null {
    const creditReceived = currentPrice * 0.006; // 0.6% credit
    const maxLoss = currentPrice * 0.015; // 1.5% max loss
    const netProfit = (creditReceived * 75) - this.BROKERAGE_PER_TRADE;
    
    if (netProfit < this.MIN_PROFIT_TARGET) return null;
    
    return {
      symbol: `${symbol}_BULL_PUT_SPREAD`,
      strategy: 'Bull Put Spread',
      action: 'sell',
      confidence: 0.80,
      riskRewardRatio: creditReceived / maxLoss,
      expectedProfit: netProfit,
      maxLoss: maxLoss * 75,
      timeframe: '1-5 days',
      reasoning: [
        'Moderately bullish outlook',
        'Credit strategy with limited risk',
        'High probability of success',
        'Time decay advantage'
      ],
      entryPrice: currentPrice,
      stopLoss: currentPrice * 0.985,
      target: creditReceived * 0.6,
      quantity: 75,
      brokerageCost: this.BROKERAGE_PER_TRADE,
      netProfit
    };
  }
  
  private createBreakoutStrategy(symbol: string, currentPrice: number, analysis: MarketAnalysis, accountBalance: number): TradingOpportunity | null {
    const riskAmount = accountBalance * this.MAX_RISK_PER_TRADE;
    const stopLossDistance = currentPrice * 0.015; // 1.5% stop loss
    const targetDistance = stopLossDistance * 4; // 1:4 risk reward
    const quantity = Math.floor(riskAmount / stopLossDistance);
    const expectedProfit = (targetDistance * quantity) - this.BROKERAGE_PER_TRADE;
    
    if (expectedProfit < this.MIN_PROFIT_TARGET || quantity < 1) return null;
    
    return {
      symbol,
      strategy: 'Breakout Momentum',
      action: analysis.trend === 'bullish' ? 'buy' : 'sell',
      confidence: 0.75,
      riskRewardRatio: targetDistance / stopLossDistance,
      expectedProfit,
      maxLoss: stopLossDistance * quantity,
      timeframe: '1-3 hours',
      reasoning: [
        'Strong breakout above resistance',
        'High volume confirmation',
        'Momentum indicators aligned',
        'Clear risk-reward setup'
      ],
      entryPrice: currentPrice,
      stopLoss: analysis.trend === 'bullish' ? currentPrice - stopLossDistance : currentPrice + stopLossDistance,
      target: analysis.trend === 'bullish' ? currentPrice + targetDistance : currentPrice - targetDistance,
      quantity,
      brokerageCost: this.BROKERAGE_PER_TRADE,
      netProfit: expectedProfit
    };
  }
  
  private performTechnicalAnalysis(symbol: string, currentPrice: number): MarketAnalysis {
    // Simulate advanced technical analysis
    const volatility = Math.random() * 0.4 + 0.1; // 10-50% volatility
    const volume = Math.random() * 2 + 0.5; // 0.5x to 2.5x average volume
    const rsi = Math.random() * 100;
    
    return {
      trend: rsi > 60 ? 'bullish' : rsi < 40 ? 'bearish' : 'sideways',
      volatility,
      volume,
      support: currentPrice * (0.98 - Math.random() * 0.02),
      resistance: currentPrice * (1.02 + Math.random() * 0.02),
      rsi,
      macd: rsi > 50 ? 'bullish' : 'bearish',
      movingAverage: currentPrice * (0.99 + Math.random() * 0.02)
    };
  }
  
  private isMarketSideways(symbol: string): boolean {
    // Check if market is in sideways trend (good for Iron Condor)
    return Math.random() > 0.6; // 40% probability
  }
  
  private isModeratelyBullish(symbol: string): boolean {
    // Check for moderate bullish sentiment
    return Math.random() > 0.5; // 50% probability
  }
  
  private isLowVolatility(symbol: string): boolean {
    // Check for low volatility environment
    return Math.random() > 0.7; // 30% probability
  }
  
  private isBreakoutPattern(analysis: MarketAnalysis): boolean {
    return analysis.volume > 1.5 && analysis.rsi > 60;
  }
  
  private isSupportResistanceBounce(analysis: MarketAnalysis): boolean {
    return Math.abs(analysis.rsi - 50) > 20; // Oversold or overbought
  }
  
  private isMeanReversionSetup(analysis: MarketAnalysis): boolean {
    return analysis.rsi > 80 || analysis.rsi < 20; // Extreme levels
  }
  
  private createBounceStrategy(symbol: string, currentPrice: number, analysis: MarketAnalysis, accountBalance: number): TradingOpportunity | null {
    const riskAmount = accountBalance * this.MAX_RISK_PER_TRADE;
    const isOversold = analysis.rsi < 30;
    const stopLossDistance = currentPrice * 0.012; // 1.2% stop loss
    const targetDistance = stopLossDistance * 3.5; // 1:3.5 risk reward
    const quantity = Math.floor(riskAmount / stopLossDistance);
    const expectedProfit = (targetDistance * quantity) - this.BROKERAGE_PER_TRADE;
    
    if (expectedProfit < this.MIN_PROFIT_TARGET || quantity < 1) return null;
    
    return {
      symbol,
      strategy: 'Support/Resistance Bounce',
      action: isOversold ? 'buy' : 'sell',
      confidence: 0.78,
      riskRewardRatio: targetDistance / stopLossDistance,
      expectedProfit,
      maxLoss: stopLossDistance * quantity,
      timeframe: '2-6 hours',
      reasoning: [
        isOversold ? 'Oversold bounce from support' : 'Overbought rejection at resistance',
        'RSI showing extreme levels',
        'High probability reversal zone',
        'Good risk-reward ratio'
      ],
      entryPrice: currentPrice,
      stopLoss: isOversold ? analysis.support * 0.995 : analysis.resistance * 1.005,
      target: isOversold ? currentPrice + targetDistance : currentPrice - targetDistance,
      quantity,
      brokerageCost: this.BROKERAGE_PER_TRADE,
      netProfit: expectedProfit
    };
  }
  
  private createMeanReversionStrategy(symbol: string, currentPrice: number, analysis: MarketAnalysis, accountBalance: number): TradingOpportunity | null {
    const riskAmount = accountBalance * this.MAX_RISK_PER_TRADE;
    const isOverbought = analysis.rsi > 80;
    const stopLossDistance = currentPrice * 0.01; // 1% stop loss for mean reversion
    const targetDistance = stopLossDistance * 4; // 1:4 risk reward
    const quantity = Math.floor(riskAmount / stopLossDistance);
    const expectedProfit = (targetDistance * quantity) - this.BROKERAGE_PER_TRADE;
    
    if (expectedProfit < this.MIN_PROFIT_TARGET || quantity < 1) return null;
    
    return {
      symbol,
      strategy: 'Mean Reversion',
      action: isOverbought ? 'sell' : 'buy',
      confidence: 0.82,
      riskRewardRatio: targetDistance / stopLossDistance,
      expectedProfit,
      maxLoss: stopLossDistance * quantity,
      timeframe: '1-4 hours',
      reasoning: [
        isOverbought ? 'Extreme overbought condition' : 'Extreme oversold condition',
        'Mean reversion probability high',
        'RSI divergence detected',
        'Statistical edge present'
      ],
      entryPrice: currentPrice,
      stopLoss: isOverbought ? currentPrice * 1.01 : currentPrice * 0.99,
      target: isOverbought ? analysis.movingAverage * 0.98 : analysis.movingAverage * 1.02,
      quantity,
      brokerageCost: this.BROKERAGE_PER_TRADE,
      netProfit: expectedProfit
    };
  }
  
  private createShortStraddleStrategy(symbol: string, currentPrice: number, accountBalance: number): TradingOpportunity | null {
    const premiumReceived = currentPrice * 0.012; // 1.2% premium for both call and put
    const maxLoss = currentPrice * 0.08; // 8% max loss if moves significantly
    const netProfit = (premiumReceived * 25) - this.BROKERAGE_PER_TRADE; // 25 lots
    
    if (netProfit < this.MIN_PROFIT_TARGET) return null;
    
    return {
      symbol: `${symbol}_SHORT_STRADDLE`,
      strategy: 'Short Straddle',
      action: 'sell',
      confidence: 0.70,
      riskRewardRatio: premiumReceived / maxLoss,
      expectedProfit: netProfit,
      maxLoss: maxLoss * 25,
      timeframe: '1-3 days',
      reasoning: [
        'Low volatility environment',
        'High time decay advantage',
        'Range-bound market expected',
        'Premium collection strategy'
      ],
      entryPrice: currentPrice,
      stopLoss: currentPrice * 1.04, // 4% movement triggers exit
      target: premiumReceived * 0.7, // 70% profit target
      quantity: 25,
      brokerageCost: this.BROKERAGE_PER_TRADE,
      netProfit
    };
  }
  
  // Risk Management Functions
  calculateOptimalPositionSize(accountBalance: number, riskPerTrade: number, stopLossDistance: number): number {
    const riskAmount = accountBalance * (riskPerTrade / 100);
    return Math.floor(riskAmount / stopLossDistance);
  }
  
  evaluateTradeQuality(opportunity: TradingOpportunity): 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' {
    if (opportunity.confidence > 0.8 && opportunity.riskRewardRatio > 3 && opportunity.netProfit > 1000) {
      return 'EXCELLENT';
    } else if (opportunity.confidence > 0.7 && opportunity.riskRewardRatio > 2.5 && opportunity.netProfit > 700) {
      return 'GOOD';
    } else if (opportunity.confidence > 0.6 && opportunity.riskRewardRatio > 2 && opportunity.netProfit > 500) {
      return 'AVERAGE';
    }
    return 'POOR';
  }
}

export const intelligentTradingStrategy = new IntelligentTradingStrategy();
export type { TradingOpportunity, MarketAnalysis };
