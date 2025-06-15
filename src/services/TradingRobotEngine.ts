
import { PositionManager } from './trading/PositionManager';
import { TradingSignal, MarketCondition, StrategyConfig, Position } from './trading/types';

export type { TradingSignal }; // Re-export for legacy dependencies

export class TradingRobotEngine {
  private config: StrategyConfig;
  private isActive: boolean = false;
  private positionManager: PositionManager;
  private marketCondition: MarketCondition | null = null;
  private dailyTradingStats = {
    totalTrades: 0,
    winningTrades: 0,
    maxDrawdown: 0,
    currentDrawdown: 0,
    startingCapital: 500000,
    currentCapital: 500000
  };

  constructor(config: StrategyConfig) {
    this.config = config;
    this.positionManager = new PositionManager();
  }

  public startRobot(): void {
    if (!this.isMarketTime()) {
      console.log('🕐 Cannot start robot - Market is closed');
      console.log('📅 Trading Hours: Monday-Friday, 9:15 AM - 3:30 PM IST');
      return;
    }

    this.isActive = true;
    this.resetDailyStats();
    
    console.log('🤖 Enhanced AI Trading Robot Started');
    console.log('📊 Multi-strategy Indian market robot active');
    console.log('🛡️ Advanced risk management enabled');
    
    this.analyzeMarketConditions();
    this.monitorMarket();
    this.startEndOfDayMonitor();
  }

  public stopRobot(): void {
    this.isActive = false;
    this.logDailyPerformance();
    console.log('🛑 AI Trading Robot Stopped');
  }

  private isMarketTime(): boolean {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours() + now.getMinutes() / 60;
    
    return day >= 1 && day <= 5 && hour >= 9.25 && hour <= 15.5;
  }

  private startEndOfDayMonitor(): void {
    const interval = setInterval(() => {
      const hour = new Date().getHours() + new Date().getMinutes() / 60;
      
      if (hour >= 15.42) { // 3:25 PM - Start closing positions
        console.log('🕐 Market closing - Initiating position closure');
        this.closeIntradayPositions();
        clearInterval(interval);
      }
    }, 60000);
  }

  private closeIntradayPositions(): void {
    const closedPositions = this.positionManager.closeIntradayPositions();
    
    closedPositions.forEach(position => {
      this.updateStatsOnClose(position);
      console.log(`- P&L: ${position.pnlPercent.toFixed(2)}%`);
    });
  }

  private resetDailyStats(): void {
    this.dailyTradingStats = {
      totalTrades: 0,
      winningTrades: 0,
      maxDrawdown: 0,
      currentDrawdown: 0,
      startingCapital: this.dailyTradingStats.currentCapital,
      currentCapital: this.dailyTradingStats.currentCapital
    };
  }

  private logDailyPerformance(): void {
    const stats = this.dailyTradingStats;
    const winRate = stats.totalTrades > 0 ? (stats.winningTrades / stats.totalTrades * 100) : 0;
    const totalReturn = ((stats.currentCapital - stats.startingCapital) / stats.startingCapital * 100);
    
    console.log('📊 Daily Performance Summary:');
    console.log(`📈 Total Trades: ${stats.totalTrades}`);
    console.log(`✅ Win Rate: ${winRate.toFixed(1)}%`);
    console.log(`💰 Total Return: ${totalReturn.toFixed(2)}%`);
    console.log(`📉 Max Drawdown: ${stats.maxDrawdown.toFixed(2)}%`);
    console.log(`💼 Current Capital: ₹${stats.currentCapital.toLocaleString()}`);
  }

  private analyzeMarketConditions(): MarketCondition {
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60;
    
    // Determine time of day
    let timeOfDay: MarketCondition['timeOfDay'];
    if (hour < 9.25) timeOfDay = 'pre_open';
    else if (hour <= 10.5) timeOfDay = 'opening';
    else if (hour <= 13) timeOfDay = 'morning';
    else if (hour <= 15.4) timeOfDay = 'afternoon';
    else timeOfDay = 'closing';
    
    // Enhanced market analysis with real factors
    const marketData = this.getMarketData();
    
    const conditions: MarketCondition = {
      trend: this.analyzeTrend(marketData),
      volatility: this.analyzeVolatility(marketData),
      volume: this.analyzeVolume(marketData),
      marketSentiment: this.analyzeSentiment(),
      timeOfDay,
      dayType: this.getDayType()
    };

    this.marketCondition = conditions;
    console.log('📈 Enhanced Market Analysis:', conditions);
    return conditions;
  }

