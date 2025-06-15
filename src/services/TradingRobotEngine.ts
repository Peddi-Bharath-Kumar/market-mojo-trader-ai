export interface TradingSignal {
  symbol: string;
  action: 'buy' | 'sell' | 'hold';
  orderType: 'market' | 'limit' | 'stop';
  quantity: number;
  price?: number;
  stopLoss?: number;
  target?: number;
  confidence: number;
  reason: string;
  strategy: string;
}

export interface MarketCondition {
  trend: 'bullish' | 'bearish' | 'sideways';
  volatility: 'low' | 'medium' | 'high' | 'extreme';
  volume: 'low' | 'normal' | 'high' | 'exceptional';
  marketSentiment: 'positive' | 'negative' | 'neutral';
  timeOfDay: 'pre_open' | 'opening' | 'morning' | 'afternoon' | 'closing';
  dayType: 'normal' | 'expiry' | 'result_day' | 'event_day';
}

export interface StrategyConfig {
  intradayEnabled: boolean;
  optionsEnabled: boolean;
  swingEnabled: boolean;
  scalpingEnabled: boolean;
  gapTradingEnabled: boolean;
  breakoutEnabled: boolean;
  maxPositions: number;
  maxCapitalPerTrade: number;
  riskPerTrade: number;
  maxDailyLoss: number;
  targetProfit: number;
  trailingStopEnabled: boolean;
  partialProfitBooking: boolean;
  correlationLimit: number;
  sectorConcentrationLimit: number;
}

export interface Position {
  id: string;
  symbol: string;
  action: 'buy' | 'sell';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  stopLoss: number;
  originalStopLoss: number;
  target: number;
  pnl: number;
  pnlPercent: number;
  strategy: string;
  entryTime: Date;
  trailingActive: boolean;
  profitBookingLevel: number;
  sector: string;
  liquidityScore: number;
  correlationRisk: number;
  product?: 'mis' | 'cnc' | 'nrml'; // Add product property
}

export class TradingRobotEngine {
  private config: StrategyConfig;
  private isActive: boolean = false;
  private currentPositions: Position[] = [];
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
    const intradayPositions = this.currentPositions.filter(pos => 
      pos.strategy.includes('Intraday') || pos.strategy.includes('Scalping')
    );
    
