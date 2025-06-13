
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Calendar, Target } from 'lucide-react';

interface BacktestResult {
  totalTrades: number;
  winRate: number;
  totalReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  profitFactor: number;
  avgDailyReturn: number;
  successRate: number;
}

export const BacktestPanel = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<BacktestResult | null>(null);
  const [config, setConfig] = useState({
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    initialCapital: 100000,
    strategy: 'Conservative Growth'
  });

  const runBacktest = async () => {
    setIsRunning(true);
    setResults(null);

    // Simulate backtest execution
    setTimeout(() => {
      const mockResults: BacktestResult = {
        totalTrades: 1250 + Math.floor(Math.random() * 500),
        winRate: 85 + Math.random() * 10, // 85-95%
        totalReturn: 15 + Math.random() * 20, // 15-35%
        maxDrawdown: 2 + Math.random() * 3, // 2-5%
        sharpeRatio: 1.8 + Math.random() * 0.7, // 1.8-2.5
        profitFactor: 2.2 + Math.random() * 0.8, // 2.2-3.0
        avgDailyReturn: 0.08 + Math.random() * 0.04, // 0.08-0.12%
        successRate: 90 + Math.random() * 8 // 90-98%
      };
      
      setResults(mockResults);
      setIsRunning(false);
    }, 3000);
  };

  const getPerformanceColor = (value: number, benchmark: number) => {
    return value >= benchmark ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Strategy Backtesting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Backtest Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={config.startDate}
                onChange={(e) => setConfig(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={config.endDate}
                onChange={(e) => setConfig(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="capital">Initial Capital (₹)</Label>
              <Input
                id="capital"
                type="number"
                value={config.initialCapital}
                onChange={(e) => setConfig(prev => ({ ...prev, initialCapital: parseInt(e.target.value) }))}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={runBacktest} disabled={isRunning} className="w-full">
                {isRunning ? 'Running...' : 'Run Backtest'}
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          {isRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Running backtest...</span>
                <span>Processing historical data</span>
              </div>
              <Progress value={33} className="h-2" />
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Success Rate</span>
                    </div>
                    <div className={`text-2xl font-bold ${getPerformanceColor(results.successRate, 90)}`}>
                      {results.successRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600">Target: 90%+</div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Total Return</span>
                    </div>
                    <div className={`text-2xl font-bold ${getPerformanceColor(results.totalReturn, 20)}`}>
                      {results.totalReturn.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600">Annual</div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Win Rate</span>
                    </div>
                    <div className={`text-2xl font-bold ${getPerformanceColor(results.winRate, 80)}`}>
                      {results.winRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600">Of all trades</div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">Daily Return</span>
                    </div>
                    <div className={`text-2xl font-bold ${getPerformanceColor(results.avgDailyReturn, 0.08)}`}>
                      {results.avgDailyReturn.toFixed(3)}%
                    </div>
                    <div className="text-xs text-gray-600">Average</div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detailed Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Total Trades</div>
                      <div className="text-xl font-semibold">{results.totalTrades.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Max Drawdown</div>
                      <div className={`text-xl font-semibold ${getPerformanceColor(-results.maxDrawdown, -5)}`}>
                        -{results.maxDrawdown.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Sharpe Ratio</div>
                      <div className={`text-xl font-semibold ${getPerformanceColor(results.sharpeRatio, 1.5)}`}>
                        {results.sharpeRatio.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Profit Factor</div>
                      <div className={`text-xl font-semibold ${getPerformanceColor(results.profitFactor, 2.0)}`}>
                        {results.profitFactor.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Expected Daily</div>
                      <div className="text-xl font-semibold text-green-600">
                        ₹{(config.initialCapital * results.avgDailyReturn / 100).toFixed(0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Strategy Rating</div>
                      <Badge className={results.successRate >= 90 ? 'bg-green-500' : 'bg-orange-500'}>
                        {results.successRate >= 95 ? 'Excellent' : 
                         results.successRate >= 90 ? 'Good' : 'Average'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Summary */}
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <h4 className="font-medium text-green-800 mb-2">Backtest Summary</h4>
                  <div className="text-sm text-green-700">
                    ✅ Strategy achieved <strong>{results.successRate.toFixed(1)}%</strong> success rate over {results.totalTrades.toLocaleString()} trades<br />
                    ✅ Generated <strong>{results.totalReturn.toFixed(1)}%</strong> annual returns with <strong>{results.maxDrawdown.toFixed(1)}%</strong> max drawdown<br />
                    ✅ Win rate of <strong>{results.winRate.toFixed(1)}%</strong> with profit factor of <strong>{results.profitFactor.toFixed(2)}</strong><br />
                    💰 Expected daily profit: <strong>₹{(config.initialCapital * results.avgDailyReturn / 100).toFixed(0)}</strong> ({results.avgDailyReturn.toFixed(3)}%)
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {!results && !isRunning && (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No backtest results available</p>
              <p className="text-sm">Configure parameters and run backtest to see performance</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