  private getMarketData() {
    // In real implementation, this would fetch actual market data
    const niftyChange = (Math.random() - 0.5) * 4; // -2% to +2%
    const volatility = Math.random() * 0.8 + 0.1; // 10% to 90%
    const volume = Math.random() * 2 + 0.5; // 0.5x to 2.5x normal
    
    return { niftyChange, volatility, volume };
  }

  private analyzeTrend(data: any): MarketCondition['trend'] {
    if (data.niftyChange > 0.5) return 'bullish';
    if (data.niftyChange < -0.5) return 'bearish';
    return 'sideways';
  }

  private analyzeVolatility(data: any): MarketCondition['volatility'] {
    if (data.volatility > 0.6) return 'extreme';
    if (data.volatility > 0.4) return 'high';
    if (data.volatility > 0.2) return 'medium';
    return 'low';
  }

  private analyzeVolume(data: any): MarketCondition['volume'] {
    if (data.volume > 2.0) return 'exceptional';
    if (data.volume > 1.5) return 'high';
    if (data.volume > 0.8) return 'normal';
    return 'low';
  }

  private analyzeSentiment(): MarketCondition['marketSentiment'] {
    const sentimentScore = Math.random();
    if (sentimentScore > 0.6) return 'positive';
    if (sentimentScore < 0.4) return 'negative';
    return 'neutral';
  }

  private getDayType(): MarketCondition['dayType'] {
    const day = new Date().getDay();
    if (day === 4) return 'expiry'; // Thursday expiry
    return 'normal';
  }

  private monitorMarket(): void {
    if (!this.isActive) return;

    const interval = setInterval(() => {
      if (!this.isActive || !this.isMarketTime()) {
        clearInterval(interval);
        return;
      }

      this.analyzeMarketConditions();
      this.positionManager.updatePositions();
      this.updateDailyStats();
      this.manageRiskAndTrailing();
      
      if (this.shouldGenerateSignals()) {
        this.generateSignals();
      }
    }, 15000); // Check every 15 seconds
  }

  private shouldGenerateSignals(): boolean {
    if (this.positionManager.getPositionCount() >= this.config.maxPositions) return false;
    
    const hour = new Date().getHours() + new Date().getMinutes() / 60;
    if (hour > 15.2) return false; // Stop new signals after 3:12 PM
    
    const recentTrades = this.positionManager.getPositions().filter(pos => 
      Date.now() - pos.entryTime.getTime() < 300000 // Last 5 minutes
    ).length;
    
    return recentTrades < 2; // Max 2 new positions per 5 minutes
  }

  private updateDailyStats(): void {
    const stats = this.dailyTradingStats;
    
    const unrealizedPnL = this.positionManager.getPositions().reduce((sum, pos) => sum + pos.pnl, 0);
    stats.currentCapital = stats.startingCapital + unrealizedPnL;
    
    const currentReturn = (stats.currentCapital - stats.startingCapital) / stats.startingCapital;
    stats.currentDrawdown = Math.min(0, currentReturn);
    stats.maxDrawdown = Math.min(stats.maxDrawdown, stats.currentDrawdown);
  }

  private manageRiskAndTrailing(): void {
    this.positionManager.getPositions().forEach(position => {
      if (position.pnlPercent < -5.0) {
        console.log(`⚠️ Risk limit hit for ${position.symbol} - Auto closing`);
        this.closePosition(position, 'Risk management - Max loss exceeded');
        return;
      }
      
      this.manageTrailingStop(position);
      
      if (this.config.partialProfitBooking) {
        this.handlePartialProfitBooking(position);
      }
      
      this.checkTimeBasedExit(position);
    });
  }

  private manageTrailingStop(position: Position): void {
    if (!this.config.trailingStopEnabled) return;
    
    const profitPercent = position.pnlPercent;
    
    if (profitPercent >= 1.0 && !position.trailingActive) {
      position.trailingActive = true;
      position.stopLoss = position.entryPrice;
      console.log(`🎯 Trailing activated for ${position.symbol} - Moved to breakeven`);
    }
    
    if (position.trailingActive) {
      let trailPercent = 0.015;
      
      if (profitPercent > 5.0) trailPercent = 0.025;
      else if (profitPercent > 3.0) trailPercent = 0.02;
      
      const newStopLoss = position.action === 'buy' ? 
        position.currentPrice * (1 - trailPercent) :
        position.currentPrice * (1 + trailPercent);
      
      if ((position.action === 'buy' && newStopLoss > position.stopLoss) ||
          (position.action === 'sell' && newStopLoss < position.stopLoss)) {
        position.stopLoss = newStopLoss;
        console.log(`📈 Trailing stop updated: ${position.symbol} → ₹${newStopLoss.toFixed(2)} (${profitPercent.toFixed(1)}% profit)`);
      }
    }
    
    this.checkExitConditions(position);
  }

