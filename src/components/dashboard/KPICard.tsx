import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  previousValue?: number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  format?: 'currency' | 'number' | 'percentage';
}

export function KPICard({ 
  title, 
  value, 
  previousValue, 
  change, 
  changeLabel,
  icon,
  format = 'number'
}: KPICardProps) {
  const formatValue = (val: string | number) => {
    const numVal = typeof val === 'string' ? parseFloat(val) : val;
    
    switch (format) {
      case 'currency':
        return `₹${numVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
      case 'percentage':
        return `${numVal.toFixed(1)}%`;
      default:
        return numVal.toLocaleString('en-IN');
    }
  };

  const calculateChange = () => {
    if (change !== undefined) return change;
    if (previousValue !== undefined && typeof value === 'number') {
      if (previousValue === 0) return value > 0 ? 100 : 0;
      return ((value - previousValue) / previousValue) * 100;
    }
    return 0;
  };

  const changeValue = calculateChange();
  const isPositive = changeValue > 0;
  const isNegative = changeValue < 0;

  return (
    <Card className="bg-card hover:bg-accent/5 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-muted-foreground">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground mb-1">
          {formatValue(value)}
        </div>
        <div className="flex items-center text-xs">
          {isPositive && (
            <>
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-green-600 font-medium">
                +{changeValue.toFixed(1)}%
              </span>
            </>
          )}
          {isNegative && (
            <>
              <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              <span className="text-red-600 font-medium">
                {changeValue.toFixed(1)}%
              </span>
            </>
          )}
          {!isPositive && !isNegative && (
            <>
              <Minus className="h-3 w-3 text-muted-foreground mr-1" />
              <span className="text-muted-foreground font-medium">
                0%
              </span>
            </>
          )}
          <span className="text-muted-foreground ml-1">
            {changeLabel || 'vs previous period'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}