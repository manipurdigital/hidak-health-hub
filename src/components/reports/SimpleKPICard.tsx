import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface SimpleKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  isLoading?: boolean;
  compact?: boolean;
}

export function SimpleKPICard({ title, value, subtitle, isLoading, compact = false }: SimpleKPICardProps) {
  if (isLoading) {
    return (
      <Card className={compact ? "p-3" : ""}>
        <CardContent className={compact ? "p-0 space-y-2" : "space-y-2"}>
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-16" />
          {subtitle && <Skeleton className="h-3 w-12" />}
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="p-3">
        <CardContent className="p-0 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="text-lg font-bold">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">
          {value}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}