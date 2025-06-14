import { TradingSignal } from './TradingRobotEngine';
import { optionsGreeksEngine, type OptionsGreeksData } from './OptionsGreeksEngine';
import { enhancedTradingEngine } from './EnhancedTradingEngine';
import { realDataService } from './RealDataService';
import { marketDataService } from './MarketDataService';
import { orderExecutionService, type OrderRequest } from './OrderExecutionService';

export interface IntegratedSignal extends TradingSignal {
  greeksData?: OptionsGreeksData;
  signalScore?: number;
  marketRegime?: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'extreme';
  dataSource: 'real_api' | 'broker_api' | 'simulation';
  confidence_boost?: number;
}

export class IntegratedTradingEngine {
  private isActive: boolean = false;
  private autoTradingEnabled: boolean = false;

  public startIntegratedTrading(): void {
    this.isActive = true;
    console.log('🚀 Integrated AI Trading Engine Started');
    console.log('📊 Real Indian market data integration active');
    console.log('🔄 Broker API + Real data + Enhanced simulation');
    
    this.initializeDataSources();
    this.monitorIntegratedSignals();
  }

  public enableAutoTrading() {
    this.autoTradingEnabled = true;
    orderExecutionService.enableLiveTrading();
    console.log('🤖 AUTO-TRADING ENABLED - System will place real orders!');
  }

  public disableAutoTrading() {
    this.autoTradingEnabled = false;
    orderExecutionService.disableLiveTrading();
    console.log('📋 Auto-trading disabled - Signal generation only');
  }

  public stopIntegratedTrading(): void {
    this.isActive = false;
    console.log('🛑 Integrated Trading Engine Stopped');
  }

  private async initializeDataSources(): Promise<void> {
    try {
      // Test all data sources and log their status
      const marketStatus = marketDataService.getConnectionStatus();
      const realDataCredentials = realDataService.getCredentials();
      
      console.log('📈 Market Data Service:', marketStatus.isConnected ? '✅ Connected' : '❌ Disconnected');
      console.log('🔑 Real Data APIs:', Object.keys(realDataCredentials).length > 0 ? '✅ Configured' : '❌ Not configured');
      
      // Analyze market regime with real data
      await enhancedTradingEngine.analyzeMarketRegimeWithRealData('NIFTY');
      
      console.log('🧠 All data sources initialized');
    } catch (error) {
      console.warn('⚠️ Some data sources failed to initialize:', error);
    }
  }

  private monitorIntegratedSignals(): void {
    if (!this.isActive) return;

    const interval = setInterval(async () => {
      if (!this.isActive) {
        clearInterval(interval);
        return;
      }

      const signals = await this.generateIntegratedSignals();
      
      // Execute high-quality signals automatically if auto-trading is enabled
      if (this.autoTradingEnabled && signals.length > 0) {
        await this.executeHighQualitySignals(signals);
      }
    }, 15000); // Check every 15 seconds
  }

  private async executeHighQualitySignals(signals: IntegratedSignal[]): Promise<void> {
    const highQualitySignals = signals.filter(signal => 
      signal.confidence >= 0.85 && 
      signal.signalScore && 
      signal.signalScore.totalScore >= 90
    );

    for (const signal of highQualitySignals.slice(0, 2)) { // Limit to 2 orders per cycle
      try {
        const orderRequest: OrderRequest = {
          symbol: signal.symbol,
          action: signal.action,
          orderType: signal.orderType || 'limit',
          quantity: signal.quantity,
          price: signal.price,
          stopLoss: signal.stopLoss,
          target: signal.target,
          product: signal.strategy.includes('Intraday') ? 'mis' : 'cnc',
          validity: 'day'
        };

        console.log(`🎯 Executing high-quality signal: ${signal.symbol} ${signal.action} (Confidence: ${(signal.confidence * 100).toFixed(1)}%)`);
        
        const orderResponse = await orderExecutionService.placeOrder(orderRequest);
        
        if (orderResponse.status === 'complete' || orderResponse.status === 'pending') {
          console.log(`✅ Order placed successfully: ${orderResponse.orderId}`);
        } else {
          console.log(`❌ Order rejected: ${orderResponse.message}`);
        }
        
        // Wait 2 seconds between orders to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Failed to execute signal for ${signal.symbol}:`, error);
      }
    }
  }

  private async generateIntegratedSignals(): Promise<IntegratedSignal[]> {
    const signals: IntegratedSignal[] = [];
    
    console.log('🎯 Generating integrated signals from all data sources...');
    
    // 1. Get options trading opportunities from Greeks engine (uses real options data)
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
          strategy: 'Integrated Options Greeks (Real Data)',
          greeksData: option,
          riskLevel: option.riskLevel,
          dataSource: 'real_api',
          confidence_boost: 0.1 // Boost for real options data
        };
        
