
import type { MarketCondition } from './types';

export class MarketAnalyzer {
  public analyzeMarketConditions(): MarketCondition {
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60;
    
    let timeOfDay: MarketCondition['timeOfDay'];
    if (hour < 9.25) timeOfDay = 'pre_open';
    else if (hour <= 10.5) timeOfDay = 'opening';
    else if (hour <= 13) timeOfDay = 'morning';
    else if (hour <= 15.4) timeOfDay = 'afternoon';
    else timeOfDay = 'closing';
    
    const marketData = this.getMarketData();
    
    const conditions: MarketCondition = {
      trend: this.analyzeTrend(marketData),
      volatility: this.analyzeVolatility(marketData),
      volume: this.analyzeVolume(marketData),
      marketSentiment: this.analyzeSentiment(),
      timeOfDay,
      dayType: this.getDayType()
    };

    console.log('📈 Enhanced Market Analysis:', conditions);
    return conditions;
  }

  private getMarketData() {
    const niftyChange = (Math.random() - 0.5) * 4;
    const volatility = Math.random() * 0.8 + 0.1;
    const volume = Math.random() * 2 + 0.5;
    
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
    if (day === 4) return 'expiry';
    return 'normal';
  }
}
