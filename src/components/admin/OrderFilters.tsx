import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Search, X, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

interface OrderFiltersProps {
  dateRange: { from: Date | null; to: Date | null };
  onDateRangeChange: (range: { from: Date | null; to: Date | null }) => void;
  status: string;
  onStatusChange: (status: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalCount: number;
  filteredCount: number;
}

const ORDER_STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'out for delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' }
];

const getDatePreset = (preset: string) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  switch (preset) {
    case 'today':
      return { from: today, to: today };
    case 'yesterday':
      return { from: yesterday, to: yesterday };
    case 'last7days':
      return { from: weekAgo, to: today };
    default:
      return { from: null, to: null };
  }
};

export const OrderFilters: React.FC<OrderFiltersProps> = ({
  dateRange,
  onDateRangeChange,
  status,
  onStatusChange,
  searchQuery,
  onSearchChange,
  totalCount,
  filteredCount
}) => {
  const [localSearch, setLocalSearch] = React.useState(searchQuery);
  const debouncedSearch = useDebouncedValue(localSearch, 300);

  React.useEffect(() => {
    onSearchChange(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

  React.useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const hasActiveFilters = 
    dateRange.from || dateRange.to || status !== 'all' || searchQuery;

  const clearAllFilters = () => {
    onDateRangeChange({ from: null, to: null });
    onStatusChange('all');
    setLocalSearch('');
  };

  const formatDateRange = () => {
    if (!dateRange.from && !dateRange.to) return 'Select date range';
    if (dateRange.from && !dateRange.to) return format(dateRange.from, 'PP');
    if (!dateRange.from && dateRange.to) return format(dateRange.to, 'PP');
    if (dateRange.from && dateRange.to) {
      if (format(dateRange.from, 'PP') === format(dateRange.to, 'PP')) {
        return format(dateRange.from, 'PP');
      }
      return `${format(dateRange.from, 'PP')} - ${format(dateRange.to, 'PP')}`;
    }
    return 'Select date range';
  };

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-col gap-4 p-4 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters</span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear all
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Date Range Picker */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Date Range</label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span className="truncate">{formatDateRange()}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3 border-b">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDateRangeChange(getDatePreset('today'))}
                      >
                        Today
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDateRangeChange(getDatePreset('yesterday'))}
                      >
                        Yesterday
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDateRangeChange(getDatePreset('last7days'))}
                        className="col-span-2"
                      >
                        Last 7 days
                      </Button>
                    </div>
                  </div>
                  <Calendar
                    mode="range"
                    selected={{
                      from: dateRange.from || undefined,
                      to: dateRange.to || undefined
                    }}
                    onSelect={(range) => {
                      onDateRangeChange({
                        from: range?.from || null,
                        to: range?.to || null
                      });
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select value={status} onValueChange={onStatusChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((statusOption) => (
                  <SelectItem key={statusOption.value} value={statusOption.value}>
                    {statusOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Input */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order number, patient name, or phone..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {dateRange.from && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Date: {formatDateRange()}
                <button
                  onClick={() => onDateRangeChange({ from: null, to: null })}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {status !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Status: {ORDER_STATUSES.find(s => s.value === status)?.label}
                <button
                  onClick={() => onStatusChange('all')}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: "{searchQuery}"
                <button
                  onClick={() => setLocalSearch('')}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredCount} of {totalCount} orders
        </span>
      </div>
    </div>
  );
};