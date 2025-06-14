
interface MarketTick {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  timestamp: number;
  bid: number;
  ask: number;
  ltp: number; // Last Traded Price
}

interface OptionChain {
  symbol: string;
  expiry: string;
  strikePrice: number;
  callPrice: number;
  putPrice: number;
  callVolume: number;
  putVolume: number;
  callOI: number; // Open Interest
  putOI: number;
  iv: number; // Implied Volatility
}

class MarketDataService {
  private ws: WebSocket | null = null;
  private subscriptions = new Set<string>();
  private listeners = new Map<string, ((data: MarketTick) => void)[]>();
  private apiConfig: any = null;

  setApiConfig(config: any) {
    this.apiConfig = config;
    console.log('API Config set for:', config.broker);
  }

  connect() {
    if (!this.apiConfig) {
      throw new Error('API configuration not set');
    }

    // Simulate WebSocket connection to broker's market data feed
    if (this.apiConfig.broker === 'zerodha') {
      this.connectZerodha();
    } else if (this.apiConfig.broker === 'angel') {
      this.connectAngelBroking();
    } else if (this.apiConfig.broker === 'upstox') {
      this.connectUpstox();
    }
  }

  private connectZerodha() {
    console.log('Connecting to Zerodha KiteConnect WebSocket...');
    // In real implementation, use KiteConnect WebSocket
    this.simulateWebSocket();
  }

  private connectAngelBroking() {
    console.log('Connecting to Angel Broking SmartAPI WebSocket...');
    this.simulateWebSocket();
  }

  private connectUpstox() {
    console.log('Connecting to Upstox WebSocket...');
    this.simulateWebSocket();
  }

  private simulateWebSocket() {
    // Simulate real-time data for demo
    setInterval(() => {
      this.subscriptions.forEach(symbol => {
        const tick: MarketTick = {
          symbol,
          price: 100 + Math.random() * 1000,
          change: (Math.random() - 0.5) * 20,
          changePercent: (Math.random() - 0.5) * 5,
          volume: Math.floor(Math.random() * 1000000),
          high: 110 + Math.random() * 1000,
          low: 90 + Math.random() * 1000,
          open: 95 + Math.random() * 1000,
          bid: 99.5 + Math.random() * 1000,
          ask: 100.5 + Math.random() * 1000,
          ltp: 100 + Math.random() * 1000,
          timestamp: Date.now()
        };

        this.notifyListeners(symbol, tick);
      });
    }, 1000);
  }

  subscribe(symbol: string, callback: (data: MarketTick) => void) {
    this.subscriptions.add(symbol);
    
    if (!this.listeners.has(symbol)) {
      this.listeners.set(symbol, []);
    }
    this.listeners.get(symbol)!.push(callback);
  }

  unsubscribe(symbol: string) {
    this.subscriptions.delete(symbol);
    this.listeners.delete(symbol);
  }

  private notifyListeners(symbol: string, data: MarketTick) {
    const callbacks = this.listeners.get(symbol);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  async getOptionChain(symbol: string, expiry: string): Promise<OptionChain[]> {
    // Simulate option chain data
    const strikes = [];
    const basePrice = 18000; // Example for NIFTY
    
    for (let i = -10; i <= 10; i++) {
      const strike = basePrice + (i * 50);
      strikes.push({
        symbol,
        expiry,
        strikePrice: strike,
        callPrice: Math.random() * 200,
        putPrice: Math.random() * 200,
        callVolume: Math.floor(Math.random() * 10000),
        putVolume: Math.floor(Math.random() * 10000),
        callOI: Math.floor(Math.random() * 50000),
        putOI: Math.floor(Math.random() * 50000),
        iv: 15 + Math.random() * 20 // 15-35% IV
      });
    }
    
    return strikes;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
    this.listeners.clear();
  }
}

export const marketDataService = new MarketDataService();
export type { MarketTick, OptionChain };
