
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, Target, TrendingUp, Volume2, MessageSquare, Zap } from 'lucide-react';

interface SignalQualityData {
  totalScore: number;
  technicalScore: number;
  volumeScore: number;
  sentimentScore: number;
  volatilityScore: number;
  confidence: number;
  qualityLevel: 'Low' | 'Medium' | 'High' | 'Excellent';
  tradesToday: number;
  highQualitySignals: number;
  successRate: number;
}

export const SignalQualityPanel = () => {
  const [qualityData, setQualityData] = useState<SignalQualityData>({
    totalScore: 0,
    technicalScore: 0,
    volumeScore: 0,
    sentimentScore: 0,
    volatilityScore: 0,
    confidence: 0,
    qualityLevel: 'Medium',
    tradesToday: 0,
    highQualitySignals: 0,
    successRate: 0
  });

  const [recentSignals, setRecentSignals] = useState<any[]>([]);

  useEffect(() => {
    // Simulate real-time signal quality updates
    const interval = setInterval(() => {
      const mockData: SignalQualityData = {
        totalScore: 70 + Math.random() * 30,
        technicalScore: 25 + Math.random() * 15,
        volumeScore: 15 + Math.random() * 10,
        sentimentScore: 10 + Math.random() * 10,
        volatilityScore: 8 + Math.random() * 7,
        confidence: 0.7 + Math.random() * 0.25,
        qualityLevel: getQualityLevel(70 + Math.random() * 30),
        tradesToday: Math.floor(8 + Math.random() * 12),
        highQualitySignals: Math.floor(5 + Math.random() * 8),
        successRate: 82 + Math.random() * 8
      };

      setQualityData(mockData);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getQualityLevel = (score: number): 'Low' | 'Medium' | 'High' | 'Excellent' => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'High';
    if (score >= 60) return 'Medium';
    return 'Low';
  };

  const getQualityColor = (level: string) => {
    switch (level) {
      case 'Excellent': return 'bg-purple-500 text-white';
      case 'High': return 'bg-green-500 text-white';
      case 'Medium': return 'bg-yellow-500 text-white';
      default: return 'bg-red-500 text-white';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Signal Quality Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Overall Quality Score */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold">{qualityData.totalScore.toFixed(0)}</div>
                <Badge className={getQualityColor(qualityData.qualityLevel)}>
                  {qualityData.qualityLevel} Quality
                </Badge>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Confidence</div>
                <div className="text-lg font-semibold">{(qualityData.confidence * 100).toFixed(1)}%</div>
              </div>
            </div>
            <Progress value={qualityData.totalScore} className="h-3" />
          </div>

          {/* Score Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Target className="h-5 w-5 mx-auto mb-2 text-blue-600" />
              <div className="text-sm text-gray-600">Technical</div>
              <div className="text-lg font-bold">{qualityData.technicalScore.toFixed(0)}/40</div>
              <Progress value={(qualityData.technicalScore / 40) * 100} className="h-1 mt-1" />
            </div>

            <div className="text-center p-3 bg-green-50 rounded-lg">
              <Volume2 className="h-5 w-5 mx-auto mb-2 text-green-600" />
              <div className="text-sm text-gray-600">Volume</div>
              <div className="text-lg font-bold">{qualityData.volumeScore.toFixed(0)}/25</div>
              <Progress value={(qualityData.volumeScore / 25) * 100} className="h-1 mt-1" />
            </div>

            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <MessageSquare className="h-5 w-5 mx-auto mb-2 text-purple-600" />
              <div className="text-sm text-gray-600">Sentiment</div>
              <div className="text-lg font-bold">{qualityData.sentimentScore.toFixed(0)}/20</div>
              <Progress value={(qualityData.sentimentScore / 20) * 100} className="h-1 mt-1" />
            </div>

            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <Zap className="h-5 w-5 mx-auto mb-2 text-orange-600" />
              <div className="text-sm text-gray-600">Volatility</div>
              <div className="text-lg font-bold">{qualityData.volatilityScore.toFixed(0)}/15</div>
              <Progress value={(qualityData.volatilityScore / 15) * 100} className="h-1 mt-1" />
            </div>
          </div>

          {/* Daily Stats */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{qualityData.tradesToday}</div>
              <div className="text-sm text-gray-600">Signals Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{qualityData.highQualitySignals}</div>
              <div className="text-sm text-gray-600">High Quality (80+)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{qualityData.successRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </div>

          {/* Quality Guidelines */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold mb-2">📊 Quality Thresholds:</h4>
            <div className="text-sm space-y-1">
              <div>• <strong>Excellent (90+):</strong> Multiple confluences, high volume, strong sentiment</div>
              <div>• <strong>High (80-89):</strong> Good technical setup with volume confirmation</div>
              <div>• <strong>Medium (60-79):</strong> Basic setup, moderate confidence</div>
              <div>• <strong>Low (&lt;60):</strong> Weak signals, avoid trading</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
