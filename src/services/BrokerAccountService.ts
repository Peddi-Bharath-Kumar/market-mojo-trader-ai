
interface BrokerAccount {
  accountId: string;
  availableBalance: number;
  usedMargin: number;
  totalValue: number;
  dayPnL: number;
  dayPnLPercent: number;
  positions: BrokerPosition[];
  orders: BrokerOrder[];
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

// TOTP generator following RFC 6238 standard
function generateTOTP(secret: string, timeStep: number = 30): string {
  const epoch = Math.floor(Date.now() / 1000);
  const timeCounter = Math.floor(epoch / timeStep);
  
  console.log('🔐 TOTP Debug Info:');
  console.log('- Current epoch:', epoch);
  console.log('- Time counter:', timeCounter);
  console.log('- Time step:', timeStep);
  console.log('- Secret (first 4 chars):', secret.substring(0, 4) + '***');
  
  // Convert secret to bytes (assuming base32 or plain text)
  let secretBytes: Uint8Array;
  try {
    // Try to decode as base32 first
    secretBytes = base32Decode(secret);
  } catch {
    // If base32 fails, use UTF-8 encoding
    secretBytes = new TextEncoder().encode(secret);
  }
  
  // Convert time counter to 8-byte array (big endian)
  const timeBytes = new ArrayBuffer(8);
  const timeView = new DataView(timeBytes);
  timeView.setUint32(4, timeCounter, false); // big endian
  
  // HMAC-SHA1 implementation
  const hmac = hmacSha1(secretBytes, new Uint8Array(timeBytes));
  
  // Dynamic truncation
  const offset = hmac[hmac.length - 1] & 0x0f;
  const truncated = ((hmac[offset] & 0x7f) << 24) |
                   ((hmac[offset + 1] & 0xff) << 16) |
                   ((hmac[offset + 2] & 0xff) << 8) |
                   (hmac[offset + 3] & 0xff);
  
  // Generate 6-digit code
  const totp = (truncated % 1000000).toString().padStart(6, '0');
  
  console.log('- Generated TOTP:', totp);
  return totp;
}

// Simple base32 decoder
function base32Decode(encoded: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleanInput = encoded.toUpperCase().replace(/[^A-Z2-7]/g, '');
  
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;
  
  for (const char of cleanInput) {
    const index = alphabet.indexOf(char);
    if (index === -1) continue;
    
    value = (value << 5) | index;
    bits += 5;
    
    if (bits >= 8) {
      bytes.push((value >> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  
  return new Uint8Array(bytes);
}

// Simple HMAC-SHA1 implementation
function hmacSha1(key: Uint8Array, message: Uint8Array): Uint8Array {
  const blockSize = 64;
  
  // If key is longer than block size, hash it
  if (key.length > blockSize) {
    key = sha1(key);
  }
  
  // Pad key to block size
  const paddedKey = new Uint8Array(blockSize);
  paddedKey.set(key);
  
  // Create inner and outer padding
  const innerPad = new Uint8Array(blockSize);
  const outerPad = new Uint8Array(blockSize);
  
  for (let i = 0; i < blockSize; i++) {
    innerPad[i] = paddedKey[i] ^ 0x36;
    outerPad[i] = paddedKey[i] ^ 0x5c;
  }
  
  // Hash inner pad + message
  const innerHash = sha1(new Uint8Array([...innerPad, ...message]));
  
  // Hash outer pad + inner hash
  return sha1(new Uint8Array([...outerPad, ...innerHash]));
}

// Simple SHA1 implementation
function sha1(data: Uint8Array): Uint8Array {
  const h = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0];
  
  // Pre-processing
  const msg = new Uint8Array(data.length + 9 + (64 - ((data.length + 9) % 64)) % 64);
  msg.set(data);
  msg[data.length] = 0x80;
  
  const bitLength = data.length * 8;
  const view = new DataView(msg.buffer);
  view.setUint32(msg.length - 4, bitLength & 0xffffffff, false);
  view.setUint32(msg.length - 8, Math.floor(bitLength / 0x100000000), false);
  
  // Process message in 512-bit chunks
  for (let chunk = 0; chunk < msg.length; chunk += 64) {
    const w = new Array(80);
    
    // Break chunk into sixteen 32-bit words
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(chunk + i * 4, false);
    }
    
    // Extend the sixteen 32-bit words into eighty 32-bit words
    for (let i = 16; i < 80; i++) {
      w[i] = leftRotate(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);
    }
    
    // Initialize hash value for this chunk
    let [a, b, c, d, e] = h;
    
    // Main loop
    for (let i = 0; i < 80; i++) {
      let f, k;
      if (i < 20) {
        f = (b & c) | (~b & d);
        k = 0x5A827999;
      } else if (i < 40) {
        f = b ^ c ^ d;
        k = 0x6ED9EBA1;
      } else if (i < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8F1BBCDC;
      } else {
        f = b ^ c ^ d;
        k = 0xCA62C1D6;
      }
      
      const temp = (leftRotate(a, 5) + f + e + k + w[i]) & 0xffffffff;
      e = d;
      d = c;
      c = leftRotate(b, 30);
      b = a;
      a = temp;
    }
    
    // Add this chunk's hash to result so far
    h[0] = (h[0] + a) & 0xffffffff;
    h[1] = (h[1] + b) & 0xffffffff;
    h[2] = (h[2] + c) & 0xffffffff;
    h[3] = (h[3] + d) & 0xffffffff;
    h[4] = (h[4] + e) & 0xffffffff;
  }
  
  // Produce the final hash value as a 160-bit number
  const result = new Uint8Array(20);
  const resultView = new DataView(result.buffer);
  for (let i = 0; i < 5; i++) {
    resultView.setUint32(i * 4, h[i], false);
  }
  
  return result;
}

function leftRotate(value: number, amount: number): number {
  return ((value << amount) | (value >>> (32 - amount))) & 0xffffffff;
}

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
      // Generate TOTP automatically using the TOTP key if provided
      let totp = this.credentials.totp; // Manual TOTP if provided
      if (!totp && this.credentials.totpKey) {
        totp = generateTOTP(this.credentials.totpKey);
        console.log('🔐 Auto-generated TOTP from TOTP Key:', totp);
      }

      if (!totp) {
        throw new Error('TOTP is required for Angel Broking. Please provide either a TOTP code or TOTP Key in the configuration.');
      }

      // Step 1: Authenticate with Angel Broking including TOTP
      const authPayload = {
        clientcode: this.credentials.clientId,
        password: this.credentials.pin,
        totp: totp
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
          throw new Error(`Invalid TOTP code. Generated: ${totp}. Please check your TOTP Key or manually enter the current 6-digit code.`);
        } else if (authData.errorcode === 'AB1004') {
          throw new Error('Invalid client ID or password. Please check your credentials.');
        } else if (authData.errorcode === 'AB1010') {
          throw new Error('Account blocked or suspended. Please contact Angel Broking support.');
        } else {
          throw new Error(`Authentication failed: ${authData.message || 'Unknown error'}`);
        }
      }

      this.authToken = authData.data.jwtToken;
      console.log('✅ Angel Broking authentication successful');

      // Step 2: Fetch REAL account funds (this works)
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
        throw new Error('Failed to fetch account balance data');
      }

