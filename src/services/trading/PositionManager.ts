
import { Position, TradingSignal } from './types';

export class PositionManager {
  private positions: Position[] = [];

  public getPositions(): Position[] {
    return this.positions;
  }

  public getPositionCount(): number {
    return this.positions.length;
  }
  
  public createPosition(signal: TradingSignal): Position | null {
    if (signal.action === 'hold') {
      console.log(`🔍 Hold signal for ${signal.symbol}: ${signal.reason}`);
      return null;
    }

    const position: Position = {
      id: `${signal.symbol}_${Date.now()}`,
      symbol: signal.symbol,
      action: signal.action,
      quantity: signal.quantity,
      entryPrice: signal.price || 19800, // Placeholder, should get real price
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
      sector: '', // This needs to be populated
      liquidityScore: 0, // This needs to be populated
      correlationRisk: 0,
      product: 'mis',
    };

    this.positions.push(position);
    console.log(`✅ Position created: ${signal.symbol} ${signal.action} @ ₹${position.entryPrice}`);
    return position;
  }
  
  public closePosition(positionId: string): Position | undefined {
    const positionIndex = this.positions.findIndex(p => p.id === positionId);
    if (positionIndex === -1) {
      return undefined;
    }

    const [closedPosition] = this.positions.splice(positionIndex, 1);
    return closedPosition;
  }

  public updatePositions() {
    this.positions.forEach(position => {
      // Simulate realistic price updates
      const volatility = this.getSymbolVolatility(position.symbol);
      const priceChange = (Math.random() - 0.5) * volatility * 0.1; // Scaled change
      position.currentPrice = position.currentPrice * (1 + priceChange);
      
      if (position.action === 'buy') {
        position.pnl = (position.currentPrice - position.entryPrice) * position.quantity;
        position.pnlPercent = ((position.currentPrice - position.entryPrice) / position.entryPrice) * 100;
      } else {
        position.pnl = (position.entryPrice - position.currentPrice) * position.quantity;
        position.pnlPercent = ((position.entryPrice - position.currentPrice) / position.entryPrice) * 100;
      }
      
      position.correlationRisk = this.calculateCorrelationRisk(position);
    });
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
    const sameSymbolPositions = this.positions.filter(p => p.symbol === position.symbol).length;
    const sameSectorPositions = this.positions.filter(p => p.sector === position.sector).length;
    
    return Math.min(1.0, (sameSymbolPositions * 0.3 + sameSectorPositions * 0.1));
  }
  
  public closeIntradayPositions(): Position[] {
    const intradayPositions = this.positions.filter(pos => 
      pos.strategy.includes('Intraday') || pos.strategy.includes('Scalping')
    );
    
    const closedPositions: Position[] = [];
    intradayPositions.forEach(position => {
      const closed = this.closePosition(position.id);
      if (closed) {
        console.log(`🔄 Auto-closing intraday position: ${position.symbol}`);
        closedPositions.push(closed);
      }
    });
    return closedPositions;
  }
}
