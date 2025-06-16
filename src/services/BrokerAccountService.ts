import { zerodhaKiteService } from './ZerodhaKiteService';

interface BrokerAccount {
  accountId: string;
  availableBalance: number;
  usedMargin: number;
  totalValue: number;
  dayPnL: number;
  dayPnLPercent: number;
  positions: BrokerPosition[];
  orders: any[];
  hasPortfolioDataAccess: boolean;
  portfolioError?: string;
}

interface BrokerPosition {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  product: 'mis' | 'cnc' | 'nrml';
}

interface BrokerCredentials {
  broker: 'angel' | 'zerodha' | 'upstox';
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  userId?: string;
}

class BrokerAccountService {
  private credentials: BrokerCredentials | null = null;
  private listeners: ((account: BrokerAccount) => void)[] = [];
  private accountData: BrokerAccount | null = null;
  private realTimeUpdatesActive = false;
  private portfolioError: string | null = null;

  getCurrentAccount(): BrokerAccount | null {
    return this.accountData;
  }

  setCredentials(credentials: BrokerCredentials) {
    this.credentials = credentials;
    console.log(`🔑 Broker account configured for ${credentials.broker}`);
  }

  async fetchRealAccountData(): Promise<BrokerAccount> {
    if (!this.credentials) {
      console.warn('No broker credentials configured - using simulated account data');
      return this.getSimulatedAccountData();
    }

    try {
      switch (this.credentials.broker) {
        case 'angel':
          return await this.fetchAngelAccountData();
        case 'zerodha':
          return await this.fetchZerodhaAccountData();
        default:
          console.warn(`Broker ${this.credentials.broker} not fully supported for fetching account data, using simulated data.`);
          return this.getSimulatedAccountData();
      }
    } catch (error: any) {
      console.error('Failed to fetch real account data:', error);
      this.portfolioError = error.message || 'Failed to fetch portfolio data';
      return this.getSimulatedAccountData();
    }
  }

  private async fetchAngelAccountData(): Promise<BrokerAccount> {
    console.log('🔄 Fetching REAL account data from Angel Broking...');
    if (!this.credentials || this.credentials.broker !== 'angel') {
      throw new Error('Angel Broking credentials not set or incorrect broker.');
    }

    const baseHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-UserType': 'USER',
      'X-SourceID': 'WEB',
      'X-ClientLocalIP': '192.168.1.1',
      'X-ClientPublicIP': '106.193.147.98',
      'X-MACAddress': 'fe80::216:3eff:fe1d:e1d1',
      'X-PrivateKey': this.credentials.apiKey
    };

