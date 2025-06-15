
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
