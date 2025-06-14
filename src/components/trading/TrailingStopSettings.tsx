
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Shield,
  Settings,
  DollarSign
} from 'lucide-react';

interface TrailingStopSettingsProps {
  trailingEnabled: boolean;
  partialBookingEnabled: boolean;
  onTrailingToggle: (enabled: boolean) => void;
  onPartialBookingToggle: (enabled: boolean) => void;
}

export const TrailingStopSettings = ({
  trailingEnabled,
  partialBookingEnabled,
  onTrailingToggle,
  onPartialBookingToggle
}: TrailingStopSettingsProps) => {
  return (
    <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-green-600" />
          Advanced Position Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Trailing Stop Loss Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Trailing Stop Loss
              </div>
              <div className="text-sm text-gray-600">
                Automatically moves stop loss to lock in profits as position gains
              </div>
            </div>
            <Switch
              checked={trailingEnabled}
              onCheckedChange={onTrailingToggle}
            />
          </div>

          {trailingEnabled && (
            <div className="bg-white p-4 rounded-lg border space-y-3">
              <h4 className="font-medium">Trailing Logic:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span>1% Profit → Move to Breakeven</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>2% Profit → Trail by 1.5%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Continue trailing upwards</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Partial Profit Booking */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                Partial Profit Booking
              </div>
              <div className="text-sm text-gray-600">
                Books partial profits at different levels to secure gains
              </div>
            </div>
            <Switch
              checked={partialBookingEnabled}
              onCheckedChange={onPartialBookingToggle}
            />
          </div>

          {partialBookingEnabled && (
            <div className="bg-white p-4 rounded-lg border space-y-3">
              <h4 className="font-medium">Booking Strategy:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>At 2% profit:</span>
                  <Badge variant="outline">Book 50% quantity</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>At 4% profit:</span>
                  <Badge variant="outline">Book additional 25%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Remaining 25%:</span>
                  <Badge variant="outline">Trail till target/stop</Badge>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Strategy Benefits */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-600" />
            Strategy Benefits
          </h4>
          <div className="text-sm space-y-1 text-blue-700">
            <div>• Locks in profits while letting winners run</div>
            <div>• Reduces risk after initial profit is secured</div>
            <div>• Maximizes returns from strong trending moves</div>
            <div>• Protects against sudden market reversals</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