    intradayPositions.forEach(position => {
      console.log(`🔄 Auto-closing intraday position: ${position.symbol}`);
      this.closePosition(position, 'End of day closure');
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
      this.updatePositions();
      this.manageRiskAndTrailing();
      
      // Generate signals less frequently but with better quality
      if (this.shouldGenerateSignals()) {
        this.generateSignals();
      }
    }, 15000); // Check every 15 seconds
  }

  private shouldGenerateSignals(): boolean {
    // Don't over-trade
    if (this.currentPositions.length >= this.config.maxPositions) return false;
    
    // Reduce signal generation near market close
    const hour = new Date().getHours() + new Date().getMinutes() / 60;
    if (hour > 15.2) return false; // Stop new signals after 3:12 PM
    
    // Throttle based on recent activity
    const recentTrades = this.currentPositions.filter(pos => 
      Date.now() - pos.entryTime.getTime() < 300000 // Last 5 minutes
    ).length;
    
    return recentTrades < 2; // Max 2 new positions per 5 minutes
  }

  private updatePositions(): void {
    this.currentPositions.forEach(position => {
      // Simulate realistic price updates
      const volatility = this.getSymbolVolatility(position.symbol);
      const priceChange = (Math.random() - 0.5) * volatility * 0.1; // Scaled change
      position.currentPrice = position.currentPrice * (1 + priceChange);
      
      // Calculate P&L
      if (position.action === 'buy') {
        position.pnl = (position.currentPrice - position.entryPrice) * position.quantity;
        position.pnlPercent = ((position.currentPrice - position.entryPrice) / position.entryPrice) * 100;
      } else {
        position.pnl = (position.entryPrice - position.currentPrice) * position.quantity;
        position.pnlPercent = ((position.entryPrice - position.currentPrice) / position.entryPrice) * 100;
      }
      
      // Update correlation risk
      position.correlationRisk = this.calculateCorrelationRisk(position);
    });
    
    this.updateDailyStats();
  }

  private getSymbolVolatility(symbol: string): number {
    const volatilityMap: { [key: string]: number } = {
      'NIFTY50': 0.15, 'BANKNIFTY': 0.20,
      'RELIANCE': 0.18, 'TCS': 0.16, 'INFY': 0.17,
      'HDFC': 0.19, 'ICICI': 0.21, 'SBI': 0.25
    };
    return volatilityMap[symbol] || 0.20;
  }

  private calculateCorrelationRisk(position: Position): number {
    const sameSymbolPositions = this.currentPositions.filter(p => p.symbol === position.symbol).length;
    const sameSectorPositions = this.currentPositions.filter(p => p.sector === position.sector).length;
    
    return Math.min(1.0, (sameSymbolPositions * 0.3 + sameSectorPositions * 0.1));
  }

  private updateDailyStats(): void {
    const stats = this.dailyTradingStats;
    
    // Calculate current capital based on open positions
    const unrealizedPnL = this.currentPositions.reduce((sum, pos) => sum + pos.pnl, 0);
    stats.currentCapital = stats.startingCapital + unrealizedPnL;
    
    // Update drawdown
    const currentReturn = (stats.currentCapital - stats.startingCapital) / stats.startingCapital;
    stats.currentDrawdown = Math.min(0, currentReturn);
    stats.maxDrawdown = Math.min(stats.maxDrawdown, stats.currentDrawdown);
  }

  private manageRiskAndTrailing(): void {
    this.currentPositions.forEach(position => {
      // Risk management - auto close if loss exceeds threshold
      if (position.pnlPercent < -5.0) { // 5% max loss per position
        console.log(`⚠️ Risk limit hit for ${position.symbol} - Auto closing`);
        this.closePosition(position, 'Risk management - Max loss exceeded');
        return;
      }
      
      // Enhanced trailing stop management
      this.manageTrailingStop(position);
      
      // Partial profit booking
      if (this.config.partialProfitBooking) {
        this.handlePartialProfitBooking(position);
      }
      
      // Time-based exits for intraday
      this.checkTimeBasedExit(position);
    });
  }

  private manageTrailingStop(position: Position): void {
    if (!this.config.trailingStopEnabled) return;
    
    const profitPercent = position.pnlPercent;
    
    // Activate trailing when profit >= 1%
    if (profitPercent >= 1.0 && !position.trailingActive) {
      position.trailingActive = true;
      position.stopLoss = position.entryPrice; // Move to breakeven
      console.log(`🎯 Trailing activated for ${position.symbol} - Moved to breakeven`);
    }
    
    // Progressive trailing based on profit levels
    if (position.trailingActive) {
      let trailPercent = 0.015; // Default 1.5%
      
      if (profitPercent > 5.0) trailPercent = 0.025; // 2.5% trail for >5% profit
      else if (profitPercent > 3.0) trailPercent = 0.02; // 2% trail for >3% profit
      
      const newStopLoss = position.action === 'buy' ? 
        position.currentPrice * (1 - trailPercent) :
        position.currentPrice * (1 + trailPercent);
      
      if ((position.action === 'buy' && newStopLoss > position.stopLoss) ||
          (position.action === 'sell' && newStopLoss < position.stopLoss)) {
        position.stopLoss = newStopLoss;
        console.log(`📈 Trailing stop updated: ${position.symbol} → ₹${newStopLoss.toFixed(2)} (${profitPercent.toFixed(1)}% profit)`);
      }
    }
    
    // Check exit conditions
    this.checkExitConditions(position);
  }

  private handlePartialProfitBooking(position: Position): void {
    const profitPercent = position.pnlPercent;
    
    // Progressive profit booking strategy
    if (profitPercent >= 3.0 && position.profitBookingLevel === 0) {
      const partialQuantity = Math.floor(position.quantity * 0.4); // Book 40%
      if (partialQuantity > 0) {
        position.quantity -= partialQuantity;
        position.profitBookingLevel = 1;
        console.log(`💰 Booked 40% profit for ${position.symbol} at ${profitPercent.toFixed(1)}% gain`);
      }
    }
    
    if (profitPercent >= 6.0 && position.profitBookingLevel === 1) {
      const partialQuantity = Math.floor(position.quantity * 0.5); // Book another 30% of original
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
    
    // Force close scalping positions after 30 minutes
    if (position.strategy.includes('Scalping') && holdingTime > 1800000) { // 30 minutes
      this.closePosition(position, 'Scalping time limit reached');
    }
    
    // Force close intraday positions before market close
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
    
    // Update statistics
    this.dailyTradingStats.totalTrades++;
    if (position.pnl > 0) {
      this.dailyTradingStats.winningTrades++;
    }
    
    // Remove from active positions
    this.currentPositions = this.currentPositions.filter(p => p.id !== position.id);
  }

  public generateSignals(): TradingSignal[] {
    if (!this.marketCondition) return [];

    const signals: TradingSignal[] = [];
    const symbols = ['NIFTY50', 'BANKNIFTY', 'RELIANCE', 'TCS', 'HDFC', 'INFY'];

    for (const symbol of symbols) {
      // Don't generate new signals if we're at max positions
      if (this.currentPositions.length >= this.config.maxPositions) break;

      // Intraday Strategy
      if (this.config.intradayEnabled) {
        const intradaySignal = this.intradayStrategy(symbol);
        if (intradaySignal) {
          signals.push(intradaySignal);
          this.createPosition(intradaySignal);
        }
      }

      // Options Strategy
      if (this.config.optionsEnabled) {
        const optionsSignal = this.optionsStrategy(symbol);
        if (optionsSignal) {
          signals.push(optionsSignal);
          this.createPosition(optionsSignal);
        }
      }
    }

    if (signals.length > 0) {
      console.log('🎯 Generated Trading Signals:', signals);
    }

    return signals;
  }

  private createPosition(signal: TradingSignal): void {
    // Don't create positions for 'hold' signals
    if (signal.action === 'hold') {
      console.log(`🔍 Hold signal for ${signal.symbol}: ${signal.reason}`);
      return;
    }

    const position: Position = {
      id: `${signal.symbol}_${Date.now()}`,
      symbol: signal.symbol,
      action: signal.action, // Now this is guaranteed to be 'buy' | 'sell'
      quantity: signal.quantity,
      entryPrice: signal.price || 19800,
      currentPrice: signal.price || 19800,
      stopLoss: signal.stopLoss || 0,
      originalStopLoss: signal.stopLoss || 0,
      target: signal.target || 0,
      pnl: 0,
      pnlPercent: 0,
      strategy: signal.strategy,
      entryTime: new Date(),
      trailingActive: false,
      profitBookingLevel: 0,
      sector: '',
      liquidityScore: 0,
      correlationRisk: 0
    };

    this.currentPositions.push(position);
    console.log(`✅ Position created: ${signal.symbol} ${signal.action} @ ₹${position.entryPrice}`);
  }

  private intradayStrategy(symbol: string): TradingSignal | null {
    if (!this.marketCondition) return null;

    const { trend, volatility, volume } = this.marketCondition;

    // Conservative intraday strategy
    if (trend === 'bullish' && volume === 'high' && this.currentPositions.length < this.config.maxPositions) {
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

    // Iron Condor for sideways market with low volatility
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

    // Straddle for high volatility events
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
    // Risk-based position sizing
    const accountBalance = 100000; // This should come from actual account
    const riskAmount = accountBalance * (this.config.riskPerTrade / 100);
    const stopLossPercentage = 1.5; // 1.5% stop loss
    
    // For simplicity, return fixed quantities based on symbol
    if (symbol === 'NIFTY50' || symbol === 'BANKNIFTY') return 1;
    return Math.floor(riskAmount / (19800 * stopLossPercentage / 100)); // Approximate calculation
  }

  private calculateStopLoss(symbol: string, action: 'buy' | 'sell'): number {
    const currentPrice = 19800; // This should come from real market data
    const stopLossPercentage = 1.5;
    
    if (action === 'buy') {
      return currentPrice * (1 - stopLossPercentage / 100);
    } else {
      return currentPrice * (1 + stopLossPercentage / 100);
    }
  }

  private calculateTarget(symbol: string, action: 'buy' | 'sell'): number {
    const currentPrice = 19800; // This should come from real market data
    const targetPercentage = 4.0; // Increased target for trailing system
    
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
      currentPositions: this.currentPositions.length,
      maxPositions: this.config.maxPositions,
      positions: this.currentPositions,
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
      trailingStopEnabled: this.config.trailingStopEnabled, // Add this for compatibility
      partialProfitBooking: this.config.partialProfitBooking // Add this for compatibility
    };
  }
}

// Enhanced configuration with more realistic settings
export const tradingRobotEngine = new TradingRobotEngine({
  intradayEnabled: true,
  optionsEnabled: true,
  swingEnabled: true,
  scalpingEnabled: true,
  gapTradingEnabled: true,
  breakoutEnabled: true,
  maxPositions: 8,
  maxCapitalPerTrade: 12, // 12% max capital per trade
  riskPerTrade: 1.5, // 1.5% risk per trade
  maxDailyLoss: 3.0, // 3% max daily loss
  targetProfit: 2.5, // 2.5% daily target
  trailingStopEnabled: true,
  partialProfitBooking: true,
  correlationLimit: 0.7, // Max 70% correlation
  sectorConcentrationLimit: 30 // Max 30% in one sector
});
