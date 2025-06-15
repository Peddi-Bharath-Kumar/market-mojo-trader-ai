
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, Wifi, WifiOff, User, Briefcase, DollarSign, PieChart } from 'lucide-react';
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
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [realDataEnabled, setRealDataEnabled] = useState(false);

  const symbols = ['NIFTY50', 'BANKNIFTY', 'RELIANCE', 'TCS', 'HDFC', 'INFY', 'ITC', 'ICICIBANK', 'SBIN', 'BHARTIARTL', 'MAZDOCK-EQ'];

  // Check for saved credentials and restore connection state
  useEffect(() => {
    console.log('🔄 MarketDataPanel: Checking for saved credentials...');
    const savedCredentials = localStorage.getItem('trading-credentials');
    if (savedCredentials) {
      try {
        const credentials = JSON.parse(savedCredentials);
        if (credentials.isAuthenticated) {
          console.log('✅ Found authenticated credentials, restoring connection...');
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
          
          console.log('🔗 Market data service configured for:', credentials.broker);
        }
      } catch (error) {
        console.error('❌ Failed to restore credentials:', error);
      }
    }
  }, []);

  // Load real broker account data when credentials are available
  useEffect(() => {
    if (realDataEnabled) {
      console.log('💰 Loading real broker account data...');
      loadBrokerAccountData();
      
      // Subscribe to account updates
      brokerAccountService.subscribe((account: BrokerAccount) => {
        console.log('📊 Broker account updated:', account);
        setBrokerAccount(account);
        
        // Extract positions for market data display
        const brokerPositions: Position[] = account.positions.map(pos => ({
          symbol: pos.symbol,
          quantity: pos.quantity,
          averagePrice: pos.averagePrice,
          currentPrice: pos.currentPrice,
          pnl: pos.pnl,
          pnlPercent: pos.pnlPercent,
          type: pos.quantity > 0 ? 'long' : 'short'
        }));
        setPositions(brokerPositions);
      });
    }
  }, [realDataEnabled]);

  const loadBrokerAccountData = async () => {
    try {
      console.log('🔄 Fetching real broker account data...');
      const accountData = await brokerAccountService.fetchRealAccountData();
      setBrokerAccount(accountData);
      
      // Extract positions
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
      
      console.log('✅ Real broker account data loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load broker account data:', error);
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
      alert('Please configure your broker API keys in the Config tab first');
      return;
    }

    try {
      const credentials = JSON.parse(savedCredentials);
      if (!credentials.isAuthenticated) {
        alert('Please authenticate your credentials in the Config tab first');
        return;
      }
    } catch (error) {
      alert('Invalid credentials found. Please reconfigure in the Config tab.');
      return;
    }

    setConnectionStatus('connecting');
    console.log('🔗 Connecting to market data with real broker credentials...');

    try {
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await marketDataService.connect();
      setIsConnected(true);
      setConnectionStatus('connected');
      setRealDataEnabled(true);
      
      // Load real account data
      await loadBrokerAccountData();
      
      console.log('✅ Successfully connected to market data with real broker integration');
      console.log(`📊 Loaded ${positions.length} positions from your broker account`);
    } catch (error) {
      console.error('❌ Failed to connect to market data:', error);
      setConnectionStatus('disconnected');
      alert('Failed to connect to market data. Please check your API configuration.');
    }
  };

  const disconnectFromMarket = () => {
    marketDataService.disconnect();
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setMarketData([]);
    console.log('🔌 Disconnected from market data feed');
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <Activity className="h-4 w-4 text-yellow-500 animate-pulse" />;
      default:
        return <WifiOff className="h-4 w-4 text-red-500" />;
    }
  };

  const getConnectionStatus = () => {
    switch (connectionStatus) {
      case 'connected':
        return realDataEnabled ? 'Connected (Real Data)' : 'Connected (Simulated)';
      case 'connecting':
        return 'Connecting...';
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
      {/* Real Account Overview */}
      {brokerAccount && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <DollarSign className="h-5 w-5" />
              Your Real Trading Account
              <Badge className="bg-green-600 text-white">LIVE DATA</Badge>
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
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Real-time Market Data
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
              {realDataEnabled && (
                <Badge className="bg-green-600 text-white">
                  REAL DATA
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
                  {isMarketOpen() ? 'Market is Open - Live Data' : 'Market is Closed - Showing Last Known Prices'}
                </span>
                {realDataEnabled && (
                  <Badge variant="outline" className="text-xs">
                    Real Broker Data
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
                  {realDataEnabled && <Badge className="bg-green-600 text-white text-xs">REAL POSITIONS</Badge>}
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
                            {isMarketOpen() ? (realDataEnabled ? 'REAL' : 'LIVE') : 'CLOSED'}
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
                <p>Connect to market data to see real-time prices and your positions</p>
                <p className="text-sm">Configure your broker API in the Config tab first</p>
                {!realDataEnabled && (
                  <Badge variant="destructive" className="mt-2">
                    Real Data Not Available
                  </Badge>
                )}
                {realDataEnabled && (
                  <Badge className="mt-2 bg-green-600 text-white">
                    Real Broker Connected - Ready to Connect
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
              {realDataEnabled && <Badge className="bg-green-600 text-white text-xs">REAL DATA</Badge>}
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
