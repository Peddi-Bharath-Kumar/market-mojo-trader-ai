
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  timestamp: number;
}

export const MarketDataPanel = () => {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('NIFTY50');
  const [isConnected, setIsConnected] = useState(false);

  // Simulated market data - replace with real API calls
  useEffect(() => {
    const symbols = ['NIFTY50', 'BANKNIFTY', 'RELIANCE', 'TCS', 'HDFC', 'INFY'];
    
    const generateMockData = () => {
      return symbols.map(symbol => ({
        symbol,
        price: Math.random() * 1000 + 100,
        change: (Math.random() - 0.5) * 20,
        changePercent: (Math.random() - 0.5) * 5,
        volume: Math.floor(Math.random() * 1000000),
        high: Math.random() * 1000 + 120,
        low: Math.random() * 1000 + 80,
        timestamp: Date.now()
      }));
    };

    if (isConnected) {
      const interval = setInterval(() => {
        setMarketData(generateMockData());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const connectToMarket = () => {
    setIsConnected(true);
    console.log('Connecting to market data API...');
    // Here you would implement actual API connection
    // Example: Zerodha KiteConnect, Angel Broking API, etc.
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Real-time Market Data
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-500">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4 items-end">
              <div>
                <Label htmlFor="symbol">Symbol</Label>
                <Input
                  id="symbol"
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  placeholder="Enter symbol (e.g., NIFTY50)"
                />
              </div>
              <Button onClick={connectToMarket} disabled={isConnected}>
                {isConnected ? 'Connected' : 'Connect to Market'}
              </Button>
            </div>

            {/* Market Data Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {marketData.map((data) => (
                <Card key={data.symbol} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">{data.symbol}</h3>
                      <Activity className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">₹{data.price.toFixed(2)}</span>
                        <div className={`flex items-center gap-1 ${data.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {data.change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          <span className="text-sm font-medium">
                            {data.changePercent.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>High: ₹{data.high.toFixed(2)}</div>
                        <div>Low: ₹{data.low.toFixed(2)}</div>
                        <div className="col-span-2">Volume: {data.volume.toLocaleString()}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {!isConnected && (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Connect to market data to see real-time prices</p>
                <p className="text-sm">Configure your broker API in the Config tab</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
