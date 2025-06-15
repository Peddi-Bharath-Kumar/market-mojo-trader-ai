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
  correlationRisk?: number;
  sectorExposure?: number;
  liquidityScore?: number;
}

export class IntegratedTradingEngine {
  private isActive: boolean = false;
  private autoTradingEnabled: boolean = false;
  private dailyStats = {
    tradesCount: 0,
    successfulTrades: 0,
    totalPnL: 0,
    maxDrawdown: 0,
    startTime: Date.now()
  };
  private positionsBySymbol: Map<string, number> = new Map();
  private positionsBySector: Map<string, number> = new Map();

  public startIntegratedTrading(): void {
    if (!enhancedTradingEngine.isMarketOpen()) {
      console.log('🕐 Cannot start trading - Market is closed');
      console.log('📅 Indian markets: Monday-Friday, 9:15 AM - 3:30 PM IST');
      return;
    }

    this.isActive = true;
    this.resetDailyStats();
    
    console.log('🚀 Integrated AI Trading Engine Started');
    console.log('📊 Enhanced Indian market integration active');
    console.log('🕐 Market Status: OPEN');
    console.log(`⏰ Current Time: ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    
    this.initializeDataSources();
    this.monitorIntegratedSignals();
    this.startMarketCloseMonitor();
  }

  public enableAutoTrading() {
    if (!enhancedTradingEngine.isMarketOpen()) {
      console.log('❌ Cannot enable auto-trading - Market is closed');
      return;
    }

    this.autoTradingEnabled = true;
    orderExecutionService.enableLiveTrading();
    console.log('🤖 AUTO-TRADING ENABLED - Real orders will be placed!');
    console.log('⚠️  Please ensure sufficient margin and risk management');
  }

  public disableAutoTrading() {
    this.autoTradingEnabled = false;
    orderExecutionService.disableLiveTrading();
    console.log('📋 Auto-trading disabled - Signal generation only');
  }

  public stopIntegratedTrading(): void {
    this.isActive = false;
    this.logDailyStats();
    console.log('🛑 Integrated Trading Engine Stopped');
  }

  private startMarketCloseMonitor(): void {
    const checkInterval = setInterval(() => {
      const now = new Date();
      const hour = now.getHours() + now.getMinutes() / 60;
      
      // Auto-stop at 3:25 PM to close all positions by 3:30 PM
      if (hour >= 15.42) { // 3:25 PM
        console.log('🕐 Market closing soon - Stopping auto-trading and closing positions');
        this.disableAutoTrading();
        this.closeAllIntradayPositions();
        clearInterval(checkInterval);
      }
      
      // Stop completely at 3:30 PM
      if (hour >= 15.5) { // 3:30 PM
        this.stopIntegratedTrading();
        clearInterval(checkInterval);
      }
    }, 60000); // Check every minute
  }

  private async closeAllIntradayPositions(): Promise<void> {
    const positions = marketDataService.getPositions();
    const intradayPositions = positions.filter(pos => 
      pos.product === 'mis' || pos.type === 'intraday' // Handle both product and type properties
    );
    
    for (const position of intradayPositions) {
      try {
        const closeOrder: OrderRequest = {
          symbol: position.symbol,
          action: position.type === 'long' ? 'sell' : 'buy',
          orderType: 'market',
          quantity: Math.abs(position.quantity),
          product: 'mis',
          validity: 'day'
        };
        
        console.log(`🔄 Closing intraday position: ${position.symbol}`);
        await orderExecutionService.placeOrder(closeOrder);
      } catch (error) {
        console.error(`❌ Failed to close position ${position.symbol}:`, error);
      }
    }
  }

  private resetDailyStats(): void {
    this.dailyStats = {
      tradesCount: 0,
      successfulTrades: 0,
      totalPnL: 0,
      maxDrawdown: 0,
      startTime: Date.now()
    };
    this.positionsBySymbol.clear();
    this.positionsBySector.clear();
  }

  private logDailyStats(): void {
    const duration = (Date.now() - this.dailyStats.startTime) / (1000 * 60 * 60); // hours
    const successRate = this.dailyStats.tradesCount > 0 ? 
      (this.dailyStats.successfulTrades / this.dailyStats.tradesCount * 100) : 0;
    
    console.log('📊 Daily Trading Summary:');
    console.log(`📈 Total Trades: ${this.dailyStats.tradesCount}`);
    console.log(`✅ Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`💰 Total P&L: ₹${this.dailyStats.totalPnL.toFixed(2)}`);
    console.log(`📉 Max Drawdown: ${this.dailyStats.maxDrawdown.toFixed(2)}%`);
    console.log(`⏱️  Trading Duration: ${duration.toFixed(1)} hours`);
  }

