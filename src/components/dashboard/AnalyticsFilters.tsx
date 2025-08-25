import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Filter, RotateCcw, CalendarIcon } from 'lucide-react';
import { DateRange } from '@/hooks/admin-analytics';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

interface AnalyticsFiltersProps {
  selectedRange: DateRange;
  onRangeChange: (range: DateRange) => void;
  onResetFilters: () => void;
  customStartDate?: Date;
  customEndDate?: Date;
  onCustomDateChange: (startDate: Date | undefined, endDate: Date | undefined) => void;
}

const dateRangeOptions: { value: DateRange; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '28d', label: 'Last 28 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'custom', label: 'Custom Range' },
];

export function AnalyticsFilters({
  selectedRange,
  onRangeChange,
  onResetFilters,
  customStartDate,
  customEndDate,
  onCustomDateChange,
}: AnalyticsFiltersProps) {
  const [tempStartDate, setTempStartDate] = React.useState<Date | undefined>(customStartDate);
  const [tempEndDate, setTempEndDate] = React.useState<Date | undefined>(customEndDate);

  const handleCustomRangeApply = () => {
    if (tempStartDate && tempEndDate) {
      onCustomDateChange(tempStartDate, tempEndDate);
      onRangeChange('custom');
    }
  };

  const getDisplayLabel = () => {
    if (selectedRange === 'custom' && customStartDate && customEndDate) {
      return `${format(customStartDate, 'MMM dd')} - ${format(customEndDate, 'MMM dd, yyyy')}`;
    }
    return dateRangeOptions.find(opt => opt.value === selectedRange)?.label;
  };
  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Date Range:</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {dateRangeOptions.slice(0, -1).map((option) => (
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
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={selectedRange === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs"
                >
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  Custom Range
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !tempStartDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {tempStartDate ? format(tempStartDate, "PPP") : "Pick start date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={tempStartDate}
                          onSelect={setTempStartDate}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !tempEndDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {tempEndDate ? format(tempEndDate, "PPP") : "Pick end date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={tempEndDate}
                          onSelect={setTempEndDate}
                          disabled={(date) => tempStartDate ? date < tempStartDate : false}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <Button
                    onClick={handleCustomRangeApply}
                    disabled={!tempStartDate || !tempEndDate}
                    className="w-full"
                    size="sm"
                  >
                    Apply Custom Range
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Filter className="h-3 w-3" />
              {getDisplayLabel()}
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