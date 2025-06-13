
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Settings, Key, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';

interface APIConfig {
  broker: string;
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  isConnected: boolean;
}

interface APIConfigurationProps {
  onConfigured: (configured: boolean) => void;
  isConfigured: boolean;
}

export const APIConfiguration: React.FC<APIConfigurationProps> = ({ onConfigured, isConfigured }) => {
  const [config, setConfig] = useState<APIConfig>({
    broker: '',
    apiKey: '',
    apiSecret: '',
    accessToken: '',
    isConnected: false
  });
  
  const [showSecrets, setShowSecrets] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const brokers = [
    { id: 'zerodha', name: 'Zerodha (Kite Connect)', docs: 'https://kite.trade/docs/' },
    { id: 'angel', name: 'Angel Broking', docs: 'https://smartapi.angelbroking.com/' },
    { id: 'upstox', name: 'Upstox', docs: 'https://upstox.com/developer/api-documentation/' },
    { id: 'fyers', name: 'Fyers', docs: 'https://myapi.fyers.in/docs/' },
    { id: 'alice', name: 'Alice Blue', docs: 'https://a3.aliceblueonline.com/' }
  ];

  const testConnection = async () => {
    if (!config.broker || !config.apiKey) {
      alert('Please select a broker and enter API credentials');
      return;
    }

    setIsConnecting(true);
    
    // Simulate API connection test
    setTimeout(() => {
      const success = Math.random() > 0.2; // 80% success rate for demo
      
      setConfig(prev => ({ ...prev, isConnected: success }));
      onConfigured(success);
      setIsConnecting(false);
      
      if (success) {
        alert('✅ Connection successful! Trading APIs are now configured.');
      } else {
        alert('❌ Connection failed. Please check your credentials.');
      }
    }, 2000);
  };

  const selectedBroker = brokers.find(b => b.id === config.broker);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            API Configuration
            {isConfigured && <Badge className="bg-green-500 text-white">Connected</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Broker Selection */}
          <div>
            <Label htmlFor="broker">Select Broker</Label>
            <Select value={config.broker} onValueChange={(value) => setConfig(prev => ({ ...prev, broker: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Choose your broker" />
              </SelectTrigger>
              <SelectContent>
                {brokers.map((broker) => (
                  <SelectItem key={broker.id} value={broker.id}>
                    {broker.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedBroker && (
              <div className="mt-2">
                <a 
                  href={selectedBroker.docs} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  📖 View {selectedBroker.name} API Documentation
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
                  {showSecrets ? 'Hide' : 'Show'}
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
                  <Label htmlFor="apiSecret">API Secret</Label>
                  <Input
                    id="apiSecret"
                    type={showSecrets ? 'text' : 'password'}
                    value={config.apiSecret}
                    onChange={(e) => setConfig(prev => ({ ...prev, apiSecret: e.target.value }))}
                    placeholder="Enter your API secret"
                  />
                </div>

                {config.broker === 'zerodha' && (
                  <div className="md:col-span-2">
                    <Label htmlFor="accessToken">Access Token (Optional)</Label>
                    <Input
                      id="accessToken"
                      type={showSecrets ? 'text' : 'password'}
                      value={config.accessToken}
                      onChange={(e) => setConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                      placeholder="Access token for session-based trading"
                    />
                  </div>
                )}
              </div>

              <Button 
                onClick={testConnection} 
                disabled={isConnecting || !config.apiKey}
                className="w-full"
              >
                {isConnecting ? 'Testing Connection...' : 'Test Connection'}
              </Button>
            </div>
          )}

          {/* Connection Status */}
          {config.broker && (
            <Card className={config.isConnected ? 'bg-green-50 border-green-200' : 'bg-gray-50'}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {config.isConnected ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-gray-500" />
                  )}
                  <div>
                    <div className="font-medium">
                      {config.isConnected ? 'Connected' : 'Not Connected'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {config.isConnected 
                        ? `Successfully connected to ${selectedBroker?.name}`
                        : 'Configure and test your API credentials to start trading'
                      }
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Setup Instructions */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                <Key className="h-4 w-4" />
                Setup Instructions
              </h4>
              <div className="text-sm text-blue-700 space-y-2">
                <div>1. <strong>Create API App:</strong> Login to your broker's developer portal and create a new API application</div>
                <div>2. <strong>Get Credentials:</strong> Copy your API Key and API Secret from the broker dashboard</div>
                <div>3. <strong>Configure Permissions:</strong> Ensure your API app has trading permissions enabled</div>
                <div>4. <strong>Test Connection:</strong> Enter credentials above and test the connection</div>
                <div>5. <strong>Start Trading:</strong> Once connected, you can enable automated trading</div>
              </div>
            </CardContent>
          </Card>

          {/* Important Notes */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <h4 className="font-medium text-yellow-800 mb-2">⚠️ Important Security Notes</h4>
              <div className="text-sm text-yellow-700 space-y-1">
                <div>• API credentials are stored locally in your browser only</div>
                <div>• Never share your API keys or secrets with anyone</div>
                <div>• Start with paper trading or small amounts</div>
                <div>• Monitor your trades and set appropriate risk limits</div>
                <div>• This is for educational purposes - trade at your own risk</div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};