  private async initializeDataSources(): Promise<void> {
    try {
      const marketStatus = marketDataService.getConnectionStatus();
      const realDataCredentials = realDataService.getCredentials();
      
      console.log('📈 Market Data Service:', marketStatus.isConnected ? '✅ Connected' : '❌ Disconnected');
      console.log('🔑 Real Data APIs:', Object.keys(realDataCredentials).length > 0 ? '✅ Configured' : '❌ Not configured');
      
      // Analyze current market regime
      await enhancedTradingEngine.analyzeMarketRegimeWithRealData('NIFTY');
      
      const regime = enhancedTradingEngine.getMarketRegime();
      console.log(`🧠 Market Regime: ${regime?.type} | Time: ${regime?.timeOfDay} | Volatility: ${regime?.volatilityRegime}`);
      
      console.log('🧠 All data sources initialized and market regime analyzed');
    } catch (error) {
      console.warn('⚠️ Some data sources failed to initialize:', error);
    }
  }

  private monitorIntegratedSignals(): void {
    if (!this.isActive) return;

    const interval = setInterval(async () => {
      if (!this.isActive || !enhancedTradingEngine.isMarketOpen()) {
        clearInterval(interval);
        return;
      }

      try {
        const signals = await this.generateIntegratedSignals();
        
        if (this.autoTradingEnabled && signals.length > 0) {
          await this.executeHighQualitySignals(signals);
        }
      } catch (error) {
        console.error('❌ Error in signal monitoring:', error);
      }
    }, 10000); // Check every 10 seconds for more responsive trading
  }

  private async executeHighQualitySignals(signals: IntegratedSignal[]): Promise<void> {
    // More realistic filtering with multiple criteria
    const executableSignals = signals.filter(signal => {
      // Basic quality filters
      if (signal.confidence < 0.65) return false;
      if (signal.signalScore && signal.signalScore < 65) return false;
      if (signal.action === 'hold') return false;
      
      // Risk management filters
      if (this.isOverExposed(signal.symbol)) {
        console.log(`⚠️ Skipping ${signal.symbol} - Over-exposed (max 3 positions per symbol)`);
        return false;
      }
      
      if (this.isDailyLimitReached()) {
        console.log(`⚠️ Daily trade limit reached (${this.dailyStats.tradesCount}/50)`);
        return false;
      }
      
      // Correlation and sector exposure checks
      if (signal.correlationRisk && signal.correlationRisk > 0.7) {
        console.log(`⚠️ Skipping ${signal.symbol} - High correlation risk`);
        return false;
      }
      
      return true;
    }).slice(0, 3); // Max 3 orders per cycle

    for (const signal of executableSignals) {
      try {
        await this.placeEnhancedOrder(signal);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between orders
      } catch (error) {
        console.error(`❌ Failed to execute signal for ${signal.symbol}:`, error);
      }
    }
  }

  private async placeEnhancedOrder(signal: IntegratedSignal): Promise<void> {
    const timeOfDay = enhancedTradingEngine.getMarketRegime()?.timeOfDay;
    
    // Determine product type based on strategy and time
    let product: 'mis' | 'cnc' | 'nrml' = 'mis'; // Default intraday
    if (signal.strategy.includes('Swing')) product = 'cnc'; // Cash for swing trades
    if (signal.strategy.includes('Options')) product = 'nrml'; // Normal for options
    
    // Adjust order type based on market conditions and time
    let orderType: 'market' | 'limit' | 'stop' = signal.orderType as any || 'limit';
    if (timeOfDay === 'opening' && signal.strategy === 'Gap Trading') {
      orderType = 'market'; // Market orders for gap trades
    }
    if (signal.strategy === 'Scalping') {
      orderType = 'market'; // Market orders for scalping
    }

    const orderRequest: OrderRequest = {
      symbol: signal.symbol,
      action: signal.action as 'buy' | 'sell',
      orderType,
      quantity: signal.quantity,
      price: signal.price,
      stopLoss: signal.stopLoss,
      target: signal.target,
      product,
      validity: 'day'
    };

    console.log(`🎯 Executing enhanced signal: ${signal.symbol} ${signal.action.toUpperCase()}`);
    console.log(`📊 Confidence: ${(signal.confidence * 100).toFixed(1)}% | Score: ${signal.signalScore} | Strategy: ${signal.strategy}`);
    
    const orderResponse = await orderExecutionService.placeOrder(orderRequest);
    
    if (orderResponse.status === 'complete' || orderResponse.status === 'pending') {
      console.log(`✅ Order placed: ${orderResponse.orderId} | ${signal.symbol} ${signal.action}`);
      this.updatePositionTracking(signal);
      this.dailyStats.tradesCount++;
    } else {
      console.log(`❌ Order rejected: ${orderResponse.message}`);
    }
  }

