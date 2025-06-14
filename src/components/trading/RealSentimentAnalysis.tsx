
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { TrendingUp, TrendingDown, MessageSquare, Newspaper, Wifi, WifiOff, Search, RefreshCw } from 'lucide-react';
import { realDataService, type NewsData } from '@/services/RealDataService';

interface SentimentScore {
  source: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  confidence: number;
  articlesCount: number;
  isRealData: boolean;
}

export const RealSentimentAnalysis = () => {
  const [newsData, setNewsData] = useState<NewsData[]>([]);
  const [sentimentScores, setSentimentScores] = useState<SentimentScore[]>([]);
  const [overallSentiment, setOverallSentiment] = useState<'positive' | 'negative' | 'neutral'>('neutral');
  const [sentimentScore, setSentimentScore] = useState(50);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('indian stock market');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [hasRealData, setHasRealData] = useState(false);

  const analyzeRealSentiment = async (query: string = searchQuery) => {
    setIsAnalyzing(true);
    console.log(`📰 Analyzing real market sentiment for: "${query}"`);

    try {
      // Get real news data
      const news = await realDataService.getMarketSentiment(query);
      setNewsData(news);

      // Check if we have real API connection
      const connectionStatus = realDataService.getConnectionStatus();
      setHasRealData(connectionStatus.hasRealData);

      // Analyze sentiment by source
      const sentimentBySource = news.reduce((acc, article) => {
        if (!acc[article.source]) {
          acc[article.source] = { positive: 0, negative: 0, neutral: 0, total: 0 };
        }
        acc[article.source][article.sentiment]++;
        acc[article.source].total++;
        return acc;
      }, {} as Record<string, any>);

      // Generate sentiment scores
      const scores: SentimentScore[] = Object.entries(sentimentBySource).map(([source, data]) => {
        const positiveRatio = data.positive / data.total;
        const negativeRatio = data.negative / data.total;
        const score = (positiveRatio * 100) - (negativeRatio * 50); // Weight positive higher
        
        let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
        if (score > 60) sentiment = 'positive';
        else if (score < 40) sentiment = 'negative';

        return {
          source,
          sentiment,
          score: Math.max(0, Math.min(100, score + 50)), // Normalize to 0-100
          confidence: Math.min(95, 60 + (data.total * 5)), // Higher confidence with more articles
          articlesCount: data.total,
          isRealData: connectionStatus.configured.includes('newsAPI')
        };
      });

      setSentimentScores(scores);

      // Calculate overall sentiment
      const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / (scores.length || 1);
      setSentimentScore(avgScore);

      if (avgScore > 60) setOverallSentiment('positive');
      else if (avgScore < 40) setOverallSentiment('negative');
      else setOverallSentiment('neutral');

      setLastUpdate(new Date());
      console.log(`✅ Sentiment analysis complete: ${avgScore.toFixed(1)}% (${overallSentiment.toUpperCase()})`);
      console.log(`📊 Analyzed ${news.length} articles from ${scores.length} sources`);

    } catch (error) {
      console.error('Sentiment analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    analyzeRealSentiment();
    
    // Auto-refresh every 5 minutes for real data, 10 minutes for simulation
    const interval = setInterval(() => analyzeRealSentiment(), hasRealData ? 5 * 60 * 1000 : 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [hasRealData]);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50 border-green-200';
      case 'negative': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="h-4 w-4" />;
      case 'negative': return <TrendingDown className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      analyzeRealSentiment(searchQuery.trim());
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              Real-time Market Sentiment Analysis
              {hasRealData ? (
                <Badge className="bg-green-500 text-white flex items-center gap-1">
                  <Wifi className="h-3 w-3" />
                  Live News
                </Badge>
              ) : (
                <Badge variant="outline" className="flex items-center gap-1">
                  <WifiOff className="h-3 w-3" />
                  Enhanced Simulation
                </Badge>
              )}
            </div>
            <Button onClick={() => analyzeRealSentiment()} disabled={isAnalyzing} size="sm">
              <RefreshCw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Data Source Info */}
          <Card className={`mb-6 ${hasRealData ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {hasRealData ? (
                  <Wifi className="h-5 w-5 text-green-600" />
                ) : (
                  <WifiOff className="h-5 w-5 text-amber-600" />
                )}
                <div>
                  <div className="font-medium">
                    {hasRealData ? '📰 Real News Data Active' : '🎯 Enhanced Sentiment Simulation'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {hasRealData 
                      ? 'Market sentiment from real news sources via News API'
                      : 'Configure News API in settings to get real market sentiment'
                    }
                  </div>
                  {lastUpdate && (
                    <div className="text-xs text-gray-500 mt-1">
                      Last updated: {lastUpdate.toLocaleTimeString()} | {newsData.length} articles analyzed
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Bar */}
          <div className="flex gap-2 mb-6">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search market sentiment (e.g., 'NIFTY', 'bank stocks', 'crypto')"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isAnalyzing}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Overall Sentiment */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${getSentimentColor(overallSentiment)}`}>
                {getSentimentIcon(overallSentiment)}
                <span className="font-semibold capitalize">{overallSentiment}</span>
              </div>
              <div className="text-sm text-gray-600">
                Market Sentiment: {sentimentScore.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">
                Query: <strong>"{searchQuery}"</strong>
              </div>
            </div>
            <Progress value={sentimentScore} className="h-3" />
          </div>

          {/* Sentiment by Source */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {sentimentScores.map((score, index) => (
              <Card key={index} className={`border-l-4 ${score.sentiment === 'positive' ? 'border-l-green-500' : score.sentiment === 'negative' ? 'border-l-red-500' : 'border-l-gray-500'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Newspaper className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{score.source}</span>
                      {score.isRealData && (
                        <Badge variant="outline" className="text-xs">
                          Real Data
                        </Badge>
                      )}
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium border ${getSentimentColor(score.sentiment)}`}>
                      {score.sentiment}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Score: {score.score.toFixed(1)}</span>
                      <span>Articles: {score.articlesCount}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Confidence: {score.confidence.toFixed(1)}%</span>
                    </div>
                    <Progress value={score.score} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent News Articles */}
          {newsData.length > 0 && (
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <h4 className="font-medium mb-3">📰 Recent News Analysis</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {newsData.slice(0, 5).map((article, index) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-800">{article.source}</span>
                        <div className={`px-2 py-1 rounded text-xs font-medium border ${getSentimentColor(article.sentiment)}`}>
                          {article.sentiment}
                        </div>
                      </div>
                      <h5 className="text-sm font-medium text-gray-900 mb-1">{article.title}</h5>
                      <p className="text-xs text-gray-600 mb-2">{article.description}</p>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Score: {article.score.toFixed(1)}</span>
                        <span>{new Date(article.publishedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {sentimentScores.length === 0 && !isAnalyzing && (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No sentiment data available</p>
              <p className="text-sm">Enter a search query and click analyze</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
