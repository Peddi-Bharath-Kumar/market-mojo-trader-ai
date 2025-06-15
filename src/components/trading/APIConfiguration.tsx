import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from '@/hooks/use-toast';
import { brokerAccountService, BrokerCredentials } from '@/services/BrokerAccountService';
import { marketDataService } from '@/services/MarketDataService';

interface APIConfigurationProps {
  onConfigured: (configured: boolean) => void;
  isConfigured: boolean;
}

export const APIConfiguration: React.FC<APIConfigurationProps> = ({ onConfigured, isConfigured }) => {
  const [broker, setBroker] = useState<BrokerCredentials['broker'] | ''>('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [userId, setUserId] = useState('');
  const [pin, setPin] = useState('');
  const [totp, setTotp] = useState('');
  const [requestToken, setRequestToken] = useState('');
  const [authMethod, setAuthMethod] = useState<'password' | 'session'>('password');
  const [sessionToken, setSessionToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [clientId, setClientId] = useState('');
  const [portfolioAccessInfo, setPortfolioAccessInfo] = useState<'full' | 'balance-only' | 'none' | 'unknown'>('unknown');

  useEffect(() => {
    const savedCredentials = localStorage.getItem('trading-credentials');
    if (savedCredentials) {
      try {
        const credentials = JSON.parse(savedCredentials);
        setBroker(credentials.broker || '');
        setApiKey(credentials.apiKey || '');
        setApiSecret(credentials.apiSecret || '');
        setAccessToken(credentials.accessToken || '');
        setUserId(credentials.userId || '');
        setPin(credentials.pin || '');
        setRequestToken(credentials.requestToken || '');
        setAuthMethod(credentials.authMethod || 'password');
        setSessionToken(credentials.sessionToken || '');
        setIsAuthenticated(credentials.isAuthenticated || false);
        setClientId(credentials.clientId || '');
        onConfigured(credentials.isAuthenticated || false);
      } catch (error) {
        console.error('Failed to load credentials:', error);
      }
    }
  }, [onConfigured]);

  useEffect(() => {
    if (isConfigured) {
      // Fetch portfolio access info when the component is configured
      const fetchPortfolioAccessInfo = async () => {
        try {
          const accountData = await brokerAccountService.fetchRealAccountData();
          setPortfolioAccessInfo(accountData.hasPortfolioDataAccess ? (accountData.portfolioError ? 'balance-only' : 'full') : 'none');
        } catch (error) {
          console.error('Failed to fetch portfolio access info:', error);
          setPortfolioAccessInfo('unknown');
        }
      };

      fetchPortfolioAccessInfo();
    }
  }, [isConfigured]);

  const { toast } = useToast();

  const handleTestConnection = async () => {
    setIsLoading(true);
    setAuthError(null);

    try {
      let finalAccessToken = broker === 'angel' ? sessionToken : accessToken;

      // For Angel Broking with password, perform authentication to get a session token
      if (broker === 'angel' && authMethod === 'password') {
        console.log('🔑 Authenticating with Angel Broking using password...');
        const authResponse = await fetch('https://apiconnect.angelbroking.com/rest/auth/angelbroking/user/v1/loginByPassword', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-UserType': 'USER',
            'X-SourceID': 'WEB',
            'X-ClientLocalIP': '192.168.1.1',
            'X-ClientPublicIP': '106.193.147.98',
            'X-MACAddress': 'fe80::216:3eff:fe1d:e1d1',
            'X-PrivateKey': apiKey
          },
          body: JSON.stringify({
            clientcode: clientId,
            password: pin,
            totp: totp,
          })
        });

        const authData = await authResponse.json();
        if (!authResponse.ok || !authData.status || !authData.data?.jwtToken) {
          throw new Error(authData.message || 'Angel Broking authentication failed. Check credentials and TOTP.');
        }

        finalAccessToken = authData.data.jwtToken;
        console.log('✅ Angel Broking authenticated successfully. Received session token.');
        setSessionToken(finalAccessToken);
      }

      if (!finalAccessToken) {
        throw new Error("Access Token not available. Please check your configuration.");
      }

      // Now test connection with the final token
      console.log('🔄 Testing broker connection with token...');

      const serviceCredentials: BrokerCredentials = {
        broker: broker as BrokerCredentials['broker'],
        apiKey: apiKey,
        apiSecret: broker === 'angel' ? clientId : apiSecret,
        accessToken: finalAccessToken,
        userId: broker === 'angel' ? clientId : userId,
      };

      brokerAccountService.setCredentials(serviceCredentials);
      const accountData = await brokerAccountService.fetchRealAccountData();

      if (!accountData || !accountData.accountId) {
        throw new Error('Failed to fetch account data after authentication.');
      }

      console.log('✅ Broker connection successful!');
      toast({ title: 'Connection Successful', description: `Connected to ${broker} successfully.` });
      setPortfolioAccessInfo(accountData.hasPortfolioDataAccess ? (accountData.portfolioError ? 'balance-only' : 'full') : 'none');
      
      const storableCredentials = {
        ...serviceCredentials,
        broker: broker as 'angel' | 'zerodha',
        pin: broker === 'angel' ? pin : '',
        requestToken: broker === 'zerodha' ? requestToken : '',
        authMethod: broker === 'angel' ? authMethod : '',
        sessionToken: broker === 'angel' ? finalAccessToken : '', // Store the new session token
        isAuthenticated: true,
        clientId: broker === 'angel' ? clientId : '',
      };
      localStorage.setItem('trading-credentials', JSON.stringify(storableCredentials));
      
      marketDataService.setApiConfig({
        broker: broker as 'angel' | 'zerodha' | 'upstox',
        apiKey: apiKey,
        apiSecret: broker === 'angel' ? clientId : apiSecret,
        accessToken: finalAccessToken,
      });

      onConfigured(true);
      setIsAuthenticated(true);

    } catch (error: any) {
      console.error('❌ Connection test failed:', error);
      setAuthError(`Connection Failed: ${error.message}. Please check your credentials.`);
      onConfigured(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('trading-credentials');
    setApiKey('');
    setApiSecret('');
    setAccessToken('');
    setUserId('');
    setPin('');
    setTotp('');
    setRequestToken('');
    setAuthMethod('password');
    setSessionToken('');
    setIsAuthenticated(false);
    onConfigured(false);
    toast({ title: 'Disconnected', description: 'Broker account disconnected.' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Key Configuration</CardTitle>
        <CardDescription>
          Connect your stock broker account to enable live trading and real-time data.
          Your credentials are saved securely in your browser's local storage.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="broker">Broker</Label>
            <Select value={broker} onValueChange={(value: BrokerCredentials['broker']) => setBroker(value)}>
              <SelectTrigger><SelectValue placeholder="Select Broker" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="angel">Angel Broking</SelectItem>
                <SelectItem value="zerodha">Zerodha</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="apiKey">API Key</Label>
            <Input id="apiKey" type="text" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
          </div>
          {broker === 'angel' ? (
            <>
              <div>
                <Label htmlFor="clientId">Client ID</Label>
                <Input id="clientId" type="text" value={clientId} onChange={(e) => setClientId(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="authMethod">Auth Method</Label>
                <Select value={authMethod} onValueChange={(value: 'password' | 'session') => setAuthMethod(value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="password">PIN + TOTP</SelectItem>
                    {/* <SelectItem value="session">Session Token</SelectItem> */}
                  </SelectContent>
                </Select>
              </div>
              {authMethod === 'password' && (
                <>
                  <div>
                    <Label htmlFor="pin">PIN</Label>
                    <Input id="pin" type="password" value={pin} onChange={(e) => setPin(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="totp">TOTP</Label>
                    <Input id="totp" type="text" value={totp} onChange={(e) => setTotp(e.target.value)} placeholder="Enter TOTP from Authenticator App" />
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="apiSecret">API Secret</Label>
                <Input id="apiSecret" type="text" value={apiSecret} onChange={(e) => setApiSecret(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="accessToken">Access Token</Label>
                <Input id="accessToken" type="text" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} />
              </div>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        {authError && <div className="text-red-500 text-sm">{authError}</div>}
        <div>
          <Button variant="outline" onClick={handleDisconnect}>Disconnect</Button>
          <Button className="ml-2" onClick={handleTestConnection} disabled={isLoading}>
            {isLoading ? 'Testing Connection...' : 'Test Connection'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
