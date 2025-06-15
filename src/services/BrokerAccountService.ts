interface BrokerAccount {
  accountId: string;
  availableBalance: number;
  usedMargin: number;
  totalValue: number;
  dayPnL: number;
  dayPnLPercent: number;
  positions: BrokerPosition[];
  orders: BrokerOrder[];
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

interface BrokerOrder {
  orderId: string;
  symbol: string;
  orderType: string;
  quantity: number;
  price: number;
  status: string;
  timestamp: Date;
}

import { zerodhaKiteService } from './ZerodhaKiteService';

class BrokerAccountService {
  private credentials: any = null;
  private accountData: BrokerAccount | null = null;
  private listeners: ((account: BrokerAccount) => void)[] = [];
  private isUsingRealData = false;
  private authToken: string | null = null;

  setCredentials(credentials: any) {
    this.credentials = credentials;
    this.isUsingRealData = true;
    console.log('🔑 Broker credentials configured for:', credentials.broker);
    console.log('📊 REAL account data mode activated');
    
    // Configure the appropriate broker service
    if (credentials.broker === 'zerodha') {
      zerodhaKiteService.setCredentials({
        apiKey: credentials.apiKey,
        apiSecret: credentials.apiSecret,
        accessToken: credentials.accessToken,
        requestToken: credentials.requestToken
      });
    }
  }

  async fetchRealAccountData(): Promise<BrokerAccount> {
    if (!this.credentials) {
      console.warn('⚠️ No broker credentials configured - using simulation');
      return this.getRealisticSimulatedAccount();
    }

    console.log('🔄 Fetching REAL account data from', this.credentials.broker);
    
    try {
      if (this.credentials.broker === 'angel') {
        return await this.fetchAngelAccountData();
      } else if (this.credentials.broker === 'zerodha') {
        return await this.fetchZerodhaAccountData();
      } else if (this.credentials.broker === 'upstox') {
        return await this.fetchUpstoxAccountData();
      }
      
      throw new Error(`Unsupported broker: ${this.credentials.broker}`);
    } catch (error) {
      console.error('❌ Failed to fetch REAL account data:', error);
      console.warn('🔄 API call failed - falling back to simulation');
      return this.getEnhancedSimulatedAccount();
    }
  }

  private async fetchAngelAccountData(): Promise<BrokerAccount> {
    console.log('🔗 Connecting to Angel Broking API for REAL account data...');
    
    try {
      // Step 1: Authenticate with Angel Broking
      const authResponse = await fetch('https://apiconnect.angelbroking.com/rest/auth/angelbroking/user/v1/loginByPassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-UserType': 'USER',
          'X-SourceID': 'WEB',
          'X-ClientLocalIP': '192.168.1.1',
          'X-ClientPublicIP': '106.193.147.98',
          'X-MACAddress': 'fe80::216:3eff:fe1d:e1d1',
          'X-PrivateKey': this.credentials.apiKey
        },
        body: JSON.stringify({
          clientcode: this.credentials.clientId,
          password: this.credentials.pin
        })
      });

      if (!authResponse.ok) {
        throw new Error(`Authentication failed: ${authResponse.status}`);
      }

      const authData = await authResponse.json();
      console.log('🔐 Angel Broking auth status:', authData.status ? '✅ Success' : '❌ Failed');

      if (!authData.status || !authData.data?.jwtToken) {
        throw new Error(`Authentication failed: ${authData.message || 'No token received'}`);
      }

      this.authToken = authData.data.jwtToken;
      
      // Step 2: Fetch REAL account funds (your actual money)
      console.log('💰 Fetching your REAL account balance...');
      const fundsResponse = await fetch('https://apiconnect.angelbroking.com/rest/secure/angelbroking/user/v1/getRMS', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
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

      let fundsData = null;
      if (fundsResponse.ok) {
        fundsData = await fundsResponse.json();
        console.log('💰 Funds API response:', fundsData);
      }

      // Step 3: Fetch REAL positions (your current trades)
      console.log('📊 Fetching your REAL positions...');
      const positionsResponse = await fetch('https://apiconnect.angelbroking.com/rest/secure/angelbroking/portfolio/v1/getPosition', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
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

      let positionsData = null;
      if (positionsResponse.ok) {
        positionsData = await positionsResponse.json();
        console.log('📊 Positions API response:', positionsData);
      }

      // Step 4: Fetch REAL holdings (your long-term investments)
      console.log('🏦 Fetching your REAL holdings...');
      const holdingsResponse = await fetch('https://apiconnect.angelbroking.com/rest/secure/angelbroking/portfolio/v1/getAllHolding', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
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

      let holdingsData = null;
      if (holdingsResponse.ok) {
        holdingsData = await holdingsResponse.json();
        console.log('🏦 Holdings API response:', holdingsData);
      }

      // Process your REAL account data
      if (fundsData?.status && fundsData.data) {
        const rmsData = fundsData.data;
        const positions = positionsData?.data || [];
        const holdings = holdingsData?.data || [];

        console.log('✅ YOUR REAL Angel Broking data:');
        console.log('💰 Available Cash: ₹', rmsData.availablecash);
        console.log('📊 Used Margin: ₹', rmsData.collateral);
        console.log('🏦 Your Positions:', positions.length);
        console.log('💎 Your Holdings:', holdings.length);

        // Your actual available balance
        const availableBalance = parseFloat(rmsData.availablecash || '0');
        const usedMargin = parseFloat(rmsData.collateral || '0');
        
        // Process your REAL trading positions
        const allPositions: BrokerPosition[] = [];
        
        // Add intraday positions
        if (positions.length > 0) {
          positions.forEach((pos: any) => {
            if (parseInt(pos.netqty || '0') !== 0) {
              allPositions.push({
                symbol: pos.tradingsymbol,
                quantity: parseInt(pos.netqty || '0'),
                averagePrice: parseFloat(pos.avgprice || '0'),
                currentPrice: parseFloat(pos.ltp || pos.avgprice || '0'),
                pnl: parseFloat(pos.pnl || '0'),
                pnlPercent: parseFloat(pos.pnlpercent || '0'),
                product: pos.producttype?.toLowerCase() || 'mis'
              });
            }
          });
        }

        // Add long-term holdings
        if (holdings.length > 0) {
          holdings.forEach((holding: any) => {
            if (parseInt(holding.quantity || '0') > 0) {
              allPositions.push({
                symbol: holding.tradingsymbol,
                quantity: parseInt(holding.quantity || '0'),
                averagePrice: parseFloat(holding.averageprice || '0'),
                currentPrice: parseFloat(holding.ltp || holding.averageprice || '0'),
                pnl: parseFloat(holding.pnl || '0'),
                pnlPercent: parseFloat(holding.pnlpercent || '0'),
                product: 'cnc'
              });
            }
          });
        }

        // Calculate total portfolio value
        const holdingsValue = holdings.reduce((sum: number, holding: any) => {
          const qty = parseInt(holding.quantity || '0');
          const ltp = parseFloat(holding.ltp || '0');
          return sum + (qty * ltp);
        }, 0);

        const totalValue = availableBalance + usedMargin + holdingsValue;
        const dayPnL = allPositions.reduce((sum, pos) => sum + pos.pnl, 0);
        const dayPnLPercent = totalValue > 0 ? (dayPnL / totalValue) * 100 : 0;

        const realAccountData: BrokerAccount = {
          accountId: this.credentials.clientId,
          availableBalance,
          usedMargin,
          totalValue,
          dayPnL,
          dayPnLPercent,
          positions: allPositions,
          orders: []
        };

        this.accountData = realAccountData;
        this.notifyListeners(realAccountData);
        
        console.log('🎉 YOUR REAL ACCOUNT DATA LOADED:');
        console.log('💰 Available Balance: ₹', availableBalance.toLocaleString());
        console.log('💎 Holdings Value: ₹', holdingsValue.toLocaleString());
        console.log('📈 Total Portfolio: ₹', totalValue.toLocaleString());
        console.log('📊 Active Positions:', allPositions.length);

        return realAccountData;
      }

      throw new Error('Failed to get valid account data from Angel Broking');

    } catch (error) {
      console.error('❌ Angel Broking API Error:', error);
      throw error;
    }
  }

  private async fetchZerodhaAccountData(): Promise<BrokerAccount> {
    console.log('🔗 Connecting to Zerodha Kite Connect for REAL account data...');
    
    try {
      // Fetch real margins (account balance)
      const margins = await zerodhaKiteService.getMargins();
      const availableBalance = margins.equity.available.cash;
      const usedMargin = margins.equity.utilised.span + margins.equity.utilised.exposure;
      
      console.log('💰 Zerodha available cash: ₹', availableBalance.toLocaleString());
      console.log('📊 Zerodha used margin: ₹', usedMargin.toLocaleString());

      // Fetch real positions
      const positions = await zerodhaKiteService.getPositions();
      console.log('📊 Zerodha positions:', positions.length);

      // Fetch real holdings
      const holdings = await zerodhaKiteService.getHoldings();
      console.log('🏦 Zerodha holdings:', holdings.length);

      // Process positions
      const allPositions: BrokerPosition[] = [];
      
      // Add trading positions
      positions.forEach((pos: any) => {
        if (parseInt(pos.quantity || '0') !== 0) {
          allPositions.push({
            symbol: pos.tradingsymbol,
            quantity: parseInt(pos.quantity || '0'),
            averagePrice: parseFloat(pos.average_price || '0'),
            currentPrice: parseFloat(pos.last_price || pos.close_price || '0'),
            pnl: parseFloat(pos.pnl || '0'),
            pnlPercent: pos.average_price > 0 ? ((parseFloat(pos.last_price || '0') - parseFloat(pos.average_price || '0')) / parseFloat(pos.average_price || '0')) * 100 : 0,
            product: pos.product?.toLowerCase() || 'mis'
          });
        }
      });

      // Add holdings as CNC positions
      holdings.forEach((holding: any) => {
        if (parseInt(holding.quantity || '0') > 0) {
          allPositions.push({
            symbol: holding.tradingsymbol,
            quantity: parseInt(holding.quantity || '0'),
            averagePrice: parseFloat(holding.average_price || '0'),
            currentPrice: parseFloat(holding.last_price || holding.close_price || '0'),
            pnl: parseFloat(holding.pnl || '0'),
            pnlPercent: holding.average_price > 0 ? ((parseFloat(holding.last_price || '0') - parseFloat(holding.average_price || '0')) / parseFloat(holding.average_price || '0')) * 100 : 0,
            product: 'cnc'
          });
        }
      });

      // Calculate total portfolio value
      const holdingsValue = holdings.reduce((sum: number, holding: any) => {
        const qty = parseInt(holding.quantity || '0');
        const ltp = parseFloat(holding.last_price || '0');
        return sum + (qty * ltp);
      }, 0);

      const totalValue = availableBalance + usedMargin + holdingsValue;
      const dayPnL = allPositions.reduce((sum, pos) => sum + pos.pnl, 0);
      const dayPnLPercent = totalValue > 0 ? (dayPnL / totalValue) * 100 : 0;

      const realAccountData: BrokerAccount = {
        accountId: this.credentials.clientId || 'ZERODHA',
        availableBalance,
        usedMargin,
        totalValue,
        dayPnL,
        dayPnLPercent,
        positions: allPositions,
        orders: []
      };

      this.accountData = realAccountData;
      this.notifyListeners(realAccountData);
      
      console.log('🎉 YOUR REAL ZERODHA ACCOUNT DATA LOADED:');
      console.log('💰 Available Balance: ₹', availableBalance.toLocaleString());
      console.log('💎 Holdings Value: ₹', holdingsValue.toLocaleString());
      console.log('📈 Total Portfolio: ₹', totalValue.toLocaleString());
      console.log('📊 Active Positions:', allPositions.length);

      return realAccountData;

    } catch (error) {
      console.error('❌ Zerodha Kite Connect API Error:', error);
      throw error;
    }
  }

  private async fetchUpstoxAccountData(): Promise<BrokerAccount> {
    // TODO: Implement Upstox integration
    throw new Error('Upstox integration not yet implemented');
  }

  private getEnhancedSimulatedAccount(): BrokerAccount {
    const baseBalance = 250000;
    const variation = (Math.random() - 0.5) * 50000;
    
    return {
      accountId: `SIM_${this.credentials?.clientId || 'TEST123'}`,
      availableBalance: baseBalance + variation,
      usedMargin: 45000 + (Math.random() - 0.5) * 20000,
      totalValue: baseBalance + variation + 45000,
      dayPnL: (Math.random() - 0.5) * 8000,
      dayPnLPercent: (Math.random() - 0.5) * 3.2,
      positions: this.generateEnhancedPositions(),
      orders: []
    };
  }

  private generateEnhancedPositions(): BrokerPosition[] {
    const currentMarketPrices = {
      'RELIANCE': 2945,
      'TCS': 4175,
      'INFY': 1890,
      'HDFC': 1735,
      'ICICIBANK': 1055,
      'BANKNIFTY': 55420,
      'NIFTY': 24750
    };

    const symbols = Object.keys(currentMarketPrices);
    const numPositions = Math.floor(Math.random() * 3) + 1;
    
    return symbols.slice(0, numPositions).map(symbol => {
      const currentPrice = currentMarketPrices[symbol as keyof typeof currentMarketPrices];
      const avgPrice = currentPrice * (0.95 + Math.random() * 0.1);
      const quantity = Math.floor(Math.random() * 50) + 10;
      const pnl = (currentPrice - avgPrice) * quantity;
      
      return {
        symbol,
        quantity,
        averagePrice: avgPrice,
        currentPrice,
        pnl,
        pnlPercent: (pnl / (avgPrice * quantity)) * 100,
        product: ['mis', 'cnc', 'nrml'][Math.floor(Math.random() * 3)] as 'mis' | 'cnc' | 'nrml'
      };
    });
  }

  private getRealisticSimulatedAccount(): BrokerAccount {
    return {
      accountId: 'SIM_' + Date.now(),
      availableBalance: 125000,
      usedMargin: 75000,
      totalValue: 200000,
      dayPnL: (Math.random() - 0.5) * 5000,
      dayPnLPercent: (Math.random() - 0.5) * 2.5,
      positions: this.generateEnhancedPositions(),
      orders: []
    };
  }

  async startRealTimeUpdates(): Promise<void> {
    if (!this.credentials) return;

    console.log('🔄 Starting REAL-TIME account updates...');
    
    setInterval(async () => {
      try {
        await this.fetchRealAccountData();
      } catch (error) {
        console.warn('Failed to update account data:', error);
      }
    }, 30000);
  }

  subscribe(callback: (account: BrokerAccount) => void) {
    this.listeners.push(callback);
  }

  private notifyListeners(account: BrokerAccount) {
    this.listeners.forEach(callback => callback(account));
  }

  getCurrentAccount(): BrokerAccount | null {
    return this.accountData;
  }

  isUsingRealBrokerData(): boolean {
    return this.isUsingRealData && this.credentials !== null;
  }
}

export const brokerAccountService = new BrokerAccountService();
export type { BrokerAccount, BrokerPosition, BrokerOrder };
