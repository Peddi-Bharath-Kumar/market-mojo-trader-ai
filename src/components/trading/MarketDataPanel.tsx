
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, Wifi, WifiOff, User, Briefcase } from 'lucide-react';
import { marketDataService, type MarketTick, type Position } from '@/services/MarketDataService';

interface MarketDataPanelProps {
  apiConfigured?: boolean;
}

export const MarketDataPanel: React.FC<MarketDataPanelProps> = ({ apiConfigured = false }) => {
  const [marketData, setMarketData] = useState<MarketTick[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('NIFTY50');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  const symbols = ['NIFTY50', 'BANKNIFTY', 'RELIANCE', 'TCS', 'HDFC', 'INFY', 'ITC', 'ICICIBANK', 'SBIN', 'BHARTIARTL', 'MAZDOCK-EQ'];

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

      // Get positions after connection
      const userPositions = marketDataService.getPositions();
      setPositions(userPositions);
      console.log('User positions loaded:', userPositions);

      return () => {
        symbols.forEach(symbol => {
          marketDataService.unsubscribe(symbol);
        });
      };
    }
  }, [isConnected]);

  const connectToMarket = async () => {
    if (!apiConfigured) {
      alert('Please configure your broker API keys in the Config tab first');
      return;
    }

    setConnectionStatus('connecting');
    console.log('Connecting to market data feed...');

    try {
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await marketDataService.connect();
      setIsConnected(true);
      setConnectionStatus('connected');
      
      // Load positions after successful connection
      const userPositions = marketDataService.getPositions();
      setPositions(userPositions);
      
      console.log('Successfully connected to market data feed');
      console.log(`Loaded ${userPositions.length} positions from your broker account`);
    } catch (error) {
      console.error('Failed to connect to market data:', error);
      setConnectionStatus('disconnected');
      alert('Failed to connect to market data. Please check your API configuration.');
    }
  };

  const disconnectFromMarket = () => {
    marketDataService.disconnect();
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setMarketData([]);
    setPositions([]);
    console.log('Disconnected from market data feed');
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
        return 'Connected';
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
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {positions.map((position, index) => (
                    <Card key={`${position.symbol}-${index}`} className={`border-l-4 ${position.pnl >= 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg">{position.symbol}</h3>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-blue-500" />
                            <span className="text-xs text-blue-600 font-medium">YOUR POSITION</span>
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
                            {isMarketOpen() ? 'LIVE' : 'CLOSED'}
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
                {!apiConfigured && (
                  <Badge variant="destructive" className="mt-2">
                    API Not Configured
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Market Summary */}
      {isConnected && marketData.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Market Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Watchlist Symbols:</span>
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
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