        signals.push(signal);
      }
    });

    // 2. Get enhanced market signals with real data
    try {
      const marketSignals = await enhancedTradingEngine.generateEnhancedSignals();
      
      for (const signal of marketSignals) {
        // Enhance each signal with real-time data
        const enhancedSignal = await this.enhanceSignalWithRealData(signal);
        signals.push(enhancedSignal);
      }
    } catch (error) {
      console.warn('Failed to generate enhanced signals:', error);
    }

    // 3. Get real-time broker positions and adjust signals
    const positions = marketDataService.getPositions();
    const adjustedSignals = this.adjustSignalsBasedOnPositions(signals, positions);

    // 4. Filter and rank signals by quality (prioritize real data)
    const qualitySignals = this.filterHighQualitySignals(adjustedSignals);
    
    if (qualitySignals.length > 0) {
      console.log('🎯 Integrated High-Quality Signals Generated:', qualitySignals.length);
      console.log('📊 Data sources breakdown:', this.getDataSourceBreakdown(qualitySignals));
    }

    return qualitySignals;
  }

  private async enhanceSignalWithRealData(baseSignal: TradingSignal): Promise<IntegratedSignal> {
    try {
      // Get real technical data
      const technicalData = await realDataService.getTechnicalIndicators(baseSignal.symbol);
      const priceData = await realDataService.getRealTimePrice(baseSignal.symbol);
      const sentimentData = await realDataService.getMarketSentiment(`${baseSignal.symbol} stock`);
      
      // Calculate sentiment score from news data
      const sentimentScore = sentimentData.length > 0 ? 
        sentimentData.reduce((sum, news) => sum + news.score, 0) / sentimentData.length / 100 : 0.5;
      
      // Calculate enhanced confidence based on real data confluence
      let enhancedConfidence = baseSignal.confidence;
      let confidenceBoost = 0;
      const reasons: string[] = [baseSignal.reason];
      
      // Technical confluence boost
      if (baseSignal.action === 'buy' && technicalData.rsi < 35) {
        confidenceBoost += 0.15;
        reasons.push(`RSI oversold (${technicalData.rsi.toFixed(1)})`);
      }
      if (baseSignal.action === 'sell' && technicalData.rsi > 65) {
        confidenceBoost += 0.15;
        reasons.push(`RSI overbought (${technicalData.rsi.toFixed(1)})`);
      }
      
      // MACD confluence
      const macdBullish = technicalData.macd.value > technicalData.macd.signal;
      if ((baseSignal.action === 'buy' && macdBullish) || (baseSignal.action === 'sell' && !macdBullish)) {
        confidenceBoost += 0.1;
        reasons.push('MACD confirmation');
      }
      
      // Volume confirmation
      if (priceData.volume > 500000) {
        confidenceBoost += 0.05;
        reasons.push('High volume');
      }
      
      // Sentiment confirmation
      if ((baseSignal.action === 'buy' && sentimentScore > 0.6) || (baseSignal.action === 'sell' && sentimentScore < 0.4)) {
        confidenceBoost += 0.1;
        reasons.push(`Market sentiment ${sentimentScore > 0.5 ? 'positive' : 'negative'}`);
      }
      
      enhancedConfidence = Math.min(0.95, enhancedConfidence + confidenceBoost);
      
      const enhancedSignal: IntegratedSignal = {
        ...baseSignal,
        confidence: enhancedConfidence,
        reason: reasons.join(', '),
        strategy: `${baseSignal.strategy} + Real Data Analysis`,
        signalScore: enhancedTradingEngine.calculateSignalScore({
          technicalScore: Math.min(40, confidenceBoost * 200),
          volumeScore: priceData.volume > 500000 ? 20 : 10,
          sentimentScore: Math.abs(sentimentScore - 0.5) * 40,
          volatilityScore: 15
        }),
        dataSource: 'real_api',
        confidence_boost: confidenceBoost,
        price: priceData.price, // Use real-time price
        target: baseSignal.action === 'buy' ? 
          priceData.price * (1 + 0.02 + confidenceBoost * 0.01) : 
          priceData.price * (1 - 0.02 - confidenceBoost * 0.01),
        stopLoss: baseSignal.action === 'buy' ? 
          priceData.price * (1 - 0.015 - confidenceBoost * 0.005) : 
          priceData.price * (1 + 0.015 + confidenceBoost * 0.005)
      };
      
      return enhancedSignal;
      
    } catch (error) {
      console.warn(`Failed to enhance signal with real data for ${baseSignal.symbol}:`, error);
      
      // Fallback to original signal with simulation marker
      return {
        ...baseSignal,
        signalScore: 50, // Lower score for simulation
        dataSource: 'simulation'
      };
    }
  }

  private adjustSignalsBasedOnPositions(signals: IntegratedSignal[], positions: any[]): IntegratedSignal[] {
    return signals.map(signal => {
      // Check if we already have a position in this symbol
      const existingPosition = positions.find(pos => pos.symbol === signal.symbol);
      
      if (existingPosition) {
        // Reduce confidence if we already have a large position
        if (Math.abs(existingPosition.quantity) > 100) {
          signal.confidence *= 0.8;
          signal.reason += ' (Position size adjustment)';
        }
        
        // Avoid opposing positions
        if ((existingPosition.type === 'long' && signal.action === 'sell') ||
            (existingPosition.type === 'short' && signal.action === 'buy')) {
          signal.confidence *= 0.6;
          signal.reason += ' (Opposing position risk)';
        }
      }
      
      return signal;
    });
  }

  private calculateOptionsQuantity(option: OptionsGreeksData): number {
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
    let confidence = 0.5;
    
    if (option.impliedVolatility > 0.35 && option.tradingRecommendation.includes('sell')) {
      confidence += 0.2;
    }
    if (option.impliedVolatility < 0.15 && option.tradingRecommendation.includes('buy')) {
      confidence += 0.2;
    }
    
    if (Math.abs(option.greeks.gamma) > 0.03 && option.timeToExpiry < 0.05) {
      confidence += 0.15;
    }
    
    if (option.volume > 2000) {
      confidence += 0.1;
    }
    
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
      .filter(signal => signal.confidence >= 0.65) // Slightly lower threshold to include more real data signals
      .filter(signal => {
        // Prioritize real data signals
        if (signal.dataSource === 'real_api') {
          return signal.confidence >= 0.65;
        }
        
        // Higher threshold for simulation signals
        if (signal.dataSource === 'simulation') {
          return signal.confidence >= 0.75;
        }
        
        // Filter extreme risk
        if (signal.riskLevel === 'extreme') {
          return signal.confidence >= 0.85;
        }
        
        return true;
      })
      .sort((a, b) => {
        // First sort by data source (real data first)
        if (a.dataSource !== b.dataSource) {
          const sourceScore = { 'real_api': 3, 'broker_api': 2, 'simulation': 1 };
          return sourceScore[b.dataSource] - sourceScore[a.dataSource];
        }
        
        // Then by confidence
        return b.confidence - a.confidence;
      })
      .slice(0, 8); // Top 8 signals
  }

  private getDataSourceBreakdown(signals: IntegratedSignal[]): { [key: string]: number } {
    const breakdown: { [key: string]: number } = {};
    
    signals.forEach(signal => {
      breakdown[signal.dataSource] = (breakdown[signal.dataSource] || 0) + 1;
    });
    
    return breakdown;
  }

  public getIntegratedStatus() {
    const portfolioRisk = optionsGreeksEngine.getPortfolioRisk();
    const highRiskOptions = optionsGreeksEngine.getHighRiskOptions();
    const tradingOpportunities = optionsGreeksEngine.getTradingOpportunities();
    const marketDataStatus = marketDataService.getConnectionStatus();
    const realDataCredentials = realDataService.getCredentials();
    const tradingStatus = orderExecutionService.getTradingStatus();
    
    return {
      isActive: this.isActive,
      autoTradingEnabled: this.autoTradingEnabled,
      portfolioRisk,
      highRiskOptionsCount: highRiskOptions.length,
      tradingOpportunitiesCount: tradingOpportunities.length,
      optionsMonitoring: true,
      enhancedAnalysis: true,
      orderExecution: tradingStatus,
      dataSourcesStatus: {
        brokerAPI: marketDataStatus.isConnected,
        brokerName: marketDataStatus.broker,
        realDataAPIs: Object.keys(realDataCredentials).length,
        hasPositions: marketDataStatus.hasPositions,
        positionsCount: marketDataStatus.positionsCount
      }
    };
  }

  public getOptionsInsights(symbol: string) {
    return optionsGreeksEngine.getGreeksAnalysis(symbol);
  }

  public async getRealTimeMarketInsights() {
    try {
      const niftyTechnicals = await realDataService.getTechnicalIndicators('NIFTY');
      const niftyPrice = await realDataService.getRealTimePrice('NIFTY');
      const sentimentData = await realDataService.getMarketSentiment('NIFTY stock market');
      const marketSentiment = sentimentData.length > 0 ? 
        sentimentData.reduce((sum, news) => sum + news.score, 0) / sentimentData.length / 100 : 0.5;
      
      return {
        technicals: niftyTechnicals,
        price: niftyPrice,
        sentiment: marketSentiment,
        timestamp: Date.now(),
        dataSource: 'real_api'
      };
    } catch (error) {
      console.warn('Failed to get real-time insights:', error);
      return null;
    }
  }
}

export const integratedTradingEngine = new IntegratedTradingEngine();
