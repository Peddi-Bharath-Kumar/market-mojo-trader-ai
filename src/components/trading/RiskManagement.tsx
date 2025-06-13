
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, TrendingDown, DollarSign } from 'lucide-react';

interface RiskMetrics {
  portfolioValue: number;
  dailyPnL: number;
  dailyPnLPercent: number;
  maxRisk: number;
  currentRisk: number;
  openPositions: number;
  maxPositions: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export const RiskManagement = () => {
  const [riskMetrics] = useState<RiskMetrics>({
    portfolioValue: 100000,
    dailyPnL: 1250,
    dailyPnLPercent: 1.25,
    maxRisk: 5000, // Max risk per day (5% of portfolio)
    currentRisk: 1800,
    openPositions: 3,
    maxPositions: 5,
    riskLevel: 'low'
  });

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const riskPercentage = (riskMetrics.currentRisk / riskMetrics.maxRisk) * 100;
  const positionUtilization = (riskMetrics.openPositions / riskMetrics.maxPositions) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Risk Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Risk Level Indicator */}
        <div className={`p-4 rounded-lg border ${getRiskColor(riskMetrics.riskLevel)}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span className="font-medium">Current Risk Level</span>
            </div>
            <Badge className={`${getRiskColor(riskMetrics.riskLevel)} border-0`}>
              {riskMetrics.riskLevel.toUpperCase()}
            </Badge>
          </div>
          <div className="text-sm">
            Risk exposure is within acceptable limits for the current strategy
          </div>
        </div>

        {/* Key Risk Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Portfolio Value</span>
              </div>
              <div className="text-2xl font-bold">₹{riskMetrics.portfolioValue.toLocaleString()}</div>
              <div className={`text-sm ${riskMetrics.dailyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {riskMetrics.dailyPnL >= 0 ? '+' : ''}₹{riskMetrics.dailyPnL.toLocaleString()} ({riskMetrics.dailyPnLPercent.toFixed(2)}%)
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Daily Risk</span>
              </div>
              <div className="text-2xl font-bold">₹{riskMetrics.currentRisk.toLocaleString()}</div>
              <div className="text-sm text-gray-600">
                of ₹{riskMetrics.maxRisk.toLocaleString()} max
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Risk Utilization */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Risk Utilization</span>
              <span>{riskPercentage.toFixed(1)}% of maximum</span>
            </div>
            <Progress value={riskPercentage} className="h-3" />
            <div className="text-xs text-gray-600 mt-1">
              ₹{riskMetrics.currentRisk.toLocaleString()} / ₹{riskMetrics.maxRisk.toLocaleString()}
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Position Utilization</span>
              <span>{riskMetrics.openPositions} of {riskMetrics.maxPositions} positions</span>
            </div>
            <Progress value={positionUtilization} className="h-3" />
            <div className="text-xs text-gray-600 mt-1">
              {positionUtilization.toFixed(1)}% capacity used
            </div>
          </div>
        </div>

        {/* Risk Alerts */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Risk Alerts & Limits</h4>
          <div className="space-y-2">
            {riskPercentage > 80 && (
              <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                <AlertTriangle className="h-4 w-4" />
                High risk utilization - Consider reducing position sizes
              </div>
            )}
            {riskPercentage > 60 && riskPercentage <= 80 && (
              <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
                <AlertTriangle className="h-4 w-4" />
                Moderate risk - Monitor positions closely
              </div>
            )}
            {riskPercentage <= 60 && (
              <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                <Shield className="h-4 w-4" />
                Risk levels are within safe limits
              </div>
            )}
          </div>
        </div>

        {/* Stop Loss & Targets */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Automatic Risk Controls</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Daily Loss Limit:</span>
                <div className="font-medium text-red-600">-2.0% (₹2,000)</div>
              </div>
              <div>
                <span className="text-gray-600">Daily Profit Target:</span>
                <div className="font-medium text-green-600">+2.0% (₹2,000)</div>
              </div>
              <div>
                <span className="text-gray-600">Max Drawdown:</span>
                <div className="font-medium">-5.0% (₹5,000)</div>
              </div>
              <div>
                <span className="text-gray-600">Position Size:</span>
                <div className="font-medium">1.0% per trade</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};
