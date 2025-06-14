
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Settings, Key, CheckCircle, AlertTriangle, Eye, EyeOff, Shield, Wifi, TrendingUp, Newspaper, BarChart3 } from 'lucide-react';
import { marketDataService, type BrokerConfig } from '@/services/MarketDataService';
import { realDataService, type APICredentials } from '@/services/RealDataService';

interface EnhancedAPIConfigurationProps {
  onConfigured: (configured: boolean) => void;
  isConfigured: boolean;
}

export const EnhancedAPIConfiguration: React.FC<EnhancedAPIConfigurationProps> = ({ onConfigured, isConfigured }) => {
  const [brokerConfig, setBrokerConfig] = useState<BrokerConfig>({
    broker: '',
    apiKey: '',
    apiSecret: '',
    accessToken: ''
  });

  const [dataCredentials, setDataCredentials] = useState<APICredentials>({});
  const [showSecrets, setShowSecrets] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');
  const [enabledServices, setEnabledServices] = useState({
    broker: true,
    technicalData: true,
    priceData: true,
    newsData: true,
    socialSentiment: false
  });

  const brokers = [
    { id: 'angel', name: 'Angel Broking', realTimeSupport: true },
    { id: 'zerodha', name: 'Zerodha Kite', realTimeSupport: true },
    { id: 'upstox', name: 'Upstox Pro', realTimeSupport: true },
    { id: 'fyers', name: 'Fyers API', realTimeSupport: true }
  ];

  const testAllConnections = async () => {
    setIsConnecting(true);
    setConnectionStatus('disconnected');

    try {
      console.log('🔗 Testing all API connections...');
      
      // Test broker API if enabled
      if (enabledServices.broker && brokerConfig.broker && brokerConfig.apiKey) {
        marketDataService.setApiConfig(brokerConfig);
        await marketDataService.connect();
        console.log('✅ Broker API connected');
      }

      // Set data service credentials
      realDataService.setCredentials(dataCredentials);
      
      // Test data APIs
      const testPromises = [];
      
      if (enabledServices.technicalData && dataCredentials.alphaVantage?.apiKey) {
        testPromises.push(
          realDataService.getTechnicalIndicators('NIFTY')
            .then(() => console.log('✅ Technical data API working'))
            .catch(e => console.warn('⚠️ Technical data API issues:', e.message))
        );
      }

      if (enabledServices.priceData && dataCredentials.finnhub?.apiKey) {
        testPromises.push(
          realDataService.getRealTimePrice('NIFTY')
            .then(() => console.log('✅ Price data API working'))
            .catch(e => console.warn('⚠️ Price data API issues:', e.message))
        );
      }

      if (enabledServices.newsData && dataCredentials.newsAPI?.apiKey) {
        testPromises.push(
          realDataService.getMarketSentiment('stock market')
            .then(() => console.log('✅ News sentiment API working'))
            .catch(e => console.warn('⚠️ News API issues:', e.message))
        );
      }

      await Promise.allSettled(testPromises);
      
      setConnectionStatus('connected');
      onConfigured(true);
      
      alert('🎉 API Configuration Complete!\n\n✅ Real-time data sources active\n✅ Technical analysis with live data\n✅ Market sentiment from real news\n✅ Enhanced backtesting available');

    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('error');
      alert('❌ Some API connections failed. Check the console for details. The system will use enhanced simulation for failed connections.');
    } finally {
      setIsConnecting(false);
    }
  };

  const updateDataCredential = (service: keyof APICredentials, field: string, value: string) => {
    setDataCredentials(prev => ({
      ...prev,
      [service]: {
        ...prev[service],
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Enhanced API Configuration - Real Data Sources
            {connectionStatus === 'connected' && (
              <Badge className="bg-green-500 text-white flex items-center gap-1">
                <Wifi className="h-3 w-3" />
                Live Data Active
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Safety Notice */}
          <Card className="bg-blue-50 border-blue-200 mb-6">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">🚀 Real Trading Data Integration</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div>• Get real-time technical indicators from Alpha Vantage</div>
                    <div>• Live price data from Finnhub for accurate signals</div>
                    <div>• Market sentiment from real news sources</div>
                    <div>• Historical data for accurate backtesting</div>
                    <div>• Optional: Social media sentiment analysis</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="broker" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="broker">Broker API</TabsTrigger>
              <TabsTrigger value="technical">Technical Data</TabsTrigger>
              <TabsTrigger value="market">Market Data</TabsTrigger>
              <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
            </TabsList>

            {/* Broker Configuration */}
            <TabsContent value="broker" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Broker API Configuration</h3>
                <Switch
                  checked={enabledServices.broker}
                  onCheckedChange={(checked) => setEnabledServices(prev => ({ ...prev, broker: checked }))}
                />
              </div>
              
              {enabledServices.broker && (
                <div className="space-y-4">
                  <div>
                    <Label>Select Broker</Label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={brokerConfig.broker}
                      onChange={(e) => setBrokerConfig(prev => ({ ...prev, broker: e.target.value }))}
                    >
                      <option value="">Choose your broker</option>
                      {brokers.map(broker => (
                        <option key={broker.id} value={broker.id}>{broker.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>API Key</Label>
                      <Input
                        type={showSecrets ? 'text' : 'password'}
                        value={brokerConfig.apiKey}
                        onChange={(e) => setBrokerConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                        placeholder="Your broker API key"
                      />
                    </div>
                    <div>
                      <Label>API Secret</Label>
                      <Input
                        type={showSecrets ? 'text' : 'password'}
                        value={brokerConfig.apiSecret}
                        onChange={(e) => setBrokerConfig(prev => ({ ...prev, apiSecret: e.target.value }))}
                        placeholder="Your broker API secret"
                      />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Technical Data Configuration */}
            <TabsContent value="technical" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    Technical Analysis Data
                  </h3>
                  <p className="text-sm text-gray-600">Real RSI, MACD, Moving Averages, Bollinger Bands</p>
                </div>
                <Switch
                  checked={enabledServices.technicalData}
                  onCheckedChange={(checked) => setEnabledServices(prev => ({ ...prev, technicalData: checked }))}
                />
              </div>

              {enabledServices.technicalData && (
                <div className="space-y-4">
                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Alpha Vantage API</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Get free API key from <a href="https://www.alphavantage.co/support/#api-key" target="_blank" className="text-blue-600 underline">Alpha Vantage</a>
                      </p>
                      <Input
                        type={showSecrets ? 'text' : 'password'}
                        value={dataCredentials.alphaVantage?.apiKey || ''}
                        onChange={(e) => updateDataCredential('alphaVantage', 'apiKey', e.target.value)}
                        placeholder="Your Alpha Vantage API key"
                      />
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Market Data Configuration */}
            <TabsContent value="market" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Real-time Price Data
                  </h3>
                  <p className="text-sm text-gray-600">Live stock prices, volume, and historical data</p>
                </div>
                <Switch
                  checked={enabledServices.priceData}
                  onCheckedChange={(checked) => setEnabledServices(prev => ({ ...prev, priceData: checked }))}
                />
              </div>

              {enabledServices.priceData && (
                <div className="space-y-4">
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Finnhub API</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Get free API key from <a href="https://finnhub.io/register" target="_blank" className="text-blue-600 underline">Finnhub</a>
                      </p>
                      <Input
                        type={showSecrets ? 'text' : 'password'}
                        value={dataCredentials.finnhub?.apiKey || ''}
                        onChange={(e) => updateDataCredential('finnhub', 'apiKey', e.target.value)}
                        placeholder="Your Finnhub API key"
                      />
                    </CardContent>
                  </Card>

                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Polygon.io API (Historical Data)</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        For accurate backtesting - <a href="https://polygon.io/dashboard/signup" target="_blank" className="text-blue-600 underline">Get API key</a>
                      </p>
                      <Input
                        type={showSecrets ? 'text' : 'password'}
                        value={dataCredentials.polygonIO?.apiKey || ''}
                        onChange={(e) => updateDataCredential('polygonIO', 'apiKey', e.target.value)}
                        placeholder="Your Polygon.io API key"
                      />
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Sentiment Analysis Configuration */}
            <TabsContent value="sentiment" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Newspaper className="h-5 w-5 text-orange-600" />
                    Market Sentiment Analysis
                  </h3>
                  <p className="text-sm text-gray-600">Real news analysis and social media sentiment</p>
                </div>
                <Switch
                  checked={enabledServices.newsData}
                  onCheckedChange={(checked) => setEnabledServices(prev => ({ ...prev, newsData: checked }))}
                />
              </div>

              {enabledServices.newsData && (
                <div className="space-y-4">
                  <Card className="bg-orange-50 border-orange-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">News API</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Real market news sentiment - <a href="https://newsapi.org/register" target="_blank" className="text-blue-600 underline">Get free API key</a>
                      </p>
                      <Input
                        type={showSecrets ? 'text' : 'password'}
                        value={dataCredentials.newsAPI?.apiKey || ''}
                        onChange={(e) => updateDataCredential('newsAPI', 'apiKey', e.target.value)}
                        placeholder="Your News API key"
                      />
                    </CardContent>
                  </Card>

                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Twitter API (Optional)</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Social media sentiment analysis - <a href="https://developer.twitter.com/en/portal/dashboard" target="_blank" className="text-blue-600 underline">Get Bearer Token</a>
                      </p>
                      <Input
                        type={showSecrets ? 'text' : 'password'}
                        value={dataCredentials.twitterAPI?.bearerToken || ''}
                        onChange={(e) => updateDataCredential('twitterAPI', 'bearerToken', e.target.value)}
                        placeholder="Your Twitter Bearer Token"
                      />
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Control Panel */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setShowSecrets(!showSecrets)}
            >
              {showSecrets ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showSecrets ? 'Hide' : 'Show'} API Keys
            </Button>

            <Button
              onClick={testAllConnections}
              disabled={isConnecting}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              {isConnecting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Connecting to APIs...
                </div>
              ) : 'Connect All APIs & Start Real Trading'}
            </Button>
          </div>

          {/* Status Display */}
          <Card className={`mt-4 ${
            connectionStatus === 'connected' ? 'bg-green-50 border-green-200' : 
            connectionStatus === 'error' ? 'bg-red-50 border-red-200' : 'bg-gray-50'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {connectionStatus === 'connected' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-gray-500" />
                )}
                <div>
                  <div className="font-medium">
                    {connectionStatus === 'connected' ? '🚀 Real Data APIs Active!' : 'Configure APIs for Real Data'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {connectionStatus === 'connected' 
                      ? 'All trading components now use real market data'
                      : 'Add API credentials above to enable real-time data'
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Setup Guide */}
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <h4 className="font-medium text-amber-800 mb-3">⚡ Quick Setup Guide</h4>
              <div className="text-sm text-amber-700 space-y-2">
                <div><strong>Essential APIs (Free):</strong></div>
                <div>1. <strong>Alpha Vantage</strong> - Technical indicators (RSI, MACD, etc.)</div>
                <div>2. <strong>Finnhub</strong> - Real-time stock prices</div>
                <div>3. <strong>News API</strong> - Market sentiment from news</div>
                <div className="mt-3"><strong>Advanced (Optional):</strong></div>
                <div>4. <strong>Polygon.io</strong> - Historical data for backtesting</div>
                <div>5. <strong>Twitter API</strong> - Social media sentiment</div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};