  private handlePartialProfitBooking(position: Position): void {
    const profitPercent = position.pnlPercent;
    
    if (profitPercent >= 3.0 && position.profitBookingLevel === 0) {
      const partialQuantity = Math.floor(position.quantity * 0.4);
      if (partialQuantity > 0) {
        position.quantity -= partialQuantity;
        position.profitBookingLevel = 1;
        console.log(`💰 Booked 40% profit for ${position.symbol} at ${profitPercent.toFixed(1)}% gain`);
      }
    }
    
    if (profitPercent >= 6.0 && position.profitBookingLevel === 1) {
      const partialQuantity = Math.floor(position.quantity * 0.5);
      if (partialQuantity > 0) {
        position.quantity -= partialQuantity;
        position.profitBookingLevel = 2;
        console.log(`💰 Booked additional 30% profit for ${position.symbol} at ${profitPercent.toFixed(1)}% gain`);
      }
    }
  }

  private checkTimeBasedExit(position: Position): void {
    const holdingTime = Date.now() - position.entryTime.getTime();
    const hour = new Date().getHours() + new Date().getMinutes() / 60;
    
    if (position.strategy.includes('Scalping') && holdingTime > 1800000) {
      this.closePosition(position, 'Scalping time limit reached');
    }
    
    if (hour >= 15.25 && position.strategy.includes('Intraday')) {
      this.closePosition(position, 'Market closing - Intraday exit');
    }
  }

  private checkExitConditions(position: Position): void {
    const shouldExit = 
      (position.action === 'buy' && position.currentPrice <= position.stopLoss) ||
      (position.action === 'sell' && position.currentPrice >= position.stopLoss) ||
      (position.action === 'buy' && position.currentPrice >= position.target) ||
      (position.action === 'sell' && position.currentPrice <= position.target);

    if (shouldExit) {
      const reason = position.pnlPercent > 0 ? 'Target/Trailing Stop' : 'Stop Loss';
      this.closePosition(position, reason);
    }
  }

  private closePosition(position: Position, reason: string): void {
    console.log(`🔄 Closing ${position.symbol}: ${reason} - P&L: ${position.pnlPercent.toFixed(2)}%`);
    
    const closedPosition = this.positionManager.closePosition(position.id);

    if (closedPosition) {
      this.updateStatsOnClose(closedPosition);
    }
  }

  private updateStatsOnClose(position: Position): void {
    this.dailyTradingStats.totalTrades++;
    if (position.pnl > 0) {
      this.dailyTradingStats.winningTrades++;
    }
  }

  public generateSignals(): TradingSignal[] {
    if (!this.marketCondition) return [];

    const signals: TradingSignal[] = [];
    const symbols = ['NIFTY50', 'BANKNIFTY', 'RELIANCE', 'TCS', 'HDFC', 'INFY'];

    for (const symbol of symbols) {
      if (this.positionManager.getPositionCount() >= this.config.maxPositions) break;

      // Intraday Strategy
      if (this.config.intradayEnabled) {
        const intradaySignal = this.intradayStrategy(symbol);
        if (intradaySignal) {
          const newPosition = this.positionManager.createPosition(intradaySignal);
          if (newPosition) {
            signals.push(intradaySignal);
          }
        }
      }

      // Options Strategy
      if (this.config.optionsEnabled) {
        const optionsSignal = this.optionsStrategy(symbol);
        if (optionsSignal) {
           const newPosition = this.positionManager.createPosition(optionsSignal);
          if (newPosition) {
            signals.push(optionsSignal);
          }
        }
      }
    }

    if (signals.length > 0) {
      console.log('🎯 Generated Trading Signals:', signals);
    }

    return signals;
  }

  private createPosition(signal: TradingSignal): void {
    
  }

