import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Minus, BarChart3, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { realDataService, type TechnicalIndicators } from '@/services/RealDataService';

interface TechnicalSignal {
  indicator: string;
  value: string;
  signal: 'buy' | 'sell' | 'hold';
  strength: number;
  description: string;
  isRealData: boolean;
}

export const RealTechnicalAnalysis = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('NIFTY');
  const [technicalData, setTechnicalData] = useState<TechnicalIndicators | null>(null);
  const [signals, setSignals] = useState<TechnicalSignal[]>([]);
  const [overallSignal, setOverallSignal] = useState<'buy' | 'sell' | 'hold'>('hold');
  const [signalStrength, setSignalStrength] = useState(50);
  const [isCalculating, setIsCalculating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [hasRealData, setHasRealData] = useState(false);

  const symbols = ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'TCS', 'INFY', 'HDFC', 'ITC', 'ICICIBANK'];

  const calculateRealTechnicalAnalysis = async () => {
    setIsCalculating(true);
    console.log(`📊 Calculating real technical analysis for ${selectedSymbol}...`);

    try {
      // Get real technical data
      const data = await realDataService.getTechnicalIndicators(selectedSymbol);
      setTechnicalData(data);

      // Check if we have real API connection
      const connectionStatus = realDataService.getConnectionStatus();
      setHasRealData(connectionStatus.hasRealData);

      // Get current price for Bollinger Bands position calculation
      const priceData = await realDataService.getRealTimePrice(selectedSymbol);
      const currentPrice = priceData.price;

      // Calculate Bollinger Bands position (0 = at lower band, 1 = at upper band)
      const bbRange = data.bollingerBands.upper - data.bollingerBands.lower;
      const bbPosition = bbRange > 0 ? (currentPrice - data.bollingerBands.lower) / bbRange : 0.5;

      // Generate signals based on real data
      const newSignals: TechnicalSignal[] = [
        {
          indicator: 'RSI (14)',
          value: data.rsi.toFixed(2),
          signal: data.rsi < 30 ? 'buy' : data.rsi > 70 ? 'sell' : 'hold',
          strength: data.rsi < 30 ? 90 : data.rsi > 70 ? 85 : 50,
          description: `RSI indicates ${data.rsi < 30 ? 'oversold' : data.rsi > 70 ? 'overbought' : 'neutral'} conditions`,
          isRealData: connectionStatus.configured.includes('alphaVantage') || connectionStatus.configured.includes('trueData')
        },
        {
          indicator: 'MACD',
          value: data.macd.value.toFixed(4),
          signal: data.macd.value > data.macd.signal ? 'buy' : 'sell',
          strength: Math.abs(data.macd.histogram) * 1000,
          description: `MACD ${data.macd.value > data.macd.signal ? 'bullish' : 'bearish'} crossover`,
          isRealData: connectionStatus.configured.includes('alphaVantage') || connectionStatus.configured.includes('trueData')
        },
        {
          indicator: 'SMA (20)',
          value: data.movingAverages.sma20.toFixed(2),
          signal: 'hold', // Would need current price to determine
          strength: 60,
          description: '20-period Simple Moving Average',
          isRealData: connectionStatus.configured.includes('alphaVantage') || connectionStatus.configured.includes('trueData')
        },
        {
          indicator: 'EMA (12)',
          value: data.movingAverages.ema12.toFixed(2),
          signal: 'hold',
          strength: 65,
          description: '12-period Exponential Moving Average',
          isRealData: connectionStatus.configured.includes('alphaVantage') || connectionStatus.configured.includes('trueData')
        },
        {
          indicator: 'Bollinger Bands',
          value: `${(bbPosition * 100).toFixed(1)}%`,
          signal: bbPosition < 0.2 ? 'buy' : bbPosition > 0.8 ? 'sell' : 'hold',
          strength: bbPosition < 0.2 || bbPosition > 0.8 ? 80 : 50,
          description: `Price is ${(bbPosition * 100).toFixed(1)}% through BB range`,
          isRealData: connectionStatus.configured.includes('alphaVantage') || connectionStatus.configured.includes('trueData')
        },
        {
          indicator: 'Stochastic',
          value: `${data.stochastic.k.toFixed(1)}/${data.stochastic.d.toFixed(1)}`,
          signal: data.stochastic.k < 20 ? 'buy' : data.stochastic.k > 80 ? 'sell' : 'hold',
          strength: data.stochastic.k < 20 || data.stochastic.k > 80 ? 75 : 45,
          description: `Stochastic ${data.stochastic.k < 20 ? 'oversold' : data.stochastic.k > 80 ? 'overbought' : 'neutral'}`,
          isRealData: connectionStatus.configured.includes('alphaVantage') || connectionStatus.configured.includes('trueData')
        }
      ];

      setSignals(newSignals);

      // Calculate overall signal
      const buySignals = newSignals.filter(s => s.signal === 'buy').length;
      const sellSignals = newSignals.filter(s => s.signal === 'sell').length;
      const avgStrength = newSignals.reduce((sum, s) => sum + s.strength, 0) / newSignals.length;

      setSignalStrength(avgStrength);

      if (buySignals > sellSignals) {
        setOverallSignal('buy');
      } else if (sellSignals > buySignals) {
        setOverallSignal('sell');
      } else {
        setOverallSignal('hold');
      }

      setLastUpdate(new Date());
      console.log(`✅ Technical analysis complete for ${selectedSymbol}`);
      console.log(`📈 Overall signal: ${buySignals > sellSignals ? 'BUY' : sellSignals > buySignals ? 'SELL' : 'HOLD'}`);
      console.log(`💪 Signal strength: ${avgStrength.toFixed(1)}%`);

    } catch (error) {
      console.error('Technical analysis calculation failed:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    calculateRealTechnicalAnalysis();
    
    // Auto-refresh every 2 minutes for real data, 5 minutes for simulation
    const interval = setInterval(calculateRealTechnicalAnalysis, hasRealData ? 2 * 60 * 1000 : 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedSymbol, hasRealData]);

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'buy': return 'bg-green-500 text-white';
      case 'sell': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'buy': return <TrendingUp className="h-4 w-4" />;
      case 'sell': return <TrendingDown className="h-4 w-4" />;
      default: return <Minus className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Real-time Technical Analysis
              {hasRealData ? (
                <Badge className="bg-green-500 text-white flex items-center gap-1">
                  <Wifi className="h-3 w-3" />
                  Live Data
                </Badge>
              ) : (
                <Badge variant="outline" className="flex items-center gap-1">
                  <WifiOff className="h-3 w-3" />
                  Enhanced Simulation
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {symbols.map(symbol => (
                    <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={calculateRealTechnicalAnalysis} disabled={isCalculating} size="sm">
                <RefreshCw className={`h-4 w-4 ${isCalculating ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Data Source Info */}
          <Card className={`mb-6 ${hasRealData ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {hasRealData ? (
                  <Wifi className="h-5 w-5 text-green-600" />
                ) : (
                  <WifiOff className="h-5 w-5 text-amber-600" />
                )}
                <div>
                  <div className="font-medium">
                    {hasRealData ? '📊 Real Market Data Active' : '🎯 Enhanced Market Simulation'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {hasRealData 
                      ? 'Technical indicators calculated from live Alpha Vantage data'
                      : 'Configure Alpha Vantage API in settings to get real technical data'
                    }
                  </div>
                  {lastUpdate && (
                    <div className="text-xs text-gray-500 mt-1">
                      Last updated: {lastUpdate.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overall Signal */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${getSignalColor(overallSignal)}`}>
                {getSignalIcon(overallSignal)}
                <span className="font-semibold capitalize">{overallSignal}</span>
              </div>
              <div className="text-sm text-gray-600">
                Signal Strength: {signalStrength.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">
                Symbol: <strong>{selectedSymbol}</strong>
              </div>
            </div>
            <Progress value={signalStrength} className="h-3" />
          </div>

          {/* Technical Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {signals.map((signal, index) => (
              <Card key={index} className={`border-l-4 ${signal.signal === 'buy' ? 'border-l-green-500' : signal.signal === 'sell' ? 'border-l-red-500' : 'border-l-gray-500'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{signal.indicator}</span>
                      {signal.isRealData && (
                        <Badge variant="outline" className="text-xs">
                          Real Data
                        </Badge>
                      )}
                    </div>
                    <Badge className={getSignalColor(signal.signal)}>
                      {signal.signal.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Value:</span>
                      <span className="font-mono">{signal.value}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Strength:</span>
                      <span>{signal.strength.toFixed(1)}%</span>
                    </div>
                    <Progress value={signal.strength} className="h-2" />
                    <p className="text-xs text-gray-600 mt-2">{signal.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Technical Analysis Summary */}
          {technicalData && (
            <Card className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50">
              <CardContent className="p-4">
                <h4 className="font-medium mb-3">📈 Technical Analysis Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">RSI Reading:</span>
                    <div className={`font-medium ${technicalData.rsi < 30 ? 'text-green-600' : technicalData.rsi > 70 ? 'text-red-600' : 'text-gray-600'}`}>
                      {technicalData.rsi.toFixed(1)} - {technicalData.rsi < 30 ? 'Oversold' : technicalData.rsi > 70 ? 'Overbought' : 'Neutral'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">MACD Signal:</span>
                    <div className={`font-medium ${technicalData.macd.value > technicalData.macd.signal ? 'text-green-600' : 'text-red-600'}`}>
                      {technicalData.macd.value > technicalData.macd.signal ? 'Bullish' : 'Bearish'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">BB Range:</span>
                    <div className="font-medium text-blue-600">
                      {technicalData.bollingerBands.lower.toFixed(2)} - {technicalData.bollingerBands.upper.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Stochastic:</span>
                    <div className={`font-medium ${technicalData.stochastic.k < 20 ? 'text-green-600' : technicalData.stochastic.k > 80 ? 'text-red-600' : 'text-gray-600'}`}>
                      {technicalData.stochastic.k < 20 ? 'Oversold' : technicalData.stochastic.k > 80 ? 'Overbought' : 'Neutral'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {signals.length === 0 && !isCalculating && (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No technical indicators calculated</p>
              <p className="text-sm">Select a symbol and click refresh to analyze</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
