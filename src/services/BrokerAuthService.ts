
interface AuthTestResult {
  success: boolean;
  error?: string;
  broker: string;
  realConnection: boolean;
}

export class BrokerAuthService {
  static async testAngelBrokingAuth(apiKey: string, apiSecret: string, clientId?: string): Promise<AuthTestResult> {
    console.log('🔐 Testing REAL Angel Broking authentication...');
    
    try {
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
          'X-PrivateKey': apiKey
        },
        body: JSON.stringify({
          clientcode: clientId || apiKey,
          password: apiSecret
        })
      });

      const authData = await authResponse.json();
      console.log('🔐 Angel Broking auth response:', authData);

      if (authData.status === true && authData.data?.jwtToken) {
        console.log('✅ Angel Broking authentication successful');
        return {
          success: true,
          broker: 'angel',
          realConnection: true
        };
      } else {
        console.log('❌ Angel Broking authentication failed:', authData.message);
        return {
          success: false,
          error: authData.message || 'Authentication failed',
          broker: 'angel',
          realConnection: true
        };
      }
    } catch (error) {
      console.error('❌ Angel Broking API connection failed:', error);
      return {
        success: false,
        error: `Network error: ${error instanceof Error ? error.message : 'Connection failed'}`,
        broker: 'angel',
        realConnection: false
      };
    }
  }

  static async testZerodhaAuth(apiKey: string, apiSecret: string, accessToken?: string): Promise<AuthTestResult> {
    console.log('🔐 Testing REAL Zerodha authentication...');
    
    if (!accessToken) {
      return {
        success: false,
        error: 'Access token required for Zerodha. Please complete the login flow first.',
        broker: 'zerodha',
        realConnection: false
      };
    }

    try {
      // Test with a simple API call that requires authentication
      const response = await fetch('https://api.kite.trade/user/profile', {
        headers: {
          'Authorization': `token ${apiKey}:${accessToken}`,
        },
      });

      const data = await response.json();
      console.log('🔐 Zerodha auth response:', data);

      if (data.status === 'success') {
        console.log('✅ Zerodha authentication successful');
        return {
          success: true,
          broker: 'zerodha',
          realConnection: true
        };
      } else {
        console.log('❌ Zerodha authentication failed:', data.message);
        return {
          success: false,
          error: data.message || 'Authentication failed',
          broker: 'zerodha',
          realConnection: true
        };
      }
    } catch (error) {
      console.error('❌ Zerodha API connection failed:', error);
      return {
        success: false,
        error: `Network error: ${error instanceof Error ? error.message : 'Connection failed'}`,
        broker: 'zerodha',
        realConnection: false
      };
    }
  }

  static async testBrokerCredentials(broker: string, apiKey: string, apiSecret: string, accessToken?: string, clientId?: string): Promise<AuthTestResult> {
    switch (broker) {
      case 'angel':
        return await this.testAngelBrokingAuth(apiKey, apiSecret, clientId);
      case 'zerodha':
        return await this.testZerodhaAuth(apiKey, apiSecret, accessToken);
      default:
        return {
          success: false,
          error: `Broker ${broker} not supported yet`,
          broker,
          realConnection: false
        };
    }
  }
}
