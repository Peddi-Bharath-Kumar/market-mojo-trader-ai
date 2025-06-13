
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Order {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  orderType: 'market' | 'limit' | 'stop';
  quantity: number;
  price: number;
  status: 'pending' | 'executed' | 'cancelled' | 'rejected';
  timestamp: number;
  pnl?: number;
}

interface OrderExecutionProps {
  isTrading: boolean;
}

export const OrderExecution: React.FC<OrderExecutionProps> = ({ isTrading }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [newOrder, setNewOrder] = useState({
    symbol: 'NIFTY50',
    type: 'buy' as 'buy' | 'sell',
    orderType: 'market' as 'market' | 'limit' | 'stop',
    quantity: 1,
    price: 0
  });

  // Mock order execution
  const executeOrder = (order: Omit<Order, 'id' | 'status' | 'timestamp'>) => {
    const newOrderObj: Order = {
      ...order,
      id: `ORD_${Date.now()}`,
      status: 'pending',
      timestamp: Date.now()
    };

    setOrders(prev => [newOrderObj, ...prev]);

    // Simulate order execution after 1-3 seconds
    setTimeout(() => {
      setOrders(prev => prev.map(o => 
        o.id === newOrderObj.id 
          ? { ...o, status: Math.random() > 0.1 ? 'executed' : 'rejected' }
          : o
      ));
    }, 1000 + Math.random() * 2000);
  };

  const placeOrder = () => {
    if (!isTrading) {
      alert('Trading is not active. Please start trading first.');
      return;
    }

    executeOrder(newOrder);
    console.log('Order placed:', newOrder);
  };

  // Auto-generate mock orders when trading is active
  useEffect(() => {
    if (isTrading) {
      const interval = setInterval(() => {
        const symbols = ['NIFTY50', 'BANKNIFTY', 'RELIANCE', 'TCS'];
        const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
        
        const autoOrder = {
          symbol: randomSymbol,
          type: Math.random() > 0.5 ? 'buy' as const : 'sell' as const,
          orderType: 'market' as const,
          quantity: Math.floor(Math.random() * 5) + 1,
          price: 100 + Math.random() * 900
        };

        executeOrder(autoOrder);
      }, 10000 + Math.random() * 20000); // Random interval between 10-30 seconds

      return () => clearInterval(interval);
    }
  }, [isTrading]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'executed': return 'bg-green-500 text-white';
      case 'pending': return 'bg-yellow-500 text-white';
      case 'cancelled': return 'bg-gray-500 text-white';
      case 'rejected': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'executed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Manual Order Placement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Place Order
          </CardTitle>
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
              <Select value={newOrder.type} onValueChange={(value: 'buy' | 'sell') => setNewOrder(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="orderType">Order Type</Label>
              <Select value={newOrder.orderType} onValueChange={(value: 'market' | 'limit' | 'stop') => setNewOrder(prev => ({ ...prev, orderType: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market">Market</SelectItem>
                  <SelectItem value="limit">Limit</SelectItem>
                  <SelectItem value="stop">Stop</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={newOrder.quantity}
                onChange={(e) => setNewOrder(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={placeOrder} disabled={!isTrading} className="w-full">
                Place Order
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <div className="space-y-4">
              {orders.slice(0, 10).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${order.type === 'buy' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {order.type === 'buy' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="font-medium">{order.symbol}</div>
                      <div className="text-sm text-gray-600">
                        {order.type.toUpperCase()} {order.quantity} @ ₹{order.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        {new Date(order.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="text-xs text-gray-500">{order.orderType}</div>
                    </div>
                    <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                      {getStatusIcon(order.status)}
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No orders placed yet</p>
              <p className="text-sm">Start trading to see orders here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
