
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarketDataPanel } from '@/components/trading/MarketDataPanel';
import { SentimentAnalysis } from '@/components/trading/SentimentAnalysis';
import { TechnicalAnalysis } from '@/components/trading/TechnicalAnalysis';
import { TradingStrategy } from '@/components/trading/TradingStrategy';
import { OrderExecution } from '@/components/trading/OrderExecution';
import { BacktestPanel } from '@/components/trading/BacktestPanel';
import { RiskManagement } from '@/components/trading/RiskManagement';
import { PerformanceMonitor } from '@/components/trading/PerformanceMonitor';
import { APIConfiguration } from '@/components/trading/APIConfiguration';
import { VirtualTradingMode } from '@/components/trading/VirtualTradingMode';
import { OptionsGreeksPanel } from '@/components/trading/OptionsGreeksPanel';
import { useToast } from '@/hooks/use-toast';
import { marketDataService } from '@/services/MarketDataService';
import { brokerAccountService } from '@/services/BrokerAccountService';
import { TradingRobotDashboard } from '@/components/trading/TradingRobotDashboard';
import { orderExecutionService } from '@/services/OrderExecutionService';

const TradingDashboard = () => {
  const [isTrading, setIsTrading] = useState(false);
  const [isVirtualTrading, setIsVirtualTrading] = useState(false);
  const [apiConfigured, setApiConfigured] = useState(false);
  const [currentProfit, setCurrentProfit] = useState(0);
  const [dailyTarget] = useState(2); // 2% daily target
  const [brokerConnected, setBrokerConnected] = useState(false);
  const [dataMode, setDataMode] = useState<'live' | 'simulated'>('simulated');
  const { toast } = useToast();

  // Check for saved credentials and restore connection state
  useEffect(() => {
    console.log('🔄 TradingDashboard: Checking for persistent credentials...');
    const savedCredentials = localStorage.getItem('trading-credentials');
    if (savedCredentials) {
      try {
        const credentials = JSON.parse(savedCredentials);
        if (credentials.isAuthenticated) {
          console.log('✅ Found authenticated credentials, restoring dashboard state...');
          setApiConfigured(true);
          setBrokerConnected(true);
          
          // Restore broker account service
          brokerAccountService.setCredentials(credentials);
          
          // Restore market data service
          marketDataService.setApiConfig({
            broker: credentials.broker,
            apiKey: credentials.apiKey,
            apiSecret: credentials.broker === 'angel' ? credentials.clientId : credentials.apiSecret,
            accessToken: credentials.broker === 'angel' ? 
              (credentials.authMethod === 'session' ? credentials.sessionToken : credentials.password) : 
              credentials.accessToken
          });
          
          console.log('🔗 Dashboard state restored with real broker connection');
          
          // Start real-time account updates
          brokerAccountService.startRealTimeUpdates();
          
          // After restoring credentials, connect market data and set mode badge
          const updateMode = () => setDataMode(marketDataService.getCurrentDataMode());
          marketDataService.connect().then(updateMode).catch(updateMode);
          // Keep up to date if it changes
          const interval = setInterval(updateMode, 15000);
          return () => clearInterval(interval);
        }
      } catch (error) {
        console.error('❌ Failed to restore dashboard state:', error);
      }
    }
  }, []);

  // Monitor broker account for P&L updates
  useEffect(() => {
    if (brokerConnected) {
      brokerAccountService.subscribe((account) => {
        setCurrentProfit(account.dayPnLPercent);
      });
    }
  }, [brokerConnected]);

  const handleStartTrading = () => {
    if (!apiConfigured) {
      toast({
        title: "API Configuration Required",
        description: "Please configure your broker API keys first",
        variant: "destructive"
      });
      return;
    }
    
    orderExecutionService.enableLiveTrading();
    setIsTrading(true);
    toast({
      title: "Live Trading Started",
      description: "Automated trading agent is now active with real money",
    });
  };

  const handleStopTrading = () => {
    orderExecutionService.disableLiveTrading();
    setIsTrading(false);
    toast({
      title: "Live Trading Stopped",
      description: "Automated trading agent has been stopped",
    });
  };

  const handleEmergencyStop = () => {
    orderExecutionService.disableLiveTrading();
    setIsTrading(false);
    setIsVirtualTrading(false);
    toast({
      title: "Emergency Stop Activated",
      description: "All trading activities have been immediately stopped",
      variant: "destructive"
    });
  };

  const handleConfigurationChange = (configured: boolean) => {
    setApiConfigured(configured);
    setBrokerConnected(configured);
    
    if (configured) {
      console.log('✅ API configured, starting real-time updates...');
      brokerAccountService.startRealTimeUpdates();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Professional AI Trading Agent
          </h1>
          <p className="text-gray-600">
            Advanced AI robot with intraday, options strategies, real-time analysis, and automatic risk management
          </p>
        </div>

        {/* Enhanced Control Panel */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Trading Controls
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="text-gray-500">Daily Target: </span>
                  <span className="font-semibold text-green-600">{dailyTarget}%</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Current P&L: </span>
                  <span className={`font-semibold ${currentProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {currentProfit.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${isTrading ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="text-sm">Live</span>
                  <div className={`h-3 w-3 rounded-full ${isVirtualTrading ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                  <span className="text-sm">Virtual</span>
                  <div className={`h-3 w-3 rounded-full ${brokerConnected ? 'bg-yellow-500' : 'bg-gray-400'}`}></div>
                  <span className="text-sm">Broker</span>
                  {/* Add badge or dot for Data Mode */}
                  <div className={`h-3 w-3 rounded-full ${dataMode === 'live' ? 'bg-green-700' : 'bg-gray-500'}`}></div>
                  <span className="text-sm">{dataMode === 'live' ? 'Live Data' : 'Simulated Data'}</span>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              <Button 
                onClick={handleStartTrading} 
                disabled={isTrading || !apiConfigured}
                className="bg-green-600 hover:bg-green-700"
              >
                Start Live Trading
              </Button>
              <Button 
                onClick={handleStopTrading} 
                disabled={!isTrading}
                variant="outline"
              >
                Stop Live Trading
              </Button>
              <Button 
                onClick={() => setIsVirtualTrading(!isVirtualTrading)}
                variant={isVirtualTrading ? "default" : "outline"}
                className={isVirtualTrading ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                {isVirtualTrading ? 'Stop' : 'Start'} Virtual Trading
              </Button>
              <Button 
                onClick={handleEmergencyStop}
                variant="destructive"
              >
                Emergency Stop
              </Button>
            </div>
            {brokerConnected && (
              <div className="mt-3 text-sm text-green-700 bg-green-50 p-2 rounded">
                ✅ Real broker connection active - All data is persistent across tabs
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="robot" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-11">
            <TabsTrigger value="robot">AI Robot</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="virtual">Virtual</TabsTrigger>
            <TabsTrigger value="market">Market Data</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
            <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
            <TabsTrigger value="strategy">Strategy</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="backtest">Backtest</TabsTrigger>
            <TabsTrigger value="config">Config</TabsTrigger>
          </TabsList>

          <TabsContent value="robot">
            <TradingRobotDashboard />
          </TabsContent>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PerformanceMonitor isTrading={isTrading} />
              <RiskManagement />
            </div>
          </TabsContent>

          <TabsContent value="virtual">
            <VirtualTradingMode 
              isActive={isVirtualTrading} 
              onToggle={setIsVirtualTrading} 
            />
          </TabsContent>

          <TabsContent value="market">
            <MarketDataPanel apiConfigured={apiConfigured} />
          </TabsContent>

          <TabsContent value="options">
            <OptionsGreeksPanel />
          </TabsContent>

          <TabsContent value="sentiment">
            <SentimentAnalysis />
          </TabsContent>

          <TabsContent value="technical">
            <TechnicalAnalysis />
          </TabsContent>

          <TabsContent value="strategy">
            <TradingStrategy />
          </TabsContent>

          <TabsContent value="orders">
            <OrderExecution isTrading={isTrading} />
          </TabsContent>

          <TabsContent value="backtest">
            <BacktestPanel />
          </TabsContent>

          <TabsContent value="config">
            <APIConfiguration 
              onConfigured={handleConfigurationChange} 
              isConfigured={apiConfigured}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TradingDashboard;
