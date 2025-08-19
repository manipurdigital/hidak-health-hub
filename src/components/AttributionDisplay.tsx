import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, Globe, Calendar } from 'lucide-react';

interface AttributionDisplayProps {
  sourceAttribution: string;
  sourceDomain: string;
  sourceUrl?: string;
  lastFetched?: string;
  variant?: 'default' | 'compact' | 'footer';
  className?: string;
}

export function AttributionDisplay({
  sourceAttribution,
  sourceDomain,
  sourceUrl,
  lastFetched,
  variant = 'default',
  className = ''
}: AttributionDisplayProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSourceClick = () => {
    if (sourceUrl) {
      window.open(sourceUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 text-xs text-muted-foreground ${className}`}>
        <Globe className="w-3 h-3" />
        <span>Source: {sourceDomain}</span>
        {sourceUrl && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSourceClick}
            className="h-4 px-1 text-xs"
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <div className={`border-t pt-2 mt-4 text-xs text-muted-foreground ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-3 h-3" />
            <span>{sourceAttribution}</span>
          </div>
          <div className="flex items-center gap-2">
            {lastFetched && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Fetched {formatDate(lastFetched)}</span>
              </div>
            )}
            {sourceUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSourceClick}
                className="h-4 px-1 text-xs"
              >
                <ExternalLink className="w-3 h-3" />
                View Source
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <Card className={`bg-muted/50 ${className}`}>
      <CardContent className="pt-3 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <Badge variant="secondary" className="text-xs">
                Source Attribution
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{sourceAttribution}</p>
            {lastFetched && (
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>Last updated: {formatDate(lastFetched)}</span>
              </div>
            )}
          </div>
          
          {sourceUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSourceClick}
              className="shrink-0"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              View Source
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}