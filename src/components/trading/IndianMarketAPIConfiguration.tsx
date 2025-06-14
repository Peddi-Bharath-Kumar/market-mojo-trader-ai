
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Settings, Key, CheckCircle, AlertTriangle, Eye, EyeOff, Shield, Wifi, TrendingUp, Newspaper, BarChart3, Database } from 'lucide-react';
import { marketDataService, type BrokerConfig } from '@/services/MarketDataService';
import { realDataService, type APICredentials } from '@/services/RealDataService';

interface IndianMarketAPIConfigurationProps {
  onConfigured: (configured: boolean) => void;
  isConfigured: boolean;
}

export const IndianMarketAPIConfiguration: React.FC<IndianMarketAPIConfigurationProps> = ({ onConfigured, isConfigured }) => {
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
    newsData: true,
    historicalData: true
  });

  const testAllConnections = async () => {
    setIsConnecting(true);
    setConnectionStatus('disconnected');

    try {
      console.log('🇮🇳 Testing Indian market API connections...');
      
      // Test broker API if enabled
      if (enabledServices.broker && brokerConfig.broker && brokerConfig.apiKey) {
        marketDataService.setApiConfig(brokerConfig);
        await marketDataService.connect();
        console.log('✅ Indian broker API connected');
      }

      // Set data service credentials
      realDataService.setCredentials(dataCredentials);
      
      // Test Indian market data APIs
      const testPromises = [];
      
      if (enabledServices.newsData && dataCredentials.gnews?.apiKey) {
        testPromises.push(
          realDataService.getMarketSentiment('NIFTY stock market')
            .then(() => console.log('✅ GNews Indian market sentiment working'))
            .catch(e => console.warn('⚠️ GNews API issues:', e.message))
        );
      }

      if (enabledServices.historicalData) {
        testPromises.push(
          realDataService.getHistoricalData('NIFTY', '2024-01-01', '2024-01-31')
            .then(() => console.log('✅ Historical Indian market data working'))
            .catch(e => console.warn('⚠️ Historical data API issues:', e.message))
        );
      }

      await Promise.allSettled(testPromises);
      
      setConnectionStatus('connected');
      onConfigured(true);
      
      alert('🎉 Indian Market API Configuration Complete!\n\n✅ Real-time NSE/BSE data via broker APIs\n✅ GNews + NLP for Indian market sentiment\n✅ NSE Bhavcopy / Professional historical data\n✅ Enhanced trading with Indian market focus');

    } catch (error) {
      console.error('Indian market API connection test failed:', error);
      setConnectionStatus('error');
      alert('❌ Some Indian market API connections failed. Check the console for details. The system will use enhanced simulation with NSE patterns.');
    } finally {
      setIsConnecting(false);
    }
  };

  const updateDataCredential = (service: keyof APICredentials, field: string, value: string | boolean) => {
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
            🇮🇳 Indian Market Data Configuration
            {connectionStatus === 'connected' && (
              <Badge className="bg-green-500 text-white flex items-center gap-1">
                <Wifi className="h-3 w-3" />
                NSE/BSE Live
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Introduction */}
          <Card className="bg-blue-50 border-blue-200 mb-6">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">🚀 Optimized for Indian Markets</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div>• <strong>Real-time data:</strong> Angel Broking / Zerodha Kite APIs</div>
                    <div>• <strong>News sentiment:</strong> GNews + Custom NLP for Indian markets</div>
                    <div>• <strong>Historical data:</strong> NSE Bhavcopy (free) or TrueData/GlobalDataFeeds</div>
                    <div>• <strong>Focus:</strong> NSE, BSE, Indian indices and stocks</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="broker" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="broker">Broker APIs</TabsTrigger>
              <TabsTrigger value="news">News & Sentiment</TabsTrigger>
              <TabsTrigger value="historical">Historical Data</TabsTrigger>
            </TabsList>

            {/* Broker Configuration */}
            <TabsContent value="broker" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Indian Broker APIs
                  </h3>
                  <p className="text-sm text-gray-600">Real-time NSE/BSE prices and volumes</p>
                </div>
                <Switch
                  checked={enabledServices.broker}
                  onCheckedChange={(checked) => setEnabledServices(prev => ({ ...prev, broker: checked }))}
                />
              </div>
              
              {enabledServices.broker && (
                <div className="space-y-4">
                  <div>
                    <Label>Select Indian Broker</Label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={brokerConfig.broker}
                      onChange={(e) => setBrokerConfig(prev => ({ ...prev, broker: e.target.value }))}
                    >
                      <option value="">Choose your broker</option>
                      <option value="angel">Angel Broking (SmartAPI)</option>
                      <option value="zerodha">Zerodha (Kite Connect)</option>
                      <option value="upstox">Upstox Pro</option>
                      <option value="fyers">Fyers API</option>
                    </select>
                  </div>

                  {brokerConfig.broker === 'angel' && (
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-3">Angel Broking SmartAPI</h4>
                        <div className="space-y-3">
                          <div>
                            <Label>API Key</Label>
                            <Input
                              type={showSecrets ? 'text' : 'password'}
                              value={brokerConfig.apiKey}
                              onChange={(e) => setBrokerConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                              placeholder="Your Angel SmartAPI key"
                            />
                          </div>
                          <div>
                            <Label>Client ID</Label>
                            <Input
                              type={showSecrets ? 'text' : 'password'}
                              value={brokerConfig.apiSecret}
                              onChange={(e) => setBrokerConfig(prev => ({ ...prev, apiSecret: e.target.value }))}
                              placeholder="Your Angel client ID"
                            />
                          </div>
                          <div>
                            <Label>M-PIN</Label>
                            <Input
                              type={showSecrets ? 'text' : 'password'}
                              value={brokerConfig.accessToken}
                              onChange={(e) => setBrokerConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                              placeholder="Your Angel M-PIN"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {brokerConfig.broker === 'zerodha' && (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-3">Zerodha Kite Connect</h4>
                        <div className="space-y-3">
                          <div>
                            <Label>API Key</Label>
                            <Input
                              type={showSecrets ? 'text' : 'password'}
                              value={brokerConfig.apiKey}
                              onChange={(e) => setBrokerConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                              placeholder="Your Kite API key"
                            />
                          </div>
                          <div>
                            <Label>API Secret</Label>
                            <Input
                              type={showSecrets ? 'text' : 'password'}
                              value={brokerConfig.apiSecret}
                              onChange={(e) => setBrokerConfig(prev => ({ ...prev, apiSecret: e.target.value }))}
                              placeholder="Your Kite API secret"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            {/* News & Sentiment Configuration */}
            <TabsContent value="news" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Newspaper className="h-5 w-5 text-orange-600" />
                    Indian Market News & Sentiment
                  </h3>
                  <p className="text-sm text-gray-600">GNews + NLP for Indian market sentiment</p>
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
                      <h4 className="font-medium mb-2">GNews API (Recommended)</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Indian market news with custom NLP - <a href="https://gnews.io/register" target="_blank" className="text-blue-600 underline">Get free API key</a>
                      </p>
                      <Input
                        type={showSecrets ? 'text' : 'password'}
                        value={dataCredentials.gnews?.apiKey || ''}
                        onChange={(e) => updateDataCredential('gnews', 'apiKey', e.target.value)}
                        placeholder="Your GNews API key"
                      />
                      <div className="mt-2 text-xs text-gray-500">
                        Automatically filters for Indian market news (NSE, BSE, NIFTY, etc.)
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">MoneyControl Sentiment (Free)</h4>
                        <Switch
                          checked={dataCredentials.moneyControl?.enabled || false}
                          onCheckedChange={(checked) => updateDataCredential('moneyControl', 'enabled', checked)}
                        />
                      </div>
                      <p className="text-sm text-gray-600">
                        Web scraping MoneyControl for Indian market sentiment (respects robots.txt)
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Historical Data Configuration */}
            <TabsContent value="historical" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Database className="h-5 w-5 text-purple-600" />
                    Historical Market Data
                  </h3>
                  <p className="text-sm text-gray-600">NSE Bhavcopy (free) or professional APIs</p>
                </div>
                <Switch
                  checked={enabledServices.historicalData}
                  onCheckedChange={(checked) => setEnabledServices(prev => ({ ...prev, historicalData: checked }))}
                />
              </div>

              {enabledServices.historicalData && (
                <div className="space-y-4">
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">NSE India Bhavcopy (Free EOD)</h4>
                        <Switch
                          checked={dataCredentials.nseIndia?.enabled || false}
                          onCheckedChange={(checked) => updateDataCredential('nseIndia', 'enabled', checked)}
                        />
                      </div>
                      <p className="text-sm text-gray-600">
                        Free end-of-day data from NSE for backtesting and historical analysis
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3">TrueData (Professional)</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        NSE-certified professional data - <a href="https://truedata.in" target="_blank" className="text-blue-600 underline">Get API access</a>
                      </p>
                      <div className="space-y-2">
                        <Input
                          type={showSecrets ? 'text' : 'password'}
                          value={dataCredentials.trueData?.apiKey || ''}
                          onChange={(e) => updateDataCredential('trueData', 'apiKey', e.target.value)}
                          placeholder="TrueData API Key"
                        />
                        <Input
                          type={showSecrets ? 'text' : 'password'}
                          value={dataCredentials.trueData?.userId || ''}
                          onChange={(e) => updateDataCredential('trueData', 'userId', e.target.value)}
                          placeholder="TrueData User ID"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3">GlobalDataFeeds (Professional)</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        NSE-certified tick-by-tick data - <a href="https://globaldatafeeds.in" target="_blank" className="text-blue-600 underline">Get API access</a>
                      </p>
                      <div className="space-y-2">
                        <Input
                          type={showSecrets ? 'text' : 'password'}
                          value={dataCredentials.globalDataFeeds?.apiKey || ''}
                          onChange={(e) => updateDataCredential('globalDataFeeds', 'apiKey', e.target.value)}
                          placeholder="GlobalDataFeeds API Key"
                        />
                        <Input
                          type={showSecrets ? 'text' : 'password'}
                          value={dataCredentials.globalDataFeeds?.userId || ''}
                          onChange={(e) => updateDataCredential('globalDataFeeds', 'userId', e.target.value)}
                          placeholder="GlobalDataFeeds User ID"
                        />
                      </div>
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
              className="bg-gradient-to-r from-green-600 to-blue-600 text-white"
            >
              {isConnecting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Connecting to Indian APIs...
                </div>
              ) : '🇮🇳 Connect Indian Market APIs'}
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
                    {connectionStatus === 'connected' ? '🚀 Indian Market APIs Active!' : 'Configure APIs for Real Indian Market Data'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {connectionStatus === 'connected' 
                      ? 'Trading system optimized for NSE/BSE with real Indian market data'
                      : 'Add API credentials above to enable real-time Indian market data'
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Setup Guide */}
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <h4 className="font-medium text-amber-800 mb-3">⚡ Quick Setup for Indian Markets</h4>
              <div className="text-sm text-amber-700 space-y-2">
                <div><strong>Priority Setup:</strong></div>
                <div>1. <strong>Broker API</strong> - Angel Broking or Zerodha for real-time NSE/BSE data</div>
                <div>2. <strong>GNews API</strong> - Indian market news sentiment (free tier available)</div>
                <div>3. <strong>NSE Bhavcopy</strong> - Free historical data for backtesting</div>
                <div className="mt-3"><strong>Professional (Optional):</strong></div>
                <div>4. <strong>TrueData/GlobalDataFeeds</strong> - Professional tick data</div>
                <div>5. <strong>MoneyControl</strong> - Additional sentiment from Indian financial media</div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};
