import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Clock, MapPin, ShoppingCart } from 'lucide-react';
import { useTrendingMedicines, TrendingMedicine } from '@/hooks/use-demand-recommendations';

interface TrendingMedicinesCarouselProps {
  city?: string;
  pincode?: string;
  limit?: number;
  className?: string;
}

export function TrendingMedicinesCarousel({ 
  city, 
  pincode, 
  limit = 8,
  className = ''
}: TrendingMedicinesCarouselProps) {
  const { data: medicines, isLoading, error } = useTrendingMedicines(city, pincode, limit);

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const formatScore = (score: number) => {
    return Math.round(score * 100) / 100;
  };

  const currentTime = new Date();
  const timeDisplay = currentTime.toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Unable to load trending medicines</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Trending Now
          <Badge variant="secondary" className="ml-auto flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeDisplay}
          </Badge>
        </CardTitle>
        {(city || pincode) && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {city && <span>{city}</span>}
            {pincode && <span>{pincode}</span>}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : medicines && medicines.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {medicines.map((medicine) => (
                <TrendingMedicineCard key={medicine.medicine_id} medicine={medicine} />
              ))}
            </div>
            
            {medicines.length >= limit && (
              <div className="text-center pt-4">
                <Link to="/medicines">
                  <Button variant="outline" size="sm">
                    View All Medicines
                  </Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No trending medicines at this time</p>
            <p className="text-xs mt-1">Check back later for recommendations</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TrendingMedicineCardProps {
  medicine: TrendingMedicine;
}

function TrendingMedicineCard({ medicine }: TrendingMedicineCardProps) {
  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const formatScore = (score: number) => {
    return Math.round(score * 100) / 100;
  };

  const getDemandLevel = (score: number) => {
    if (score >= 10) return { label: 'High', color: 'destructive' };
    if (score >= 5) return { label: 'Medium', color: 'default' };
    return { label: 'Low', color: 'secondary' };
  };

  const demandLevel = getDemandLevel(medicine.score);

  return (
    <Link to={`/medicines/${medicine.medicine_id}`}>
      <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer border-border hover:border-primary/20">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Image */}
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
              {medicine.image_url ? (
                <img 
                  src={medicine.image_url} 
                  alt={medicine.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            
            {/* Content */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                {medicine.name}
              </h4>
              
              <div className="flex items-center justify-between">
                <span className="font-semibold text-primary">
                  {formatPrice(medicine.price)}
                </span>
                <Badge 
                  variant={demandLevel.color as any}
                  className="text-xs"
                >
                  {demandLevel.label}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Score: {formatScore(medicine.score)}</span>
                {medicine.expected_qty > 0 && (
                  <span>~{Math.ceil(medicine.expected_qty)} units</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}