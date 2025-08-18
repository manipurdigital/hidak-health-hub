import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface FacetOption {
  value: string;
  label: string;
  count?: number;
}

interface FacetFilterProps {
  title: string;
  options: FacetOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  className?: string;
}

export const FacetFilter: React.FC<FacetFilterProps> = ({
  title,
  options,
  value,
  onChange,
  multiple = false,
  className = ''
}) => {
  const isSelected = (optionValue: string) => {
    if (multiple) {
      return Array.isArray(value) && value.includes(optionValue);
    }
    return value === optionValue;
  };

  const handleClick = (optionValue: string) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      if (currentValues.includes(optionValue)) {
        onChange(currentValues.filter(v => v !== optionValue));
      } else {
        onChange([...currentValues, optionValue]);
      }
    } else {
      onChange(value === optionValue ? '' : optionValue);
    }
  };

  const clearAll = () => {
    onChange(multiple ? [] : '');
  };

  const hasSelected = multiple ? 
    (Array.isArray(value) && value.length > 0) : 
    value !== '';

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">{title}</h3>
        {hasSelected && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAll}
            className="h-auto p-1 text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
        )}
      </div>
      
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-center justify-between">
            <Button
              variant={isSelected(option.value) ? "default" : "ghost"}
              size="sm"
              onClick={() => handleClick(option.value)}
              className="justify-start flex-1 h-auto py-2 px-3"
            >
              <span className="text-sm">{option.label}</span>
              {option.count !== undefined && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {option.count}
                </Badge>
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};