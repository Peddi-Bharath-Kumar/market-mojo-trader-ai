
interface AuthTestResult {
  success: boolean;
  error?: string;
  broker: string;
  realConnection: boolean;
}

export class BrokerAuthService {
  static async testAngelBrokingAuth(apiKey: string, clientId: string, mpin: string): Promise<AuthTestResult> {
    console.log('🔐 Testing REAL Angel Broking authentication...');
    
    try {
      // Step 1: Generate session using the correct Angel Broking API
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
          clientcode: clientId,
          password: mpin
        })
      });

      if (!authResponse.ok) {
        throw new Error(`HTTP ${authResponse.status}: ${authResponse.statusText}`);
      }

      const authData = await authResponse.json();
      console.log('🔐 Angel Broking auth response:', authData);

      // Handle the TOTP error specifically
      if (authData.errorcode === 'AB1050' || authData.message === 'Invalid totp') {
        return {
          success: false,
          error: 'Angel Broking requires TOTP (Two-Factor Authentication). Please:\n1. Enable API access in your Angel account\n2. Generate an API session token\n3. Use session-based authentication instead of password\n\nAlternatively, try using session token method or contact Angel support to disable TOTP for API access.',
          broker: 'angel',
          realConnection: true
        };
      }

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
          error: authData.message || 'Authentication failed - check your API Key, Client ID, and MPIN',
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

  // Alternative method for Angel Broking using session token
  static async testAngelBrokingWithSession(apiKey: string, clientId: string, sessionToken: string): Promise<AuthTestResult> {
    console.log('🔐 Testing Angel Broking with session token...');
    
    try {
      // Test the profile API with session token
      const profileResponse = await fetch('https://apiconnect.angelbroking.com/rest/secure/angelbroking/user/v1/getProfile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-UserType': 'USER',
          'X-SourceID': 'WEB',
          'X-ClientLocalIP': '192.168.1.1',
          'X-ClientPublicIP': '106.193.147.98',
          'X-MACAddress': 'fe80::216:3eff:fe1d:e1d1',
          'X-PrivateKey': apiKey
        }
      });

      const profileData = await profileResponse.json();
      console.log('🔐 Angel profile response:', profileData);

      if (profileData.status === true) {
        return {
          success: true,
          broker: 'angel',
          realConnection: true
        };
      } else {
        return {
          success: false,
          error: profileData.message || 'Session token authentication failed',
          broker: 'angel',
          realConnection: true
        };
      }
    } catch (error) {
      console.error('❌ Angel session token test failed:', error);
      return {
        success: false,
        error: `Session token error: ${error instanceof Error ? error.message : 'Connection failed'}`,
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

  static async testBrokerCredentials(
    broker: string, 
    apiKey: string, 
    clientIdOrSecret: string, 
    mpinOrAccessToken: string
  ): Promise<AuthTestResult> {
    switch (broker) {
      case 'angel':
        return await this.testAngelBrokingAuth(apiKey, clientIdOrSecret, mpinOrAccessToken);
      case 'zerodha':
        return await this.testZerodhaAuth(apiKey, clientIdOrSecret, mpinOrAccessToken);
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