  private isOverExposed(symbol: string): boolean {
    const currentPositions = this.positionsBySymbol.get(symbol) || 0;
    return currentPositions >= 3; // Max 3 positions per symbol
  }

  private isDailyLimitReached(): boolean {
    return this.dailyStats.tradesCount >= 50; // Max 50 trades per day
  }

  private updatePositionTracking(signal: IntegratedSignal): void {
    // Update symbol exposure
    const currentSymbolPositions = this.positionsBySymbol.get(signal.symbol) || 0;
    this.positionsBySymbol.set(signal.symbol, currentSymbolPositions + 1);
    
    // Update sector exposure (simplified sector mapping)
    const sector = this.getSectorForSymbol(signal.symbol);
    const currentSectorPositions = this.positionsBySector.get(sector) || 0;
    this.positionsBySector.set(sector, currentSectorPositions + 1);
  }

  private getSectorForSymbol(symbol: string): string {
    const sectorMap: { [key: string]: string } = {
      'RELIANCE': 'Energy',
      'TCS': 'IT', 'INFY': 'IT', 'WIPRO': 'IT',
      'HDFC': 'Banking', 'ICICI': 'Banking', 'SBI': 'Banking',
      'ITC': 'FMCG', 'HUL': 'FMCG',
      'NIFTY': 'Index', 'BANKNIFTY': 'Index'
    };
    return sectorMap[symbol] || 'Others';
  }

