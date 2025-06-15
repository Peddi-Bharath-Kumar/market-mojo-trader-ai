
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, TrendingUp, TrendingDown, Target, AlertTriangle, Zap, Activity } from 'lucide-react';
import { aiTradingAssistant, TradingSignal } from '@/services/AITradingAssistant';

export const AITradingPanel = () => {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [marketOverview, setMarketOverview] = useState('');
  const [riskAssessment, setRiskAssessment] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchAIRecommendations = async () => {
    setIsAnalyzing(true);
    try {
      console.log('🤖 Fetching AI recommendations with REAL market data...');
      const recommendations = await aiTradingAssistant.getAIRecommendations();
      
      setSignals(recommendations.signals);
      setMarketOverview(recommendations.marketOverview);
      setRiskAssessment(recommendations.riskAssessment);
      setSuggestions(recommendations.suggestions);
      setLastUpdate(new Date());
      
      console.log('✅ AI recommendations updated:', recommendations.signals.length, 'signals');
    } catch (error) {
      console.error('❌ Failed to fetch AI recommendations:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    // Fetch initial recommendations
    fetchAIRecommendations();
    
    // Set up auto-refresh every 30 seconds for real-time analysis
    const interval = setInterval(() => {
      if (!isAnalyzing) {
        fetchAIRecommendations();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getSignalColor = (action: string) => {
    switch (action) {
      case 'buy': return 'text-green-600 bg-green-50';
      case 'sell': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRiskColor = (riskReward: number) => {
    if (riskReward >= 2) return 'text-green-600';
    if (riskReward >= 1.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* AI Status Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              AI Trading Assistant
              {isAnalyzing && <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>}
            </div>
            <Button 
              onClick={fetchAIRecommendations} 
              disabled={isAnalyzing}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isAnalyzing ? (
                <Activity className="h-4 w-4 animate-spin" />
              ) : (
                'Refresh Analysis'
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{signals.length}</div>
              <div className="text-sm text-gray-600">Active Signals</div>
              {lastUpdate && (
                <div className="text-xs text-gray-500 mt-1">
                  Updated: {lastUpdate.toLocaleTimeString()}
                </div>
              )}
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {signals.filter(s => s.confidence > 0.7).length}
              </div>
              <div className="text-sm text-gray-600">High Confidence</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                ₹{signals.reduce((sum, s) => sum + s.expected_profit, 0).toFixed(0)}
              </div>
              <div className="text-sm text-gray-600">Total Expected Profit</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="signals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="signals">🎯 Trading Signals</TabsTrigger>
          <TabsTrigger value="analysis">📊 Market Analysis</TabsTrigger>
          <TabsTrigger value="risk">⚠️ Risk Assessment</TabsTrigger>
          <TabsTrigger value="suggestions">💡 AI Suggestions</TabsTrigger>
        </TabsList>

        {/* Trading Signals */}
        <TabsContent value="signals">
          <div className="space-y-4">
            {signals.length > 0 ? (
              signals.map((signal, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${getSignalColor(signal.action)}`}>
                          {signal.action === 'buy' ? 
                            <TrendingUp className="h-4 w-4" /> : 
                            <TrendingDown className="h-4 w-4" />
                          }
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{signal.symbol}</h3>
                          <p className="text-sm text-gray-600">{signal.strategy}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getConfidenceColor(signal.confidence)}>
                          {(signal.confidence * 100).toFixed(1)}% Confidence
                        </Badge>
                        <div className="text-sm text-gray-600 mt-1">{signal.timeframe}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-600">Entry Price</div>
                        <div className="font-bold">₹{signal.entry_price.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Target</div>
                        <div className="font-bold text-green-600">₹{signal.target_price.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Stop Loss</div>
                        <div className="font-bold text-red-600">₹{signal.stop_loss.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Quantity</div>
                        <div className="font-bold">{signal.quantity}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-600">Expected Profit</div>
                        <div className="font-bold text-green-600">₹{signal.expected_profit.toFixed(0)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Max Loss</div>
                        <div className="font-bold text-red-600">₹{signal.max_loss.toFixed(0)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Risk:Reward</div>
                        <div className={`font-bold ${getRiskColor(signal.risk_reward_ratio)}`}>
                          1:{signal.risk_reward_ratio.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600 mb-2">AI Analysis Reasoning:</div>
                      <ul className="text-sm space-y-1">
                        {signal.reasoning.map((reason, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Target className="h-3 w-3 mt-1 text-blue-500" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button 
                        size="sm" 
                        className={`${getSignalColor(signal.action)} border`}
                      >
                        {signal.action.toUpperCase()} {signal.symbol}
                      </Button>
                      <Badge variant="outline">{signal.type}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No Trading Signals</h3>
                  <p className="text-gray-600 mb-4">AI is analyzing market conditions...</p>
                  <Button onClick={fetchAIRecommendations} disabled={isAnalyzing}>
                    {isAnalyzing ? 'Analyzing...' : 'Generate Signals'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Market Analysis */}
        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle>AI Market Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2">Market Overview</h4>
                  <p className="text-sm">{marketOverview || 'Loading AI market analysis...'}</p>
                </div>
                
                {lastUpdate && (
                  <div className="text-sm text-gray-600">
                    <strong>Last Analysis:</strong> {lastUpdate.toLocaleString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Assessment */}
        <TabsContent value="risk">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-orange-50 rounded-lg">
                  <h4 className="font-medium mb-2">Current Risk Level</h4>
                  <p className="text-sm">{riskAssessment || 'Calculating risk parameters...'}</p>
                </div>
                
                {signals.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Portfolio Risk</h4>
                      <div className="text-2xl font-bold text-red-600">
                        ₹{signals.reduce((sum, s) => sum + s.max_loss, 0).toFixed(0)}
                      </div>
                      <div className="text-sm text-gray-600">Total Potential Loss</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Avg Risk:Reward</h4>
                      <div className="text-2xl font-bold text-green-600">
                        1:{(signals.reduce((sum, s) => sum + s.risk_reward_ratio, 0) / signals.length || 0).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">Across All Signals</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Suggestions */}
        <TabsContent value="suggestions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                AI Trading Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {suggestions.length > 0 ? (
                  suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <Zap className="h-4 w-4 mt-1 text-yellow-600" />
                      <span className="text-sm">{suggestion}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>AI suggestions will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
