
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
import { useToast } from '@/hooks/use-toast';

const TradingDashboard = () => {
  const [isTrading, setIsTrading] = useState(false);
  const [apiConfigured, setApiConfigured] = useState(false);
  const [currentProfit, setCurrentProfit] = useState(0);
  const [dailyTarget] = useState(2); // 2% daily target
  const { toast } = useToast();

  const handleStartTrading = () => {
    if (!apiConfigured) {
      toast({
        title: "API Configuration Required",
        description: "Please configure your broker API keys first",
        variant: "destructive"
      });
      return;
    }
    
    setIsTrading(true);
    toast({
      title: "Trading Started",
      description: "Automated trading agent is now active",
    });
  };

  const handleStopTrading = () => {
    setIsTrading(false);
    toast({
      title: "Trading Stopped",
      description: "Automated trading agent has been stopped",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Trading Agent
          </h1>
          <p className="text-gray-600">
            Automated trading with sentiment analysis, technical indicators, and risk management
          </p>
        </div>

        {/* Control Panel */}
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
                <div className={`h-3 w-3 rounded-full ${isTrading ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button 
                onClick={handleStartTrading} 
                disabled={isTrading}
                className="bg-green-600 hover:bg-green-700"
              >
                Start Trading
              </Button>
              <Button 
                onClick={handleStopTrading} 
                disabled={!isTrading}
                variant="destructive"
              >
                Stop Trading
              </Button>
              <Button variant="outline">
                Emergency Stop
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="market">Market Data</TabsTrigger>
            <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
            <TabsTrigger value="strategy">Strategy</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="backtest">Backtest</TabsTrigger>
            <TabsTrigger value="config">Config</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PerformanceMonitor isTrading={isTrading} />
              <RiskManagement />
            </div>
          </TabsContent>

          <TabsContent value="market">
            <MarketDataPanel />
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
              onConfigured={setApiConfigured} 
              isConfigured={apiConfigured}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TradingDashboard;
