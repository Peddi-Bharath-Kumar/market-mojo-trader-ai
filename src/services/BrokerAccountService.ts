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
  private lastRealDataFetch: Date | null = null;

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
      console.warn('⚠️ No broker credentials configured');
      throw new Error('No broker credentials configured');
    }

    console.log('🔄 Fetching REAL account data from', this.credentials.broker);
    
    try {
      let realAccountData: BrokerAccount;
      
      if (this.credentials.broker === 'angel') {
        realAccountData = await this.fetchAngelAccountData();
      } else if (this.credentials.broker === 'zerodha') {
        realAccountData = await this.fetchZerodhaAccountData();
      } else if (this.credentials.broker === 'upstox') {
        realAccountData = await this.fetchUpstoxAccountData();
      } else {
        throw new Error(`Unsupported broker: ${this.credentials.broker}`);
      }
      
      // Validate that we got real data (not simulation)
      if (realAccountData.accountId.startsWith('SIM_')) {
        console.warn('⚠️ Broker API returned simulated data - treating as failure');
        throw new Error('Broker API returned simulated data');
      }
      
      this.lastRealDataFetch = new Date();
      console.log('✅ Successfully fetched REAL broker account data');
      return realAccountData;
      
    } catch (error) {
      console.error('❌ Failed to fetch REAL account data:', error);
      console.warn('🔄 API call failed - will not use simulation fallback');
      throw error;
    }
  }

  private async fetchAngelAccountData(): Promise<BrokerAccount> {
    console.log('🔗 Connecting to Angel Broking API for REAL account data...');
    
    try {
      // Check if TOTP is provided in credentials
      if (!this.credentials.totp) {
        throw new Error('TOTP (6-digit authenticator code) is required for Angel Broking. Please provide it in the configuration.');
      }

      // Step 1: Authenticate with Angel Broking including TOTP
      const authPayload = {
        clientcode: this.credentials.clientId,
        password: this.credentials.pin,
        totp: this.credentials.totp
      };

      console.log('🔐 Attempting Angel Broking authentication with TOTP...');
      
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
        body: JSON.stringify(authPayload)
      });

      if (!authResponse.ok) {
        const errorText = await authResponse.text();
        console.error('❌ Angel Broking auth failed:', errorText);
        throw new Error(`Authentication failed: HTTP ${authResponse.status}`);
      }

      const authData = await authResponse.json();
      console.log('🔐 Angel Broking auth response:', authData);

      if (!authData.status || !authData.data?.jwtToken) {
        console.error('❌ Angel Broking auth failed:', authData);
        
        // Provide specific error messages for common issues
        if (authData.errorcode === 'AB1050') {
          throw new Error('Invalid TOTP code. Please check your authenticator app and enter the current 6-digit code.');
        } else if (authData.errorcode === 'AB1004') {
          throw new Error('Invalid client ID or password. Please check your credentials.');
        } else if (authData.errorcode === 'AB1010') {
          throw new Error('Account blocked or suspended. Please contact Angel Broking support.');
        } else {
          throw new Error(`Authentication failed: ${authData.message || 'Unknown error'}`);
        }
      }

      this.authToken = authData.data.jwtToken;
      console.log('✅ Angel Broking authentication successful with TOTP');
      
      // Step 2: Fetch REAL account funds
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
        console.log('💰 Angel Funds API response:', fundsData);
      } else {
        console.warn('⚠️ Failed to fetch funds data:', await fundsResponse.text());
      }

      // Step 3: Fetch REAL positions
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
        console.log('📊 Angel Positions API response:', positionsData);
      } else {
        console.warn('⚠️ Failed to fetch positions data:', await positionsResponse.text());
      }

      // Step 4: Fetch REAL holdings
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
        console.log('🏦 Angel Holdings API response:', holdingsData);
      } else {
        console.warn('⚠️ Failed to fetch holdings data:', await holdingsResponse.text());
      }

      // Process your REAL account data
      if (fundsData?.status && fundsData.data) {
        const rmsData = fundsData.data;
        const positions = positionsData?.data || [];
        const holdings = holdingsData?.data || [];

        console.log('✅ Processing YOUR REAL Angel Broking data:');
        console.log('💰 Available Cash: ₹', rmsData.availablecash);
        console.log('📊 Used Margin: ₹', rmsData.collateral);
        console.log('🏦 Your Positions:', positions.length);
        console.log('💎 Your Holdings:', holdings.length);

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
        
        console.log('🎉 YOUR REAL ANGEL BROKING ACCOUNT DATA LOADED:');
        console.log('💰 Available Balance: ₹', availableBalance.toLocaleString());
        console.log('💎 Holdings Value: ₹', holdingsValue.toLocaleString());
        console.log('📈 Total Portfolio: ₹', totalValue.toLocaleString());
        console.log('📊 Active Positions:', allPositions.length);

        return realAccountData;
      }

      throw new Error('Failed to get valid account data from Angel Broking API');

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
    throw new Error('Upstox integration not yet implemented');
  }

  async startRealTimeUpdates(): Promise<void> {
    if (!this.credentials) return;

    console.log('🔄 Starting REAL-TIME account updates...');
    
    setInterval(async () => {
      try {
        await this.fetchRealAccountData();
      } catch (error) {
        console.warn('⚠️ Real-time update failed:', error);
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
    return this.isUsingRealData && 
           this.credentials !== null && 
           this.lastRealDataFetch !== null &&
           this.accountData !== null &&
           !this.accountData.accountId.startsWith('SIM_');
  }
}

export const brokerAccountService = new BrokerAccountService();
export type { BrokerAccount, BrokerPosition, BrokerOrder };
