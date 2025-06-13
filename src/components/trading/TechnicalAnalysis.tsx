
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';

interface TechnicalIndicator {
  name: string;
  value: number;
  signal: 'buy' | 'sell' | 'hold';
  strength: number;
  description: string;
}

export const TechnicalAnalysis = () => {
  const [indicators, setIndicators] = useState<TechnicalIndicator[]>([]);
  const [overallSignal, setOverallSignal] = useState<'buy' | 'sell' | 'hold'>('hold');
  const [signalStrength, setSignalStrength] = useState(50);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateIndicators = async () => {
    setIsCalculating(true);

    // Mock technical analysis calculations - replace with real TA-Lib or similar
    const mockIndicators: TechnicalIndicator[] = [
      {
        name: 'RSI (14)',
        value: 45 + Math.random() * 20,
        signal: Math.random() > 0.5 ? 'buy' : 'sell',
        strength: 70 + Math.random() * 30,
        description: 'Relative Strength Index indicates momentum'
      },
      {
        name: 'MACD',
        value: (Math.random() - 0.5) * 10,
        signal: Math.random() > 0.4 ? 'buy' : 'sell',
        strength: 60 + Math.random() * 40,
        description: 'Moving Average Convergence Divergence'
      },
      {
        name: 'SMA (20)',
        value: 100 + Math.random() * 50,
        signal: Math.random() > 0.6 ? 'buy' : 'hold',
        strength: 65 + Math.random() * 25,
        description: 'Simple Moving Average 20-period'
      },
      {
        name: 'EMA (12)',
        value: 105 + Math.random() * 45,
        signal: Math.random() > 0.55 ? 'buy' : 'sell',
        strength: 75 + Math.random() * 25,
        description: 'Exponential Moving Average 12-period'
      },
      {
        name: 'Bollinger Bands',
        value: Math.random() * 100,
        signal: Math.random() > 0.5 ? 'hold' : 'buy',
        strength: 55 + Math.random() * 35,
        description: 'Price relative to Bollinger Bands'
      },
      {
        name: 'Stochastic',
        value: Math.random() * 100,
        signal: Math.random() > 0.45 ? 'buy' : 'sell',
        strength: 60 + Math.random() * 30,
        description: 'Stochastic oscillator momentum indicator'
      }
    ];

    setTimeout(() => {
      setIndicators(mockIndicators);
      
      // Calculate overall signal
      const buySignals = mockIndicators.filter(i => i.signal === 'buy').length;
      const sellSignals = mockIndicators.filter(i => i.signal === 'sell').length;
      const avgStrength = mockIndicators.reduce((sum, i) => sum + i.strength, 0) / mockIndicators.length;
      
      setSignalStrength(avgStrength);
      
      if (buySignals > sellSignals) setOverallSignal('buy');
      else if (sellSignals > buySignals) setOverallSignal('sell');
      else setOverallSignal('hold');
      
      setIsCalculating(false);
    }, 1500);
  };

  useEffect(() => {
    calculateIndicators();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(calculateIndicators, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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
            Technical Analysis
            <Button onClick={calculateIndicators} disabled={isCalculating}>
              {isCalculating ? 'Calculating...' : 'Recalculate'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
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
            </div>
            <Progress value={signalStrength} className="h-3" />
          </div>

          {/* Technical Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {indicators.map((indicator, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{indicator.name}</span>
                    </div>
                    <Badge className={getSignalColor(indicator.signal)}>
                      {indicator.signal.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Value:</span>
                      <span className="font-mono">{indicator.value.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Strength:</span>
                      <span>{indicator.strength.toFixed(1)}%</span>
                    </div>
                    <Progress value={indicator.strength} className="h-2" />
                    <p className="text-xs text-gray-600 mt-2">{indicator.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {indicators.length === 0 && !isCalculating && (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No technical indicators calculated</p>
              <p className="text-sm">Click Recalculate to analyze technical signals</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
