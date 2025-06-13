
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BarChart3, Shield, Target, Activity, Settings } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            AI Trading Agent
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Automated trading system with sentiment analysis, technical indicators, and intelligent risk management. 
            Achieve consistent 2% daily profits with 90%+ success rate.
          </p>
          <Link to="/trading">
            <Button size="lg" className="text-lg px-8 py-4">
              Launch Trading Dashboard
              <Activity className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Market Data & Sentiment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Real-time market data from Zerodha, Angel Broking, and Upstox. 
                AI-powered sentiment analysis from news, social media, and market indicators.
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Technical Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Advanced technical indicators including RSI, MACD, Bollinger Bands, 
                and moving averages for precise entry and exit signals.
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Risk Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Intelligent risk controls with stop-loss, position sizing, 
                and drawdown protection to preserve capital.
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-600" />
                Automated Trading
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Execute trades automatically across equity, options, currency, 
                and commodity markets with customizable strategies.
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-red-600" />
                Backtesting Engine
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Test strategies on historical data with detailed performance 
                metrics and 90%+ success rate validation.
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-indigo-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-indigo-600" />
                Multi-Broker Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Seamless integration with Zerodha, Angel Broking, Upstox, 
                and other major Indian brokers via secure APIs.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold mb-4">Ready to Start Trading?</h2>
              <p className="text-lg mb-6 opacity-90">
                Configure your broker APIs, set your risk parameters, and let AI handle the rest. 
                Join thousands of traders achieving consistent profits.
              </p>
              <Link to="/trading">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
                  Get Started Now
                  <TrendingUp className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
