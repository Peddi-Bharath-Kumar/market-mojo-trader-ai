
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
  volatility: 'low' | 'medium' | 'high';
  volume: 'low' | 'normal' | 'high';
  marketSentiment: 'positive' | 'negative' | 'neutral';
}

export interface StrategyConfig {
  intradayEnabled: boolean;
  optionsEnabled: boolean;
  swingEnabled: boolean;
  maxPositions: number;
  riskPerTrade: number;
  maxDailyLoss: number;
  targetProfit: number;
  trailingStopEnabled: boolean;
  partialProfitBooking: boolean;
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
  profitBookingLevel: number; // 0 = no booking, 1 = 50% booked, 2 = 75% booked
}

export class TradingRobotEngine {
  private config: StrategyConfig;
  private isActive: boolean = false;
  private currentPositions: Position[] = [];
  private marketCondition: MarketCondition | null = null;

  constructor(config: StrategyConfig) {
    this.config = config;
  }

  public startRobot(): void {
    this.isActive = true;
    console.log('🤖 AI Trading Robot Started with Trailing Stop Loss');
    console.log('📊 Analyzing market conditions...');
    this.analyzeMarketConditions();
    this.monitorMarket();
  }

  public stopRobot(): void {
    this.isActive = false;
    console.log('🛑 AI Trading Robot Stopped');
  }

  private analyzeMarketConditions(): MarketCondition {
    // Real market analysis would use technical indicators
    const conditions = {
      trend: Math.random() > 0.5 ? 'bullish' : Math.random() > 0.3 ? 'bearish' : 'sideways',
      volatility: Math.random() > 0.6 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low',
      volume: Math.random() > 0.5 ? 'high' : Math.random() > 0.3 ? 'normal' : 'low',
      marketSentiment: Math.random() > 0.6 ? 'positive' : Math.random() > 0.3 ? 'negative' : 'neutral'
    } as MarketCondition;

    this.marketCondition = conditions;
    console.log('📈 Market Analysis:', conditions);
    return conditions;
  }

  private monitorMarket(): void {
    if (!this.isActive) return;

    const interval = setInterval(() => {
      if (!this.isActive) {
        clearInterval(interval);
        return;
      }

      this.analyzeMarketConditions();
      this.updatePositions(); // Update positions with current prices
      this.manageTrailingStopLoss(); // Handle trailing stop logic
      this.generateSignals();
    }, 30000); // Check every 30 seconds
  }

  private updatePositions(): void {
    // Simulate price updates for existing positions
    this.currentPositions.forEach(position => {
      // In real implementation, fetch current price from broker API
      const priceChange = (Math.random() - 0.5) * 0.02; // ±1% random movement
      position.currentPrice = position.currentPrice * (1 + priceChange);
      
      // Calculate P&L
      if (position.action === 'buy') {
        position.pnl = (position.currentPrice - position.entryPrice) * position.quantity;
        position.pnlPercent = ((position.currentPrice - position.entryPrice) / position.entryPrice) * 100;
      } else {
        position.pnl = (position.entryPrice - position.currentPrice) * position.quantity;
        position.pnlPercent = ((position.entryPrice - position.currentPrice) / position.entryPrice) * 100;
      }
    });
  }

  private manageTrailingStopLoss(): void {
    if (!this.config.trailingStopEnabled) return;

    this.currentPositions.forEach(position => {
      const profitPercent = position.pnlPercent;

      // Activate trailing when profit >= 1%
      if (profitPercent >= 1.0 && !position.trailingActive) {
        position.trailingActive = true;
        // Move stop loss to breakeven
        position.stopLoss = position.entryPrice;
        console.log(`🎯 Trailing activated for ${position.symbol} - Stop moved to breakeven`);
      }

      // Trail stop loss as profit increases
      if (position.trailingActive && profitPercent > 2.0) {
        const trailAmount = position.action === 'buy' ? 
          position.currentPrice * 0.015 : // Trail by 1.5% below current price for long
          position.currentPrice * 0.015;  // Trail by 1.5% above current price for short

        if (position.action === 'buy') {
          const newStopLoss = position.currentPrice - trailAmount;
          if (newStopLoss > position.stopLoss) {
            position.stopLoss = newStopLoss;
            console.log(`📈 Trailing stop updated for ${position.symbol}: ₹${newStopLoss.toFixed(2)} (Profit: ${profitPercent.toFixed(1)}%)`);
          }
        } else {
          const newStopLoss = position.currentPrice + trailAmount;
          if (newStopLoss < position.stopLoss) {
            position.stopLoss = newStopLoss;
            console.log(`📉 Trailing stop updated for ${position.symbol}: ₹${newStopLoss.toFixed(2)} (Profit: ${profitPercent.toFixed(1)}%)`);
          }
        }
      }

      // Partial profit booking
      if (this.config.partialProfitBooking) {
        this.handlePartialProfitBooking(position);
      }

      // Check for stop loss or target hit
      this.checkExitConditions(position);
    });
  }

  private handlePartialProfitBooking(position: Position): void {
    const profitPercent = position.pnlPercent;

    // Book 50% profit at 2% gain
    if (profitPercent >= 2.0 && position.profitBookingLevel === 0) {
      const partialQuantity = Math.floor(position.quantity / 2);
      position.quantity -= partialQuantity;
      position.profitBookingLevel = 1;
      console.log(`💰 Booked 50% profit for ${position.symbol} at ${profitPercent.toFixed(1)}% gain`);
    }

    // Book additional 50% (25% of original) at 4% gain
    if (profitPercent >= 4.0 && position.profitBookingLevel === 1) {
      const partialQuantity = Math.floor(position.quantity / 2);
      position.quantity -= partialQuantity;
      position.profitBookingLevel = 2;
      console.log(`💰 Booked additional 25% profit for ${position.symbol} at ${profitPercent.toFixed(1)}% gain`);
    }
  }

  private checkExitConditions(position: Position): void {
    const shouldExit = 
      (position.action === 'buy' && position.currentPrice <= position.stopLoss) ||
      (position.action === 'sell' && position.currentPrice >= position.stopLoss) ||
      (position.action === 'buy' && position.currentPrice >= position.target) ||
      (position.action === 'sell' && position.currentPrice <= position.target);

    if (shouldExit) {
      this.closePosition(position);
    }
  }

  private closePosition(position: Position): void {
    const reason = position.pnlPercent > 0 ? 'Target/Trailing Stop' : 'Stop Loss';
    console.log(`🔄 Closing position ${position.symbol}: ${reason} - P&L: ${position.pnlPercent.toFixed(2)}%`);
    
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
      profitBookingLevel: 0
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
    return {
      isActive: this.isActive,
      marketCondition: this.marketCondition,
      currentPositions: this.currentPositions.length,
      maxPositions: this.config.maxPositions,
      positions: this.currentPositions,
      strategies: {
        intraday: this.config.intradayEnabled,
        options: this.config.optionsEnabled,
        swing: this.config.swingEnabled
      },
      trailingStopEnabled: this.config.trailingStopEnabled,
      partialProfitBooking: this.config.partialProfitBooking
    };
  }
}

export const tradingRobotEngine = new TradingRobotEngine({
  intradayEnabled: true,
  optionsEnabled: true,
  swingEnabled: false,
  maxPositions: 5,
  riskPerTrade: 1.0,
  maxDailyLoss: 2.0,
  targetProfit: 2.0,
  trailingStopEnabled: true,
  partialProfitBooking: true
});
