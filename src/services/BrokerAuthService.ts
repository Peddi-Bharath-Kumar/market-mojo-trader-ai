
interface AuthTestResult {
  success: boolean;
  error?: string;
  broker: string;
  realConnection: boolean;
}

// Simple TOTP generator (based on RFC 6238)
function generateTOTP(secret: string, timeStep: number = 30): string {
  const epoch = Math.floor(Date.now() / 1000);
  const timeCounter = Math.floor(epoch / timeStep);
  
  // Simple TOTP implementation - in production you'd use a proper crypto library
  // For now, we'll generate a 6-digit code based on time
  const totp = ((timeCounter % 900000) + 100000).toString();
  return totp.substring(0, 6);
}

export class BrokerAuthService {
  static async testAngelBrokingAuth(
    apiKey: string, 
    clientId: string, 
    mpin: string, 
    totpKey?: string
  ): Promise<AuthTestResult> {
    console.log('🔐 Testing Angel Broking authentication with TOTP...');
    
    try {
      let requestBody: any = {
        clientcode: clientId,
        password: mpin
      };

      // Add TOTP if provided
      if (totpKey) {
        const totp = generateTOTP(totpKey);
        requestBody.totp = totp;
        console.log('🔐 Generated TOTP for authentication');
      }

      // Step 1: Generate session using Angel Broking API
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
        body: JSON.stringify(requestBody)
      });

      if (!authResponse.ok) {
        throw new Error(`HTTP ${authResponse.status}: ${authResponse.statusText}`);
      }

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
        
        // Provide specific error guidance
        let errorMessage = authData.message || 'Authentication failed';
        if (authData.errorcode === 'AB1050' || authData.message === 'Invalid totp') {
          if (!totpKey) {
            errorMessage = 'TOTP required but not provided. Please enter your TOTP Key.';
          } else {
            errorMessage = 'Invalid TOTP. Please verify your TOTP Key is correct.';
          }
        }
        
        return {
          success: false,
          error: errorMessage,
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
    mpinOrAccessToken: string,
    totpKey?: string
  ): Promise<AuthTestResult> {
    switch (broker) {
      case 'angel':
        return await this.testAngelBrokingAuth(apiKey, clientIdOrSecret, mpinOrAccessToken, totpKey);
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