      // Step 3: Try to fetch positions and holdings (may fail due to CORS)
      let hasPortfolioAccess = true;
      let portfolioError = '';
      const allPositions: BrokerPosition[] = [];

      try {
        console.log('📊 Attempting to fetch your REAL positions...');
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

        if (positionsResponse.ok) {
          const positionsData = await positionsResponse.json();
          console.log('📊 Angel Positions API response:', positionsData);
          
          // Process positions if available
          if (positionsData?.data && Array.isArray(positionsData.data)) {
            positionsData.data.forEach((pos: any) => {
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
        } else {
          throw new Error('Positions API failed');
        }

        console.log('🏦 Attempting to fetch your REAL holdings...');
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

        if (holdingsResponse.ok) {
          const holdingsData = await holdingsResponse.json();
          console.log('🏦 Angel Holdings API response:', holdingsData);
          
          // Process holdings if available
          if (holdingsData?.data && Array.isArray(holdingsData.data)) {
            holdingsData.data.forEach((holding: any) => {
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
        } else {
          throw new Error('Holdings API failed');
        }

      } catch (portfolioErr) {
        console.warn('⚠️ Portfolio data fetch failed (likely CORS restrictions):', portfolioErr);
        hasPortfolioAccess = false;
        portfolioError = 'Portfolio data unavailable due to browser CORS restrictions. Account balance is accessible.';
      }

      // Process your REAL account data with available information
      if (fundsData?.status && fundsData.data) {
        const rmsData = fundsData.data;

        console.log('✅ Processing YOUR REAL Angel Broking account data:');
        console.log('💰 Available Cash: ₹', rmsData.availablecash);
        console.log('📊 Used Margin: ₹', rmsData.collateral);
        console.log('🏦 Portfolio Access:', hasPortfolioAccess ? 'Available' : 'Restricted');

        const availableBalance = parseFloat(rmsData.availablecash || '0');
        const usedMargin = parseFloat(rmsData.collateral || '0');
        
        // Calculate portfolio value (limited without portfolio access)
        const holdingsValue = allPositions.reduce((sum, pos) => {
          return sum + (pos.quantity * pos.currentPrice);
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
          orders: [],
          hasPortfolioDataAccess: hasPortfolioAccess,
          portfolioError: hasPortfolioAccess ? undefined : portfolioError
        };

        this.accountData = realAccountData;
        this.notifyListeners(realAccountData);
        
        console.log('🎉 YOUR REAL ANGEL BROKING ACCOUNT DATA LOADED:');
        console.log('💰 Available Balance: ₹', availableBalance.toLocaleString());
        console.log('💎 Holdings Value: ₹', holdingsValue.toLocaleString());
        console.log('📈 Total Portfolio: ₹', totalValue.toLocaleString());
        console.log('📊 Active Positions:', allPositions.length);
        console.log('🔒 Portfolio Access:', hasPortfolioAccess ? 'Full' : 'Limited (Balance only)');

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
