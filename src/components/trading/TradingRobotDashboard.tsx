
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  Play, 
  Square, 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Shield,
  Activity,
  DollarSign,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { tradingRobotEngine } from '@/services/TradingRobotEngine';
import type { TradingSignal } from '@/services/trading/types';
import { marketDataService } from '@/services/MarketDataService';
import { TrailingStopSettings } from './TrailingStopSettings';

export const TradingRobotDashboard = () => {
  const [robotActive, setRobotActive] = useState(false);
  const [robotStatus, setRobotStatus] = useState(tradingRobotEngine.getRobotStatus());
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [actualPositions, setActualPositions] = useState<any[]>([]);
  const [accountSummary, setAccountSummary] = useState({
    totalValue: 125000,
    dayPnL: 2500,
    dayPnLPercent: 2.04,
    availableMargin: 45000,
    usedMargin: 80000
  });

  useEffect(() => {
    const updateDashboard = async () => {
      setRobotStatus(tradingRobotEngine.getRobotStatus());
      if (robotActive) {
        try {
          const newSignals = await tradingRobotEngine.generateSignals();
          setSignals(prev => [...newSignals, ...prev].slice(0, 10));
          
          // Get actual positions from broker
          const positions = marketDataService.getPositions();
          setActualPositions(positions);
        } catch (error) {
            console.error("Dashboard update failed:", error);
        }
      }
    };

    updateDashboard(); // Initial call
    const interval = setInterval(updateDashboard, 30000);

    return () => clearInterval(interval);
  }, [robotActive]);

  const handleStartRobot = () => {
    tradingRobotEngine.startRobot();
    setRobotActive(true);
  };

  const handleStopRobot = () => {
    tradingRobotEngine.stopRobot();
    setRobotActive(false);
  };

  const getMarketConditionColor = (condition: string) => {
    switch (condition) {
      case 'bullish': case 'positive': case 'high': return 'text-green-600 bg-green-50';
      case 'bearish': case 'negative': return 'text-red-600 bg-red-50';
      case 'sideways': case 'neutral': case 'medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Robot Control Panel */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-blue-600" />
            AI Trading Robot Control Center
            <Badge variant={robotActive ? 'default' : 'secondary'} className="flex items-center gap-1">
              <Activity className={`h-3 w-3 ${robotActive ? 'animate-pulse' : ''}`} />
              {robotActive ? 'ACTIVE' : 'INACTIVE'}
            </Badge>
            {robotStatus.trailingStopEnabled && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                Trailing Stop ON
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex gap-3">
                <Button 
                  onClick={handleStartRobot} 
                  disabled={robotActive}
                  className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Start AI Robot
                </Button>
                <Button 
                  onClick={handleStopRobot} 
                  disabled={!robotActive}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Square className="h-4 w-4" />
                  Stop Robot
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Active Strategies:</span>
                  <div className="flex gap-1">
                    {robotStatus.strategies.intraday && <Badge variant="outline">Intraday</Badge>}
                    {robotStatus.strategies.options && <Badge variant="outline">Options</Badge>}
                    {robotStatus.strategies.swing && <Badge variant="outline">Swing</Badge>}
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Positions:</span>
                  <span>{robotStatus.currentPositions} / {robotStatus.maxPositions}</span>
                </div>
                <Progress value={(robotStatus.currentPositions / robotStatus.maxPositions) * 100} className="h-2" />
              </div>
            </div>

            {/* Market Conditions */}
            {robotStatus.marketCondition && (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI Market Analysis
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`p-2 rounded text-center text-xs ${getMarketConditionColor(robotStatus.marketCondition.trend)}`}>
                    <div className="font-medium">Trend</div>
                    <div>{robotStatus.marketCondition.trend.toUpperCase()}</div>
                  </div>
                  <div className={`p-2 rounded text-center text-xs ${getMarketConditionColor(robotStatus.marketCondition.volatility)}`}>
                    <div className="font-medium">Volatility</div>
                    <div>{robotStatus.marketCondition.volatility.toUpperCase()}</div>
                  </div>
                  <div className={`p-2 rounded text-center text-xs ${getMarketConditionColor(robotStatus.marketCondition.volume)}`}>
                    <div className="font-medium">Volume</div>
                    <div>{robotStatus.marketCondition.volume.toUpperCase()}</div>
                  </div>
                  <div className={`p-2 rounded text-center text-xs ${getMarketConditionColor(robotStatus.marketCondition.marketSentiment)}`}>
                    <div className="font-medium">Sentiment</div>
                    <div>{robotStatus.marketCondition.marketSentiment.toUpperCase()}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="settings">Position Settings</TabsTrigger>
          <TabsTrigger value="account">Account Overview</TabsTrigger>
          <TabsTrigger value="positions">Live Positions</TabsTrigger>
          <TabsTrigger value="signals">AI Signals</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
        </TabsList>

        {/* Advanced Position Settings */}
        <TabsContent value="settings">
          <TrailingStopSettings
            trailingEnabled={robotStatus.trailingStopEnabled || false}
            partialBookingEnabled={robotStatus.partialProfitBooking || false}
            onTrailingToggle={(enabled) => {
              // This would update the robot configuration
              console.log('Trailing stop toggled:', enabled);
            }}
            onPartialBookingToggle={(enabled) => {
              // This would update the robot configuration
              console.log('Partial booking toggled:', enabled);
            }}
          />
        </TabsContent>

        {/* Account Overview */}
        <TabsContent value="account">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Portfolio Value</span>
                </div>
                <div className="text-2xl font-bold">₹{accountSummary.totalValue.toLocaleString()}</div>
                <div className={`text-sm ${accountSummary.dayPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {accountSummary.dayPnL >= 0 ? '+' : ''}₹{accountSummary.dayPnL.toLocaleString()} ({accountSummary.dayPnLPercent.toFixed(2)}%)
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Available Margin</span>
                </div>
                <div className="text-2xl font-bold">₹{accountSummary.availableMargin.toLocaleString()}</div>
                <div className="text-sm text-gray-500">For new positions</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-gray-600">Used Margin</span>
                </div>
                <div className="text-2xl font-bold">₹{accountSummary.usedMargin.toLocaleString()}</div>
                <Progress value={(accountSummary.usedMargin / (accountSummary.usedMargin + accountSummary.availableMargin)) * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-gray-600">Active Positions</span>
                </div>
                <div className="text-2xl font-bold">{actualPositions.length}</div>
                <div className="text-sm text-gray-500">Live trades</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Live Positions with Trailing Info */}
        <TabsContent value="positions">
          <Card>
            <CardHeader>
              <CardTitle>Your Live Trading Positions with Trailing Stops</CardTitle>
            </CardHeader>
            <CardContent>
              {robotStatus.positions && robotStatus.positions.length > 0 ? (
                <div className="space-y-4">
                  {robotStatus.positions.map((position: any, index: number) => (
                    <div key={index} className={`p-4 border rounded-lg border-l-4 ${position.pnl >= 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${position.action === 'buy' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {position.action === 'buy' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          </div>
                          <div>
                            <div className="font-medium text-lg flex items-center gap-2">
                              {position.symbol}
                              {position.trailingActive && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                                  Trailing Active
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              Qty: {position.quantity} | Entry: ₹{position.entryPrice.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold">₹{position.currentPrice.toFixed(2)}</div>
                          <div className={`text-sm font-medium ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {position.pnl >= 0 ? '+' : ''}₹{position.pnl.toFixed(2)} ({position.pnlPercent.toFixed(1)}%)
                          </div>
                        </div>
                      </div>
                      
                      {/* Trailing Stop Information */}
                      <div className="bg-gray-50 p-3 rounded space-y-2">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">Current Stop:</span>
                            <div className="font-medium">₹{position.stopLoss.toFixed(2)}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Original Stop:</span>
                            <div className="font-medium">₹{position.originalStopLoss.toFixed(2)}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Target:</span>
                            <div className="font-medium">₹{position.target.toFixed(2)}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Strategy:</span>
                            <div className="font-medium">{position.strategy}</div>
                          </div>
                        </div>
                        
                        {position.profitBookingLevel > 0 && (
                          <div className="text-sm text-blue-600">
                            📊 Partial profits booked: {position.profitBookingLevel === 1 ? '50%' : '75%'} of original position
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active positions</p>
                  <p className="text-sm">Positions will appear here when the robot trades</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Signals */}
        <TabsContent value="signals">
          <Card>
            <CardHeader>
              <CardTitle>Recent AI Trading Signals</CardTitle>
            </CardHeader>
            <CardContent>
              {signals.length > 0 ? (
                <div className="space-y-3">
                  {signals.map((signal, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Badge variant={signal.action === 'buy' ? 'default' : 'destructive'}>
                            {signal.action.toUpperCase()}
                          </Badge>
                          <span className="font-medium">{signal.symbol}</span>
                          <Badge variant="outline">{signal.strategy}</Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">Confidence: {(signal.confidence * 100).toFixed(0)}%</div>
                          <Progress value={signal.confidence * 100} className="w-20 h-2" />
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">{signal.reason}</div>
                      {signal.stopLoss && signal.target && (
                        <div className="text-xs text-gray-500 mt-2">
                          SL: ₹{signal.stopLoss.toFixed(2)} | Target: ₹{signal.target.toFixed(2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No signals generated yet</p>
                  <p className="text-sm">Start the robot to see AI trading signals</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Strategies */}
        <TabsContent value="strategies">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Intraday Strategy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>• Momentum-based entries</div>
                  <div>• 1.5% stop loss, 2.5% target</div>
                  <div>• High volume confirmation</div>
                  <div>• Risk: 1% per trade</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Options Strategy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>• Iron Condor (sideways markets)</div>
                  <div>• Long Straddle (high volatility)</div>
                  <div>• Premium collection focus</div>
                  <div>• Greeks-based risk management</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Risk Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>• Max 5 positions</div>
                  <div>• 2% daily loss limit</div>
                  <div>• Position sizing based on risk</div>
                  <div>• Automatic stop losses</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
