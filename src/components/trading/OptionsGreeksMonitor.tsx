
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  Zap, 
  Activity,
  AlertTriangle,
  Shield,
  Brain,
  Eye
} from 'lucide-react';
import { optionsGreeksEngine, type OptionsGreeksData, type PortfolioGreeksRisk } from '@/services/OptionsGreeksEngine';

export const OptionsGreeksMonitor = () => {
  const [optionsData, setOptionsData] = useState<OptionsGreeksData[]>([]);
  const [portfolioRisk, setPortfolioRisk] = useState<PortfolioGreeksRisk | null>(null);
  const [highRiskOptions, setHighRiskOptions] = useState<OptionsGreeksData[]>([]);
  const [tradingOpportunities, setTradingOpportunities] = useState<OptionsGreeksData[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setOptionsData(optionsGreeksEngine.getOptionsData());
      setPortfolioRisk(optionsGreeksEngine.getPortfolioRisk());
      setHighRiskOptions(optionsGreeksEngine.getHighRiskOptions());
      setTradingOpportunities(optionsGreeksEngine.getTradingOpportunities());
    }, 10000);

    // Initial load
    setOptionsData(optionsGreeksEngine.getOptionsData());
    setPortfolioRisk(optionsGreeksEngine.getPortfolioRisk());
    setHighRiskOptions(optionsGreeksEngine.getHighRiskOptions());
    setTradingOpportunities(optionsGreeksEngine.getTradingOpportunities());

    return () => clearInterval(interval);
  }, []);

  const getGreekColor = (greek: string, value: number) => {
    switch (greek) {
      case 'delta':
        return Math.abs(value) > 0.7 ? 'text-red-600' : Math.abs(value) > 0.3 ? 'text-yellow-600' : 'text-green-600';
      case 'gamma':
        return Math.abs(value) > 0.05 ? 'text-red-600' : Math.abs(value) > 0.02 ? 'text-yellow-600' : 'text-green-600';
      case 'theta':
        return value < -15 ? 'text-red-600' : value < -5 ? 'text-yellow-600' : 'text-green-600';
      case 'vega':
        return Math.abs(value) > 25 ? 'text-red-600' : Math.abs(value) > 15 ? 'text-yellow-600' : 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'extreme': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      default: return 'bg-green-500 text-white';
    }
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'strong_buy': return 'bg-green-600 text-white';
      case 'buy': return 'bg-green-500 text-white';
      case 'hold': return 'bg-gray-500 text-white';
      case 'sell': return 'bg-red-500 text-white';
      case 'strong_sell': return 'bg-red-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Risk Overview */}
      {portfolioRisk && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              Portfolio Greeks Risk Monitor
              <Badge className={`${portfolioRisk.riskScore > 75 ? 'bg-red-500' : portfolioRisk.riskScore > 50 ? 'bg-yellow-500' : 'bg-green-500'} text-white`}>
                Risk: {portfolioRisk.riskScore}/100
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <div className="text-center">
                <div className="text-sm text-gray-600">Net Delta</div>
                <div className={`text-lg font-bold ${getGreekColor('delta', portfolioRisk.totalDelta)}`}>
                  {portfolioRisk.totalDelta.toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Net Gamma</div>
                <div className={`text-lg font-bold ${getGreekColor('gamma', portfolioRisk.totalGamma)}`}>
                  {portfolioRisk.totalGamma.toFixed(4)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Net Theta</div>
                <div className={`text-lg font-bold ${getGreekColor('theta', portfolioRisk.totalTheta)}`}>
                  {portfolioRisk.totalTheta.toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Net Vega</div>
                <div className={`text-lg font-bold ${getGreekColor('vega', portfolioRisk.totalVega)}`}>
                  {portfolioRisk.totalVega.toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Portfolio Value</div>
                <div className="text-lg font-bold">₹{portfolioRisk.portfolioValue.toLocaleString()}</div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Risk Score</span>
                  <span>{portfolioRisk.riskScore}/100</span>
                </div>
                <Progress value={portfolioRisk.riskScore} className="h-2" />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4" />
                  <span className="font-medium">Gamma Exposure</span>
                  <Badge className={getRiskBadgeColor(portfolioRisk.gammaExposure)}>
                    {portfolioRisk.gammaExposure.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  Max Drawdown Risk: ₹{portfolioRisk.maxDrawdownRisk.toLocaleString()}
                </div>
              </div>

              {portfolioRisk.hedgingRecommendations.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      {portfolioRisk.hedgingRecommendations.map((rec, index) => (
                        <div key={index} className="text-sm">• {rec}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="monitor" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="monitor">Real-time Monitor</TabsTrigger>
          <TabsTrigger value="opportunities">Trading Opportunities</TabsTrigger>
          <TabsTrigger value="risks">High Risk Alerts</TabsTrigger>
          <TabsTrigger value="analysis">Greeks Analysis</TabsTrigger>
        </TabsList>

        {/* Real-time Greeks Monitor */}
        <TabsContent value="monitor">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Live Options Greeks Monitor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {optionsData.slice(0, 10).map((option, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded ${option.optionType === 'call' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {option.optionType === 'call' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="font-medium">{option.symbol}</div>
                          <div className="text-sm text-gray-600">
                            Strike: ₹{option.strikePrice} | Spot: ₹{option.spotPrice.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">₹{option.lastPrice.toFixed(2)}</div>
                        <Badge className={getRiskBadgeColor(option.riskLevel)}>
                          {option.riskLevel}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Delta:</span>
                        <div className={`font-medium ${getGreekColor('delta', option.greeks.delta)}`}>
                          {option.greeks.delta.toFixed(4)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Gamma:</span>
                        <div className={`font-medium ${getGreekColor('gamma', option.greeks.gamma)}`}>
                          {option.greeks.gamma.toFixed(4)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Theta:</span>
                        <div className={`font-medium ${getGreekColor('theta', option.greeks.theta)}`}>
                          {option.greeks.theta.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Vega:</span>
                        <div className={`font-medium ${getGreekColor('vega', option.greeks.vega)}`}>
                          {option.greeks.vega.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">IV:</span>
                        <div className="font-medium">
                          {(option.impliedVolatility * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-sm">
                      <div className="text-gray-600">
                        Volume: {option.volume.toLocaleString()} | OI: {option.openInterest.toLocaleString()}
                      </div>
                      <Badge className={getRecommendationColor(option.tradingRecommendation)}>
                        {option.tradingRecommendation.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trading Opportunities */}
        <TabsContent value="opportunities">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Options Trading Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tradingOpportunities.length > 0 ? (
                <div className="space-y-4">
                  {tradingOpportunities.map((option, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-blue-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Badge className={getRecommendationColor(option.tradingRecommendation)}>
                            {option.tradingRecommendation.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <span className="font-medium">{option.symbol}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">₹{option.lastPrice.toFixed(2)}</div>
                          <div className="text-sm text-gray-600">
                            IV: {(option.impliedVolatility * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-3 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">Delta:</span>
                          <div className="font-medium">{option.greeks.delta.toFixed(4)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Gamma:</span>
                          <div className="font-medium">{option.greeks.gamma.toFixed(4)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Theta:</span>
                          <div className="font-medium">{option.greeks.theta.toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Vega:</span>
                          <div className="font-medium">{option.greeks.vega.toFixed(2)}</div>
                        </div>
                      </div>

                      <div className="text-sm bg-white p-2 rounded">
                        <strong>Strategy Insight:</strong> 
                        {option.tradingRecommendation.includes('buy') && option.impliedVolatility < 0.2 && 
                          ' Low IV with positive momentum - consider volatility expansion play'}
                        {option.tradingRecommendation.includes('sell') && option.impliedVolatility > 0.3 && 
                          ' High IV mean reversion opportunity - consider premium selling strategies'}
                        {Math.abs(option.greeks.gamma) > 0.03 && 
                          ' High gamma - excellent for scalping strategies'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No trading opportunities detected</p>
                  <p className="text-sm">Opportunities will appear based on Greeks analysis</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* High Risk Alerts */}
        <TabsContent value="risks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                High Risk Options Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              {highRiskOptions.length > 0 ? (
                <div className="space-y-4">
                  {highRiskOptions.map((option, index) => (
                    <Alert key={index} className="border-red-200">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{option.symbol}</span>
                            <Badge className={getRiskBadgeColor(option.riskLevel)}>
                              {option.riskLevel.toUpperCase()} RISK
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div>Gamma: {option.greeks.gamma.toFixed(4)}</div>
                            <div>Theta: {option.greeks.theta.toFixed(2)}</div>
                            <div>Vega: {option.greeks.vega.toFixed(2)}</div>
                            <div>IV: {(option.impliedVolatility * 100).toFixed(1)}%</div>
                          </div>
                          
                          <div className="text-sm text-red-600">
                            <strong>Risk Factors:</strong>
                            {Math.abs(option.greeks.gamma) > 0.05 && ' High gamma acceleration risk.'}
                            {option.greeks.theta < -15 && ' Severe time decay.'}
                            {option.impliedVolatility > 0.35 && ' Extremely high volatility.'}
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No high risk options detected</p>
                  <p className="text-sm">Your options portfolio is within safe risk parameters</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Analysis */}
        <TabsContent value="analysis">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Greeks Sensitivity Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <strong>Delta Risk:</strong> Measures directional exposure
                    <div className="text-gray-600">Monitor for portfolio delta neutrality</div>
                  </div>
                  <div>
                    <strong>Gamma Risk:</strong> Acceleration of delta changes
                    <div className="text-gray-600">High gamma near expiry creates volatility</div>
                  </div>
                  <div>
                    <strong>Theta Decay:</strong> Time value erosion
                    <div className="text-gray-600">Accelerates exponentially near expiry</div>
                  </div>
                  <div>
                    <strong>Vega Risk:</strong> Volatility sensitivity
                    <div className="text-gray-600">IV changes impact option pricing significantly</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Expert Trading Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <strong>IV Percentile Analysis:</strong>
                    <div className="text-gray-600">Compare current IV to historical ranges</div>
                  </div>
                  <div>
                    <strong>Time Decay Optimization:</strong>
                    <div className="text-gray-600">Theta positive strategies in high IV environments</div>
                  </div>
                  <div>
                    <strong>Gamma Scalping:</strong>
                    <div className="text-gray-600">Profit from delta hedging high gamma positions</div>
                  </div>
                  <div>
                    <strong>Volatility Mean Reversion:</strong>
                    <div className="text-gray-600">Sell high IV, buy low IV relative to historical norms</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