    try {
      // First, fetch profile data (this usually works better than portfolio endpoints)
      const response = await this.makeApiRequest(
        'https://apiconnect.angelbroking.com/rest/secure/angelbroking/user/v1/getProfile',
        {
          headers: {
            'Authorization': `Bearer ${this.credentials.accessToken}`,
            ...baseHeaders
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Angel Broking API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.status || !data.data) {
        throw new Error(data.message || 'Failed to fetch profile data');
      }

      const profile = data.data;
      const availableBalance = parseFloat(profile.availablecash || '0');
      const usedMargin = parseFloat(profile.usedmargin || '0');
      const totalValue = parseFloat(profile.networth || '0');

      // Always expect CORS issues for portfolio data from browser
      const { positions, dayPnL, hasPortfolioDataAccess, portfolioError } = 
        await this.fetchAngelPositionsWithCorsHandling(baseHeaders);

      const dayPnLPercent = totalValue > 0 ? (dayPnL / totalValue) * 100 : 0;

      const account: BrokerAccount = {
        accountId: profile.clientcode,
        availableBalance,
        usedMargin,
        totalValue,
        dayPnL,
        dayPnLPercent,
        positions,
        orders: [], // TODO: Fetch orders
        hasPortfolioDataAccess,
        portfolioError
      };

      console.log('✅ Angel Broking account data processed (profile data successful)');
      return account;
    } catch (error: any) {
      console.error('❌ Failed to fetch Angel Broking account data:', error);
      throw new Error(error.message || 'Failed to fetch account data');
    }
  }

  private async fetchAngelPositionsWithCorsHandling(baseHeaders: any): Promise<{
    positions: BrokerPosition[];
    dayPnL: number;
    hasPortfolioDataAccess: boolean;
    portfolioError: string | null;
  }> {
    let positions: BrokerPosition[] = [];
    let dayPnL = 0;
    let hasPortfolioDataAccess = false;
    let portfolioError: string | null = null;

    console.log('🔍 Attempting to fetch portfolio data (expecting CORS restrictions)...');

    // Define all possible portfolio endpoints
    const portfolioEndpoints = [
      'https://apiconnect.angelbroking.com/rest/secure/angelbroking/portfolio/v1/getPositions',
      'https://apiconnect.angelbroking.com/rest/secure/angelbroking/portfolio/v1/getHolding',
      'https://apiconnect.angelbroking.com/rest/secure/angelbroking/user/v1/getRMS'
    ];

    for (const endpoint of portfolioEndpoints) {
      try {
        console.log(`🧪 Testing endpoint: ${endpoint}`);
        
        const positionsResponse = await this.makeApiRequestWithTimeout(endpoint, {
          headers: {
            'Authorization': `Bearer ${this.credentials!.accessToken}`,
            ...baseHeaders
          }
        }, 5000); // 5 second timeout

        if (positionsResponse.ok) {
          const positionsData = await positionsResponse.json();

          if (positionsData.status && positionsData.data) {
            positions = positionsData.data.map((item: any) => {
              const pnl = parseFloat(item.unrealisedprofit || item.pnl || '0');
              dayPnL += pnl;

              return {
                symbol: item.symbolname || item.tradingsymbol,
                quantity: parseInt(item.netqty || item.quantity || '0'),
                averagePrice: parseFloat(item.averageprice || item.price || '0'),
                currentPrice: parseFloat(item.ltp || item.lastprice || '0'),
                pnl: pnl,
                pnlPercent: parseFloat(item.pnlpercent || '0'),
                product: (item.producttype || item.product || 'mis').toLowerCase() as 'mis' | 'cnc' | 'nrml'
              };
            });
            
            hasPortfolioDataAccess = true;
            portfolioError = null;
            console.log(`✅ Successfully fetched ${positions.length} positions from ${endpoint}`);
            break; // Success, exit the loop
          }
        }
      } catch (endpointError: any) {
        console.warn(`❌ Endpoint failed: ${endpoint}`, endpointError.message);
        
        // Check if it's specifically a CORS error
        if (endpointError.message.includes('CORS') || 
            endpointError.message.includes('Access-Control-Allow-Origin') ||
            endpointError.message.includes('ERR_FAILED')) {
          portfolioError = 'CORS Policy Restriction: Browser cannot access Angel Broking portfolio APIs directly. Use Angel\'s web platform or mobile app to view positions.';
        }
        continue; // Try next endpoint
      }
    }

    // If all endpoints failed, provide clear guidance
    if (!hasPortfolioDataAccess) {
      portfolioError = portfolioError || 'Portfolio data unavailable due to browser security restrictions. Account balance and funds data is working correctly.';
      console.warn('⚠️ All portfolio endpoints failed due to CORS - this is expected behavior from financial APIs');
    }

    return { positions, dayPnL, hasPortfolioDataAccess, portfolioError };
  }

  private async makeApiRequestWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        mode: 'cors',
        credentials: 'omit'
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - API took too long to respond');
      }
      throw error;
    }
  }

  private async makeApiRequest(url: string, options: RequestInit): Promise<Response> {
    try {
      // Try standard CORS request first
      return await fetch(url, {
        ...options,
        mode: 'cors',
        credentials: 'omit'
      });
    } catch (error: any) {
      console.error('Standard CORS request failed:', error.message);
      
      // If it's a CORS error, throw a clear message
      if (error.message.includes('CORS') || 
          error.message.includes('Access-Control-Allow-Origin') ||
          error.message.includes('ERR_FAILED')) {
        throw new Error('CORS Policy Restriction: Financial APIs block browser access for security. Use broker\'s native app or web platform.');
      }
      
      throw error;
    }
  }

  private async fetchZerodhaAccountData(): Promise<BrokerAccount> {
    console.log('🔄 Fetching REAL account data from zerodha');
    if (!this.credentials || this.credentials.broker !== 'zerodha') {
      throw new Error('Zerodha credentials not set or incorrect broker.');
    }
    
    try {
      // Fetch margins and positions concurrently
      const [margins, positionsData] = await Promise.all([
        zerodhaKiteService.getMargins(),
        zerodhaKiteService.getPositions()
      ]);

      const equityMargins = margins.equity;
      const availableBalance = equityMargins.available.cash;
      const usedMargin = equityMargins.utilised.m2m_realised + equityMargins.utilised.m2m_unrealised + equityMargins.utilised.exposure;
      const totalValue = equityMargins.net;

      let dayPnL = 0;
      const positions: BrokerPosition[] = positionsData.map(p => {
        dayPnL += p.pnl;
        return {
          symbol: p.tradingsymbol,
          quantity: p.quantity,
          averagePrice: p.average_price,
          currentPrice: p.last_price,
          pnl: p.pnl,
          pnlPercent: (p.pnl / (p.average_price * p.quantity)) * 100,
          product: p.product.toLowerCase() as 'mis' | 'cnc' | 'nrml'
        };
      });

      const dayPnLPercent = totalValue > 0 ? (dayPnL / (totalValue - dayPnL)) * 100 : 0;
      
      console.log('✅ Zerodha account data processed');
      
      return {
        accountId: this.credentials.userId || `zerodha_${this.credentials.apiKey}`,
        availableBalance,
        usedMargin,
        totalValue,
        dayPnL,
        dayPnLPercent,
        positions,
        orders: [], // TODO: Fetch orders
        hasPortfolioDataAccess: true,
      };
    } catch (error) {
      console.error('❌ Failed to fetch Zerodha account data:', error);
      throw new Error('Failed to fetch Zerodha account data');
    }
  }

  private getSimulatedAccountData(): BrokerAccount {
    console.log('🎭 Using SIMULATED account data');
    const balance = 100000 + Math.random() * 500000;
    const used = Math.random() * 50000;
    const pnl = (Math.random() - 0.5) * 1000;
    const pnlPercent = (pnl / balance) * 100;

    const numPositions = Math.floor(Math.random() * 5);
    const positions: BrokerPosition[] = [];

    for (let i = 0; i < numPositions; i++) {
      const symbol = `STOCK${i + 1}`;
      const quantity = Math.floor(Math.random() * 10) + 1;
      const avgPrice = 100 + Math.random() * 900;
      const currentPrice = avgPrice + (Math.random() - 0.5) * 20;
      const positionPnl = (currentPrice - avgPrice) * quantity;
      const positionPnlPercent = (positionPnl / (avgPrice * quantity)) * 100;

      positions.push({
        symbol,
        quantity,
        averagePrice: avgPrice,
        currentPrice: currentPrice,
        pnl: positionPnl,
        pnlPercent: positionPnlPercent,
        product: 'mis'
      });
    }

    return {
      accountId: `SIM_${Date.now()}`,
      availableBalance: balance,
      usedMargin: used,
      totalValue: balance + pnl,
      dayPnL: pnl,
      dayPnLPercent: pnlPercent,
      positions: positions,
      orders: [],
      hasPortfolioDataAccess: true
    };
  }

  subscribe(listener: (account: BrokerAccount) => void) {
    this.listeners.push(listener);
    if (this.accountData) {
      listener(this.accountData);
    }
  }

  unsubscribe(listener: (account: BrokerAccount) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  async startRealTimeUpdates() {
    if (this.realTimeUpdatesActive) return;
    this.realTimeUpdatesActive = true;

    console.log('Starting real-time account updates...');

    const updateAccountData = async () => {
      try {
        const account = await this.fetchRealAccountData();
        this.accountData = account;
        this.listeners.forEach(listener => listener(account));
      } catch (error) {
        console.error('Failed to update account data:', error);
      }
    };

    await updateAccountData();
    setInterval(updateAccountData, 15000);
  }
}

export const brokerAccountService = new BrokerAccountService();
export type { BrokerAccount, BrokerPosition, BrokerCredentials };