  private intradayStrategy(symbol: string): TradingSignal | null {
    if (!this.marketCondition) return null;

    const { trend, volatility, volume } = this.marketCondition;

    if (trend === 'bullish' && volume === 'high' && this.positionManager.getPositionCount() < this.config.maxPositions) {
      return {
        symbol,
        action: 'buy',
        orderType: 'limit',
        quantity: this.calculatePositionSize(symbol),
        price: 19800,
        confidence: 0.75,
        reason: 'Bullish trend with high volume - momentum play',
        strategy: 'Intraday Momentum',
        stopLoss: this.calculateStopLoss(symbol, 'buy'),
        target: this.calculateTarget(symbol, 'buy')
      };
    }

    if (trend === 'bearish' && volatility === 'high') {
      return {
        symbol,
        action: 'sell',
        orderType: 'limit',
        quantity: this.calculatePositionSize(symbol),
        price: 19800,
        confidence: 0.70,
        reason: 'Bearish trend with high volatility - short opportunity',
        strategy: 'Intraday Short',
        stopLoss: this.calculateStopLoss(symbol, 'sell'),
        target: this.calculateTarget(symbol, 'sell')
      };
    }

    return null;
  }

  private optionsStrategy(symbol: string): TradingSignal | null {
    if (!this.marketCondition) return null;
    if (symbol !== 'NIFTY50' && symbol !== 'BANKNIFTY') return null;

    const { trend, volatility, marketSentiment } = this.marketCondition;

    if (trend === 'sideways' && volatility === 'low') {
      return {
        symbol: `${symbol}_CE`,
        action: 'sell',
        orderType: 'limit',
        quantity: 1,
        confidence: 0.80,
        reason: 'Sideways market - Iron Condor strategy for premium collection',
        strategy: 'Options Iron Condor'
      };
    }

    if (volatility === 'high' && marketSentiment === 'neutral') {
      return {
        symbol: `${symbol}_STRADDLE`,
        action: 'buy',
        orderType: 'market',
        quantity: 1,
        confidence: 0.85,
        reason: 'High volatility expected - Long Straddle for directional move',
        strategy: 'Options Long Straddle'
      };
    }

    return null;
  }

  private calculatePositionSize(symbol: string): number {
    const accountBalance = 100000;
    const riskAmount = accountBalance * (this.config.riskPerTrade / 100);
    const stopLossPercentage = 1.5;
    
    if (symbol === 'NIFTY50' || symbol === 'BANKNIFTY') return 1;
    return Math.floor(riskAmount / (19800 * stopLossPercentage / 100));
  }

  private calculateStopLoss(symbol: string, action: 'buy' | 'sell'): number {
    const currentPrice = 19800;
    const stopLossPercentage = 1.5;
    
    if (action === 'buy') {
      return currentPrice * (1 - stopLossPercentage / 100);
    } else {
      return currentPrice * (1 + stopLossPercentage / 100);
    }
  }

  private calculateTarget(symbol: string, action: 'buy' | 'sell'): number {
    const currentPrice = 19800;
    const targetPercentage = 4.0;
    
    if (action === 'buy') {
      return currentPrice * (1 + targetPercentage / 100);
    } else {
      return currentPrice * (1 - targetPercentage / 100);
    }
  }

  public getRobotStatus() {
    const marketOpen = this.isMarketTime();
    
    return {
      isActive: this.isActive,
      marketOpen,
      marketCondition: this.marketCondition,
      currentPositions: this.positionManager.getPositionCount(),
      maxPositions: this.config.maxPositions,
      positions: this.positionManager.getPositions(),
      dailyStats: this.dailyTradingStats,
      strategies: {
        intraday: this.config.intradayEnabled,
        options: this.config.optionsEnabled,
        swing: this.config.swingEnabled,
        scalping: this.config.scalpingEnabled,
        gapTrading: this.config.gapTradingEnabled,
        breakout: this.config.breakoutEnabled
      },
      riskManagement: {
        trailingStopEnabled: this.config.trailingStopEnabled,
        partialProfitBooking: this.config.partialProfitBooking,
        maxDailyLoss: this.config.maxDailyLoss,
        correlationLimit: this.config.correlationLimit
      },
      trailingStopEnabled: this.config.trailingStopEnabled,
      partialProfitBooking: this.config.partialProfitBooking
    };
  }
}

export const tradingRobotEngine = new TradingRobotEngine({
  intradayEnabled: true,
  optionsEnabled: true,
  swingEnabled: true,
  scalpingEnabled: true,
  gapTradingEnabled: true,
  breakoutEnabled: true,
  maxPositions: 8,
  maxCapitalPerTrade: 12,
  riskPerTrade: 1.5,
  maxDailyLoss: 3.0,
  targetProfit: 2.5,
  trailingStopEnabled: true,
  partialProfitBooking: true,
  correlationLimit: 0.7,
  sectorConcentrationLimit: 30
});
