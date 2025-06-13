
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Settings, TrendingUp, Shield, Target } from 'lucide-react';

interface StrategyConfig {
  name: string;
  type: 'intraday' | 'swing' | 'scalping' | 'options';
  targetProfit: number;
  stopLoss: number;
  maxPositions: number;
  riskPerTrade: number;
  useTA: boolean;
  useSentiment: boolean;
  timeframe: string;
}

export const TradingStrategy = () => {
  const [strategy, setStrategy] = useState<StrategyConfig>({
    name: 'Conservative Growth',
    type: 'intraday',
    targetProfit: 2.0,
    stopLoss: 1.0,
    maxPositions: 3,
    riskPerTrade: 1.0,
    useTA: true,
    useSentiment: true,
    timeframe: '5m'
  });

  const [isActive, setIsActive] = useState(false);

  const handleStrategyChange = (field: keyof StrategyConfig, value: any) => {
    setStrategy(prev => ({ ...prev, [field]: value }));
  };

  const predefinedStrategies = [
    {
      name: 'Conservative Growth',
      type: 'intraday' as const,
      targetProfit: 2.0,
      stopLoss: 1.0,
      maxPositions: 3,
      riskPerTrade: 1.0,
      useTA: true,
      useSentiment: true,
      timeframe: '5m'
    },
    {
      name: 'Aggressive Scalping',
      type: 'scalping' as const,
      targetProfit: 0.5,
      stopLoss: 0.3,
      maxPositions: 5,
      riskPerTrade: 2.0,
      useTA: true,
      useSentiment: false,
      timeframe: '1m'
    },
    {
      name: 'Options Strategy',
      type: 'options' as const,
      targetProfit: 5.0,
      stopLoss: 3.0,
      maxPositions: 2,
      riskPerTrade: 3.0,
      useTA: true,
      useSentiment: true,
      timeframe: '15m'
    }
  ];

  const activateStrategy = () => {
    setIsActive(true);
    console.log('Strategy activated:', strategy);
  };

  const deactivateStrategy = () => {
    setIsActive(false);
    console.log('Strategy deactivated');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Trading Strategy Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Strategy Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="font-medium">Strategy Status</span>
              <Badge variant={isActive ? 'default' : 'secondary'}>
                {isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={activateStrategy} 
                disabled={isActive}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                Activate
              </Button>
              <Button 
                onClick={deactivateStrategy} 
                disabled={!isActive}
                variant="outline"
                size="sm"
              >
                Deactivate
              </Button>
            </div>
          </div>

          {/* Predefined Strategies */}
          <div>
            <Label className="text-base font-medium mb-3 block">Quick Setup</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {predefinedStrategies.map((preset, index) => (
                <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setStrategy(preset)}>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">{preset.name}</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>Type: {preset.type}</div>
                      <div>Target: {preset.targetProfit}%</div>
                      <div>Stop Loss: {preset.stopLoss}%</div>
                      <div>Risk: {preset.riskPerTrade}%</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Custom Strategy Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="strategyName">Strategy Name</Label>
                <Input
                  id="strategyName"
                  value={strategy.name}
                  onChange={(e) => handleStrategyChange('name', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="strategyType">Trading Type</Label>
                <Select value={strategy.type} onValueChange={(value) => handleStrategyChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="intraday">Intraday</SelectItem>
                    <SelectItem value="swing">Swing Trading</SelectItem>
                    <SelectItem value="scalping">Scalping</SelectItem>
                    <SelectItem value="options">Options</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="timeframe">Timeframe</Label>
                <Select value={strategy.timeframe} onValueChange={(value) => handleStrategyChange('timeframe', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1m">1 Minute</SelectItem>
                    <SelectItem value="5m">5 Minutes</SelectItem>
                    <SelectItem value="15m">15 Minutes</SelectItem>
                    <SelectItem value="1h">1 Hour</SelectItem>
                    <SelectItem value="1d">1 Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetProfit">Target Profit (%)</Label>
                  <Input
                    id="targetProfit"
                    type="number"
                    step="0.1"
                    value={strategy.targetProfit}
                    onChange={(e) => handleStrategyChange('targetProfit', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="stopLoss">Stop Loss (%)</Label>
                  <Input
                    id="stopLoss"
                    type="number"
                    step="0.1"
                    value={strategy.stopLoss}
                    onChange={(e) => handleStrategyChange('stopLoss', parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxPositions">Max Positions</Label>
                  <Input
                    id="maxPositions"
                    type="number"
                    value={strategy.maxPositions}
                    onChange={(e) => handleStrategyChange('maxPositions', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="riskPerTrade">Risk per Trade (%)</Label>
                  <Input
                    id="riskPerTrade"
                    type="number"
                    step="0.1"
                    value={strategy.riskPerTrade}
                    onChange={(e) => handleStrategyChange('riskPerTrade', parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="useTA">Use Technical Analysis</Label>
                  <Switch
                    id="useTA"
                    checked={strategy.useTA}
                    onCheckedChange={(checked) => handleStrategyChange('useTA', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="useSentiment">Use Sentiment Analysis</Label>
                  <Switch
                    id="useSentiment"
                    checked={strategy.useSentiment}
                    onCheckedChange={(checked) => handleStrategyChange('useSentiment', checked)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Strategy Summary */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Strategy Summary
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Daily Target:</span>
                  <div className="font-medium text-green-600">{strategy.targetProfit}%</div>
                </div>
                <div>
                  <span className="text-gray-600">Max Risk:</span>
                  <div className="font-medium text-red-600">{strategy.stopLoss}%</div>
                </div>
                <div>
                  <span className="text-gray-600">Risk/Reward:</span>
                  <div className="font-medium">1:{(strategy.targetProfit / strategy.stopLoss).toFixed(1)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Max Exposure:</span>
                  <div className="font-medium">{(strategy.maxPositions * strategy.riskPerTrade).toFixed(1)}%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};
