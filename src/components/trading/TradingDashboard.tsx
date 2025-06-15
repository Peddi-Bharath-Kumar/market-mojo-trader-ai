
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TradingRobotDashboard } from './TradingRobotDashboard';
import { IndianMarketAPIConfiguration } from './IndianMarketAPIConfiguration';
import { RealAccountOverview } from './RealAccountOverview';
import { VirtualTradingMode } from './VirtualTradingMode';
import { marketDataService } from '@/services/MarketDataService';
import { brokerAccountService } from '@/services/BrokerAccountService';

export const TradingDashboard = () => {
  const [apiConfigured, setApiConfigured] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isVirtualTrading, setIsVirtualTrading] = useState(false);

  useEffect(() => {
    // Check initial connection status
    const status = marketDataService.getConnectionStatus();
    setApiConfigured(status.isConnected);
    setConnectionStatus(status.isConnected ? 'connected' : 'disconnected');

    // Monitor connection status
    const interval = setInterval(() => {
      const currentStatus = marketDataService.getConnectionStatus();
      setConnectionStatus(currentStatus.isConnected ? 'connected' : 'disconnected');
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleApiConfigured = (configured: boolean) => {
    setApiConfigured(configured);
    if (configured) {
      setConnectionStatus('connected');
      // Initialize broker account service with the same credentials
      const status = marketDataService.getConnectionStatus();
      if (status.isConnected) {
        console.log('🔗 Initializing real account data service...');
      }
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          🇮🇳 AI Trading Platform
        </h1>
        <p className="text-gray-600 mt-2">
          Professional trading system optimized for Indian markets (NSE/BSE)
        </p>
      </div>

      <Tabs defaultValue="setup" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="setup">🔧 API Setup</TabsTrigger>
          <TabsTrigger value="account">💼 Account</TabsTrigger>
          <TabsTrigger value="robot">🤖 AI Robot</TabsTrigger>
          <TabsTrigger value="virtual">🎮 Virtual Trading</TabsTrigger>
          <TabsTrigger value="analysis">📊 Analysis</TabsTrigger>
        </TabsList>

        {/* API Configuration */}
        <TabsContent value="setup">
          <IndianMarketAPIConfiguration 
            onConfigured={handleApiConfigured}
            isConfigured={apiConfigured}
          />
        </TabsContent>

        {/* Real Account Overview */}
        <TabsContent value="account">
          <RealAccountOverview />
        </TabsContent>

        {/* AI Trading Robot */}
        <TabsContent value="robot">
          <TradingRobotDashboard />
        </TabsContent>

        {/* Virtual Trading */}
        <TabsContent value="virtual">
          <VirtualTradingMode 
            isActive={isVirtualTrading} 
            onToggle={setIsVirtualTrading} 
          />
        </TabsContent>

        {/* Analysis */}
        <TabsContent value="analysis">
          <div className="text-center py-12">
            <h3 className="text-xl font-medium mb-4">Advanced Market Analysis</h3>
            <p className="text-gray-600">Coming soon - Technical analysis, backtesting, and performance metrics</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
