import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackToHomeProps {
  variant?: 'button' | 'link' | 'breadcrumb';
  className?: string;
  showIcon?: boolean;
  text?: string;
}

export function BackToHome({ 
  variant = 'button', 
  className, 
  showIcon = true,
  text = 'Back to Home' 
}: BackToHomeProps) {
  const iconElement = showIcon ? <Home className="w-4 h-4" /> : null;
  
  if (variant === 'link') {
    return (
      <Link 
        to="/" 
        className={cn(
          "inline-flex items-center gap-2 text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors",
          className
        )}
      >
        {iconElement}
        {text}
      </Link>
    );
  }

  if (variant === 'breadcrumb') {
    return (
      <Link 
        to="/" 
        className={cn(
          "inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors",
          className
        )}
      >
        <ArrowLeft className="w-3 h-3" />
        Home
      </Link>
    );
  }

  return (
    <Button asChild variant="outline" size="sm" className={className}>
      <Link to="/" className="inline-flex items-center gap-2">
        {iconElement}
        {text}
      </Link>
    </Button>
  );
}