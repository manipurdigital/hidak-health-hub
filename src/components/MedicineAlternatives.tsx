import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Package, ShoppingCart } from 'lucide-react';
import { useSimilarMedicines } from '@/hooks/useSimilarMedicines';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

interface MedicineAlternativesProps {
  medicineId: string;
  medicineName: string;
  originalPrice?: number;
}

export function MedicineAlternatives({ medicineId, medicineName, originalPrice }: MedicineAlternativesProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  
  // First try exact composition matches
  const { 
    data: exactAlternatives = [], 
    isLoading: exactLoading, 
    error: exactError 
  } = useSimilarMedicines(medicineId, 'exact');

  // If less than 3 exact matches, also show family matches
  const shouldShowFamily = Array.isArray(exactAlternatives) && exactAlternatives.length < 3;
  const { 
    data: familyAlternatives = [], 
    isLoading: familyLoading, 
    error: familyError 
  } = useSimilarMedicines(medicineId, 'family');

  const isLoading = exactLoading || (shouldShowFamily && familyLoading);
  const error = exactError || familyError;

  // Combine results, prioritizing exact matches
  const allAlternatives = React.useMemo(() => {
    const exactArray = Array.isArray(exactAlternatives) ? exactAlternatives : [];
    const familyArray = Array.isArray(familyAlternatives) ? familyAlternatives : [];
    
    const combined = [...exactArray];
    if (shouldShowFamily) {
      // Add family alternatives that aren't already in exact matches
      const exactIds = new Set(exactArray.map(alt => alt.id));
      const uniqueFamilyAlts = familyArray.filter(alt => !exactIds.has(alt.id));
      combined.push(...uniqueFamilyAlts);
    }
    return combined.slice(0, 6); // Limit to 6 alternatives
  }, [exactAlternatives, familyAlternatives, shouldShowFamily]);

  const handleAddToCart = (medicine: any) => {
    try {
      addItem({
        id: medicine.id,
        name: medicine.name,
        price: medicine.price,
        image_url: medicine.thumbnail_url,
        requires_prescription: false // Default for alternatives
      });
      
      toast({
        title: "Added to cart",
        description: `${medicine.name} has been added to your cart.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number) => {
    return `₹${price.toFixed(2)}`;
  };

  const getPriceComparison = (alternativePrice: number) => {
    if (!originalPrice || originalPrice <= 0) return null;
    
    const difference = alternativePrice - originalPrice;
    const percentageDiff = Math.abs((difference / originalPrice) * 100);
    
    if (Math.abs(difference) < 0.01) {
      return { type: 'same', label: 'Same price', color: 'text-muted-foreground' };
    } else if (difference < 0) {
      return { 
        type: 'cheaper', 
        label: `₹${Math.abs(difference).toFixed(2)} cheaper`,
        color: 'text-green-600',
        percentage: percentageDiff.toFixed(0)
      };
    } else {
      return { 
        type: 'costlier', 
        label: `₹${difference.toFixed(2)} costlier`,
        color: 'text-red-600',
        percentage: percentageDiff.toFixed(0)
      };
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Alternatives (same composition)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2 text-muted-foreground">Loading alternatives...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Alternatives (same composition)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive text-sm mb-4">
              Failed to load alternatives. Please try again.
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (allAlternatives.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Alternatives (same composition)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-muted-foreground mb-2">
              No alternatives found
            </h3>
            <p className="text-sm text-muted-foreground">
              We couldn't find any medicines with the same composition as {medicineName}.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Alternatives (same composition)
          <Badge variant="secondary" className="ml-2">
            {allAlternatives.length} found
          </Badge>
        </CardTitle>
        {Array.isArray(exactAlternatives) && exactAlternatives.length > 0 && shouldShowFamily && Array.isArray(familyAlternatives) && familyAlternatives.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Showing exact composition matches and similar active ingredients
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allAlternatives.map((medicine, index) => {
            const isExactMatch = Array.isArray(exactAlternatives) && exactAlternatives.some(exact => exact.id === medicine.id);
            
            return (
              <Card key={medicine.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {medicine.thumbnail_url && (
                      <img 
                        src={medicine.thumbnail_url} 
                        alt={medicine.name}
                        className="w-16 h-16 object-cover rounded-lg bg-muted flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Link 
                          to={`/medicine/${medicine.id}`}
                          className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors"
                        >
                          {medicine.name}
                        </Link>
                        {isExactMatch && (
                          <Badge variant="default" className="text-xs flex-shrink-0">
                            Exact
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-primary">
                            {formatPrice(medicine.price)}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddToCart(medicine)}
                            className="ml-2"
                          >
                            <ShoppingCart className="w-3 h-3 mr-1" />
                            Add
                          </Button>
                        </div>
                        {(() => {
                          const comparison = getPriceComparison(medicine.price);
                          return comparison ? (
                            <div className={`text-xs font-medium ${comparison.color}`}>
                              {comparison.label}
                              {comparison.percentage && (
                                <span className="ml-1">({comparison.percentage}% {comparison.type === 'cheaper' ? 'less' : 'more'})</span>
                              )}
                            </div>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {allAlternatives.length >= 6 && (
          <div className="mt-6 text-center">
            <Button variant="outline" asChild>
              <Link to={`/medicines?similar_to=${medicineId}`}>
                View All Alternatives
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}