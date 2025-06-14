import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Play, Square, TrendingUp, TrendingDown, DollarSign, Target, Activity } from 'lucide-react';

interface VirtualPosition {
  id: string;
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  entryTime: number;
  type: 'long' | 'short';
}

interface VirtualTradingModeProps {
  isActive: boolean;
  onToggle: (active: boolean) => void;
}

export const VirtualTradingMode: React.FC<VirtualTradingModeProps> = ({ isActive, onToggle }) => {
  const [virtualBalance, setVirtualBalance] = useState(100000); // ₹1,00,000 virtual money
  const [initialBalance] = useState(100000);
  const [positions, setPositions] = useState<VirtualPosition[]>([]);
  const [totalPnL, setTotalPnL] = useState(0);
  const [dayPnL, setDayPnL] = useState(0);
  const [winRate, setWinRate] = useState(0);
  const [totalTrades, setTotalTrades] = useState(0);

  // Simulate virtual trading positions
  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        // Simulate price movements for existing positions
        setPositions(prev => prev.map(position => {
          const priceChange = (Math.random() - 0.5) * 0.02; // ±2% price movement
          const newPrice = position.currentPrice * (1 + priceChange);
          const pnl = position.type === 'long' 
            ? (newPrice - position.entryPrice) * position.quantity
            : (position.entryPrice - newPrice) * position.quantity;
          const pnlPercent = (pnl / (position.entryPrice * position.quantity)) * 100;

          return {
            ...position,
            currentPrice: newPrice,
            pnl,
            pnlPercent
          };
        }));

        // Randomly execute new virtual trades
        if (Math.random() > 0.7) { // 30% chance every interval
          executeVirtualTrade();
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [isActive]);

  // Calculate portfolio metrics
  useEffect(() => {
    const currentPnL = positions.reduce((sum, pos) => sum + pos.pnl, 0);
    setTotalPnL(currentPnL);
    setDayPnL(currentPnL);
    
    if (positions.length > 0) {
      const winningTrades = positions.filter(pos => pos.pnl > 0).length;
      setWinRate((winningTrades / positions.length) * 100);
    }
    setTotalTrades(positions.length);
  }, [positions]);

  const executeVirtualTrade = () => {
    const symbols = ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'TCS', 'HDFC', 'INFY'];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const entryPrice = 100 + Math.random() * 1000;
    const quantity = Math.floor(Math.random() * 100) + 1;
    const type = Math.random() > 0.5 ? 'long' : 'short';

    const newPosition: VirtualPosition = {
      id: `VP_${Date.now()}`,
      symbol,
      quantity,
      entryPrice,
      currentPrice: entryPrice,
      pnl: 0,
      pnlPercent: 0,
      entryTime: Date.now(),
      type
    };

    setPositions(prev => [...prev, newPosition]);
    console.log('Virtual trade executed:', newPosition);
  };

  const resetVirtualPortfolio = () => {
    setPositions([]);
    setVirtualBalance(initialBalance);
    setTotalPnL(0);
    setDayPnL(0);
    setWinRate(0);
    setTotalTrades(0);
  };

  const currentBalance = virtualBalance + totalPnL;
  const portfolioReturn = ((currentBalance - initialBalance) / initialBalance) * 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Virtual Trading Mode
              <Badge variant={isActive ? 'default' : 'secondary'}>
                {isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => onToggle(!isActive)}
                variant={isActive ? 'destructive' : 'default'}
                size="sm"
              >
                {isActive ? <Square className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                {isActive ? 'Stop' : 'Start'} Virtual Trading
              </Button>
              <Button onClick={resetVirtualPortfolio} variant="outline" size="sm">
                Reset Portfolio
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Portfolio Value</span>
                </div>
                <div className="text-2xl font-bold">₹{currentBalance.toLocaleString()}</div>
                <div className={`text-sm ${portfolioReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {portfolioReturn >= 0 ? '+' : ''}{portfolioReturn.toFixed(2)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Day P&L</span>
                </div>
                <div className={`text-2xl font-bold ${dayPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{dayPnL.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">
                  {dayPnL >= 0 ? 'Profit' : 'Loss'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-gray-600">Win Rate</span>
                </div>
                <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
                <Progress value={winRate} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-gray-600">Total Trades</span>
                </div>
                <div className="text-2xl font-bold">{totalTrades}</div>
                <div className="text-sm text-gray-500">
                  {positions.length} Active
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Positions */}
          <div className="space-y-4">
            <h4 className="font-medium">Active Virtual Positions</h4>
            {positions.length > 0 ? (
              <div className="space-y-2">
                {positions.slice(0, 5).map((position) => (
                  <div key={position.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${position.type === 'long' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {position.type === 'long' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="font-medium">{position.symbol}</div>
                        <div className="text-sm text-gray-600">
                          {position.quantity} @ ₹{position.entryPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-medium">₹{position.currentPrice.toFixed(2)}</div>
                      <div className={`text-sm ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {position.pnl >= 0 ? '+' : ''}₹{position.pnl.toFixed(2)} ({position.pnlPercent.toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No virtual positions yet</p>
                <p className="text-sm">Start virtual trading to see positions here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-medium text-blue-800 mb-3">Virtual Trading Performance</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-600">Starting Capital:</span>
              <div className="font-medium">₹{initialBalance.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-blue-600">Current Value:</span>
              <div className="font-medium">₹{currentBalance.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-blue-600">Total Return:</span>
              <div className={`font-medium ${portfolioReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {portfolioReturn.toFixed(2)}%
              </div>
            </div>
            <div>
              <span className="text-blue-600">Risk Level:</span>
              <div className="font-medium">Moderate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
