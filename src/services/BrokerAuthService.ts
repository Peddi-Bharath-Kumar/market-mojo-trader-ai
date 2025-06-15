
interface AuthTestResult {
  success: boolean;
  error?: string;
  broker: string;
  realConnection: boolean;
}

// Proper TOTP generator following RFC 6238 standard
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
  // This is a simplified implementation
  // In production, use crypto.subtle.digest or a proper crypto library
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

export class BrokerAuthService {
  static async testAngelBrokingAuth(
    apiKey: string, 
    clientId: string, 
    password: string, 
    totpKey?: string
  ): Promise<AuthTestResult> {
    console.log('🔐 Testing Angel Broking authentication with password...');
    console.log('🔐 API Key:', apiKey.substring(0, 4) + '***');
    console.log('🔐 Client ID:', clientId);
    console.log('🔐 Password provided:', !!password);
    console.log('🔐 TOTP Key provided:', !!totpKey);
    
    try {
      let requestBody: any = {
        clientcode: clientId,
        password: password
      };

      // Add TOTP if provided
      if (totpKey) {
        const totp = generateTOTP(totpKey);
        requestBody.totp = totp;
        console.log('🔐 Adding TOTP to request:', totp);
      } else {
        console.log('⚠️ No TOTP Key provided - this might cause authentication failure');
      }

      console.log('🔐 Request body:', JSON.stringify(requestBody, null, 2));

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

      console.log('🔐 Response status:', authResponse.status);
      console.log('🔐 Response headers:', Object.fromEntries(authResponse.headers.entries()));

      if (!authResponse.ok) {
        throw new Error(`HTTP ${authResponse.status}: ${authResponse.statusText}`);
      }

      const authData = await authResponse.json();
      console.log('🔐 Full Angel Broking auth response:', JSON.stringify(authData, null, 2));

      if (authData.status === true && authData.data?.jwtToken) {
        console.log('✅ Angel Broking authentication successful');
        return {
          success: true,
          broker: 'angel',
          realConnection: true
        };
      } else {
        console.log('❌ Angel Broking authentication failed');
        console.log('❌ Error code:', authData.errorcode);
        console.log('❌ Error message:', authData.message);
        
        // Provide specific error guidance
        let errorMessage = authData.message || 'Authentication failed';
        if (authData.errorcode === 'AB1050' || authData.message === 'Invalid totp') {
          if (!totpKey) {
            errorMessage = 'TOTP required but not provided. Please enter your TOTP Key from Angel SmartAPI portal.';
          } else {
            errorMessage = `Invalid TOTP. Generated: ${requestBody.totp}. Please verify your TOTP Key format (should be base32 encoded) or check if time sync is correct.`;
          }
        } else if (authData.errorcode === 'AB1010') {
          errorMessage = 'Invalid client code or password. Please check your credentials.';
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
    passwordOrAccessToken: string,
    totpKey?: string
  ): Promise<AuthTestResult> {
    switch (broker) {
      case 'angel':
        return await this.testAngelBrokingAuth(apiKey, clientIdOrSecret, passwordOrAccessToken, totpKey);
      case 'zerodha':
        return await this.testZerodhaAuth(apiKey, clientIdOrSecret, passwordOrAccessToken);
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
