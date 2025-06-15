
import type { TradingSignal, MarketCondition } from '../types';

export function generateOptionsSignal(symbol: string, marketCondition: MarketCondition): TradingSignal | null {
  if (symbol !== 'NIFTY50' && symbol !== 'BANKNIFTY') return null;

  const { trend, volatility, marketSentiment } = marketCondition;

  if (trend === 'sideways' && volatility === 'low') {
    return {
      symbol: `${symbol}_CE`, action: 'sell', orderType: 'limit', quantity: 1,
      confidence: 0.80, reason: 'Sideways market - Iron Condor strategy for premium collection',
      strategy: 'Options Iron Condor'
    };
  }

  if (volatility === 'high' && marketSentiment === 'neutral') {
    return {
      symbol: `${symbol}_STRADDLE`, action: 'buy', orderType: 'market', quantity: 1,
      confidence: 0.85, reason: 'High volatility expected - Long Straddle for directional move',
      strategy: 'Options Long Straddle'
    };
  }

  return null;
}
