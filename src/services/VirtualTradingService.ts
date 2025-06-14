
interface VirtualOrder {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  orderType: 'market' | 'limit' | 'stop';
  quantity: number;
  price: number;
  status: 'pending' | 'executed' | 'cancelled' | 'rejected';
  timestamp: number;
  executedPrice?: number;
  pnl?: number;
}

interface VirtualPosition {
  id: string;
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  entryTime: number;
  type: 'long' | 'short';
}

interface VirtualPortfolio {
  balance: number;
  initialBalance: number;
  totalPnL: number;
  dayPnL: number;
  positions: VirtualPosition[];
  orders: VirtualOrder[];
  trades: number;
  winRate: number;
}

class VirtualTradingService {
  private portfolio: VirtualPortfolio;
  private listeners: ((portfolio: VirtualPortfolio) => void)[] = [];
  private isActive = false;
  private autoTradingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.portfolio = {
      balance: 100000, // ₹1,00,000 virtual money
      initialBalance: 100000,
      totalPnL: 0,
      dayPnL: 0,
      positions: [],
      orders: [],
      trades: 0,
      winRate: 0
    };
  }

  // SAFETY: This service is COMPLETELY isolated from real trading
  startVirtualTrading() {
    if (this.isActive) return;
    
    this.isActive = true;
    console.log('🎮 VIRTUAL TRADING STARTED - NO REAL MONEY AT RISK');
    console.log('🔒 SAFETY: This is completely isolated from real trading APIs');
    
    // Start auto-trading simulation
    this.autoTradingInterval = setInterval(() => {
      this.executeRandomVirtualTrade();
    }, 8000 + Math.random() * 12000); // Random interval 8-20 seconds

    this.notifyListeners();
  }

  stopVirtualTrading() {
    this.isActive = false;
    
    if (this.autoTradingInterval) {
      clearInterval(this.autoTradingInterval);
      this.autoTradingInterval = null;
    }
    
    console.log('🛑 VIRTUAL TRADING STOPPED');
    this.notifyListeners();
  }

  placeVirtualOrder(order: Omit<VirtualOrder, 'id' | 'status' | 'timestamp'>): string {
    const virtualOrder: VirtualOrder = {
      ...order,
      id: `VIRT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      timestamp: Date.now()
    };

    this.portfolio.orders.unshift(virtualOrder);
    
    console.log('🎮 VIRTUAL ORDER PLACED:', {
      symbol: virtualOrder.symbol,
      type: virtualOrder.type,
      quantity: virtualOrder.quantity,
      id: virtualOrder.id
    });

    // Simulate order execution delay
    setTimeout(() => {
      this.executeVirtualOrder(virtualOrder.id);
    }, 1000 + Math.random() * 3000);

    this.notifyListeners();
    return virtualOrder.id;
  }

  private executeVirtualOrder(orderId: string) {
    const orderIndex = this.portfolio.orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return;

    const order = this.portfolio.orders[orderIndex];
    
    // 95% success rate for virtual orders
    const isExecuted = Math.random() > 0.05;
    
    if (isExecuted) {
      const executedPrice = order.orderType === 'market' 
        ? order.price * (1 + (Math.random() - 0.5) * 0.002) // ±0.2% slippage
        : order.price;

      order.status = 'executed';
      order.executedPrice = executedPrice;
      
      this.createOrUpdatePosition(order, executedPrice);
      this.portfolio.trades++;
      
      console.log('✅ VIRTUAL ORDER EXECUTED:', {
        symbol: order.symbol,
        type: order.type,
        executedPrice: executedPrice.toFixed(2),
        id: order.id
      });
    } else {
      order.status = 'rejected';
      console.log('❌ VIRTUAL ORDER REJECTED:', order.id);
    }

    this.calculatePortfolioMetrics();
    this.notifyListeners();
  }

  private createOrUpdatePosition(order: VirtualOrder, executedPrice: number) {
    const existingPositionIndex = this.portfolio.positions.findIndex(
      p => p.symbol === order.symbol
    );

    if (existingPositionIndex !== -1) {
      // Update existing position
      const position = this.portfolio.positions[existingPositionIndex];
      const totalQuantity = position.quantity + (order.type === 'buy' ? order.quantity : -order.quantity);
      
      if (totalQuantity === 0) {
        // Position closed
        this.portfolio.positions.splice(existingPositionIndex, 1);
      } else if (totalQuantity > 0) {
        // Still long position
        const totalValue = (position.quantity * position.entryPrice) + (order.quantity * executedPrice);
        position.quantity = totalQuantity;
        position.entryPrice = totalValue / totalQuantity;
        position.type = 'long';
      } else {
        // Now short position
        position.quantity = Math.abs(totalQuantity);
        position.entryPrice = executedPrice;
        position.type = 'short';
      }
    } else {
      // Create new position
      const newPosition: VirtualPosition = {
        id: `POS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        symbol: order.symbol,
        quantity: order.quantity,
        entryPrice: executedPrice,
        currentPrice: executedPrice,
        pnl: 0,
        pnlPercent: 0,
        entryTime: Date.now(),
        type: order.type === 'buy' ? 'long' : 'short'
      };
      
      this.portfolio.positions.push(newPosition);
    }
  }

  private executeRandomVirtualTrade() {
    if (!this.isActive) return;

    const symbols = ['NIFTY50', 'BANKNIFTY', 'RELIANCE', 'TCS', 'HDFC', 'INFY', 'ITC'];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const basePrice = this.getBasePriceForSymbol(symbol);
    
    const virtualOrder = {
      symbol,
      type: Math.random() > 0.5 ? 'buy' as const : 'sell' as const,
      orderType: 'market' as const,
      quantity: Math.floor(Math.random() * 10) + 1,
      price: basePrice * (1 + (Math.random() - 0.5) * 0.01) // ±1% from base price
    };

    this.placeVirtualOrder(virtualOrder);
  }

  private getBasePriceForSymbol(symbol: string): number {
    const basePrices: { [key: string]: number } = {
      'NIFTY50': 19800,
      'BANKNIFTY': 45200,
      'RELIANCE': 2450,
      'TCS': 3890,
      'HDFC': 1680,
      'INFY': 1850,
      'ITC': 456,
      'ICICIBANK': 985,
      'SBIN': 625,
      'BHARTIARTL': 895
    };
    
    return basePrices[symbol] || 100 + Math.random() * 1000;
  }

  updatePositionPrices(marketData: { symbol: string; price: number }[]) {
    this.portfolio.positions.forEach(position => {
      const marketPrice = marketData.find(m => m.symbol === position.symbol);
      if (marketPrice) {
        position.currentPrice = marketPrice.price;
        
        if (position.type === 'long') {
          position.pnl = (position.currentPrice - position.entryPrice) * position.quantity;
        } else {
          position.pnl = (position.entryPrice - position.currentPrice) * position.quantity;
        }
        
        position.pnlPercent = (position.pnl / (position.entryPrice * position.quantity)) * 100;
      }
    });

    this.calculatePortfolioMetrics();
    this.notifyListeners();
  }

  private calculatePortfolioMetrics() {
    const totalPnL = this.portfolio.positions.reduce((sum, pos) => sum + pos.pnl, 0);
    this.portfolio.totalPnL = totalPnL;
    this.portfolio.dayPnL = totalPnL; // Simplified for demo
    
    if (this.portfolio.trades > 0) {
      const winningTrades = this.portfolio.positions.filter(pos => pos.pnl > 0).length;
      this.portfolio.winRate = (winningTrades / Math.max(this.portfolio.trades, 1)) * 100;
    }
  }

  resetPortfolio() {
    console.log('🔄 RESETTING VIRTUAL PORTFOLIO');
    
    this.portfolio = {
      balance: 100000,
      initialBalance: 100000,
      totalPnL: 0,
      dayPnL: 0,
      positions: [],
      orders: [],
      trades: 0,
      winRate: 0
    };
    
    this.notifyListeners();
  }

  getPortfolio(): VirtualPortfolio {
    return { ...this.portfolio };
  }

  isVirtualTradingActive(): boolean {
    return this.isActive;
  }

  subscribe(callback: (portfolio: VirtualPortfolio) => void) {
    this.listeners.push(callback);
  }

  unsubscribe(callback: (portfolio: VirtualPortfolio) => void) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback(this.getPortfolio()));
  }
}

export const virtualTradingService = new VirtualTradingService();
export type { VirtualOrder, VirtualPosition, VirtualPortfolio };
