
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Settings, Key, CheckCircle, AlertTriangle, Eye, EyeOff, Shield, Wifi, XCircle } from 'lucide-react';
import { marketDataService, type BrokerConfig } from '@/services/MarketDataService';
import { BrokerAuthService } from '@/services/BrokerAuthService';

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
  
  const [clientId, setClientId] = useState(''); // For Angel Broking
  const [showSecrets, setShowSecrets] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');
  const [lastConnectionTest, setLastConnectionTest] = useState<Date | null>(null);
  const [connectionError, setConnectionError] = useState<string>('');
  const [isRealConnection, setIsRealConnection] = useState(false);

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
    }
  ];

  const testConnection = async () => {
    if (!config.broker || !config.apiKey || !config.apiSecret) {
      alert('Please select a broker and enter all required credentials');
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('disconnected');
    setConnectionError('');
    setIsRealConnection(false);
    
    try {
      console.log(`🔐 Testing REAL ${config.broker} credentials...`);
      
      // Test with REAL broker API
      const testResult = await BrokerAuthService.testBrokerCredentials(
        config.broker,
        config.apiKey,
        config.apiSecret,
        config.accessToken,
        clientId
      );
      
      console.log('🔐 Authentication test result:', testResult);
      
      if (testResult.success) {
        setConnectionStatus('connected');
        setIsRealConnection(testResult.realConnection);
        onConfigured(true);
        setLastConnectionTest(new Date());
        
        // Only set the config if authentication was successful
        marketDataService.setApiConfig(config);
        
        console.log('✅ REAL API Connection successful!');
        alert(`✅ Successfully authenticated with ${config.broker}!\n\n🔐 Real broker connection established\n📡 Real-time market data is now available`);
        
        try {
          await marketDataService.connect();
          console.log('📡 Real-time data connection established');
        } catch (error) {
          console.warn('Real-time data connection failed, but auth was successful');
        }
        
      } else {
        setConnectionStatus('error');
        setConnectionError(testResult.error || 'Authentication failed');
        setIsRealConnection(testResult.realConnection);
        onConfigured(false);
        
        console.error('❌ Authentication failed:', testResult.error);
        
        if (testResult.realConnection) {
          alert(`❌ Authentication Failed\n\n🔐 Your ${config.broker} credentials are incorrect:\n${testResult.error}\n\nPlease check your API key, secret, and try again.`);
        } else {
          alert(`❌ Connection Failed\n\n🌐 Cannot reach ${config.broker} API:\n${testResult.error}\n\nPlease check your internet connection.`);
        }
      }
      
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      setConnectionStatus('error');
      setConnectionError('Connection test failed. Please check your credentials.');
      setIsRealConnection(false);
      onConfigured(false);
      alert('❌ Connection test failed. Please check your credentials and try again.');
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
                <CheckCircle className="h-3 w-3" />
                {isRealConnection ? 'REAL CONNECTION' : 'Simulated'}
              </Badge>}
              {connectionStatus === 'error' && <Badge variant="destructive" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Authentication Failed
              </Badge>}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Security Warning */}
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800 mb-2">🔐 Real Credential Testing</h4>
                  <div className="text-sm text-red-700 space-y-1">
                    <div>• Your credentials are tested against REAL broker APIs</div>
                    <div>• Invalid credentials will be REJECTED by the broker</div>
                    <div>• Only successful authentication enables real data</div>
                    <div>• Test with wrong credentials first to verify security</div>
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
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type={showSecrets ? 'text' : 'password'}
                    value={config.apiKey}
                    onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Enter your API key"
                  />
                </div>

                <div>
                  <Label htmlFor="apiSecret">
                    {config.broker === 'angel' ? 'MPIN/Password' : 'API Secret'}
                  </Label>
                  <Input
                    id="apiSecret"
                    type={showSecrets ? 'text' : 'password'}
                    value={config.apiSecret}
                    onChange={(e) => setConfig(prev => ({ ...prev, apiSecret: e.target.value }))}
                    placeholder={config.broker === 'angel' ? 'Your MPIN' : 'Enter your API secret'}
                  />
                </div>

                {config.broker === 'angel' && (
                  <div>
                    <Label htmlFor="clientId">Client ID (Optional)</Label>
                    <Input
                      id="clientId"
                      type="text"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      placeholder="Your client ID (if different from API key)"
                    />
                  </div>
                )}

                {config.broker === 'zerodha' && (
                  <div>
                    <Label htmlFor="accessToken">Access Token</Label>
                    <Input
                      id="accessToken"
                      type={showSecrets ? 'text' : 'password'}
                      value={config.accessToken || ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                      placeholder="Required for Zerodha"
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
                    Testing Real Credentials...
                  </div>
                ) : '🔐 Test Real Broker Credentials'}
              </Button>
            </div>
          )}

          {/* Connection Status */}
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
                  <XCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-gray-500" />
                )}
                <div>
                  <div className="font-medium">
                    {connectionStatus === 'connected' ? '✅ Authenticated Successfully' : 
                     connectionStatus === 'error' ? '❌ Authentication Failed' : 
                     'Not Connected'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {connectionStatus === 'connected' 
                      ? `${isRealConnection ? 'REAL' : 'SIMULATED'} connection to ${selectedBroker?.name}` 
                      : connectionStatus === 'error'
                      ? connectionError
                      : 'Enter your broker credentials and test the connection'
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

          {/* Test Instructions */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <h4 className="font-medium text-yellow-800 mb-3">🧪 Testing Instructions</h4>
              <div className="text-sm text-yellow-700 space-y-2">
                <div><strong>Step 1:</strong> Try with WRONG credentials first</div>
                <div><strong>Step 2:</strong> Verify it shows "Authentication Failed"</div>
                <div><strong>Step 3:</strong> Enter your REAL credentials</div>
                <div><strong>Step 4:</strong> Verify it shows "Authenticated Successfully"</div>
                <div className="mt-2 p-2 bg-yellow-100 rounded text-xs">
                  <strong>Security:</strong> Only valid credentials will pass authentication
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};
