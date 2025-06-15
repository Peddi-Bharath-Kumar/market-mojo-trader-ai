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

    try {
      const response = await fetch('https://apiconnect.angelbroking.com/rest/secure/angelbroking/user/v1/getProfile', {
        headers: {
          'Authorization': `Bearer ${this.credentials.accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-UserType': 'USER',
          'X-SourceID': 'WEB',
          'X-ClientLocalIP': '192.168.1.1',
          'X-ClientPublicIP': '106.193.147.98',
          'X-MACAddress': 'fe80::216:3eff:fe1d:e1d1',
          'X-PrivateKey': this.credentials.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Angel Broking API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status && data.data) {
        const profile = data.data;
        const availableBalance = parseFloat(profile.availablecash || '0');
        const usedMargin = parseFloat(profile.usedmargin || '0');
        const totalValue = parseFloat(profile.networth || '0');

        // Fetch positions separately due to CORS issue
        let positions: BrokerPosition[] = [];
        let dayPnL = 0;
        let dayPnLPercent = 0;
        let hasPortfolioDataAccess = true;
        let portfolioError: string | null = null;

        try {
          const positionsResponse = await fetch('https://apiconnect.angelbroking.com/rest/secure/angelbroking/portfolio/v1/getPositions', {
            headers: {
              'Authorization': `Bearer ${this.credentials.accessToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'X-UserType': 'USER',
              'X-SourceID': 'WEB',
              'X-ClientLocalIP': '192.168.1.1',
              'X-ClientPublicIP': '106.193.147.98',
              'X-MACAddress': 'fe80::216:3eff:fe1d:e1d1',
              'X-PrivateKey': this.credentials.apiKey
            }
          });

          if (positionsResponse.ok) {
            const positionsData = await positionsResponse.json();

            if (positionsData.status && positionsData.data) {
              positions = positionsData.data.map((item: any) => {
                const pnl = parseFloat(item.unrealisedprofit || '0');
                dayPnL += pnl;

                return {
                  symbol: item.symbolname,
                  quantity: parseInt(item.netqty || '0'),
                  averagePrice: parseFloat(item.averageprice || '0'),
                  currentPrice: parseFloat(item.ltp || '0'),
                  pnl: pnl,
                  pnlPercent: parseFloat(item.pnlpercent || '0'),
                  product: item.producttype.toLowerCase() as 'mis' | 'cnc' | 'nrml'
                };
              });
            } else {
              hasPortfolioDataAccess = false;
              portfolioError = positionsData.message || 'Failed to fetch positions';
              console.warn('Failed to fetch positions:', positionsData.message);
            }
          } else {
            hasPortfolioDataAccess = false;
            portfolioError = `Failed to fetch positions: ${positionsResponse.status} ${positionsResponse.statusText}`;
            console.warn('Failed to fetch positions:', positionsResponse.status, positionsResponse.statusText);
          }
        } catch (corsError: any) {
          hasPortfolioDataAccess = false;
          portfolioError = 'CORS error - positions data unavailable';
          console.error('CORS error fetching positions:', corsError.message);
        }

        dayPnLPercent = totalValue > 0 ? (dayPnL / totalValue) * 100 : 0;

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

        console.log('✅ Angel Broking account data processed');
        return account;
      } else {
        throw new Error(data.message || 'Failed to fetch profile data');
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch Angel Broking account data:', error);
      throw new Error(error.message || 'Failed to fetch account data');
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
