
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Shield,
  Zap,
  BarChart3,
  Lightbulb
} from 'lucide-react';
import { aiTradingAssistant, type TradingSignal } from '@/services/AITradingAssistant';

export const AITradingPanel = () => {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<any>(null);

  const generateAISignals = async () => {
    setIsAnalyzing(true);
    console.log('🤖 AI Assistant generating trading signals...');

    try {
      const aiRecommendations = await aiTradingAssistant.getAIRecommendations();
      setSignals(aiRecommendations.signals);
      setRecommendations(aiRecommendations);
      console.log('✨ AI generated', aiRecommendations.signals.length, 'high-quality signals');
    } catch (error) {
      console.error('❌ AI signal generation failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    // Auto-generate signals on component mount
    generateAISignals();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(generateAISignals, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* AI Assistant Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-purple-600" />
            🤖 AI Trading Assistant
            <Badge variant="default" className="bg-purple-600">
              INTELLIGENT
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 mb-2">
                Advanced AI analyzes market conditions and generates high-probability trading opportunities
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Real-time Analysis
                </span>
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  High Accuracy Signals
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Risk-Optimized
                </span>
              </div>
            </div>
            <Button 
              onClick={generateAISignals} 
              disabled={isAnalyzing}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isAnalyzing ? 'Analyzing...' : 'Generate AI Signals'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Market Overview */}
      {recommendations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              AI Market Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Market Analysis</h4>
                  <p className="text-sm text-blue-700">{recommendations.marketOverview}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <h4 className="font-medium text-orange-800 mb-2">Risk Assessment</h4>
                  <p className="text-sm text-orange-700">{recommendations.riskAssessment}</p>
                </div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  AI Suggestions
                </h4>
                <ul className="text-sm text-green-700 space-y-1">
                  {recommendations.suggestions.map((suggestion: string, index: number) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Trading Signals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              AI Trading Signals
            </span>
            <Badge variant="outline">
              {signals.length} Active Signals
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {signals.length > 0 ? (
            <div className="space-y-4">
              {signals.map((signal, index) => (
                <Card key={index} className={`border-l-4 ${
                  signal.action === 'buy' ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{signal.symbol}</h3>
                        <Badge variant={signal.action === 'buy' ? 'default' : 'destructive'}>
                          {signal.action.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">{signal.type.toUpperCase()}</Badge>
                        <Badge variant="secondary">{signal.strategy}</Badge>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-lg font-bold">
                          {signal.action === 'buy' ? (
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-red-600" />
                          )}
                          ₹{signal.entry_price.toFixed(2)}
                        </div>
                        <div className={`text-sm ${signal.confidence > 0.8 ? 'text-green-600' : 'text-orange-600'}`}>
                          {(signal.confidence * 100).toFixed(0)}% Confidence
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <span className="text-xs text-gray-500">Target</span>
                        <div className="font-medium text-green-600">₹{signal.target_price.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Stop Loss</span>
                        <div className="font-medium text-red-600">₹{signal.stop_loss.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Expected Profit</span>
                        <div className="font-medium text-green-600">₹{signal.expected_profit.toFixed(0)}</div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Risk:Reward</span>
                        <div className="font-medium">1:{signal.risk_reward_ratio.toFixed(1)}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">AI Reasoning:</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {signal.reasoning.map((reason, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Qty: {signal.quantity}</span>
                        <span>•</span>
                        <span>Timeframe: {signal.timeframe}</span>
                      </div>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        Execute Trade
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No AI signals generated yet</p>
              <p className="text-sm">Click "Generate AI Signals" to analyze market opportunities</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
