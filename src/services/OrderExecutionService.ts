
import { zerodhaKiteService } from './ZerodhaKiteService';

interface OrderRequest {
  symbol: string;
  action: 'buy' | 'sell';
  orderType: 'market' | 'limit' | 'stop' | 'sl' | 'sl-m';
  quantity: number;
  price?: number;
  stopLoss?: number;
  target?: number;
  product: 'mis' | 'cnc' | 'nrml'; // Intraday, Cash, Normal
  validity: 'day' | 'ioc' | 'gtc';
}

interface OrderResponse {
  orderId: string;
  status: 'pending' | 'complete' | 'rejected' | 'cancelled';
  message: string;
  executedPrice?: number;
  executedQuantity?: number;
  timestamp: Date;
}

interface BrokerCredentials {
  broker: 'angel' | 'zerodha' | 'upstox';
  apiKey: string;
  apiSecret: string;
  accessToken: string;
}

export class OrderExecutionService {
  private credentials: BrokerCredentials | null = null;
  private isLiveTrading = false;
  private orderHistory: OrderResponse[] = [];

  setCredentials(credentials: BrokerCredentials) {
    this.credentials = credentials;
    console.log(`📋 Order execution configured for ${credentials.broker}`);
  }

  enableLiveTrading() {
    if (!this.credentials) {
      throw new Error('Broker credentials not configured');
    }
    this.isLiveTrading = true;
    console.log('🔴 LIVE TRADING ENABLED - Real orders will be placed!');
  }

  disableLiveTrading() {
    this.isLiveTrading = false;
    console.log('🟡 Paper trading mode - Orders simulated only');
  }

  async placeOrder(orderRequest: OrderRequest): Promise<OrderResponse> {
    console.log('📤 Placing order:', orderRequest);

    if (!this.isLiveTrading) {
      return this.simulateOrder(orderRequest);
    }

    if (!this.credentials) {
      throw new Error('No broker credentials configured');
    }

    try {
      switch (this.credentials.broker) {
        case 'angel':
          return await this.placeAngelOrder(orderRequest);
        case 'zerodha':
          return await this.placeZerodhaOrder(orderRequest);
        case 'upstox':
          return await this.placeUpstoxOrder(orderRequest);
        default:
          throw new Error(`Unsupported broker: ${this.credentials.broker}`);
      }
    } catch (error) {
      console.error('❌ Order placement failed:', error);
      throw error;
    }
  }

