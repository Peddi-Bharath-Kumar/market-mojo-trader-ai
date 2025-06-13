
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Target, Activity } from 'lucide-react';

interface PerformanceData {
  dailyPnL: number;
  dailyPnLPercent: number;
  totalTrades: number;
  winningTrades: number;
  winRate: number;
  avgProfit: number;
  maxProfit: number;
  maxLoss: number;
  currentStreak: number;
  streakType: 'winning' | 'losing';
}

interface PerformanceMonitorProps {
  isTrading: boolean;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ isTrading }) => {
  const [performance, setPerformance] = useState<PerformanceData>({
    dailyPnL: 0,
    dailyPnLPercent: 0,
    totalTrades: 0,
    winningTrades: 0,
    winRate: 0,
    avgProfit: 0,
    maxProfit: 0,
    maxLoss: 0,
    currentStreak: 0,
    streakType: 'winning'
  });

  // Simulate real-time performance updates
  useEffect(() => {
    if (isTrading) {
      const interval = setInterval(() => {
        setPerformance(prev => {
          const newTrade = Math.random() > 0.15; // 85% win rate
          const profitAmount = newTrade 
            ? 50 + Math.random() * 200 
            : -(30 + Math.random() * 100);

          const newTotalTrades = prev.totalTrades + 1;
          const newWinningTrades = prev.winningTrades + (newTrade ? 1 : 0);
          const newDailyPnL = prev.dailyPnL + profitAmount;

          return {
            ...prev,
            dailyPnL: newDailyPnL,
            dailyPnLPercent: (newDailyPnL / 100000) * 100,
            totalTrades: newTotalTrades,
            winningTrades: newWinningTrades,
            winRate: (newWinningTrades / newTotalTrades) * 100,
            avgProfit: newDailyPnL / newTotalTrades,
            maxProfit: Math.max(prev.maxProfit, profitAmount),
            maxLoss: Math.min(prev.maxLoss, profitAmount),
            currentStreak: newTrade && prev.streakType === 'winning' 
              ? prev.currentStreak + 1 
              : !newTrade && prev.streakType === 'losing'
              ? prev.currentStreak + 1
              : 1,
            streakType: newTrade ? 'winning' : 'losing'
          };
        });
      }, 8000 + Math.random() * 12000); // Random interval between 8-20 seconds

      return () => clearInterval(interval);
    }
  }, [isTrading]);

  const targetDaily = 2000; // ₹2000 daily target
  const progressToTarget = Math.min((performance.dailyPnL / targetDaily) * 100, 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Live Performance
          {isTrading && <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Daily P&L */}
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-1">Today's P&L</div>
          <div className={`text-3xl font-bold ${performance.dailyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {performance.dailyPnL >= 0 ? '+' : ''}₹{performance.dailyPnL.toFixed(0)}
          </div>
          <div className={`text-sm ${performance.dailyPnLPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ({performance.dailyPnLPercent >= 0 ? '+' : ''}{performance.dailyPnLPercent.toFixed(3)}%)
          </div>
          
          {/* Progress to Target */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progress to Daily Target</span>
              <span>{progressToTarget.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  progressToTarget >= 100 ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(progressToTarget, 100)}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Target: ₹{targetDaily.toLocaleString()} (2.0%)
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-gray-600">Total Trades</div>
            <div className="text-xl font-bold">{performance.totalTrades}</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-sm text-gray-600">Win Rate</div>
            <div className="text-xl font-bold text-green-600">
              {performance.totalTrades > 0 ? performance.winRate.toFixed(1) : 0}%
            </div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-sm text-gray-600">Avg Profit</div>
            <div className="text-xl font-bold">
              ₹{performance.totalTrades > 0 ? performance.avgProfit.toFixed(0) : 0}
            </div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-sm text-gray-600">Current Streak</div>
            <div className="flex items-center justify-center gap-1">
              <span className="text-xl font-bold">{performance.currentStreak}</span>
              {performance.streakType === 'winning' ? 
                <TrendingUp className="h-4 w-4 text-green-600" /> : 
                <TrendingDown className="h-4 w-4 text-red-600" />
              }
            </div>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Best Trade:</span>
            <span className="font-medium text-green-600">+₹{performance.maxProfit.toFixed(0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Worst Trade:</span>
            <span className="font-medium text-red-600">₹{performance.maxLoss.toFixed(0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Winning Trades:</span>
            <span className="font-medium">{performance.winningTrades} of {performance.totalTrades}</span>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex gap-2 flex-wrap">
          {performance.dailyPnL >= targetDaily && (
            <Badge className="bg-green-500 text-white">
              <Target className="h-3 w-3 mr-1" />
              Target Achieved
            </Badge>
          )}
          {performance.winRate >= 85 && performance.totalTrades >= 5 && (
            <Badge className="bg-blue-500 text-white">
              High Win Rate
            </Badge>
          )}
          {performance.currentStreak >= 5 && performance.streakType === 'winning' && (
            <Badge className="bg-purple-500 text-white">
              Hot Streak
            </Badge>
          )}
          {!isTrading && (
            <Badge variant="secondary">
              Trading Inactive
            </Badge>
          )}
        </div>

        {!isTrading && performance.totalTrades === 0 && (
          <div className="text-center py-4 text-gray-500">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Start trading to see live performance</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
