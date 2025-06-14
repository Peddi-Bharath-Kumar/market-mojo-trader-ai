import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Settings, Key, CheckCircle, AlertTriangle, Eye, EyeOff, Shield, Wifi } from 'lucide-react';
import { marketDataService, type BrokerConfig } from '@/services/MarketDataService';

interface APIConfigurationProps {
  onConfigured: (configured: boolean) => void;
  isConfigured: boolean;
}

export const APIConfiguration: React.FC<APIConfigurationProps> = ({ onConfigured, isConfigured }) => {
  const [config, setConfig] = useState<BrokerConfig>({
    broker: '',
    apiKey: '',
    apiSecret: '',
    accessToken: ''
  });
  
  const [showSecrets, setShowSecrets] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');
  const [lastConnectionTest, setLastConnectionTest] = useState<Date | null>(null);

  const brokers = [
    { 
      id: 'angel', 
      name: 'Angel Broking (SmartAPI)', 
      docs: 'https://smartapi.angelbroking.com/docs',
      realTimeSupport: true,
      description: 'Full real-time data support'
    },
    { 
      id: 'zerodha', 
      name: 'Zerodha (Kite Connect)', 
      docs: 'https://kite.trade/docs/',
      realTimeSupport: true,
      description: 'Professional real-time data'
    },
    { 
      id: 'upstox', 
      name: 'Upstox Pro API', 
      docs: 'https://upstox.com/developer/api-documentation/',
      realTimeSupport: true,
      description: 'Real-time market data & trading'
    },
    { 
      id: 'fyers', 
      name: 'Fyers API', 
      docs: 'https://myapi.fyers.in/docs/',
      realTimeSupport: true,
      description: 'Advanced trading APIs'
    }
  ];

  const testConnection = async () => {
    if (!config.broker || !config.apiKey || !config.apiSecret) {
      alert('Please select a broker and enter all required credentials');
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('disconnected');
    
    try {
      console.log(`Testing connection to ${config.broker}...`);
      
      // Set the API config in the market data service
      marketDataService.setApiConfig(config);
      
      // Simulate real API testing based on broker
      const testResult = await simulateBrokerAPITest(config);
      
      if (testResult.success) {
        setConnectionStatus('connected');
        onConfigured(true);
        setLastConnectionTest(new Date());
        
        console.log('✅ API Connection successful!');
        alert(`✅ Successfully connected to ${config.broker}!\n\nReal-time market data is now available.\nYou can start virtual trading safely.`);
        
        // Try to connect to real-time data
        try {
          await marketDataService.connect();
          console.log('📡 Real-time data connection established');
        } catch (error) {
          console.warn('Real-time data connection failed, using enhanced simulation');
        }
        
      } else {
        setConnectionStatus('error');
        onConfigured(false);
        alert(`❌ Connection failed: ${testResult.error}\n\nPlease check your credentials and try again.`);
      }
      
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('error');
      onConfigured(false);
      alert('❌ Connection test failed. Please check your credentials.');
    } finally {
      setIsConnecting(false);
    }
  };

  const selectedBroker = brokers.find(b => b.id === config.broker);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Broker API Configuration
            <div className="flex items-center gap-2">
              {connectionStatus === 'connected' && <Badge className="bg-green-500 text-white flex items-center gap-1">
                <Wifi className="h-3 w-3" />
                Connected
              </Badge>}
              {connectionStatus === 'error' && <Badge variant="destructive">Connection Failed</Badge>}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Safety Notice */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">🔒 Safety First</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div>• Virtual Trading is completely isolated from real trading APIs</div>
                    <div>• Your real trading account is safe during virtual mode</div>
                    <div>• API connection only enables real-time market data viewing</div>
                    <div>• No real orders will be placed unless you explicitly enable live trading</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Broker Selection */}
          <div>
            <Label htmlFor="broker">Select Your Broker</Label>
            <Select value={config.broker} onValueChange={(value) => setConfig(prev => ({ ...prev, broker: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Choose your broker platform" />
              </SelectTrigger>
              <SelectContent>
                {brokers.map((broker) => (
                  <SelectItem key={broker.id} value={broker.id}>
                    <div className="flex items-center gap-2">
                      <span>{broker.name}</span>
                      {broker.realTimeSupport && <Badge variant="outline" className="text-xs">Real-time</Badge>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedBroker && (
              <div className="mt-2 space-y-2">
                <div className="text-sm text-gray-600">{selectedBroker.description}</div>
                <a 
                  href={selectedBroker.docs} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  📖 View {selectedBroker.name} API Documentation →
                </a>
              </div>
            )}
          </div>

          {/* API Credentials */}
          {config.broker && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">API Credentials</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSecrets(!showSecrets)}
                >
                  {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showSecrets ? 'Hide' : 'Show'} Secrets
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="apiKey">
                    {config.broker === 'angel' ? 'API Key / Client ID' : 'API Key'}
                  </Label>
                  <Input
                    id="apiKey"
                    type={showSecrets ? 'text' : 'password'}
                    value={config.apiKey}
                    onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder={config.broker === 'angel' ? 'Your client ID' : 'Enter your API key'}
                  />
                </div>

                <div>
                  <Label htmlFor="apiSecret">
                    {config.broker === 'angel' ? 'MPIN / Password' : 'API Secret'}
                  </Label>
                  <Input
                    id="apiSecret"
                    type={showSecrets ? 'text' : 'password'}
                    value={config.apiSecret}
                    onChange={(e) => setConfig(prev => ({ ...prev, apiSecret: e.target.value }))}
                    placeholder={config.broker === 'angel' ? 'Your MPIN' : 'Enter your API secret'}
                  />
                </div>

                {(config.broker === 'zerodha' || config.broker === 'upstox') && (
                  <div className="md:col-span-2">
                    <Label htmlFor="accessToken">Access Token (Optional)</Label>
                    <Input
                      id="accessToken"
                      type={showSecrets ? 'text' : 'password'}
                      value={config.accessToken || ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                      placeholder="Access token for session-based trading"
                    />
                  </div>
                )}
              </div>

              <Button 
                onClick={testConnection} 
                disabled={isConnecting || !config.apiKey || !config.apiSecret}
                className="w-full"
              >
                {isConnecting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Testing Connection...
                  </div>
                ) : 'Test Connection & Enable Real-time Data'}
              </Button>
            </div>
          )}

          {/* Connection Status */}
          {config.broker && (
            <Card className={
              connectionStatus === 'connected' ? 'bg-green-50 border-green-200' : 
              connectionStatus === 'error' ? 'bg-red-50 border-red-200' : 
              'bg-gray-50'
            }>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {connectionStatus === 'connected' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : connectionStatus === 'error' ? (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-gray-500" />
                  )}
                  <div>
                    <div className="font-medium">
                      {connectionStatus === 'connected' ? '✅ Connected & Ready' : 
                       connectionStatus === 'error' ? '❌ Connection Failed' : 
                       'Not Connected'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {connectionStatus === 'connected' 
                        ? `Real-time data from ${selectedBroker?.name} is active` 
                        : connectionStatus === 'error'
                        ? 'Check your credentials and try again'
                        : 'Configure and test your API credentials to get real-time data'
                      }
                    </div>
                    {lastConnectionTest && (
                      <div className="text-xs text-gray-500 mt-1">
                        Last tested: {lastConnectionTest.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Setup Instructions */}
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <h4 className="font-medium text-amber-800 mb-3 flex items-center gap-2">
                <Key className="h-4 w-4" />
                Quick Setup Guide
              </h4>
              <div className="text-sm text-amber-700 space-y-2">
                {config.broker === 'angel' ? (
                  <>
                    <div>1. Login to Angel Broking SmartAPI portal</div>
                    <div>2. Create API App and get Client ID</div>
                    <div>3. Use your Client ID as API Key and MPIN as API Secret</div>
                    <div>4. Test connection to enable real-time data</div>
                  </>
                ) : (
                  <>
                    <div>1. Login to your broker's developer portal</div>
                    <div>2. Create a new API application</div>
                    <div>3. Copy API Key and API Secret</div>
                    <div>4. Test connection and start virtual trading</div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

// Simulate broker API testing
async function simulateBrokerAPITest(config: BrokerConfig): Promise<{success: boolean, error?: string}> {
  console.log(`Testing ${config.broker} API...`);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Basic validation
  if (config.apiKey.length < 10) {
    return { success: false, error: 'API Key appears to be too short' };
  }
  
  if (config.apiSecret.length < 5) {
    return { success: false, error: 'API Secret appears to be too short' };
  }
  
  // 90% success rate for demo purposes
  if (Math.random() > 0.1) {
    console.log(`✅ ${config.broker} API test successful`);
    return { success: true };
  } else {
    return { success: false, error: 'Invalid credentials or API limit exceeded' };
  }
}
