import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Filter, Star, Clock, Truck, Upload, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Medicine {
  id: string;
  name: string;
  brand: string;
  price: number;
  original_price: number;
  discount_percentage: number;
  stock_quantity: number;
  requires_prescription: boolean;
  fast_delivery: boolean;
  rating: number;
  review_count: number;
  manufacturer: string;
  dosage: string;
  form: string;
  pack_size: string;
  description: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const PharmacySection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [uploadingPrescription, setUploadingPrescription] = useState(false);
  
  const { toast } = useToast();
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    fetchMedicines();
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('medicine_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to load medicine categories",
        variant: "destructive"
      });
    }
  };

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('medicines')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      if (searchQuery.trim()) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMedicines(data || []);
    } catch (error) {
      console.error('Error fetching medicines:', error);
      toast({
        title: "Error",
        description: "Failed to load medicines",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMedicines();
  };

  const handleAddToCart = (medicine: Medicine) => {
    if (medicine.stock_quantity <= 0) {
      toast({
        title: "Out of Stock",
        description: `${medicine.name} is currently out of stock`,
        variant: "destructive"
      });
      return;
    }

    addItem({
      id: medicine.id,
      name: medicine.name,
      price: medicine.price,
      requires_prescription: medicine.requires_prescription || false,
    });
    
    toast({
      title: "Added to Cart",
      description: `${medicine.name} has been added to your cart`,
    });
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  const handlePrescriptionUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to upload prescriptions",
        variant: "destructive"
      });
      return;
    }

    setPrescriptionFile(file);
    setUploadingPrescription(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('prescriptions')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      toast({
        title: "Prescription Uploaded",
        description: "Your prescription has been uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading prescription:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload prescription. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploadingPrescription(false);
      setPrescriptionFile(null);
      // Reset the input
      event.target.value = '';
    }
  };

  const formatPrice = (price: number) => `₹${price.toFixed(0)}`;

  return (
    <section id="pharmacy" className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Online Pharmacy</h2>
            <p className="text-muted-foreground">Order medicines with prescription upload</p>
          </div>
          <Button 
            variant="outline" 
            className="hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={() => navigate('/medicines')}
          >
            View All Medicines
          </Button>
        </div>

        {/* Search and filters */}
        <div className="bg-card p-6 rounded-xl shadow-sm border mb-12">
          <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for medicines, brands, or health conditions..."
                className="pl-12"
              />
            </div>
            <Button 
              variant="outline" 
              size="lg" 
              className="flex items-center gap-2 hover:bg-primary/10 transition-colors"
              type="button"
              onClick={() => toast({ title: "Filters", description: "Opening filter options..." })}
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
            
            {/* Prescription Upload */}
            <div className="relative">
              <input
                type="file"
                id="prescription-upload"
                accept="image/*,.pdf"
                onChange={handlePrescriptionUpload}
                className="hidden"
                disabled={uploadingPrescription}
              />
              <Button 
                variant="medical" 
                size="lg" 
                type="button"
                onClick={() => document.getElementById('prescription-upload')?.click()}
                disabled={uploadingPrescription}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploadingPrescription ? 'Uploading...' : 'Upload Prescription'}
              </Button>
            </div>
          </form>
        </div>

        {/* Categories */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold mb-6">Shop by Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Card 
                key={category.id} 
                className={`group hover:shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-1 ${
                  selectedCategory === category.id ? 'border-primary bg-primary/5' : 'hover:border-primary/20'
                }`}
                onClick={() => handleCategoryClick(category.id)}
              >
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">
                    {category.icon}
                  </div>
                  <h4 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                    {category.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">{category.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Medicines Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">
              {selectedCategory ? 'Filtered Medicines' : 'Featured Medicines'}
            </h3>
            {selectedCategory && (
              <Button 
                variant="ghost" 
                onClick={() => setSelectedCategory(null)}
                className="hover:text-primary transition-colors"
              >
                Clear Filter
              </Button>
            )}
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardHeader className="pb-3">
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-6 bg-muted rounded"></div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                    <div className="h-10 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : medicines.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No medicines found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your search or category filter
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {medicines.map((medicine) => (
                <Card 
                  key={medicine.id} 
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-primary/20 cursor-pointer"
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant={medicine.requires_prescription ? "destructive" : "secondary"} className="text-xs">
                        {medicine.requires_prescription ? "Prescription Required" : "No Prescription"}
                      </Badge>
                      {medicine.fast_delivery && (
                        <div className="flex items-center gap-1 text-xs text-success">
                          <Truck className="w-3 h-3" />
                          Fast
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                      {medicine.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{medicine.brand}</p>
                    <p className="text-xs text-muted-foreground">{medicine.pack_size}</p>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Rating */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{medicine.rating}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">({medicine.review_count} reviews)</span>
                    </div>

                    {/* Price */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-foreground">
                          {formatPrice(medicine.price)}
                        </span>
                        {medicine.original_price && medicine.original_price > medicine.price && (
                          <span className="text-sm text-muted-foreground line-through">
                            {formatPrice(medicine.original_price)}
                          </span>
                        )}
                      </div>
                      {medicine.discount_percentage > 0 && (
                        <Badge variant="outline" className="text-xs text-success border-success">
                          {medicine.discount_percentage}% OFF
                        </Badge>
                      )}
                    </div>

                    {/* Stock status */}
                    {medicine.stock_quantity <= 0 && (
                      <Badge variant="destructive" className="text-xs">
                        Out of Stock
                      </Badge>
                    )}

                    {/* Add to cart */}
                    <Button 
                      className="w-full group-hover:scale-105 transition-transform duration-200"
                      onClick={() => handleAddToCart(medicine)}
                      disabled={medicine.stock_quantity <= 0}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Trust indicators */}
        <div className="mt-16 bg-trust-badge p-8 rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-2xl mb-2">🔒</div>
              <h4 className="font-semibold mb-1">100% Secure</h4>
              <p className="text-sm text-muted-foreground">Encrypted payments & data protection</p>
            </div>
            <div>
              <div className="text-2xl mb-2">✅</div>
              <h4 className="font-semibold mb-1">Authentic Products</h4>
              <p className="text-sm text-muted-foreground">Licensed pharmacies & verified medicines</p>
            </div>
            <div>
              <div className="text-2xl mb-2">🚚</div>
              <h4 className="font-semibold mb-1">Fast Delivery</h4>
              <p className="text-sm text-muted-foreground">Same day delivery in select cities</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PharmacySection;