  private async placeAngelOrder(order: OrderRequest): Promise<OrderResponse> {
    const orderPayload = {
      variety: "NORMAL",
      tradingsymbol: order.symbol,
      symboltoken: await this.getSymbolToken(order.symbol),
      transactiontype: order.action.toUpperCase(),
      exchange: this.getExchange(order.symbol),
      ordertype: order.orderType.toUpperCase(),
      producttype: order.product.toUpperCase(),
      duration: order.validity.toUpperCase(),
      price: order.price?.toString() || "0",
      squareoff: order.target?.toString() || "0",
      stoploss: order.stopLoss?.toString() || "0",
      quantity: order.quantity.toString()
    };

    const response = await fetch('https://apiconnect.angelbroking.com/rest/secure/angelbroking/order/v1/placeOrder', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.credentials!.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': '192.168.1.1',
        'X-ClientPublicIP': '106.193.147.98',
        'X-MACAddress': 'fe80::216:3eff:fe1d:e1d1',
        'X-PrivateKey': this.credentials!.apiKey
      },
      body: JSON.stringify(orderPayload)
    });

    const data = await response.json();
    
    if (data.status && data.data) {
      const orderResponse: OrderResponse = {
        orderId: data.data.orderid,
        status: 'pending',
        message: 'Order placed successfully',
        timestamp: new Date()
      };
      
      this.orderHistory.push(orderResponse);
      console.log('✅ Angel Broking order placed:', orderResponse.orderId);
      return orderResponse;
    } else {
      throw new Error(data.message || 'Order placement failed');
    }
  }

  private async placeZerodhaOrder(order: OrderRequest): Promise<OrderResponse> {
    if (!this.credentials || this.credentials.broker !== 'zerodha') {
      throw new Error('Zerodha credentials not configured for order placement.');
    }

    try {
      const orderId = await zerodhaKiteService.placeOrder({
        exchange: this.getExchange(order.symbol),
        tradingsymbol: order.symbol,
        transaction_type: order.action.toUpperCase() as 'BUY' | 'SELL',
        quantity: order.quantity,
        order_type: order.orderType.toUpperCase() as 'MARKET' | 'LIMIT' | 'SL' | 'SL-M',
        product: order.product.toUpperCase() as 'MIS' | 'CNC' | 'NRML',
        price: order.price,
        trigger_price: order.stopLoss,
        validity: order.validity.toUpperCase() as 'DAY' | 'IOC',
        squareoff: order.target,
        stoploss: order.stopLoss
      });

      const orderResponse: OrderResponse = {
        orderId,
        status: 'pending', // Zerodha order placement is async, status needs to be fetched later
        message: 'Order placed with Zerodha successfully',
        timestamp: new Date(),
      };
      
      this.orderHistory.unshift(orderResponse);
      console.log('✅ Zerodha order placed:', orderResponse.orderId);
      return orderResponse;

    } catch (error) {
      console.error('❌ Zerodha order placement failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      const orderResponse: OrderResponse = {
        orderId: `REJ_${Date.now()}`,
        status: 'rejected',
        message: `Zerodha order failed: ${message}`,
        timestamp: new Date()
      };
      this.orderHistory.unshift(orderResponse);
      throw new Error(`Zerodha order failed: ${message}`);
    }
  }

  private async placeUpstoxOrder(order: OrderRequest): Promise<OrderResponse> {
    // Upstox API implementation
    console.log('🟣 Upstox order simulation:', order);
    return this.simulateOrder(order);
  }

  private simulateOrder(order: OrderRequest): OrderResponse {
    const orderId = `SIM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const orderResponse: OrderResponse = {
      orderId,
      status: Math.random() > 0.1 ? 'complete' : 'rejected', // 90% success rate
      message: 'Simulated order execution',
      executedPrice: order.price || (100 + Math.random() * 1000),
      executedQuantity: order.quantity,
      timestamp: new Date()
    };

    this.orderHistory.push(orderResponse);
    console.log('🎭 Simulated order:', orderResponse);
    return orderResponse;
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    if (!this.isLiveTrading) {
      console.log('🎭 Simulated order cancellation:', orderId);
      return true;
    }

    try {
      // Implementation varies by broker
      if (this.credentials?.broker === 'angel') {
        return await this.cancelAngelOrder(orderId);
      }
      return false;
    } catch (error) {
      console.error('❌ Order cancellation failed:', error);
      return false;
    }
  }

  private async cancelAngelOrder(orderId: string): Promise<boolean> {
    const response = await fetch('https://apiconnect.angelbroking.com/rest/secure/angelbroking/order/v1/cancelOrder', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.credentials!.accessToken}`,
        'Content-Type': 'application/json',
        'X-PrivateKey': this.credentials!.apiKey
      },
      body: JSON.stringify({
        variety: "NORMAL",
        orderid: orderId
      })
    });

    const data = await response.json();
    return data.status === true;
  }

  async getOrderStatus(orderId: string): Promise<OrderResponse | null> {
    const order = this.orderHistory.find(o => o.orderId === orderId);
    
    if (!order) return null;

    if (this.isLiveTrading && this.credentials) {
      // Fetch real order status from broker
      try {
        const updatedStatus = await this.fetchOrderStatusFromBroker(orderId);
        if (updatedStatus) {
          Object.assign(order, updatedStatus);
        }
      } catch (error) {
        console.warn('Failed to fetch order status:', error);
      }
    }

    return order;
  }

  private async fetchOrderStatusFromBroker(orderId: string): Promise<Partial<OrderResponse> | null> {
    if (this.credentials?.broker === 'angel') {
      try {
        const response = await fetch(`https://apiconnect.angelbroking.com/rest/secure/angelbroking/order/v1/details/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${this.credentials.accessToken}`,
            'X-PrivateKey': this.credentials.apiKey
          }
        });
        
        const data = await response.json();
        if (data.status && data.data) {
          return {
            status: this.mapBrokerStatus(data.data.status),
            executedPrice: parseFloat(data.data.averageprice || '0'),
            executedQuantity: parseInt(data.data.filledshares || '0')
          };
        }
      } catch (error) {
        console.error('Failed to fetch Angel order status:', error);
      }
    }
    
    return null;
  }

  private mapBrokerStatus(brokerStatus: string): OrderResponse['status'] {
    const statusMap: { [key: string]: OrderResponse['status'] } = {
      'complete': 'complete',
      'open': 'pending',
      'cancelled': 'cancelled',
      'rejected': 'rejected',
      'trigger pending': 'pending'
    };
    
    return statusMap[brokerStatus.toLowerCase()] || 'pending';
  }

  private async getSymbolToken(symbol: string): Promise<string> {
    // In real implementation, maintain a symbol-to-token mapping
    // For now, return a placeholder
    return "99926000"; // Example token
  }

  private getExchange(symbol: string): string {
    if (symbol.includes('NIFTY') || symbol.includes('BANK')) return 'NFO';
    if (symbol.endsWith('-EQ')) return 'NSE';
    return 'NSE';
  }

  getTradingStatus() {
    return {
      isLiveTrading: this.isLiveTrading,
      broker: this.credentials?.broker || 'none',
      totalOrders: this.orderHistory.length,
      successfulOrders: this.orderHistory.filter(o => o.status === 'complete').length,
      pendingOrders: this.orderHistory.filter(o => o.status === 'pending').length,
      rejectedOrders: this.orderHistory.filter(o => o.status === 'rejected').length
    };
  }

  getOrderHistory(limit: number = 50): OrderResponse[] {
    return this.orderHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

export const orderExecutionService = new OrderExecutionService();
export type { OrderRequest, OrderResponse, BrokerCredentials };
