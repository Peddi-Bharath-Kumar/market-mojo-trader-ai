
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingUp, TrendingDown, Target, Clock } from 'lucide-react';
import { optionsCalculator, type GreeksInput, type GreeksOutput } from '@/utils/OptionsGreeks';

export const OptionsGreeksPanel = () => {
  const [inputs, setInputs] = useState<GreeksInput>({
    spotPrice: 18000,
    strikePrice: 18000,
    timeToExpiry: 0.0274, // 10 days
    riskFreeRate: 0.06,
    volatility: 0.20,
    optionType: 'call'
  });

  const [greeks, setGreeks] = useState<GreeksOutput | null>(null);
  const [portfolioGreeks, setPortfolioGreeks] = useState<GreeksOutput | null>(null);

  // Sample portfolio positions for demonstration
  const [portfolioPositions] = useState([
    { symbol: 'NIFTY 18000 CE', quantity: 100, greeks: { delta: 0.5, gamma: 0.001, theta: -5, vega: 15, rho: 8, price: 120 } },
    { symbol: 'NIFTY 18000 PE', quantity: -50, greeks: { delta: -0.5, gamma: 0.001, theta: -5, vega: 15, rho: -8, price: 110 } },
    { symbol: 'NIFTY 17800 CE', quantity: 200, greeks: { delta: 0.7, gamma: 0.0008, theta: -3, vega: 12, rho: 10, price: 180 } }
  ]);

  useEffect(() => {
    calculateGreeks();
    calculatePortfolioGreeks();
  }, [inputs]);

  const calculateGreeks = () => {
    try {
      const result = optionsCalculator.calculateGreeks(inputs);
      setGreeks(result);
    } catch (error) {
      console.error('Error calculating Greeks:', error);
    }
  };

  const calculatePortfolioGreeks = () => {
    try {
      const result = optionsCalculator.calculatePortfolioGreeks(portfolioPositions);
      setPortfolioGreeks(result);
    } catch (error) {
      console.error('Error calculating portfolio Greeks:', error);
    }
  };

  const handleInputChange = (field: keyof GreeksInput, value: string | number) => {
    setInputs(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? parseFloat(value) || 0 : value
    }));
  };

  const getGreekColor = (greek: string, value: number) => {
    switch (greek) {
      case 'delta':
        return value > 0 ? 'text-green-600' : 'text-red-600';
      case 'gamma':
        return 'text-blue-600';
      case 'theta':
        return value < 0 ? 'text-red-600' : 'text-green-600';
      case 'vega':
        return 'text-purple-600';
      case 'rho':
        return value > 0 ? 'text-green-600' : 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Options Greeks Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Options Greeks Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="spotPrice">Spot Price (₹)</Label>
              <Input
                id="spotPrice"
                type="number"
                value={inputs.spotPrice}
                onChange={(e) => handleInputChange('spotPrice', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="strikePrice">Strike Price (₹)</Label>
              <Input
                id="strikePrice"
                type="number"
                value={inputs.strikePrice}
                onChange={(e) => handleInputChange('strikePrice', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="optionType">Option Type</Label>
              <Select value={inputs.optionType} onValueChange={(value: 'call' | 'put') => handleInputChange('optionType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="put">Put</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="timeToExpiry">Time to Expiry (days)</Label>
              <Input
                id="timeToExpiry"
                type="number"
                value={Math.round(inputs.timeToExpiry * 365)}
                onChange={(e) => handleInputChange('timeToExpiry', parseFloat(e.target.value) / 365)}
              />
            </div>

            <div>
              <Label htmlFor="volatility">Implied Volatility (%)</Label>
              <Input
                id="volatility"
                type="number"
                step="0.01"
                value={inputs.volatility * 100}
                onChange={(e) => handleInputChange('volatility', parseFloat(e.target.value) / 100)}
              />
            </div>

            <div>
              <Label htmlFor="riskFreeRate">Risk-Free Rate (%)</Label>
              <Input
                id="riskFreeRate"
                type="number"
                step="0.01"
                value={inputs.riskFreeRate * 100}
                onChange={(e) => handleInputChange('riskFreeRate', parseFloat(e.target.value) / 100)}
              />
            </div>
          </div>

          {/* Greeks Display */}
          {greeks && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Option Price</span>
                  </div>
                  <div className="text-2xl font-bold">₹{greeks.price}</div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Delta</span>
                  </div>
                  <div className={`text-2xl font-bold ${getGreekColor('delta', greeks.delta)}`}>
                    {greeks.delta}
                  </div>
                  <div className="text-xs text-gray-600">Price sensitivity</div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Gamma</span>
                  </div>
                  <div className={`text-2xl font-bold ${getGreekColor('gamma', greeks.gamma)}`}>
                    {greeks.gamma}
                  </div>
                  <div className="text-xs text-gray-600">Delta sensitivity</div>
                </CardContent>
              </Card>

              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-red-600" />
                    <span className="font-medium">Theta</span>
                  </div>
                  <div className={`text-2xl font-bold ${getGreekColor('theta', greeks.theta)}`}>
                    {greeks.theta}
                  </div>
                  <div className="text-xs text-gray-600">Time decay</div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">Vega</span>
                  </div>
                  <div className={`text-2xl font-bold ${getGreekColor('vega', greeks.vega)}`}>
                    {greeks.vega}
                  </div>
                  <div className="text-xs text-gray-600">Volatility sensitivity</div>
                </CardContent>
              </Card>

              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">Rho</span>
                  </div>
                  <div className={`text-2xl font-bold ${getGreekColor('rho', greeks.rho)}`}>
                    {greeks.rho}
                  </div>
                  <div className="text-xs text-gray-600">Interest rate sensitivity</div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Portfolio Greeks */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Greeks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {portfolioGreeks && (
                <>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Portfolio Delta</div>
                    <div className={`text-xl font-bold ${getGreekColor('delta', portfolioGreeks.delta)}`}>
                      {portfolioGreeks.delta}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Portfolio Gamma</div>
                    <div className={`text-xl font-bold ${getGreekColor('gamma', portfolioGreeks.gamma)}`}>
                      {portfolioGreeks.gamma}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Portfolio Theta</div>
                    <div className={`text-xl font-bold ${getGreekColor('theta', portfolioGreeks.theta)}`}>
                      {portfolioGreeks.theta}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Portfolio Vega</div>
                    <div className={`text-xl font-bold ${getGreekColor('vega', portfolioGreeks.vega)}`}>
                      {portfolioGreeks.vega}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Portfolio Value</div>
                    <div className="text-xl font-bold">₹{portfolioGreeks.price.toLocaleString()}</div>
                  </div>
                </>
              )}
            </div>

            {/* Portfolio Positions */}
            <div className="space-y-2">
              <h4 className="font-medium">Current Positions</h4>
              {portfolioPositions.map((position, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{position.symbol}</div>
                    <div className="text-sm text-gray-600">Qty: {position.quantity}</div>
                  </div>
                  <div className="grid grid-cols-5 gap-4 text-sm">
                    <div>Δ: {position.greeks.delta}</div>
                    <div>Γ: {position.greeks.gamma}</div>
                    <div>Θ: {position.greeks.theta}</div>
                    <div>ν: {position.greeks.vega}</div>
                    <div>ρ: {position.greeks.rho}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">₹{position.greeks.price}</div>
                    <div className="text-sm text-gray-600">
                      Value: ₹{(position.quantity * position.greeks.price).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
