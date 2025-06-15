
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, Wifi, WifiOff, User, Briefcase, DollarSign, PieChart, AlertTriangle } from 'lucide-react';
import { marketDataService, type MarketTick, type Position } from '@/services/MarketDataService';
import { brokerAccountService, type BrokerAccount } from '@/services/BrokerAccountService';

interface MarketDataPanelProps {
  apiConfigured?: boolean;
}

export const MarketDataPanel: React.FC<MarketDataPanelProps> = ({ apiConfigured = false }) => {
  const [marketData, setMarketData] = useState<MarketTick[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [brokerAccount, setBrokerAccount] = useState<BrokerAccount | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState('NIFTY50');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [realDataEnabled, setRealDataEnabled] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isRealBrokerConnected, setIsRealBrokerConnected] = useState(false);

  const symbols = ['NIFTY50', 'BANKNIFTY', 'RELIANCE', 'TCS', 'HDFC', 'INFY', 'ITC', 'ICICIBANK', 'SBIN', 'BHARTIARTL'];

  // Check for saved credentials and validate real connection
  useEffect(() => {
    console.log('🔄 MarketDataPanel: Checking for authenticated broker connection...');
    const savedCredentials = localStorage.getItem('trading-credentials');
    if (savedCredentials) {
      try {
        const credentials = JSON.parse(savedCredentials);
        if (credentials.isAuthenticated) {
          console.log('✅ Found authenticated credentials, testing real broker connection...');
          setRealDataEnabled(true);
          
          // Set broker credentials
          brokerAccountService.setCredentials(credentials);
          
          // Set market data API config
          marketDataService.setApiConfig({
            broker: credentials.broker,
            apiKey: credentials.apiKey,
            apiSecret: credentials.broker === 'angel' ? credentials.clientId : credentials.apiSecret,
            accessToken: credentials.broker === 'angel' ? 
              (credentials.authMethod === 'session' ? credentials.sessionToken : credentials.password) : 
              credentials.accessToken
          });
          
          // Test real broker connection
          testRealBrokerConnection();
          
          console.log('🔗 Market data service configured for:', credentials.broker);
        }
      } catch (error) {
        console.error('❌ Failed to restore credentials:', error);
        setConnectionError('Failed to restore saved credentials');
      }
    } else {
      console.warn('⚠️ No saved credentials found - real broker data not available');
      setConnectionError('No broker credentials configured');
    }
  }, []);

  const testRealBrokerConnection = async () => {
    try {
      console.log('🧪 Testing real broker API connection...');
      const accountData = await brokerAccountService.fetchRealAccountData();
      
      if (accountData && accountData.accountId && !accountData.accountId.startsWith('SIM_')) {
        console.log('✅ REAL broker connection successful!');
        setIsRealBrokerConnected(true);
        setBrokerAccount(accountData);
        setConnectionError(null);
        
        // Extract real positions
        const brokerPositions: Position[] = accountData.positions.map(pos => ({
          symbol: pos.symbol,
          quantity: pos.quantity,
          averagePrice: pos.averagePrice,
          currentPrice: pos.currentPrice,
          pnl: pos.pnl,
          pnlPercent: pos.pnlPercent,
          type: pos.quantity > 0 ? 'long' : 'short'
        }));
        setPositions(brokerPositions);
        
        console.log(`📊 Loaded ${brokerPositions.length} REAL positions from broker`);
        
        // Subscribe to real-time account updates
        brokerAccountService.subscribe((account: BrokerAccount) => {
          console.log('📊 Real-time broker account update received');
          setBrokerAccount(account);
          
          const updatedPositions: Position[] = account.positions.map(pos => ({
            symbol: pos.symbol,
            quantity: pos.quantity,
            averagePrice: pos.averagePrice,
            currentPrice: pos.currentPrice,
            pnl: pos.pnl,
            pnlPercent: pos.pnlPercent,
            type: pos.quantity > 0 ? 'long' : 'short'
          }));
          setPositions(updatedPositions);
        });
        
      } else {
        console.warn('⚠️ Broker API returned simulated data - real connection failed');
        setIsRealBrokerConnected(false);
        setConnectionError('Broker API authentication failed - using simulation');
      }
    } catch (error) {
      console.error('❌ Real broker connection test failed:', error);
      setIsRealBrokerConnected(false);
      setConnectionError(`Broker API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  useEffect(() => {
    if (isConnected) {
      // Subscribe to market data for all symbols
      symbols.forEach(symbol => {
        marketDataService.subscribe(symbol, (tick: MarketTick) => {
          setMarketData(prev => {
            const filtered = prev.filter(item => item.symbol !== tick.symbol);
            return [...filtered, tick].sort((a, b) => a.symbol.localeCompare(b.symbol));
          });
        });
      });

      return () => {
        symbols.forEach(symbol => {
          marketDataService.unsubscribe(symbol);
        });
      };
    }
  }, [isConnected]);

  const connectToMarket = async () => {
    const savedCredentials = localStorage.getItem('trading-credentials');
    if (!savedCredentials) {
      setConnectionError('Please configure your broker API keys in the Config tab first');
      return;
    }

    try {
      const credentials = JSON.parse(savedCredentials);
      if (!credentials.isAuthenticated) {
        setConnectionError('Please authenticate your credentials in the Config tab first');
        return;
      }
    } catch (error) {
      setConnectionError('Invalid credentials found. Please reconfigure in the Config tab.');
      return;
    }

    setConnectionStatus('connecting');
    setConnectionError(null);
    console.log('🔗 Connecting to market data with real broker credentials...');

    try {
      // Test broker connection first
      await testRealBrokerConnection();
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await marketDataService.connect();
      setIsConnected(true);
      setConnectionStatus('connected');
      
      console.log('✅ Successfully connected to market data');
      
      if (isRealBrokerConnected) {
        console.log('🎉 Using REAL broker data');
      } else {
        console.warn('⚠️ Using simulated data - real broker connection failed');
        setConnectionError('Real broker API unavailable - using simulation');
      }
      
    } catch (error) {
      console.error('❌ Failed to connect to market data:', error);
      setConnectionStatus('error');
      setConnectionError(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const disconnectFromMarket = () => {
    marketDataService.disconnect();
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setMarketData([]);
    setConnectionError(null);
    console.log('🔌 Disconnected from market data feed');
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <Activity className="h-4 w-4 text-yellow-500 animate-pulse" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-red-500" />;
    }
  };

  const getConnectionStatus = () => {
    switch (connectionStatus) {
      case 'connected':
        return isRealBrokerConnected ? 'Connected (Real Broker Data)' : 'Connected (Simulation - Broker API Failed)';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection Error';
      default:
        return 'Disconnected';
    }
  };

  const isMarketOpen = () => {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const currentTime = hour * 60 + minute;
    
    // Monday to Friday, 9:15 AM to 3:30 PM IST
    return day >= 1 && day <= 5 && currentTime >= 555 && currentTime <= 930;
  };

  return (
    <div className="space-y-6">
      {/* Connection Status Alert */}
      {connectionError && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <div className="font-medium text-red-800">Connection Issue</div>
                <div className="text-sm text-red-700">{connectionError}</div>
                <div className="text-xs text-red-600 mt-1">
                  All displayed data is simulated. Fix broker connection to see real data.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real Account Overview */}
      {brokerAccount && isRealBrokerConnected ? (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <DollarSign className="h-5 w-5" />
              Your Real Trading Account
              <Badge className="bg-green-600 text-white">LIVE BROKER DATA</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">₹{brokerAccount.availableBalance.toLocaleString()}</div>
                <div className="text-sm text-green-600">Available Balance</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-700">₹{brokerAccount.totalValue.toLocaleString()}</div>
                <div className="text-sm text-blue-600">Total Portfolio</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${brokerAccount.dayPnL >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {brokerAccount.dayPnL >= 0 ? '+' : ''}₹{brokerAccount.dayPnL.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Day P&L</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${brokerAccount.dayPnLPercent >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {brokerAccount.dayPnLPercent >= 0 ? '+' : ''}{brokerAccount.dayPnLPercent.toFixed(2)}%
                </div>
                <div className="text-sm text-gray-600">Day Return</div>
              </div>
            </div>
            <div className="mt-4 text-xs text-green-700 text-center">
              Account ID: {brokerAccount.accountId} • Real-time data from your broker
            </div>
          </CardContent>
        </Card>
      ) : brokerAccount && !isRealBrokerConnected ? (
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <div className="font-medium text-orange-800">Simulated Account Data</div>
                <div className="text-sm text-orange-700">
                  Broker API connection failed - showing simulated data for testing
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Market Data
            <div className="flex items-center gap-2">
              {getConnectionIcon()}
              <span className="text-sm text-gray-500">
                {getConnectionStatus()}
              </span>
              <Badge variant={isConnected ? 'default' : 'secondary'}>
                {marketData.length} symbols
              </Badge>
              {positions.length > 0 && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {positions.length} positions
                </Badge>
              )}
              {isRealBrokerConnected ? (
                <Badge className="bg-green-600 text-white">
                  REAL BROKER
                </Badge>
              ) : (
                <Badge variant="destructive">
                  SIMULATION
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Market Status Banner */}
            <div className={`p-3 rounded-lg border ${isMarketOpen() ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
              <div className="flex items-center gap-2">
                <Activity className={`h-4 w-4 ${isMarketOpen() ? 'text-green-600' : 'text-orange-600'}`} />
                <span className={`font-medium ${isMarketOpen() ? 'text-green-800' : 'text-orange-800'}`}>
                  {isMarketOpen() ? 'Market is Open' : 'Market is Closed - Showing Last Known Prices'}
                </span>
                {isRealBrokerConnected ? (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                    Real Broker Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                    Broker API Failed - Simulation Mode
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex gap-4 items-end">
              <div>
                <Label htmlFor="symbol">Add Symbol</Label>
                <Input
                  id="symbol"
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value.toUpperCase())}
                  placeholder="Enter symbol (e.g., NIFTY50)"
                />
              </div>
              <Button 
                onClick={isConnected ? disconnectFromMarket : connectToMarket} 
                disabled={connectionStatus === 'connecting'}
                variant={isConnected ? 'destructive' : 'default'}
              >
                {connectionStatus === 'connecting' ? 'Connecting...' : 
                 isConnected ? 'Disconnect' : 'Connect to Market'}
              </Button>
            </div>

            {/* Your Positions Section */}
            {isConnected && positions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-lg">Your Trading Positions</h4>
                  <Badge variant="default">{positions.length} Active</Badge>
                  {isRealBrokerConnected ? (
                    <Badge className="bg-green-600 text-white text-xs">REAL POSITIONS</Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">SIMULATED</Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {positions.map((position, index) => (
                    <Card key={`${position.symbol}-${index}`} className={`border-l-4 ${position.pnl >= 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg">{position.symbol}</h3>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-blue-500" />
                            <span className="text-xs text-blue-600 font-medium">
                              {realDataEnabled ? 'REAL POSITION' : 'YOUR POSITION'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold">₹{position.currentPrice.toFixed(2)}</span>
                            <div className={`flex items-center gap-1 ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {position.pnl >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                              <span className="text-sm font-medium">
                                {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                            <div>Qty: {position.quantity}</div>
                            <div>Avg: ₹{position.averagePrice.toFixed(2)}</div>
                            <div className={`col-span-2 font-medium ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              P&L: {position.pnl >= 0 ? '+' : ''}₹{position.pnl.toFixed(2)}
                            </div>
                          </div>
                          
                          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                            Type: {position.type.toUpperCase()} Position
                            {realDataEnabled && <span className="ml-2 font-medium">(REAL)</span>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Market Data Grid */}
            <div className="space-y-4">
              <h4 className="font-medium">Market Watchlist</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {marketData.map((data) => (
                  <Card key={data.symbol} className={`border-l-4 ${data.change >= 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">{data.symbol}</h3>
                        <div className="flex items-center gap-1">
                          <Activity className={`h-3 w-3 ${isMarketOpen() ? 'text-blue-500 animate-pulse' : 'text-gray-400'}`} />
                          <span className="text-xs text-gray-500">
                            {isMarketOpen() ? (isRealBrokerConnected ? 'REAL' : 'SIM') : 'CLOSED'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold">₹{data.ltp.toFixed(2)}</span>
                          <div className={`flex items-center gap-1 ${data.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {data.change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                            <span className="text-sm font-medium">
                              {data.changePercent >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                          <div>Open: ₹{data.open.toFixed(2)}</div>
                          <div>High: ₹{data.high.toFixed(2)}</div>
                          <div>Low: ₹{data.low.toFixed(2)}</div>
                          <div>Volume: {(data.volume / 1000).toFixed(0)}K</div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                          <div>Bid: ₹{data.bid.toFixed(2)}</div>
                          <div>Ask: ₹{data.ask.toFixed(2)}</div>
                        </div>
                        
                        <div className="text-xs text-gray-400">
                          Updated: {new Date(data.timestamp).toLocaleTimeString()}
                          {realDataEnabled && <span className="ml-2 text-green-600 font-medium">(REAL)</span>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {!isConnected && (
              <div className="text-center py-8 text-gray-500">
                <WifiOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Connect to market data to see prices and your positions</p>
                <p className="text-sm">Configure your broker API in the Config tab first</p>
                {!isRealBrokerConnected && (
                  <Badge variant="destructive" className="mt-2">
                    Real Broker Data Not Available
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Market Summary */}
      {isConnected && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Market Summary
              {isRealBrokerConnected ? (
                <Badge className="bg-green-600 text-white text-xs">REAL DATA</Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">SIMULATION</Badge>
              )}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Watchlist:</span>
                <div className="font-medium">{marketData.length}</div>
              </div>
              <div>
                <span className="text-gray-600">Your Positions:</span>
                <div className="font-medium text-blue-600">{positions.length}</div>
              </div>
              <div>
                <span className="text-gray-600">Gainers:</span>
                <div className="font-medium text-green-600">
                  {marketData.filter(d => d.change > 0).length}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Losers:</span>
                <div className="font-medium text-red-600">
                  {marketData.filter(d => d.change < 0).length}
                </div>
              </div>
              {brokerAccount && (
                <div>
                  <span className="text-gray-600">Account:</span>
                  <div className="font-medium text-green-600">₹{(brokerAccount.availableBalance / 100000).toFixed(1)}L</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
