
import type { Position, StrategyConfig } from '../types';

type ClosePositionFn = (position: Position, reason: string) => Promise<void>;

export class RiskManager {
  private config: StrategyConfig;

  constructor(config: StrategyConfig) {
    this.config = config;
  }

  public async managePositions(positions: Position[], closePosition: ClosePositionFn): Promise<void> {
    for (const position of positions) {
      if (position.pnlPercent < -5.0) {
        console.log(`⚠️ Risk limit hit for ${position.symbol} - Auto closing`);
        await closePosition(position, 'Risk management - Max loss exceeded');
        continue;
      }
      
      this.manageTrailingStop(position);
      
      if (this.config.partialProfitBooking) {
        this.handlePartialProfitBooking(position);
      }
      
      const timeBasedExitReason = this.getTimeBasedExitReason(position);
      if (timeBasedExitReason) {
        await closePosition(position, timeBasedExitReason);
        continue;
      }
      
      const exitReason = this.getExitReason(position);
      if (exitReason) {
        await closePosition(position, exitReason);
      }
    }
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
      
      const newStopLoss = position.action === 'buy' 
        ? position.currentPrice * (1 - trailPercent) 
        : position.currentPrice * (1 + trailPercent);
      
      if ((position.action === 'buy' && newStopLoss > position.stopLoss) ||
          (position.action === 'sell' && newStopLoss < position.stopLoss)) {
        position.stopLoss = newStopLoss;
        console.log(`📈 Trailing stop updated: ${position.symbol} → ₹${newStopLoss.toFixed(2)} (${profitPercent.toFixed(1)}% profit)`);
      }
    }
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

  private getTimeBasedExitReason(position: Position): string | null {
    const holdingTime = Date.now() - position.entryTime.getTime();
    const hour = new Date().getHours() + new Date().getMinutes() / 60;
    
    if (position.strategy.includes('Scalping') && holdingTime > 1800000) {
      return 'Scalping time limit reached';
    }
    
    if (hour >= 15.25 && position.strategy.includes('Intraday')) {
      return 'Market closing - Intraday exit';
    }
    return null;
  }

  private getExitReason(position: Position): string | null {
    const shouldExit = 
      (position.action === 'buy' && position.currentPrice <= position.stopLoss) ||
      (position.action === 'sell' && position.currentPrice >= position.stopLoss) ||
      (position.action === 'buy' && position.currentPrice >= position.target) ||
      (position.action === 'sell' && position.currentPrice <= position.target);

    if (shouldExit) {
      return position.pnlPercent > 0 ? 'Target/Trailing Stop' : 'Stop Loss';
    }
    return null;
  }
}
