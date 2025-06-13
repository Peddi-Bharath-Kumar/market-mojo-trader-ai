
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, MessageSquare, Twitter, Newspaper } from 'lucide-react';

interface SentimentData {
  source: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  score: number;
  confidence: number;
  summary: string;
  timestamp: number;
}

export const SentimentAnalysis = () => {
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([]);
  const [overallSentiment, setOverallSentiment] = useState<'bullish' | 'bearish' | 'neutral'>('neutral');
  const [sentimentScore, setSentimentScore] = useState(50);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Mock sentiment analysis - replace with real AI APIs
  const analyzeSentiment = async () => {
    setIsAnalyzing(true);
    
    // Simulate API calls to sentiment analysis services
    const mockData: SentimentData[] = [
      {
        source: 'Twitter',
        sentiment: Math.random() > 0.5 ? 'bullish' : 'bearish',
        score: Math.random() * 100,
        confidence: 70 + Math.random() * 30,
        summary: 'Market showing positive momentum based on recent tweets about tech stocks',
        timestamp: Date.now()
      },
      {
        source: 'News',
        sentiment: Math.random() > 0.4 ? 'bullish' : 'bearish',
        score: Math.random() * 100,
        confidence: 80 + Math.random() * 20,
        summary: 'Economic indicators suggest continued growth in the financial sector',
        timestamp: Date.now()
      },
      {
        source: 'Reddit',
        sentiment: Math.random() > 0.6 ? 'bullish' : 'bearish',
        score: Math.random() * 100,
        confidence: 60 + Math.random() * 25,
        summary: 'Retail investors showing increased interest in index funds',
        timestamp: Date.now()
      }
    ];

    setTimeout(() => {
      setSentimentData(mockData);
      
      // Calculate overall sentiment
      const avgScore = mockData.reduce((sum, item) => sum + item.score, 0) / mockData.length;
      setSentimentScore(avgScore);
      
      if (avgScore > 60) setOverallSentiment('bullish');
      else if (avgScore < 40) setOverallSentiment('bearish');
      else setOverallSentiment('neutral');
      
      setIsAnalyzing(false);
    }, 2000);
  };

  useEffect(() => {
    analyzeSentiment();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(analyzeSentiment, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-600 bg-green-50';
      case 'bearish': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return <TrendingUp className="h-4 w-4" />;
      case 'bearish': return <TrendingDown className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Market Sentiment Analysis
            <Button onClick={analyzeSentiment} disabled={isAnalyzing}>
              {isAnalyzing ? 'Analyzing...' : 'Refresh'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Overall Sentiment */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${getSentimentColor(overallSentiment)}`}>
                {getSentimentIcon(overallSentiment)}
                <span className="font-semibold capitalize">{overallSentiment}</span>
              </div>
              <div className="text-sm text-gray-600">
                Confidence: {sentimentScore.toFixed(1)}%
              </div>
            </div>
            <Progress value={sentimentScore} className="h-3" />
          </div>

          {/* Sentiment Sources */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sentimentData.map((data, index) => (
              <Card key={index} className="border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {data.source === 'Twitter' && <Twitter className="h-4 w-4 text-blue-500" />}
                      {data.source === 'News' && <Newspaper className="h-4 w-4 text-gray-600" />}
                      {data.source === 'Reddit' && <MessageSquare className="h-4 w-4 text-orange-500" />}
                      <span className="font-medium">{data.source}</span>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getSentimentColor(data.sentiment)}`}>
                      {data.sentiment}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{data.summary}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Score: {data.score.toFixed(1)}</span>
                      <span>Confidence: {data.confidence.toFixed(1)}%</span>
                    </div>
                    <Progress value={data.score} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {sentimentData.length === 0 && !isAnalyzing && (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No sentiment data available</p>
              <p className="text-sm">Click Refresh to analyze market sentiment</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
