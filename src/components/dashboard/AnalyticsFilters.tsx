import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Filter, RotateCcw } from 'lucide-react';
import { DateRange } from '@/hooks/admin-analytics';

interface AnalyticsFiltersProps {
  selectedRange: DateRange;
  onRangeChange: (range: DateRange) => void;
  onResetFilters: () => void;
}

const dateRangeOptions: { value: DateRange; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '28d', label: 'Last 28 days' },
  { value: '90d', label: 'Last 90 days' },
];

export function AnalyticsFilters({
  selectedRange,
  onRangeChange,
  onResetFilters,
}: AnalyticsFiltersProps) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Date Range:</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {dateRangeOptions.map((option) => (
              <Button
                key={option.value}
                variant={selectedRange === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => onRangeChange(option.value)}
                className="text-xs"
              >
                {option.label}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Filter className="h-3 w-3" />
              {dateRangeOptions.find(opt => opt.value === selectedRange)?.label}
            </Badge>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="text-xs flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}