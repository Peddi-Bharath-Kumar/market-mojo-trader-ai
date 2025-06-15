
import { marketDataService } from '@/services/MarketDataService';
import { realDataService } from '@/services/RealDataService';
import type { TradingSignal, MarketCondition, StrategyConfig } from '../types';

function calculatePositionSize(price: number, stopLossPrice: number, config: StrategyConfig, currentCapital: number): number {
  const riskAmount = currentCapital * (config.riskPerTrade / 100);
  const riskPerShare = Math.abs(price - stopLossPrice);
  if (riskPerShare === 0) return 0;
  const size = Math.floor(riskAmount / riskPerShare);
  return size > 0 ? size : 0;
}

function calculateStopLoss(price: number, atr: number, action: 'buy' | 'sell'): number {
  const stopLossDistance = atr * 1.5;
  return action === 'buy' ? price - stopLossDistance : price + stopLossDistance;
}

function calculateTarget(price: number, stopLoss: number, action: 'buy' | 'sell'): number {
  const riskDistance = Math.abs(price - stopLoss);
  const targetDistance = riskDistance * 2.0;
  return action === 'buy' ? price + targetDistance : price - targetDistance;
}

export async function generateIntradaySignal(
  symbol: string,
  marketCondition: MarketCondition,
  config: StrategyConfig,
  currentCapital: number
): Promise<TradingSignal | null> {
  try {
    const priceData = await marketDataService.getRealTimePrice(symbol);
    const technicals = await realDataService.getTechnicalIndicators(symbol);

    if (!priceData || !priceData.ltp || !technicals) {
      console.warn(`Could not get complete market data for ${symbol}, skipping strategy.`);
      return null;
    }
    const currentPrice = priceData.ltp;
    const atr = technicals.atr;

    const { trend } = marketCondition;

    const isBullishConfluence = trend === 'bullish' && currentPrice > (technicals.movingAverages?.['20_ema'] || 0) && technicals.rsi < 65;
    if (isBullishConfluence) {
      const stopLoss = calculateStopLoss(currentPrice, atr, 'buy');
      const target = calculateTarget(currentPrice, stopLoss, 'buy');
      const quantity = calculatePositionSize(currentPrice, stopLoss, config, currentCapital);
      if (quantity <= 0) return null;
      return {
        symbol, action: 'buy', orderType: 'limit', quantity, price: currentPrice,
        confidence: 0.80, reason: `Bullish trend, >20 EMA, RSI<65.`,
        strategy: 'Intraday Confluence', stopLoss, target,
      };
    }

    const isBearishConfluence = trend === 'bearish' && currentPrice < (technicals.movingAverages?.['20_ema'] || 0) && technicals.rsi > 35;
    if (isBearishConfluence) {
      const stopLoss = calculateStopLoss(currentPrice, atr, 'sell');
      const target = calculateTarget(currentPrice, stopLoss, 'sell');
      const quantity = calculatePositionSize(currentPrice, stopLoss, config, currentCapital);
      if (quantity <= 0) return null;
      return {
        symbol, action: 'sell', orderType: 'limit', quantity, price: currentPrice,
        confidence: 0.78, reason: `Bearish trend, <20 EMA, RSI>35.`,
        strategy: 'Intraday Confluence', stopLoss, target,
      };
    }
  } catch (error) {
    console.error(`Error in intraday strategy for ${symbol}:`, error);
  }

  return null;
}
