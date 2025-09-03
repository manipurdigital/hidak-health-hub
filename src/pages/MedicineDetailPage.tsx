// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Star, ShoppingCart, Zap, Truck, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useMedicine } from '@/hooks/medicine-hooks';
import { useCart } from '@/contexts/CartContext';
import { PrescriptionUpload } from '@/components/PrescriptionUpload';
import { MedicineAlternatives } from '@/components/MedicineAlternatives';
import { AttributionDisplay } from '@/components/AttributionDisplay';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-states';
import { Breadcrumb, BackButton } from '@/components/Breadcrumb';

export function MedicineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [prescriptionFile, setPrescriptionFile] = useState<string | null>(null);
  const [showPrescriptionUpload, setShowPrescriptionUpload] = useState(false);

  const { data: medicine, isLoading, error } = useMedicine(id!);

  if (isLoading) {
    return <MedicineDetailSkeleton />;
  }

  if (error || !medicine) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <ErrorState
          title="Medicine Not Found"
          description="The medicine you're looking for doesn't exist or is unavailable."
          action={{
            label: "Browse Medicines",
            onClick: () => navigate('/medicines')
          }}
        />
      </div>
    );
  }

  const handleAddToCart = () => {
    if (medicine.requires_prescription && !prescriptionFile) {
      setShowPrescriptionUpload(true);
      toast({
        title: "Prescription Required",
        description: "Please upload a valid prescription to add this medicine to cart.",
        variant: "destructive",
      });
      return;
    }

    addItem({
      id: medicine.id,
      name: medicine.name,
      brand: medicine.brand,
      price: medicine.price,
      image_url: medicine.image_url,
      requires_prescription: medicine.requires_prescription,
    });
  };

  const handleBuyNow = () => {
    if (medicine.requires_prescription && !prescriptionFile) {
      setShowPrescriptionUpload(true);
      toast({
        title: "Prescription Required",
        description: "Please upload a valid prescription to proceed.",
        variant: "destructive",
      });
      return;
    }

    addItem({
      id: medicine.id,
      name: medicine.name,
      brand: medicine.brand,
      price: medicine.price,
      image_url: medicine.image_url,
      requires_prescription: medicine.requires_prescription,
    });
    navigate('/checkout');
  };

  const isOutOfStock = medicine.stock_quantity === 0;
  const discountedPrice = medicine.original_price 
    ? medicine.original_price - medicine.price 
    : 0;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb 
          items={[
            { label: "Medicines", href: "/#pharmacy" },
            { label: medicine.name }
          ]} 
          className="mb-4" 
        />
        <BackButton onClick={() => navigate(-1)} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Medicine Image */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  {(medicine.thumbnail_url || medicine.image_url) ? (
                    <img
                      src={medicine.thumbnail_url || medicine.image_url}
                      alt={medicine.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const triedFallback = target.getAttribute('data-fallback-tried') === 'true';
                        const primary = medicine.thumbnail_url || '';
                        const secondary = medicine.image_url || '';
                        if (!triedFallback && primary && secondary && primary !== secondary) {
                          target.setAttribute('data-fallback-tried', 'true');
                          target.src = secondary;
                          return;
                        }
                        console.log('Image failed to load:', primary || secondary);
                        target.style.display = 'none';
                        const parent = target.parentElement!;
                        parent.innerHTML = '<div class="text-muted-foreground">Image not available</div>';
                      }}
                    />
                  ) : (
                    <div className="text-muted-foreground">No image available</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Additional Benefits */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Truck className="w-5 h-5 text-primary" />
                    <span className="text-xs">Fast Delivery</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    <span className="text-xs">Verified</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span className="text-xs">Top Rated</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Medicine Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{medicine.name}</CardTitle>
                    {medicine.brand && (
                      <p className="text-muted-foreground mt-1">by {medicine.brand}</p>
                    )}
                  </div>
                  {medicine.requires_prescription && (
                    <Badge variant="secondary">Prescription Required</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Price */}
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-primary">₹{medicine.price}</span>
                  {medicine.original_price && medicine.original_price > medicine.price && (
                    <>
                      <span className="text-lg text-muted-foreground line-through">
                        ₹{medicine.original_price}
                      </span>
                      <Badge variant="destructive">
                        {medicine.discount_percentage}% OFF
                      </Badge>
                    </>
                  )}
                </div>

                {/* Salt Composition */}
                {medicine.salt_composition && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Salt Composition (Generic)</h4>
                    <p className="text-sm text-muted-foreground">{medicine.salt_composition}</p>
                  </div>
                )}

                {/* Manufacturer & MRP Info */}
                <div className="space-y-2">
                  {(medicine.marketed_by || medicine.manufacturer) && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Marketed by</h4>
                      <p className="text-sm text-muted-foreground">{medicine.marketed_by || medicine.manufacturer}</p>
                    </div>
                  )}
                  
                  {medicine.mrp && medicine.mrp > medicine.price && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">MRP:</span>
                      <span className="line-through text-muted-foreground">₹{medicine.mrp}</span>
                      {medicine.discount_percent && (
                        <Badge variant="secondary" className="text-xs">
                          {medicine.discount_percent}% OFF
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Pack Size & Form */}
                <div className="flex gap-4 text-sm text-muted-foreground">
                  {medicine.pack_size && <span>Pack: {medicine.pack_size}</span>}
                  {medicine.dosage_form && <span>Form: {medicine.dosage_form}</span>}
                  {medicine.dosage_strength && <span>Strength: {medicine.dosage_strength}</span>}
                </div>

                {/* Prescription Type */}
                {medicine.prescription_type && (
                  <div className="flex items-center gap-2">
                    <Badge variant={medicine.prescription_type === 'OTC' ? 'secondary' : 'destructive'}>
                      {medicine.prescription_type}
                    </Badge>
                    {medicine.habit_forming && (
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        Habit Forming
                      </Badge>
                    )}
                  </div>
                )}

                {/* Stock Status */}
                <div className="flex items-center gap-2">
                  {isOutOfStock ? (
                    <Badge variant="destructive">Out of Stock</Badge>
                  ) : (
                    <Badge variant="secondary">
                      {medicine.stock_quantity} in stock
                    </Badge>
                  )}
                </div>

                {/* Rating */}
                {medicine.rating > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{medicine.rating}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({medicine.review_count} reviews)
                    </span>
                  </div>
                )}

                <Separator />

                {/* Description */}
                {medicine.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground">{medicine.description}</p>
                  </div>
                )}

                {/* Prescription Upload */}
                {medicine.requires_prescription && (
                  <PrescriptionUpload
                    onUploadComplete={(url) => {
                      setPrescriptionFile(url);
                      setShowPrescriptionUpload(false);
                    }}
                    isOpen={showPrescriptionUpload}
                    onClose={() => setShowPrescriptionUpload(false)}
                  />
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    variant="outline"
                    className="flex-1"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                  <Button
                    onClick={handleBuyNow}
                    disabled={isOutOfStock}
                    className="flex-1"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Buy Now
                  </Button>
                </div>

                {medicine.requires_prescription && !prescriptionFile && (
                  <p className="text-sm text-muted-foreground text-center">
                    Upload prescription to enable ordering
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced Medicine Information Sections */}
        <div className="mt-8 space-y-6">
          {/* Uses */}
          {medicine.uses && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-primary rounded"></div>
                  Uses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{medicine.uses}</p>
              </CardContent>
            </Card>
          )}

          {/* Side Effects */}
          {medicine.side_effects && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-orange-500 rounded"></div>
                  Side Effects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{medicine.side_effects}</p>
              </CardContent>
            </Card>
          )}

          {/* How to Use */}
          {medicine.how_to_use && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-blue-500 rounded"></div>
                  How to Use
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{medicine.how_to_use}</p>
              </CardContent>
            </Card>
          )}

          {/* How it Works */}
          {medicine.how_it_works && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-green-500 rounded"></div>
                  How it Works
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{medicine.how_it_works}</p>
              </CardContent>
            </Card>
          )}

          {/* Safety Advice */}
          {medicine.safety_advice && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-red-500 rounded"></div>
                  Safety Advice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{medicine.safety_advice}</p>
              </CardContent>
            </Card>
          )}

          {/* Storage Conditions */}
          {medicine.storage_conditions && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-purple-500 rounded"></div>
                  Storage Conditions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{medicine.storage_conditions}</p>
              </CardContent>
            </Card>
          )}

          {/* Therapeutic Class */}
          {medicine.therapeutic_class && (
            <Card>
              <CardHeader>
                <CardTitle>Therapeutic Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Therapeutic Class</h4>
                    <p className="text-sm text-muted-foreground">{medicine.therapeutic_class}</p>
                  </div>
                  {medicine.chemical_class && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Chemical Class</h4>
                      <p className="text-sm text-muted-foreground">{medicine.chemical_class}</p>
                    </div>
                  )}
                  {medicine.action_class && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Action Class</h4>
                      <p className="text-sm text-muted-foreground">{medicine.action_class}</p>
                    </div>
                  )}
                  {medicine.country_of_origin && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Country of Origin</h4>
                      <p className="text-sm text-muted-foreground">{medicine.country_of_origin}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Medicine Alternatives Section */}
        <div className="mt-8">
          <MedicineAlternatives 
            medicineId={medicine.id} 
            medicineName={medicine.name}
            originalPrice={medicine.price}
          />
        </div>
      </div>
    </div>
  );
}

function MedicineDetailSkeleton() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-24 mb-6" />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="aspect-square w-full" />
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-6 w-1/4" />
                <div className="flex gap-3">
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 flex-1" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}