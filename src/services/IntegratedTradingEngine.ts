
import { TradingSignal } from './TradingRobotEngine';
import { optionsGreeksEngine, type OptionsGreeksData } from './OptionsGreeksEngine';
import { enhancedTradingEngine } from './EnhancedTradingEngine';

export interface IntegratedSignal extends TradingSignal {
  greeksData?: OptionsGreeksData;
  signalScore?: number;
  marketRegime?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'extreme';
}

export class IntegratedTradingEngine {
  private isActive: boolean = false;

  public startIntegratedTrading(): void {
    this.isActive = true;
    console.log('🚀 Integrated AI Trading Engine Started');
    console.log('📊 Options Greeks monitoring active');
    console.log('🧠 Enhanced signal analysis active');
    
    this.monitorIntegratedSignals();
  }

  public stopIntegratedTrading(): void {
    this.isActive = false;
    console.log('🛑 Integrated Trading Engine Stopped');
  }

  private monitorIntegratedSignals(): void {
    if (!this.isActive) return;

    const interval = setInterval(() => {
      if (!this.isActive) {
        clearInterval(interval);
        return;
      }

      this.generateIntegratedSignals();
    }, 15000); // Check every 15 seconds
  }

  private generateIntegratedSignals(): IntegratedSignal[] {
    const signals: IntegratedSignal[] = [];
    
    // Get options trading opportunities from Greeks engine
    const optionsOpportunities = optionsGreeksEngine.getTradingOpportunities();
    
    optionsOpportunities.forEach(option => {
      if (option.tradingRecommendation !== 'hold') {
        const signal: IntegratedSignal = {
          symbol: option.symbol,
          action: option.tradingRecommendation.includes('buy') ? 'buy' : 'sell',
          orderType: 'limit',
          quantity: this.calculateOptionsQuantity(option),
          price: option.lastPrice,
          confidence: this.calculateOptionsConfidence(option),
          reason: this.generateOptionsReason(option),
          strategy: 'Integrated Options Greeks',
          greeksData: option,
          riskLevel: option.riskLevel
        };
        
        signals.push(signal);
      }
    });

    // Get enhanced market signals
    const marketSignals = enhancedTradingEngine.generateEnhancedSignals();
    marketSignals.forEach(signal => {
      const enhancedSignal: IntegratedSignal = {
        ...signal,
        signalScore: enhancedTradingEngine.calculateSignalScore({
          technicalScore: 25,
          volumeScore: 20,
          sentimentScore: 15,
          volatilityScore: 10
        })
      };
      signals.push(enhancedSignal);
    });

    // Filter and rank signals by quality
    const qualitySignals = this.filterHighQualitySignals(signals);
    
    if (qualitySignals.length > 0) {
      console.log('🎯 Integrated High-Quality Signals Generated:', qualitySignals);
    }

    return qualitySignals;
  }

  private calculateOptionsQuantity(option: OptionsGreeksData): number {
    // Risk-based position sizing for options
    const baseQuantity = 1;
    const riskMultiplier = {
      low: 2,
      medium: 1,
      high: 0.5,
      extreme: 0.25
    };
    
    return Math.max(1, Math.floor(baseQuantity * riskMultiplier[option.riskLevel]));
  }

  private calculateOptionsConfidence(option: OptionsGreeksData): number {
    let confidence = 0.5; // Base confidence
    
    // IV-based confidence
    if (option.impliedVolatility > 0.35 && option.tradingRecommendation.includes('sell')) {
      confidence += 0.2; // High IV sell
    }
    if (option.impliedVolatility < 0.15 && option.tradingRecommendation.includes('buy')) {
      confidence += 0.2; // Low IV buy
    }
    
    // Greeks-based confidence
    if (Math.abs(option.greeks.gamma) > 0.03 && option.timeToExpiry < 0.05) {
      confidence += 0.15; // High gamma near expiry
    }
    
    // Volume confirmation
    if (option.volume > 2000) {
      confidence += 0.1;
    }
    
    // Risk level adjustment
    if (option.riskLevel === 'low') confidence += 0.05;
    if (option.riskLevel === 'extreme') confidence -= 0.15;
    
    return Math.min(0.95, Math.max(0.3, confidence));
  }

  private generateOptionsReason(option: OptionsGreeksData): string {
    const reasons: string[] = [];
    
    if (option.impliedVolatility > 0.35) {
      reasons.push(`High IV (${(option.impliedVolatility * 100).toFixed(1)}%)`);
    }
    if (option.impliedVolatility < 0.15) {
      reasons.push(`Low IV (${(option.impliedVolatility * 100).toFixed(1)}%)`);
    }
    if (Math.abs(option.greeks.gamma) > 0.03) {
      reasons.push(`High gamma (${option.greeks.gamma.toFixed(4)})`);
    }
    if (option.greeks.theta < -15) {
      reasons.push('High time decay');
    }
    if (option.volume > 3000) {
      reasons.push('High volume');
    }
    
    const baseReason = option.tradingRecommendation.includes('buy') ? 
      'Options buying opportunity' : 'Options selling opportunity';
    
    return `${baseReason}: ${reasons.join(', ')}`;
  }

  private filterHighQualitySignals(signals: IntegratedSignal[]): IntegratedSignal[] {
    return signals
      .filter(signal => signal.confidence >= 0.7) // Only high confidence
      .filter(signal => {
        // Filter out extreme risk unless very high confidence
        if (signal.riskLevel === 'extreme') {
          return signal.confidence >= 0.85;
        }
        return true;
      })
      .sort((a, b) => b.confidence - a.confidence) // Sort by confidence
      .slice(0, 5); // Top 5 signals
  }

  public getIntegratedStatus() {
    const portfolioRisk = optionsGreeksEngine.getPortfolioRisk();
    const highRiskOptions = optionsGreeksEngine.getHighRiskOptions();
    const tradingOpportunities = optionsGreeksEngine.getTradingOpportunities();
    
    return {
      isActive: this.isActive,
      portfolioRisk,
      highRiskOptionsCount: highRiskOptions.length,
      tradingOpportunitiesCount: tradingOpportunities.length,
      optionsMonitoring: true,
      enhancedAnalysis: true
    };
  }

  public getOptionsInsights(symbol: string) {
    return optionsGreeksEngine.getGreeksAnalysis(symbol);
  }
}

export const integratedTradingEngine = new IntegratedTradingEngine();
