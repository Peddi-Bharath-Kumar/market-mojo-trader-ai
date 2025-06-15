
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle } from 'lucide-react';
import { orderExecutionService, OrderResponse } from '@/services/OrderExecutionService';
import { useToast } from '@/hooks/use-toast';

interface OrderExecutionProps {
  isTrading: boolean;
}

export const OrderExecution: React.FC<OrderExecutionProps> = ({ isTrading }) => {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const { toast } = useToast();
  const [newOrder, setNewOrder] = useState({
    symbol: 'NIFTY50',
    type: 'buy' as 'buy' | 'sell',
    orderType: 'market' as 'market' | 'limit' | 'stop',
    quantity: 1,
    price: 0,
    product: 'mis' as 'mis' | 'cnc' | 'nrml',
    validity: 'day' as 'day' | 'ioc',
  });

  useEffect(() => {
    setOrders(orderExecutionService.getOrderHistory());

    const interval = setInterval(() => {
      setOrders(orderExecutionService.getOrderHistory(50));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const placeOrder = async () => {
    if (!isTrading) {
      toast({
        title: "Trading Not Active",
        description: "Please start live trading to place orders.",
        variant: "destructive",
      });
      return;
    }

    try {
      await orderExecutionService.placeOrder({
        ...newOrder,
        symbol: newOrder.symbol.toUpperCase(),
        price: newOrder.orderType === 'limit' || newOrder.orderType === 'stop' ? newOrder.price : undefined,
      });
      toast({
        title: "Order Placed",
        description: `${newOrder.type.toUpperCase()} ${newOrder.quantity} ${newOrder.symbol} order has been sent.`,
      });
      // The useEffect interval will update the list
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({
        title: "Order Failed",
        description: message,
        variant: "destructive",
      });
      console.error("Failed to place order:", error);
    }
  };

  const getStatusColor = (status: OrderResponse['status']) => {
    switch (status) {
      case 'complete': return 'bg-green-500 text-white';
      case 'pending': return 'bg-yellow-500 text-white';
      case 'cancelled': return 'bg-gray-500 text-white';
      case 'rejected': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status: OrderResponse['status']) => {
    switch (status) {
      case 'complete': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Place Manual Order
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label htmlFor="symbol">Symbol</Label>
              <Input id="symbol" value={newOrder.symbol} onChange={(e) => setNewOrder(prev => ({ ...prev, symbol: e.target.value }))} placeholder="e.g., NIFTY50" />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={newOrder.type} onValueChange={(value: 'buy' | 'sell') => setNewOrder(prev => ({ ...prev, type: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" type="number" value={newOrder.quantity} onChange={(e) => setNewOrder(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 1) }))} />
            </div>
            <div>
              <Button onClick={placeOrder} disabled={!isTrading} className="w-full">
                Place {newOrder.type === 'buy' ? 'Buy' : 'Sell'} Order
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 items-end">
            <div>
              <Label htmlFor="orderType">Order Type</Label>
              <Select value={newOrder.orderType} onValueChange={(value: any) => setNewOrder(prev => ({ ...prev, orderType: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="market">Market</SelectItem>
                  <SelectItem value="limit">Limit</SelectItem>
                  <SelectItem value="stop">Stop (SL-M)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(newOrder.orderType === 'limit' || newOrder.orderType === 'stop') && (
              <div>
                <Label htmlFor="price">Price</Label>
                <Input id="price" type="number" value={newOrder.price} onChange={(e) => setNewOrder(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))} />
              </div>
            )}
             <div>
              <Label htmlFor="product">Product</Label>
              <Select value={newOrder.product} onValueChange={(value: any) => setNewOrder(prev => ({ ...prev, product: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mis">MIS (Intraday)</SelectItem>
                  <SelectItem value="cnc">CNC (Delivery)</SelectItem>
                  <SelectItem value="nrml">NRML (Carry Forward)</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div>
              <Label htmlFor="validity">Validity</Label>
              <Select value={newOrder.validity} onValueChange={(value: any) => setNewOrder(prev => ({ ...prev, validity: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">DAY</SelectItem>
                  <SelectItem value="ioc">IOC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {orders.map((order) => (
                <div key={order.orderId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${order.message.includes('Buy') || !order.message.includes('Sell') ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {order.message.includes('Buy') || !order.message.includes('Sell') ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="font-medium">{order.orderId}</div>
                      <div className="text-sm text-gray-600">{order.message}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        {new Date(order.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(order.status)} flex items-center gap-1 min-w-[100px] justify-center`}>
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
              <p className="text-sm">Placed orders will appear here in real-time</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
