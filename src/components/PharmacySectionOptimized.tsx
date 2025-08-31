import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useMedicines } from '@/hooks/api-hooks';
import { MedicineCardSkeleton } from '@/components/ui/loading-skeletons';
import { ErrorState, EmptyState } from '@/components/ui/error-states';
import { Star, ShoppingCart, Heart, Truck } from 'lucide-react';

const PharmacySection = () => {
  const { addItem } = useCart();
  const { data: medicines, isLoading, error, refetch } = useMedicines();

  if (isLoading) {
    return (
      <section id="pharmacy" className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Pharmacy</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <MedicineCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="pharmacy" className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Pharmacy</h2>
          <ErrorState
            title="Failed to load medicines"
            description="We couldn't fetch the medicines. Please try again."
            action={{ label: "Retry", onClick: () => refetch() }}
          />
        </div>
      </section>
    );
  }

  if (!medicines || medicines.length === 0) {
    return (
      <section id="pharmacy" className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Pharmacy</h2>
          <EmptyState
            title="No medicines available"
            description="We don't have any medicines in stock right now. Please check back later."
            icon={<ShoppingCart className="w-12 h-12 text-muted-foreground" />}
          />
        </div>
      </section>
    );
  }

  const handleAddToCart = (medicine: any) => {
    addItem({
      id: medicine.id,
      name: medicine.name,
      brand: medicine.manufacturer,
      price: medicine.discount_price || medicine.price,
      image_url: medicine.image_url,
      requires_prescription: medicine.prescription_required,
    });
  };

  return (
    <section id="pharmacy" className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Pharmacy</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Order your medicines online with genuine quality assurance and fast delivery
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {medicines.map((medicine) => (
            <Card key={medicine.id} className="group hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
                  {medicine.image_url ? (
                    <img 
                      src={medicine.image_url} 
                      alt={medicine.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-4xl">💊</div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm line-clamp-2">{medicine.name}</h3>
                  {medicine.manufacturer && (
                    <p className="text-xs text-muted-foreground">{medicine.manufacturer}</p>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3 h-3 ${
                            i < 4 
                              ? 'fill-yellow-400 text-yellow-400' 
                              : 'text-gray-300'
                          }`} 
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      (50+)
                    </span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-lg">₹{medicine.discount_price || medicine.price}</span>
                      {medicine.discount_price && medicine.discount_price < medicine.price && (
                        <span className="text-xs text-muted-foreground line-through ml-2">
                          ₹{medicine.price}
                        </span>
                      )}
                    </div>
                    {medicine.discount_price && medicine.discount_price < medicine.price && (
                      <Badge variant="destructive" className="text-xs">
                        {Math.round((1 - medicine.discount_price / medicine.price) * 100)}% OFF
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {medicine.prescription_required && (
                      <Badge variant="secondary" className="text-xs">
                        Prescription Required
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      <Truck className="w-3 h-3 mr-1" />
                      Fast Delivery
                    </Badge>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    size="sm"
                    onClick={() => handleAddToCart(medicine)}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PharmacySection;