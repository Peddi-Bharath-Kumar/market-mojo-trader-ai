
interface ZerodhaCredentials {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  requestToken?: string;
}

interface ZerodhaPosition {
  tradingsymbol: string;
  exchange: string;
  instrument_token: string;
  product: string;
  quantity: number;
  overnight_quantity: number;
  multiplier: string;
  average_price: number;
  close_price: number;
  last_price: number;
  value: number;
  pnl: number;
  m2m: number;
  unrealised: number;
  realised: number;
}

interface ZerodhaMargins {
  equity: {
    enabled: boolean;
    net: number;
    available: {
      adhoc_margin: number;
      cash: number;
      opening_balance: number;
      live_balance: number;
      collateral: number;
      intraday_payin: number;
    };
    utilised: {
      debits: number;
      exposure: number;
      m2m_realised: number;
      m2m_unrealised: number;
      option_premium: number;
      payout: number;
      span: number;
      holding_sales: number;
      turnover: number;
      liquid_collateral: number;
      stock_collateral: number;
    };
  };
}

export class ZerodhaKiteService {
  private credentials: ZerodhaCredentials | null = null;
  private baseUrl = 'https://api.kite.trade';

  setCredentials(credentials: ZerodhaCredentials) {
    this.credentials = credentials;
    console.log('🔑 Zerodha Kite Connect credentials configured');
  }

  async generateSession(requestToken: string): Promise<string> {
    if (!this.credentials) throw new Error('Credentials not set');

    const crypto = await import('crypto');
    const checksum = crypto
      .createHash('sha256')
      .update(this.credentials.apiKey + requestToken + this.credentials.apiSecret)
      .digest('hex');

    const response = await fetch(`${this.baseUrl}/session/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        api_key: this.credentials.apiKey,
        request_token: requestToken,
        checksum: checksum,
      }),
    });

    const data = await response.json();
    if (data.status === 'success') {
      this.credentials.accessToken = data.data.access_token;
      console.log('✅ Zerodha session generated successfully');
      return data.data.access_token;
    }
    
    throw new Error(data.message || 'Session generation failed');
  }

  async getMargins(): Promise<ZerodhaMargins> {
    if (!this.credentials?.accessToken) throw new Error('Not authenticated');

    const response = await fetch(`${this.baseUrl}/user/margins`, {
      headers: {
        'Authorization': `token ${this.credentials.apiKey}:${this.credentials.accessToken}`,
      },
    });

    const data = await response.json();
    if (data.status === 'success') {
      console.log('💰 Zerodha margins fetched:', data.data);
      return data.data;
    }
    
    throw new Error(data.message || 'Failed to fetch margins');
  }

  async getPositions(): Promise<ZerodhaPosition[]> {
    if (!this.credentials?.accessToken) throw new Error('Not authenticated');

    const response = await fetch(`${this.baseUrl}/portfolio/positions`, {
      headers: {
        'Authorization': `token ${this.credentials.apiKey}:${this.credentials.accessToken}`,
      },
    });

    const data = await response.json();
    if (data.status === 'success') {
      console.log('📊 Zerodha positions fetched:', data.data);
      return [...data.data.day, ...data.data.net];
    }
    
    throw new Error(data.message || 'Failed to fetch positions');
  }

  async getHoldings(): Promise<any[]> {
    if (!this.credentials?.accessToken) throw new Error('Not authenticated');

    const response = await fetch(`${this.baseUrl}/portfolio/holdings`, {
      headers: {
        'Authorization': `token ${this.credentials.apiKey}:${this.credentials.accessToken}`,
      },
    });

    const data = await response.json();
    if (data.status === 'success') {
      console.log('🏦 Zerodha holdings fetched:', data.data);
      return data.data;
    }
    
    throw new Error(data.message || 'Failed to fetch holdings');
  }

  async placeOrder(orderParams: {
    exchange: string;
    tradingsymbol: string;
    transaction_type: 'BUY' | 'SELL';
    quantity: number;
    order_type: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
    product: 'MIS' | 'CNC' | 'NRML';
    price?: number;
    trigger_price?: number;
    validity?: 'DAY' | 'IOC';
    disclosed_quantity?: number;
    squareoff?: number;
    stoploss?: number;
  }): Promise<string> {
    if (!this.credentials?.accessToken) throw new Error('Not authenticated');

    const response = await fetch(`${this.baseUrl}/orders/regular`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${this.credentials.apiKey}:${this.credentials.accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        exchange: orderParams.exchange,
        tradingsymbol: orderParams.tradingsymbol,
        transaction_type: orderParams.transaction_type,
        quantity: orderParams.quantity.toString(),
        order_type: orderParams.order_type,
        product: orderParams.product,
        validity: orderParams.validity || 'DAY',
        ...(orderParams.price && { price: orderParams.price.toString() }),
        ...(orderParams.trigger_price && { trigger_price: orderParams.trigger_price.toString() }),
        ...(orderParams.disclosed_quantity && { disclosed_quantity: orderParams.disclosed_quantity.toString() }),
        ...(orderParams.squareoff && { squareoff: orderParams.squareoff.toString() }),
        ...(orderParams.stoploss && { stoploss: orderParams.stoploss.toString() }),
      }),
    });

    const data = await response.json();
    if (data.status === 'success') {
      console.log('✅ Zerodha order placed:', data.data.order_id);
      return data.data.order_id;
    }
    
    throw new Error(data.message || 'Order placement failed');
  }

  async getQuote(instruments: string[]): Promise<any> {
    if (!this.credentials?.accessToken) throw new Error('Not authenticated');

    const response = await fetch(`${this.baseUrl}/quote?i=${instruments.join('&i=')}`, {
      headers: {
        'Authorization': `token ${this.credentials.apiKey}:${this.credentials.accessToken}`,
      },
    });

    const data = await response.json();
    if (data.status === 'success') {
      return data.data;
    }
    
    throw new Error(data.message || 'Failed to fetch quotes');
  }

  getLoginUrl(): string {
    if (!this.credentials) throw new Error('API key not set');
    return `https://kite.trade/connect/login?api_key=${this.credentials.apiKey}&v=3`;
  }
}

export const zerodhaKiteService = new ZerodhaKiteService();
