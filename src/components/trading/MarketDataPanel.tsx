
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, Wifi, WifiOff } from 'lucide-react';
import { marketDataService, type MarketTick } from '@/services/MarketDataService';

interface MarketDataPanelProps {
  apiConfigured?: boolean;
}

export const MarketDataPanel: React.FC<MarketDataPanelProps> = ({ apiConfigured = false }) => {
  const [marketData, setMarketData] = useState<MarketTick[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('NIFTY50');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  const symbols = ['NIFTY50', 'BANKNIFTY', 'RELIANCE', 'TCS', 'HDFC', 'INFY', 'ITC', 'ICICIBANK', 'SBIN', 'BHARTIARTL'];

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
    if (!apiConfigured) {
      alert('Please configure your broker API keys in the Config tab first');
      return;
    }

    setConnectionStatus('connecting');
    console.log('Connecting to market data feed...');

    try {
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      marketDataService.connect();
      setIsConnected(true);
      setConnectionStatus('connected');
      
      console.log('Successfully connected to market data feed');
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
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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

            {/* Enhanced Market Data Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {marketData.map((data) => (
                <Card key={data.symbol} className={`border-l-4 ${data.change >= 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">{data.symbol}</h3>
                      <div className="flex items-center gap-1">
                        <Activity className="h-3 w-3 text-blue-500 animate-pulse" />
                        <span className="text-xs text-gray-500">LIVE</span>
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

            {!isConnected && (
              <div className="text-center py-8 text-gray-500">
                <WifiOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Connect to market data to see real-time prices</p>
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
                <span className="text-gray-600">Total Symbols:</span>
                <div className="font-medium">{marketData.length}</div>
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
              <div>
                <span className="text-gray-600">Unchanged:</span>
                <div className="font-medium text-gray-600">
                  {marketData.filter(d => d.change === 0).length}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
