import { PositionManager } from './trading/PositionManager';
import { TradingSignal, MarketCondition, StrategyConfig, Position } from './trading/types';
import { orderExecutionService, OrderRequest } from './OrderExecutionService';
import { marketDataService } from './MarketDataService';
import { MarketAnalyzer } from './trading/MarketAnalyzer';
import { RiskManager } from './trading/risk/RiskManager';
import { generateIntradaySignal } from './trading/strategies/IntradayStrategy';
import { generateOptionsSignal } from './trading/strategies/OptionsStrategy';
import { realDataService } from './RealDataService';

export type { TradingSignal }; // Re-export for legacy dependencies

export class TradingRobotEngine {
  private config: StrategyConfig;
  private isActive: boolean = false;
  private positionManager: PositionManager;
  private marketAnalyzer: MarketAnalyzer;
  private riskManager: RiskManager;
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
    this.marketAnalyzer = new MarketAnalyzer();
    this.riskManager = new RiskManager(config);
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
    
    this.marketCondition = this.marketAnalyzer.analyzeMarketConditions();
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
    const intradayPositions = this.positionManager.getPositions().filter(p => p.strategy.includes('Intraday'));
    
    console.log(`Closing ${intradayPositions.length} intraday positions.`);
    
    intradayPositions.forEach(position => {
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

  private monitorMarket(): void {
    if (!this.isActive) return;

    const interval = setInterval(async () => {
      if (!this.isActive || !this.isMarketTime()) {
        clearInterval(interval);
        return;
      }

      this.marketCondition = this.marketAnalyzer.analyzeMarketConditions();
      await this.updatePositionsWithRealData();
      this.updateDailyStats();
      await this.riskManager.managePositions(
        this.positionManager.getPositions(), 
        this.closePosition.bind(this)
      );
      
      if (this.shouldGenerateSignals()) {
        await this.generateSignals();
      }
    }, 15000); // Check every 15 seconds
  }

  private async updatePositionsWithRealData(): Promise<void> {
    const { isLiveTrading } = orderExecutionService.getTradingStatus();
    if (!isLiveTrading) {
      this.positionManager.updatePositions(); // Fallback to simulation if not live
      return;
    }

    const positions = this.positionManager.getPositions();
    if (positions.length === 0) return;

    console.log('🔄 Fetching real-time prices for open positions...');
    for (const position of positions) {
      try {
        const priceData = await marketDataService.getRealTimePrice(position.symbol);
        if (priceData && priceData.ltp) {
          this.positionManager.updatePositionPrice(position.id, priceData.ltp);
        }
      } catch (error) {
        console.warn(`Could not fetch price for ${position.symbol}, it might be closed or API failed.`, error);
      }
    }
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

  private async closePosition(position: Position, reason: string): Promise<void> {
    console.log(`🔄 Closing ${position.symbol}: ${reason} - P&L: ${position.pnlPercent.toFixed(2)}%`);
    
    const { isLiveTrading } = orderExecutionService.getTradingStatus();

    if (isLiveTrading) {
      try {
        const orderRequest: OrderRequest = {
          symbol: position.symbol,
          action: position.action === 'buy' ? 'sell' : 'buy',
          orderType: 'market',
          quantity: position.quantity,
          product: 'mis',
          validity: 'day',
        };
        const response = await orderExecutionService.placeOrder(orderRequest);
        console.log(`✅ Live closing order placed for ${position.symbol}:`, response.orderId);
      } catch (error) {
        console.error(`❌ Failed to place LIVE closing order for ${position.symbol}:`, error);
      }
    }

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

  public async generateSignals(): Promise<TradingSignal[]> {
    if (!this.marketCondition) return [];

    const signals: TradingSignal[] = [];
    const symbols = ['NIFTY50', 'BANKNIFTY', 'RELIANCE', 'TCS', 'HDFC', 'INFY'];

    for (const symbol of symbols) {
      if (this.positionManager.getPositionCount() >= this.config.maxPositions) break;
      if (this.positionManager.getPositions().some(p => p.symbol === symbol)) continue;

      if (this.config.intradayEnabled) {
        const intradaySignal = await generateIntradaySignal(symbol, this.marketCondition, this.config, this.dailyTradingStats.currentCapital);
        if (intradaySignal) {
          const isPlaced = await this.executeSignal(intradaySignal);
          if (isPlaced) signals.push(intradaySignal);
        }
      }

      if (this.config.optionsEnabled) {
        const optionsSignal = generateOptionsSignal(symbol, this.marketCondition);
        if (optionsSignal) {
           const isPlaced = await this.executeSignal(optionsSignal);
          if (isPlaced) signals.push(optionsSignal);
        }
      }
    }

    if (signals.length > 0) {
      console.log('🎯 Generated Trading Signals:', signals);
    }

    return signals;
  }

  private async executeSignal(signal: TradingSignal): Promise<boolean> {
    if (signal.action === 'hold') {
      console.log(`💡 HOLD signal received for ${signal.symbol}, no action taken.`);
      return false;
    }

    const { isLiveTrading } = orderExecutionService.getTradingStatus();

    if (isLiveTrading) {
        console.log(`🔴 Executing LIVE order for ${signal.symbol}`);
        try {
            const orderRequest: OrderRequest = {
                symbol: signal.symbol,
                action: signal.action,
                orderType: signal.orderType === 'limit' ? 'limit' : 'market',
                quantity: signal.quantity,
                price: signal.price,
                stopLoss: signal.stopLoss,
                target: signal.target,
                product: 'mis', // Assuming intraday
                validity: 'day',
            };
            
            const response = await orderExecutionService.placeOrder(orderRequest);
            console.log('✅ Live order placement response:', response);

            const newPosition = this.positionManager.createPosition(signal);
            if (newPosition) {
                console.log(`📈 Position for ${signal.symbol} created locally for tracking.`);
                return true;
            }
            return false;
            
        } catch (error) {
            console.error(`❌ Failed to place LIVE order for ${signal.symbol}:`, error);
            return false;
        }
    } else {
        console.log(`🎭 Executing SIMULATED order for ${signal.symbol}`);
        const newPosition = this.positionManager.createPosition(signal);
        if (newPosition) {
            return true;
        }
        return false;
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
