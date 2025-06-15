import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { brokerAccountService, type BrokerAccount } from '@/services/BrokerAccountService';

export const RealAccountOverview = () => {
  const [account, setAccount] = useState<BrokerAccount | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isRealBrokerData, setIsRealBrokerData] = useState(false);

  useEffect(() => {
    // Subscribe to account updates
    brokerAccountService.subscribe((accountData) => {
      console.log('📊 Account update received:', accountData);
      setAccount(accountData);
      setIsConnected(true);
      setLastUpdated(new Date());
      setConnectionError(null);
      
      // Check if this is real broker data or simulation
      const isReal = !accountData.accountId.startsWith('SIM_');
      setIsRealBrokerData(isReal);
      
      if (isReal) {
        console.log('✅ Confirmed real broker data');
      } else {
        console.warn('⚠️ Received simulated data');
        setConnectionError('Broker API failed - showing simulated data');
      }
    });

    // Try to load account data if credentials are available
    loadAccountData();
  }, []);

  const loadAccountData = async () => {
    setIsLoading(true);
    setConnectionError(null);
    
    try {
      console.log('🔄 Loading real broker account data...');
      const accountData = await brokerAccountService.fetchRealAccountData();
      
      // Validate this is real data
      if (accountData.accountId.startsWith('SIM_')) {
        throw new Error('Broker API returned simulated data');
      }
      
      setAccount(accountData);
      setIsConnected(true);
      setIsRealBrokerData(true);
      setLastUpdated(new Date());
      
      // Start real-time updates
      await brokerAccountService.startRealTimeUpdates();
      
      console.log('✅ Real broker account data loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load real broker account data:', error);
      setConnectionError(error instanceof Error ? error.message : 'Connection failed');
      setIsConnected(false);
      setIsRealBrokerData(false);
      setAccount(null); // Don't show simulated data
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAccount = () => {
    console.log('🔄 Manual refresh triggered');
    loadAccountData();
  };

  if (!account) {
    return (
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-600" />
          <h3 className="text-lg font-medium mb-2">Connect Your Real Broker Account</h3>
          <p className="text-sm text-gray-600 mb-4">
            Configure your broker API credentials in the Config tab to see real account data
          </p>
          {connectionError && (
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-sm text-red-700">
              <strong>Error:</strong> {connectionError}
              <div className="mt-1 text-xs">
                No simulated data will be shown - only real broker data
              </div>
            </div>
          )}
          <Button onClick={loadAccountData} disabled={isLoading}>
            {isLoading ? 'Connecting...' : 'Try Real Connection'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Connection Status */}
      <Card className={`${isRealBrokerData ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isRealBrokerData ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-600" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {isRealBrokerData ? '🔗 Real Broker Connected' : '❌ Real Broker Failed'}
                  </span>
                  <Badge variant={isRealBrokerData ? "default" : "destructive"}>
                    {isRealBrokerData ? "REAL BROKER DATA" : "BROKER API FAILED"}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  {isRealBrokerData 
                    ? `Account: ${account.accountId} | Last updated: ${lastUpdated?.toLocaleTimeString()}`
                    : 'Real broker connection required for live data'
                  }
                </div>
                {isRealBrokerData && (
                  <div className="text-xs text-green-700 font-medium mt-1">
                    ✅ Using real broker API data - no simulation
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshAccount}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          {connectionError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              <strong>Connection Error:</strong> {connectionError}
              <div className="mt-1 text-xs">
                This could be due to: Invalid credentials, API rate limits, network issues, or TOTP problems
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real Account Summary - Only show if we have real data */}
      {isRealBrokerData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Total Portfolio Value</span>
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700">REAL</Badge>
                </div>
                <div className="text-2xl font-bold">₹{account.totalValue.toLocaleString()}</div>
                <div className={`text-sm flex items-center gap-1 ${account.dayPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {account.dayPnL >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {account.dayPnL >= 0 ? '+' : ''}₹{account.dayPnL.toLocaleString()} ({account.dayPnLPercent.toFixed(2)}%)
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Available Balance</span>
                  <Badge variant="outline" className="text-xs">REAL</Badge>
                </div>
                <div className="text-2xl font-bold">₹{account.availableBalance.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Ready for new trades</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-gray-600">Used Margin</span>
                </div>
                <div className="text-2xl font-bold">₹{account.usedMargin.toLocaleString()}</div>
                <div className="text-sm text-gray-500">In open positions</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-gray-600">Active Positions</span>
                </div>
                <div className="text-2xl font-bold">{account.positions.length}</div>
                <div className="text-sm text-gray-500">Live trades</div>
              </CardContent>
            </Card>
          </div>

          {/* Real Positions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📊 Your Live Positions
                <Badge variant="default" className="bg-green-600 text-white">
                  REAL BROKER DATA
                </Badge>
                <Badge variant="outline" className="text-green-700 border-green-300">
                  ✅ LIVE
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {account.positions.length > 0 ? (
                <div className="space-y-3">
                  {account.positions.map((position, index) => (
                    <div key={index} className={`p-4 border rounded-lg ${position.pnl >= 0 ? 'border-l-4 border-l-green-500 bg-green-50' : 'border-l-4 border-l-red-500 bg-red-50'}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-lg">{position.symbol}</span>
                            <Badge variant="outline" className="text-xs text-green-700 bg-green-50">REAL</Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            Qty: {position.quantity} | Avg: ₹{position.averagePrice.toFixed(2)} | Product: {position.product.toUpperCase()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold">₹{position.currentPrice.toFixed(2)}</div>
                          <div className={`text-sm font-medium ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {position.pnl >= 0 ? '+' : ''}₹{position.pnl.toFixed(2)} ({position.pnlPercent.toFixed(1)}%)
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active positions</p>
                  <p className="text-sm">Start trading to see your positions here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Debug Information */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-sm">Debug Information</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            <div>Real Data Mode: {isRealBrokerData ? '✅ YES' : '❌ NO'}</div>
            <div>Connection Status: {isConnected ? '✅ Connected' : '❌ Disconnected'}</div>
            <div>Last Updated: {lastUpdated?.toISOString()}</div>
            <div>Account ID: {account?.accountId}</div>
            <div>Is Simulation: {account?.accountId.startsWith('SIM_') ? '❌ YES' : '✅ NO'}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
