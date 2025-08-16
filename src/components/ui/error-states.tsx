import React from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorStateProps {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'error' | 'network' | 'empty';
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  description = "We encountered an error while loading this content.",
  action,
  variant = 'error'
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'network':
        return <WifiOff className="w-12 h-12 text-muted-foreground" />;
      case 'empty':
        return <AlertTriangle className="w-12 h-12 text-muted-foreground" />;
      default:
        return <AlertTriangle className="w-12 h-12 text-destructive" />;
    }
  };

  return (
    <Card className="mx-auto max-w-md">
      <CardContent className="flex flex-col items-center justify-center p-8 text-center">
        {getIcon()}
        <CardTitle className="mt-4 text-lg">{title}</CardTitle>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        {action && (
          <Button 
            onClick={action.onClick} 
            className="mt-4"
            variant={variant === 'error' ? 'destructive' : 'default'}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export const EmptyState: React.FC<{
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
}> = ({ title, description, action, icon }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    {icon || <AlertTriangle className="w-12 h-12 text-muted-foreground" />}
    <h3 className="mt-4 text-lg font-semibold">{title}</h3>
    <p className="mt-2 text-sm text-muted-foreground max-w-sm">{description}</p>
    {action && (
      <Button onClick={action.onClick} className="mt-4">
        {action.label}
      </Button>
    )}
  </div>
);

export const NetworkError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <ErrorState
    title="Connection Problem"
    description="Unable to connect to the server. Please check your internet connection and try again."
    action={{ label: "Try Again", onClick: onRetry }}
    variant="network"
  />
);

export const LoadingError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <ErrorState
    title="Failed to Load"
    description="Something went wrong while loading this content."
    action={{ label: "Retry", onClick: onRetry }}
    variant="error"
  />
);