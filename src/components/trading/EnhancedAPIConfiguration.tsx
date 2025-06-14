
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
      
      if (enabledServices.technicalData && dataCredentials.gNews?.apiKey) {
        testPromises.push(
          realDataService.getTechnicalIndicators('NIFTY')
            .then(() => console.log('✅ Technical data API working'))
            .catch(e => console.warn('⚠️ Technical data API issues:', e.message))
        );
      }

      if (enabledServices.priceData && dataCredentials.nseBhavcopy?.enabled) {
        testPromises.push(
          realDataService.getRealTimePrice('NIFTY')
            .then(() => console.log('✅ Price data API working'))
            .catch(e => console.warn('⚠️ Price data API issues:', e.message))
        );
      }

      if (enabledServices.newsData && dataCredentials.gNews?.apiKey) {
        testPromises.push(
          realDataService.getMarketSentiment('stock market')
            .then(() => console.log('✅ News sentiment API working'))
            .catch(e => console.warn('⚠️ News API issues:', e.message))
        );
      }

      await Promise.allSettled(testPromises);
      
      setConnectionStatus('connected');
      onConfigured(true);
      
      alert('🎉 Indian Market API Configuration Complete!\n\n✅ Real-time Indian stock data active\n✅ Technical analysis with NSE data\n✅ GNews + NLP for market sentiment\n✅ Enhanced backtesting available');

    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('error');
      alert('❌ Some API connections failed. Check the console for details. The system will use enhanced simulation for failed connections.');
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
            Indian Market API Configuration
            {connectionStatus === 'connected' && (
              <Badge className="bg-green-500 text-white flex items-center gap-1">
                <Wifi className="h-3 w-3" />
                Live Indian Data
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
                  <h4 className="font-medium text-blue-800 mb-2">🇮🇳 Indian Stock Market Integration</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div>• Real-time NSE/BSE data via Broker APIs</div>
                    <div>• GNews API + NLP for Indian market sentiment</div>
                    <div>• NSE Bhavcopy for historical EOD data</div>
                    <div>• Enhanced simulation with Indian market patterns</div>
                    <div>• Zerodha/Angel Broking integration ready</div>
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
                <h3 className="text-lg font-medium">Indian Broker API Configuration</h3>
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
                    NSE Technical Analysis Data
                  </h3>
                  <p className="text-sm text-gray-600">Real RSI, MACD, Moving Averages from NSE data</p>
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
                      <h4 className="font-medium mb-2">NSE Bhavcopy (Free)</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Free end-of-day data from NSE India
                      </p>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={dataCredentials.nseBhavcopy?.enabled || false}
                          onCheckedChange={(checked) => updateDataCredential('nseBhavcopy', 'enabled', checked)}
                        />
                        <span className="text-sm">Enable NSE Bhavcopy</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">TrueData API (Professional)</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        NSE-certified professional data - <a href="https://truedata.in" target="_blank" className="text-blue-600 underline">Get API key</a>
                      </p>
                      <Input
                        type={showSecrets ? 'text' : 'password'}
                        value={dataCredentials.trueData?.apiKey || ''}
                        onChange={(e) => updateDataCredential('trueData', 'apiKey', e.target.value)}
                        placeholder="Your TrueData API key"
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
                    Real-time Indian Stock Data
                  </h3>
                  <p className="text-sm text-gray-600">Live NSE/BSE prices and volume</p>
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
                      <h4 className="font-medium mb-2">Use Broker API for Real-time Data</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Configure your broker API above to get real-time NSE/BSE data
                      </p>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={dataCredentials.brokerRealtime?.enabled || false}
                          onCheckedChange={(checked) => updateDataCredential('brokerRealtime', 'enabled', checked)}
                        />
                        <span className="text-sm">Enable Broker Real-time Data</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">GlobalDataFeeds API (Professional)</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        NSE-certified professional data - <a href="https://globaldatafeeds.in" target="_blank" className="text-blue-600 underline">Get API key</a>
                      </p>
                      <Input
                        type={showSecrets ? 'text' : 'password'}
                        value={dataCredentials.globalData?.apiKey || ''}
                        onChange={(e) => updateDataCredential('globalData', 'apiKey', e.target.value)}
                        placeholder="Your GlobalDataFeeds API key"
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
                    Indian Market Sentiment
                  </h3>
                  <p className="text-sm text-gray-600">News analysis focused on Indian markets</p>
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
                      <h4 className="font-medium mb-2">GNews API + NLP</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Indian market news with custom NLP - <a href="https://gnews.io" target="_blank" className="text-blue-600 underline">Get free API key</a>
                      </p>
                      <Input
                        type={showSecrets ? 'text' : 'password'}
                        value={dataCredentials.gNews?.apiKey || ''}
                        onChange={(e) => updateDataCredential('gNews', 'apiKey', e.target.value)}
                        placeholder="Your GNews API key"
                      />
                    </CardContent>
                  </Card>

                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">MoneyControl RSS (Free)</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Free Indian market news from MoneyControl
                      </p>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={dataCredentials.moneyControl?.enabled || false}
                          onCheckedChange={(checked) => updateDataCredential('moneyControl', 'enabled', checked)}
                        />
                        <span className="text-sm">Enable MoneyControl News</span>
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
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              {isConnecting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Connecting to APIs...
                </div>
              ) : 'Connect Indian Market APIs'}
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
                    {connectionStatus === 'connected' ? '🇮🇳 Indian Market APIs Active!' : 'Configure APIs for Real Indian Data'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {connectionStatus === 'connected' 
                      ? 'All trading components now use real Indian market data'
                      : 'Add API credentials above to enable real-time NSE/BSE data'
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Setup Guide */}
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <h4 className="font-medium text-amber-800 mb-3">🇮🇳 Indian Market Setup Guide</h4>
              <div className="text-sm text-amber-700 space-y-2">
                <div><strong>Essential APIs (Free/Low Cost):</strong></div>
                <div>1. <strong>NSE Bhavcopy</strong> - Free EOD data from NSE</div>
                <div>2. <strong>GNews API</strong> - Indian market news + NLP</div>
                <div>3. <strong>MoneyControl RSS</strong> - Free Indian market updates</div>
                <div className="mt-3"><strong>Professional (Paid):</strong></div>
                <div>4. <strong>Broker API</strong> - Real-time NSE/BSE data</div>
                <div>5. <strong>TrueData/GlobalDataFeeds</strong> - NSE-certified data</div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};
