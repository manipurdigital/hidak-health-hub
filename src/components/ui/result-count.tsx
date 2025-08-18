import React from 'react';
import { Badge } from '@/components/ui/badge';

interface ResultCountProps {
  total: number;
  showing: number;
  searchTerm?: string;
  className?: string;
}

export const ResultCount: React.FC<ResultCountProps> = ({
  total,
  showing,
  searchTerm,
  className = ''
}) => {
  const formatCount = (count: number) => {
    return count.toLocaleString();
  };

  return (
    <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
      <span>
        Showing {formatCount(showing)} of {formatCount(total)} results
      </span>
      {searchTerm && (
        <Badge variant="secondary" className="text-xs">
          for "{searchTerm}"
        </Badge>
      )}
    </div>
  );
};