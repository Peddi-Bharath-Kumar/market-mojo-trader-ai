
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Play, Square, TrendingUp, TrendingDown, DollarSign, Target, Activity, Shield, AlertTriangle } from 'lucide-react';
import { virtualTradingService, type VirtualPortfolio, type VirtualOrder } from '@/services/VirtualTradingService';
import { marketDataService, type MarketTick } from '@/services/MarketDataService';

interface VirtualTradingModeProps {
  isActive: boolean;
  onToggle: (active: boolean) => void;
}

export const VirtualTradingMode: React.FC<VirtualTradingModeProps> = ({ isActive, onToggle }) => {
  const [portfolio, setPortfolio] = useState<VirtualPortfolio>(virtualTradingService.getPortfolio());
  const [newOrder, setNewOrder] = useState({
    symbol: 'NIFTY50',
    type: 'buy' as 'buy' | 'sell',
    orderType: 'market' as 'market' | 'limit' | 'stop',
    quantity: 1,
    price: 19800
  });
  const [marketData, setMarketData] = useState<MarketTick[]>([]);

  // Subscribe to portfolio updates
  useEffect(() => {
    const handlePortfolioUpdate = (updatedPortfolio: VirtualPortfolio) => {
      setPortfolio(updatedPortfolio);
    };

    virtualTradingService.subscribe(handlePortfolioUpdate);

    return () => {
      virtualTradingService.unsubscribe(handlePortfolioUpdate);
    };
  }, []);

  // Subscribe to market data for position updates
  useEffect(() => {
    const symbols = ['NIFTY50', 'BANKNIFTY', 'RELIANCE', 'TCS', 'HDFC', 'INFY', 'ITC'];
    const marketDataMap = new Map<string, MarketTick>();

    symbols.forEach(symbol => {
      marketDataService.subscribe(symbol, (tick: MarketTick) => {
        marketDataMap.set(symbol, tick);
        setMarketData(Array.from(marketDataMap.values()));
        
        // Update virtual positions with real market prices
        virtualTradingService.updatePositionPrices([{
          symbol: tick.symbol,
          price: tick.ltp
        }]);
      });
    });

    return () => {
      symbols.forEach(symbol => {
        marketDataService.unsubscribe(symbol);
      });
    };
  }, []);

  // Handle virtual trading toggle
  useEffect(() => {
    if (isActive && !virtualTradingService.isVirtualTradingActive()) {
      virtualTradingService.startVirtualTrading();
    } else if (!isActive && virtualTradingService.isVirtualTradingActive()) {
      virtualTradingService.stopVirtualTrading();
    }
  }, [isActive]);

  const handleToggle = () => {
    onToggle(!isActive);
  };

  const placeManualOrder = () => {
    if (!isActive) {
      alert('Please start virtual trading first');
      return;
    }

    const orderId = virtualTradingService.placeVirtualOrder(newOrder);
    console.log('Manual virtual order placed:', orderId);
  };

  const resetPortfolio = () => {
    if (confirm('Are you sure you want to reset your virtual portfolio? This will clear all positions and reset your balance to ₹1,00,000.')) {
      virtualTradingService.resetPortfolio();
    }
  };

  const currentBalance = portfolio.balance + portfolio.totalPnL;
  const portfolioReturn = ((currentBalance - portfolio.initialBalance) / portfolio.initialBalance) * 100;

  return (
    <div className="space-y-6">
      {/* Safety Banner */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-blue-600" />
            <div>
              <h4 className="font-medium text-blue-800">🔒 Virtual Trading Mode - 100% Safe</h4>
              <p className="text-sm text-blue-700">
                This mode uses virtual money only. No real trades will be placed. Your real trading account is completely safe.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Virtual Trading Mode
              <Badge variant={isActive ? 'default' : 'secondary'} className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleToggle}
                variant={isActive ? 'destructive' : 'default'}
                size="sm"
                className="flex items-center gap-1"
              >
                {isActive ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isActive ? 'Stop Virtual Trading' : 'Start Virtual Trading'}
              </Button>
              <Button onClick={resetPortfolio} variant="outline" size="sm">
                Reset Portfolio
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Portfolio Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Portfolio Value</span>
                </div>
                <div className="text-2xl font-bold">₹{currentBalance.toLocaleString()}</div>
                <div className={`text-sm ${portfolioReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {portfolioReturn >= 0 ? '+' : ''}{portfolioReturn.toFixed(2)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Day P&L</span>
                </div>
                <div className={`text-2xl font-bold ${portfolio.dayPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{portfolio.dayPnL.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">
                  {portfolio.dayPnL >= 0 ? 'Profit' : 'Loss'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-gray-600">Win Rate</span>
                </div>
                <div className="text-2xl font-bold">{portfolio.winRate.toFixed(1)}%</div>
                <Progress value={portfolio.winRate} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-gray-600">Total Trades</span>
                </div>
                <div className="text-2xl font-bold">{portfolio.trades}</div>
                <div className="text-sm text-gray-500">
                  {portfolio.positions.length} Active Positions
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Manual Order Placement */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Place Virtual Order</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input
                    id="symbol"
                    value={newOrder.symbol}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, symbol: e.target.value }))}
                    placeholder="e.g., NIFTY50"
                  />
                </div>
                
                <div>
                  <Label htmlFor="type">Type</Label>
                  <select
                    className="w-full p-2 border rounded"
                    value={newOrder.type}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, type: e.target.value as 'buy' | 'sell' }))}
                  >
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={newOrder.quantity}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  />
                </div>

                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.05"
                    value={newOrder.price}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div className="flex items-end">
                  <Button 
                    onClick={placeManualOrder} 
                    disabled={!isActive} 
                    className="w-full"
                  >
                    Place Virtual Order
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Positions */}
          <div className="space-y-4">
            <h4 className="font-medium">Active Virtual Positions</h4>
            {portfolio.positions.length > 0 ? (
              <div className="space-y-2">
                {portfolio.positions.slice(0, 8).map((position) => (
                  <div key={position.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${position.type === 'long' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {position.type === 'long' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="font-medium">{position.symbol}</div>
                        <div className="text-sm text-gray-600">
                          {position.quantity} @ ₹{position.entryPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-medium">₹{position.currentPrice.toFixed(2)}</div>
                      <div className={`text-sm ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {position.pnl >= 0 ? '+' : ''}₹{position.pnl.toFixed(2)} ({position.pnlPercent.toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No virtual positions yet</p>
                <p className="text-sm">Start virtual trading or place manual orders</p>
              </div>
            )}
          </div>

          {/* Recent Orders */}
          {portfolio.orders.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-4">Recent Virtual Orders</h4>
              <div className="space-y-2">
                {portfolio.orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                    <div className="flex items-center gap-3">
                      <div className={`px-2 py-1 rounded text-xs ${order.type === 'buy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {order.type.toUpperCase()}
                      </div>
                      <span>{order.symbol}</span>
                      <span>{order.quantity} @ ₹{order.price.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={order.status === 'executed' ? 'default' : order.status === 'pending' ? 'secondary' : 'destructive'}>
                        {order.status}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(order.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-4">
          <h4 className="font-medium text-green-800 mb-3">Virtual Trading Performance Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-green-600">Starting Capital:</span>
              <div className="font-medium">₹{portfolio.initialBalance.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-green-600">Current Value:</span>
              <div className="font-medium">₹{currentBalance.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-green-600">Total Return:</span>
              <div className={`font-medium ${portfolioReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {portfolioReturn.toFixed(2)}%
              </div>
            </div>
            <div>
              <span className="text-green-600">Safety Level:</span>
              <div className="font-medium text-green-600">100% Safe</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
