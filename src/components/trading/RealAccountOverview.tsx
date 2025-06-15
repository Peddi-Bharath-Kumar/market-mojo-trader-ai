
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
  AlertTriangle
} from 'lucide-react';
import { brokerAccountService, type BrokerAccount } from '@/services/BrokerAccountService';

export const RealAccountOverview = () => {
  const [account, setAccount] = useState<BrokerAccount | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    // Subscribe to account updates
    brokerAccountService.subscribe((accountData) => {
      setAccount(accountData);
      setIsConnected(true);
      setLastUpdated(new Date());
    });

    // Try to load account data if credentials are available
    loadAccountData();
  }, []);

  const loadAccountData = async () => {
    setIsLoading(true);
    try {
      const accountData = await brokerAccountService.fetchRealAccountData();
      setAccount(accountData);
      setIsConnected(true);
      setLastUpdated(new Date());
      
      // Start real-time updates
      await brokerAccountService.startRealTimeUpdates();
    } catch (error) {
      console.error('Failed to load account data:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAccount = () => {
    loadAccountData();
  };

  if (!account) {
    return (
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-600" />
          <h3 className="text-lg font-medium mb-2">Connect Your Broker Account</h3>
          <p className="text-sm text-gray-600 mb-4">
            Configure your broker API credentials to see real account data
          </p>
          <Button onClick={loadAccountData} disabled={isLoading}>
            {isLoading ? 'Connecting...' : 'Try Connection'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className={`${isConnected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isConnected ? (
                <Wifi className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-600" />
              )}
              <div>
                <div className="font-medium">
                  {isConnected ? '🔗 Live Broker Connection' : '❌ Broker Disconnected'}
                </div>
                <div className="text-sm text-gray-600">
                  {isConnected 
                    ? `Account: ${account.accountId} | Last updated: ${lastUpdated?.toLocaleTimeString()}`
                    : 'Using realistic simulation data'
                  }
                </div>
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
        </CardContent>
      </Card>

      {/* Real Account Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-600">Total Portfolio Value</span>
            </div>
            <div className="text-2xl font-bold">₹{account.totalValue.toLocaleString()}</div>
            <div className={`text-sm flex items-center gap-1 ${account.dayPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {account.dayPnL >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {account.dayPnL >= 0 ? '+' : ''}₹{account.dayPnL.toLocaleString()} ({account.dayPnLPercent.toFixed(2)}%)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-gray-600">Available Balance</span>
            </div>
            <div className="text-2xl font-bold">₹{account.availableBalance.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Ready for new trades</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-gray-600">Used Margin</span>
            </div>
            <div className="text-2xl font-bold">₹{account.usedMargin.toLocaleString()}</div>
            <div className="text-sm text-gray-500">In open positions</div>
          </CardContent>
        </Card>

        <Card>
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
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? "Real Data" : "Simulation"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {account.positions.length > 0 ? (
            <div className="space-y-3">
              {account.positions.map((position, index) => (
                <div key={index} className={`p-4 border rounded-lg ${position.pnl >= 0 ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-lg">{position.symbol}</div>
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
    </div>
  );
};
