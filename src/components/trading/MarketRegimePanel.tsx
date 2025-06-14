
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, BarChart, Activity, Target } from 'lucide-react';

interface MarketRegimeData {
  regime: 'trending_bull' | 'trending_bear' | 'sideways_low_vol' | 'sideways_high_vol' | 'volatile_uncertain';
  strength: number;
  hurstExponent: number;
  volatilityLevel: 'low' | 'medium' | 'high';
  allocation: {
    conservative: number;
    moderate: number;
    aggressive: number;
  };
  recommendedStrategies: string[];
}

export const MarketRegimePanel = () => {
  const [regimeData, setRegimeData] = useState<MarketRegimeData>({
    regime: 'sideways_low_vol',
    strength: 75,
    hurstExponent: 0.45,
    volatilityLevel: 'low',
    allocation: { conservative: 80, moderate: 15, aggressive: 5 },
    recommendedStrategies: ['Iron Condor', 'Covered Calls', 'Cash Secured Puts']
  });

  useEffect(() => {
    // Simulate regime detection updates
    const interval = setInterval(() => {
      const regimes: MarketRegimeData['regime'][] = [
        'trending_bull', 'trending_bear', 'sideways_low_vol', 'sideways_high_vol', 'volatile_uncertain'
      ];
      
      const randomRegime = regimes[Math.floor(Math.random() * regimes.length)];
      
      const mockData: MarketRegimeData = {
        regime: randomRegime,
        strength: 60 + Math.random() * 35,
        hurstExponent: 0.3 + Math.random() * 0.4,
        volatilityLevel: Math.random() > 0.6 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low',
        allocation: getAllocationForRegime(randomRegime),
        recommendedStrategies: getStrategiesForRegime(randomRegime)
      };

      setRegimeData(mockData);
    }, 15000); // Update every 15 seconds

    return () => clearInterval(interval);
  }, []);

  const getAllocationForRegime = (regime: MarketRegimeData['regime']) => {
    switch (regime) {
      case 'trending_bull':
        return { conservative: 40, moderate: 40, aggressive: 20 };
      case 'trending_bear':
        return { conservative: 45, moderate: 35, aggressive: 20 };
      case 'sideways_low_vol':
        return { conservative: 80, moderate: 15, aggressive: 5 };
      case 'sideways_high_vol':
        return { conservative: 70, moderate: 20, aggressive: 10 };
      default:
        return { conservative: 60, moderate: 30, aggressive: 10 };
    }
  };

  const getStrategiesForRegime = (regime: MarketRegimeData['regime']): string[] => {
    switch (regime) {
      case 'trending_bull':
        return ['Momentum Trades', 'Bull Call Spreads', 'Covered Calls'];
      case 'trending_bear':
        return ['Short Momentum', 'Bear Put Spreads', 'Protective Puts'];
      case 'sideways_low_vol':
        return ['Iron Condor', 'Iron Butterfly', 'Covered Calls'];
      case 'sideways_high_vol':
        return ['Short Straddle', 'Iron Condor', 'Calendar Spreads'];
      default:
        return ['Conservative Trades', 'Cash Positions', 'Defensive Strategies'];
    }
  };

  const getRegimeIcon = (regime: string) => {
    if (regime.includes('bull')) return <TrendingUp className="h-5 w-5 text-green-600" />;
    if (regime.includes('bear')) return <TrendingDown className="h-5 w-5 text-red-600" />;
    if (regime.includes('sideways')) return <Minus className="h-5 w-5 text-blue-600" />;
    return <Activity className="h-5 w-5 text-gray-600" />;
  };

  const getRegimeColor = (regime: string) => {
    if (regime.includes('bull')) return 'bg-green-500 text-white';
    if (regime.includes('bear')) return 'bg-red-500 text-white';
    if (regime.includes('sideways')) return 'bg-blue-500 text-white';
    return 'bg-gray-500 text-white';
  };

  const formatRegimeName = (regime: string) => {
    return regime.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart className="h-5 w-5" />
          Market Regime Detection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Regime */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            {getRegimeIcon(regimeData.regime)}
            <Badge className={`${getRegimeColor(regimeData.regime)} text-lg px-4 py-2`}>
              {formatRegimeName(regimeData.regime)}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Regime Strength:</span>
              <div className="font-bold text-lg">{regimeData.strength.toFixed(1)}%</div>
              <Progress value={regimeData.strength} className="h-2 mt-1" />
            </div>
            <div>
              <span className="text-gray-600">Hurst Exponent:</span>
              <div className="font-bold text-lg">{regimeData.hurstExponent.toFixed(3)}</div>
              <div className="text-xs text-gray-500">
                {regimeData.hurstExponent > 0.5 ? 'Trending' : 'Mean Reverting'}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Allocation */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Target className="h-4 w-4" />
            Dynamic Allocation
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Conservative</span>
              <span className="font-medium">{regimeData.allocation.conservative}%</span>
            </div>
            <Progress value={regimeData.allocation.conservative} className="h-2" />
            
            <div className="flex justify-between items-center">
              <span className="text-sm">Moderate</span>
              <span className="font-medium">{regimeData.allocation.moderate}%</span>
            </div>
            <Progress value={regimeData.allocation.moderate} className="h-2" />
            
            <div className="flex justify-between items-center">
              <span className="text-sm">Aggressive</span>
              <span className="font-medium">{regimeData.allocation.aggressive}%</span>
            </div>
            <Progress value={regimeData.allocation.aggressive} className="h-2" />
          </div>
        </div>

        {/* Recommended Strategies */}
        <div className="space-y-3">
          <h4 className="font-semibold">Recommended Strategies</h4>
          <div className="flex flex-wrap gap-2">
            {regimeData.recommendedStrategies.map((strategy, index) => (
              <Badge key={index} variant="outline" className="bg-blue-50">
                {strategy}
              </Badge>
            ))}
          </div>
        </div>

        {/* Volatility Info */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Volatility Regime:</span>
            <Badge variant={
              regimeData.volatilityLevel === 'high' ? 'destructive' : 
              regimeData.volatilityLevel === 'medium' ? 'default' : 'secondary'
            }>
              {regimeData.volatilityLevel.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Regime Insights */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold mb-2">💡 Regime Insights:</h4>
          <div className="text-sm space-y-1">
            {regimeData.regime === 'trending_bull' && (
              <>
                <div>• Strong upward momentum detected</div>
                <div>• Favor momentum and breakout strategies</div>
                <div>• Increase position sizes moderately</div>
              </>
            )}
            {regimeData.regime === 'sideways_low_vol' && (
              <>
                <div>• Range-bound market with low volatility</div>
                <div>• Perfect for premium selling strategies</div>
                <div>• Iron Condors have high success probability</div>
              </>
            )}
            {regimeData.regime === 'volatile_uncertain' && (
              <>
                <div>• High uncertainty in market direction</div>
                <div>• Reduce position sizes and risk</div>
                <div>• Focus on defensive strategies</div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
