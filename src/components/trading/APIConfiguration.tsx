
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  Shield,
  Key,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { brokerAccountService } from '@/services/BrokerAccountService';
import { marketDataService } from '@/services/MarketDataService';

interface APIConfigurationProps {
  onConfigured: (configured: boolean) => void;
  isConfigured: boolean;
}

export const APIConfiguration: React.FC<APIConfigurationProps> = ({ onConfigured, isConfigured }) => {
  const [broker, setBroker] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [clientId, setClientId] = useState('');
  const [pin, setPin] = useState('');
  const [totp, setTotp] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [requestToken, setRequestToken] = useState('');
  const [authMethod, setAuthMethod] = useState('password');
  const [sessionToken, setSessionToken] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showTotp, setShowTotp] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const { toast } = useToast();

  // Load saved credentials on component mount
  useEffect(() => {
    const savedCredentials = localStorage.getItem('trading-credentials');
    if (savedCredentials) {
      try {
        const credentials = JSON.parse(savedCredentials);
        console.log('🔄 Loading saved credentials...');
        
        setBroker(credentials.broker || '');
        setApiKey(credentials.apiKey || '');
        setApiSecret(credentials.apiSecret || '');
        setClientId(credentials.clientId || '');
        setPin(credentials.pin || '');
        setAccessToken(credentials.accessToken || '');
        setRequestToken(credentials.requestToken || '');
        setAuthMethod(credentials.authMethod || 'password');
        setSessionToken(credentials.sessionToken || '');
        setIsAuthenticated(credentials.isAuthenticated || false);
        
        if (credentials.isAuthenticated) {
          setConnectionStatus('connected');
          onConfigured(true);
          console.log('✅ Restored authenticated session');
        }
      } catch (error) {
        console.error('❌ Failed to load saved credentials:', error);
      }
    }
  }, [onConfigured]);

  const saveCredentials = (credentials: any) => {
    localStorage.setItem('trading-credentials', JSON.stringify(credentials));
    console.log('💾 Credentials saved to localStorage');
  };

  const testConnection = async () => {
    if (!broker) {
      setErrorMessage('Please select a broker');
      return;
    }

    if (!apiKey || !clientId) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    if (broker === 'angel' && (!pin || !totp)) {
      setErrorMessage('Angel Broking requires PIN and TOTP (6-digit authenticator code)');
      return;
    }

    if (broker === 'zerodha' && !apiSecret) {
      setErrorMessage('Zerodha requires API Secret');
      return;
    }

    setIsConnecting(true);
    setErrorMessage('');
    
    try {
      console.log('🔄 Testing broker connection...');
      
      const credentials = {
        broker,
        apiKey,
        apiSecret: broker === 'angel' ? clientId : apiSecret,
        clientId,
        pin,
        totp: broker === 'angel' ? totp : undefined,
        accessToken: broker === 'angel' ? 
          (authMethod === 'session' ? sessionToken : pin) : 
          accessToken,
        requestToken,
        authMethod,
        sessionToken,
        isAuthenticated: false
      };

      // Set credentials in broker service
      brokerAccountService.setCredentials(credentials);
      
      // Test actual connection by fetching account data
      console.log('🧪 Testing real broker API connection...');
      const accountData = await brokerAccountService.fetchRealAccountData();
      
      if (accountData && !accountData.accountId.startsWith('SIM_')) {
        // Real connection successful
        credentials.isAuthenticated = true;
        saveCredentials(credentials);
        
        setConnectionStatus('connected');
        setIsAuthenticated(true);
        onConfigured(true);
        
        // Configure market data service
        marketDataService.setApiConfig({
          broker,
          apiKey,
          apiSecret: broker === 'angel' ? clientId : apiSecret,
          accessToken: broker === 'angel' ? 
            (authMethod === 'session' ? sessionToken : pin) : 
            accessToken
        });
        
        // Start real-time updates
        brokerAccountService.startRealTimeUpdates();
        
        console.log('✅ Real broker connection established successfully');
        toast({
          title: "Connection Successful!",
          description: `Connected to ${broker.toUpperCase()} with real account data`,
        });
        
        // Clear TOTP after successful authentication for security
        setTotp('');
        
      } else {
        throw new Error('Failed to get real account data');
      }
      
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      setConnectionStatus('error');
      setIsAuthenticated(false);
      
      const errorMsg = error instanceof Error ? error.message : 'Connection failed';
      setErrorMessage(errorMsg);
      
      // Save partial credentials (without authentication flag)
      const partialCredentials = {
        broker,
        apiKey,
        apiSecret: broker === 'angel' ? clientId : apiSecret,
        clientId,
        pin,
        accessToken,
        requestToken,
        authMethod,
        sessionToken,
        isAuthenticated: false
      };
      saveCredentials(partialCredentials);
      
      toast({
        title: "Connection Failed",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    // Clear all credentials
    setBroker('');
    setApiKey('');
    setApiSecret('');
    setClientId('');
    setPin('');
    setTotp('');
    setAccessToken('');
    setRequestToken('');
    setSessionToken('');
    setConnectionStatus('disconnected');
    setIsAuthenticated(false);
    setErrorMessage('');
    
    // Clear saved credentials
    localStorage.removeItem('trading-credentials');
    
    onConfigured(false);
    
    toast({
      title: "Disconnected",
      description: "Broker connection has been removed",
    });
  };

  const refreshConnection = () => {
    if (isAuthenticated) {
      testConnection();
    }
  };

  const getConnectionIcon = () => {
    if (isConnecting) return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
    if (connectionStatus === 'connected') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (connectionStatus === 'error') return <AlertTriangle className="h-4 w-4 text-red-500" />;
    return <WifiOff className="h-4 w-4 text-gray-500" />;
  };

  const getStatusText = () => {
    if (isConnecting) return 'Testing Connection...';
    if (connectionStatus === 'connected') return 'Connected & Authenticated';
    if (connectionStatus === 'error') return 'Connection Failed';
    return 'Not Connected';
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className={`${connectionStatus === 'connected' ? 'bg-green-50 border-green-200' : 
                        connectionStatus === 'error' ? 'bg-red-50 border-red-200' : 
                        'bg-gray-50 border-gray-200'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getConnectionIcon()}
              <div>
                <div className="font-medium">{getStatusText()}</div>
                {connectionStatus === 'connected' && (
                  <div className="text-sm text-green-600">
                    Broker: {broker.toUpperCase()} | Client: {clientId}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {connectionStatus === 'connected' && (
                <>
                  <Button variant="outline" size="sm" onClick={refreshConnection}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh
                  </Button>
                  <Button variant="destructive" size="sm" onClick={disconnect}>
                    Disconnect
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Broker API Configuration
            {isAuthenticated && (
              <Badge className="bg-green-600 text-white">AUTHENTICATED</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Broker Selection */}
          <div>
            <Label htmlFor="broker">Select Broker</Label>
            <Select value={broker} onValueChange={setBroker} disabled={isAuthenticated}>
              <SelectTrigger>
                <SelectValue placeholder="Choose your broker" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="angel">Angel Broking (Angel One)</SelectItem>
                <SelectItem value="zerodha">Zerodha Kite Connect</SelectItem>
                <SelectItem value="upstox">Upstox (Coming Soon)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Common Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                disabled={isAuthenticated}
              />
            </div>
            <div>
              <Label htmlFor="clientId">Client ID / User ID</Label>
              <Input
                id="clientId"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Enter your client ID"
                disabled={isAuthenticated}
              />
            </div>
          </div>

          {/* Angel Broking Specific Fields */}
          {broker === 'angel' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pin">PIN / Password</Label>
                  <div className="relative">
                    <Input
                      id="pin"
                      type={showPassword ? "text" : "password"}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="Enter your PIN/Password"
                      disabled={isAuthenticated}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isAuthenticated}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="totp">TOTP (Authenticator Code)</Label>
                  <div className="relative">
                    <Input
                      id="totp"
                      type={showTotp ? "text" : "password"}
                      value={totp}
                      onChange={(e) => setTotp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6-digit code"
                      maxLength={6}
                      disabled={isAuthenticated}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowTotp(!showTotp)}
                      disabled={isAuthenticated}
                    >
                      {showTotp ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    Enter the current 6-digit code from your authenticator app
                  </div>
                </div>
              </div>
              
              {/* Angel Auth Method */}
              <div>
                <Label>Authentication Method</Label>
                <Select value={authMethod} onValueChange={setAuthMethod} disabled={isAuthenticated}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="password">Password + TOTP</SelectItem>
                    <SelectItem value="session">Session Token</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {authMethod === 'session' && (
                <div>
                  <Label htmlFor="sessionToken">Session Token</Label>
                  <Input
                    id="sessionToken"
                    value={sessionToken}
                    onChange={(e) => setSessionToken(e.target.value)}
                    placeholder="Enter session token"
                    disabled={isAuthenticated}
                  />
                </div>
              )}
            </>
          )}

          {/* Zerodha Specific Fields */}
          {broker === 'zerodha' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="apiSecret">API Secret</Label>
                <Input
                  id="apiSecret"
                  type="password"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  placeholder="Enter your API secret"
                  disabled={isAuthenticated}
                />
              </div>
              <div>
                <Label htmlFor="accessToken">Access Token</Label>
                <Input
                  id="accessToken"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Enter access token (optional)"
                  disabled={isAuthenticated}
                />
              </div>
            </div>
          )}

          {/* Error Display */}
          {errorMessage && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Connection Button */}
          {!isAuthenticated && (
            <Button 
              onClick={testConnection} 
              disabled={isConnecting || !broker}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <Wifi className="h-4 w-4 mr-2" />
                  Test & Connect to Broker
                </>
              )}
            </Button>
          )}

          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
            <div className="flex items-center gap-2 text-blue-800 font-medium mb-1">
              <Shield className="h-4 w-4" />
              Security Notice
            </div>
            <div className="text-blue-700">
              • Your credentials are stored locally in your browser only
              • TOTP codes are not stored and cleared after authentication
              • Always use official API keys from your broker's developer portal
              • Never share your API credentials with anyone
            </div>
          </div>

          {/* Angel Broking TOTP Instructions */}
          {broker === 'angel' && (
            <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm">
              <div className="flex items-center gap-2 text-amber-800 font-medium mb-1">
                <Key className="h-4 w-4" />
                Angel Broking TOTP Setup
              </div>
              <div className="text-amber-700">
                • Download Google Authenticator or similar TOTP app
                • Scan the QR code from your Angel Broking account settings
                • Enter the current 6-digit code in the TOTP field above
                • TOTP codes refresh every 30 seconds
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