  private async generateIntegratedSignals(): Promise<IntegratedSignal[]> {
    const signals: IntegratedSignal[] = [];
    
    console.log('🎯 Generating integrated signals with enhanced filtering...');
    
    try {
      // 1. Get enhanced signals with real data (multiple strategies)
      const enhancedSignals = await enhancedTradingEngine.generateEnhancedSignalsWithRealData();
      
      for (const signal of enhancedSignals) {
        const enhancedSignal = await this.enhanceSignalWithRealData(signal);
        signals.push(enhancedSignal);
      }
      
      // 2. Get options opportunities (only during appropriate times)
      const timeOfDay = enhancedTradingEngine.getMarketRegime()?.timeOfDay;
      if (timeOfDay !== 'closing') { // Avoid options near close
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
              strategy: 'Enhanced Options Greeks',
              greeksData: option,
              riskLevel: option.riskLevel,
              dataSource: 'real_api',
              confidence_boost: 0.05,
              signalScore: this.scoreOptionsSignal(option)
            };
            
            signals.push(signal);
          }
        });
      }
      
    } catch (error) {
      console.warn('Failed to generate enhanced signals:', error);
    }

    // 3. Apply portfolio-level filters and risk management
    const positions = marketDataService.getPositions();
    const adjustedSignals = this.adjustSignalsBasedOnPortfolio(signals, positions);

    // 4. Filter and rank by comprehensive quality metrics
    const qualitySignals = this.filterHighQualitySignals(adjustedSignals);
    
    if (qualitySignals.length > 0) {
      console.log(`🎯 High-Quality Signals: ${qualitySignals.length} | Data Sources: ${this.getDataSourceBreakdown(qualitySignals)}`);
      this.logTopSignals(qualitySignals.slice(0, 3));
    }

    return qualitySignals;
  }

  private scoreOptionsSignal(option: OptionsGreeksData): number {
    let score = 50; // Base score
    
    // IV-based scoring
    if (option.impliedVolatility > 0.4) score += 15;
    else if (option.impliedVolatility < 0.15) score += 10;
    
    // Greeks-based scoring
    if (Math.abs(option.greeks.delta) > 0.5) score += 10;
    if (option.greeks.theta < -20) score += 5;
    if (Math.abs(option.greeks.gamma) > 0.05) score += 10;
    
    // Volume and liquidity
    if (option.volume > 5000) score += 10;
    
    // Risk level adjustment
    if (option.riskLevel === 'low') score += 10;
    else if (option.riskLevel === 'extreme') score -= 20;
    
    return Math.min(100, Math.max(0, score));
  }

  private logTopSignals(signals: IntegratedSignal[]): void {
    console.log('📊 Top Signals:');
    signals.forEach((signal, index) => {
      console.log(`${index + 1}. ${signal.symbol} ${signal.action.toUpperCase()} - ${signal.strategy}`);
      console.log(`   📈 Confidence: ${(signal.confidence * 100).toFixed(1)}% | Score: ${signal.signalScore}`);
      console.log(`   💡 ${signal.reason}`);
    });
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

  private adjustSignalsBasedOnPortfolio(signals: IntegratedSignal[], positions: any[]): IntegratedSignal[] {
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
      .filter(signal => {
        // Enhanced quality filters
        if (signal.confidence < 0.60) return false;
        
        // Data source prioritization with more lenient thresholds
        if (signal.dataSource === 'real_api' && signal.confidence >= 0.60) return true;
        if (signal.dataSource === 'broker_api' && signal.confidence >= 0.65) return true;
        if (signal.dataSource === 'simulation' && signal.confidence >= 0.75) return true;
        
        // Risk level filters
        if (signal.riskLevel === 'extreme' && signal.confidence < 0.80) return false;
        
        // Liquidity filter (basic)
        if (signal.liquidityScore && signal.liquidityScore < 30) return false;
        
        return true;
      })
      .sort((a, b) => {
        // Multi-factor ranking
        const aScore = this.calculateOverallSignalScore(a);
        const bScore = this.calculateOverallSignalScore(b);
        return bScore - aScore;
      })
      .slice(0, enhancedTradingEngine.getDynamicAllocation().maxPositions);
  }

  private calculateOverallSignalScore(signal: IntegratedSignal): number {
    let score = signal.confidence * 50; // Base confidence score (0-50)
    
    // Signal score bonus
    if (signal.signalScore) score += signal.signalScore * 0.3; // 0-30 points
    
    // Data source bonus
    const dataSourceBonus = { 'real_api': 15, 'broker_api': 10, 'simulation': 0 };
    score += dataSourceBonus[signal.dataSource] || 0;
    
    // Strategy time appropriateness
    const timeOfDay = enhancedTradingEngine.getMarketRegime()?.timeOfDay;
    if (timeOfDay === 'opening' && signal.strategy.includes('Gap')) score += 5;
    if (timeOfDay === 'morning' && signal.strategy.includes('Scalping')) score += 3;
    
    // Risk adjustment
    const riskPenalty = { 'low': 0, 'medium': -2, 'high': -5, 'extreme': -10 };
    score += riskPenalty[signal.riskLevel || 'medium'];
    
    return score;
  }

  private getDataSourceBreakdown(signals: IntegratedSignal[]): { [key: string]: number } {
    const breakdown: { [key: string]: number } = {};
    
    signals.forEach(signal => {
      breakdown[signal.dataSource] = (breakdown[signal.dataSource] || 0) + 1;
    });
    
    return breakdown;
  }

  public getIntegratedStatus() {
    const marketOpen = enhancedTradingEngine.isMarketOpen();
    const regime = enhancedTradingEngine.getMarketRegime();
    const allocation = enhancedTradingEngine.getDynamicAllocation();
    
    return {
      isActive: this.isActive,
      autoTradingEnabled: this.autoTradingEnabled,
      marketOpen,
      marketRegime: regime,
      dynamicAllocation: allocation,
      dailyStats: {
        ...this.dailyStats,
        successRate: this.dailyStats.tradesCount > 0 ? 
          (this.dailyStats.successfulTrades / this.dailyStats.tradesCount * 100) : 0
      },
      exposureBySymbol: Object.fromEntries(this.positionsBySymbol),
      exposureBySector: Object.fromEntries(this.positionsBySector),
      dataSourcesStatus: {
        brokerAPI: marketDataService.getConnectionStatus().isConnected,
        realDataAPIs: Object.keys(realDataService.getCredentials()).length,
        tradingStatus: orderExecutionService.getTradingStatus()
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
