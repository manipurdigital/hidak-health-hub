
// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { TrendingMedicinesCarousel } from '@/components/TrendingMedicinesCarousel';
import { FeatureGuard } from '@/components/FeatureGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { FacetFilter } from '@/components/ui/facet-filter';
import { SortSelect } from '@/components/ui/sort-select';
import { ResultCount } from '@/components/ui/result-count';
import { MedicineCardSkeleton } from '@/components/ui/loading-skeletons';
import { EmptyState, LoadingError } from '@/components/ui/error-states';
import { Search, Filter, Star, Truck, Upload, ShoppingCart, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { useMedicines, useMedicineCategories } from '@/hooks/api-hooks';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useServiceability } from '@/contexts/ServiceabilityContext';

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

const MedicinesPage = () => {
  const navigate = useNavigate();
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [uploadingPrescription, setUploadingPrescription] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const { toast } = useToast();
  const { addItem } = useCart();
  const { user } = useAuth();
  const { filters, updateFilters, clearFilters } = useUrlFilters();
  const { inDeliveryArea, feePreview } = useServiceability();

  const page = filters.page || 1;
  const pageSize = 12;

  const { data: medicinesData, isLoading: medicinesLoading, error: medicinesError } = useQuery({
    queryKey: ['medicines', filters],
    queryFn: async () => {
      // For search queries, use enhanced search function
      if (filters.q && filters.q.trim()) {
        const { data: searchResults, error: searchError } = await supabase.rpc('universal_search_with_alternatives', {
          q: filters.q.trim(),
          max_per_group: 50
        });
        
        if (searchError) throw searchError;
        
        // Filter only medicine results and get their IDs
        const medicineResults = searchResults?.filter((r: any) => r.type === 'medicine') || [];
        const medicineIds = medicineResults.map((r: any) => r.id);
        
        if (medicineIds.length === 0) {
          return { medicines: [], total: 0 };
        }
        
        // Fetch full medicine data for the search results
        let query = supabase
          .from('medicines')
          .select('*', { count: 'exact' })
          .eq('is_active', true)
          .in('id', medicineIds);
        
        // Apply additional filters
        if (filters.category) {
          query = query.eq('category_id', filters.category);
        }
        
        if (filters.brand) {
          query = query.eq('brand', filters.brand);
        }
        
        if (filters.rx_only !== undefined) {
          query = query.eq('requires_prescription', filters.rx_only);
        }
        
        if (filters.price_min) {
          query = query.gte('price', filters.price_min);
        }
        
        if (filters.price_max) {
          query = query.lte('price', filters.price_max);
        }

        // Apply sorting
        switch (filters.sort) {
          case 'price_asc':
            query = query.order('price', { ascending: true });
            break;
          case 'price_desc':
            query = query.order('price', { ascending: false });
            break;
          case 'rating':
            query = query.order('rating', { ascending: false });
            break;
          case 'name':
            query = query.order('name', { ascending: true });
            break;
          default:
            // Keep search relevance order for search results
            break;
        }

        const { data, error, count } = await query;
        if (error) throw error;
        
        return { medicines: data || [], total: count || 0 };
      }
      
      // For non-search queries, use standard filtering
      let query = supabase
        .from('medicines')
        .select('*', { count: 'exact' })
        .eq('is_active', true);
      
      if (filters.category) {
        query = query.eq('category_id', filters.category);
      }
      
      if (filters.brand) {
        query = query.eq('brand', filters.brand);
      }
      
      if (filters.rx_only !== undefined) {
        query = query.eq('requires_prescription', filters.rx_only);
      }
      
      if (filters.price_min) {
        query = query.gte('price', filters.price_min);
      }
      
      if (filters.price_max) {
        query = query.lte('price', filters.price_max);
      }

      switch (filters.sort) {
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
        case 'rating':
          query = query.order('rating', { ascending: false });
          break;
        case 'name':
          query = query.order('name', { ascending: true });
          break;
        default:
          query = query.order('name', { ascending: true });
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      
      return { medicines: data || [], total: count || 0 };
    }
  });

  const { data: categories } = useMedicineCategories();

  const medicines = medicinesData?.medicines || [];
  const totalMedicines = medicinesData?.total || 0;
  const totalPages = Math.ceil(totalMedicines / pageSize);

  const brands = Array.from(new Set(medicines.map(m => m.brand).filter(Boolean)))
    .map(brand => ({ value: brand, label: brand }));

  const categoryOptions = (categories || []).map(cat => ({
    value: cat.id,
    label: cat.name
  }));

  const sortOptions = [
    { value: 'name', label: 'Name A-Z' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'rating', label: 'Rating' }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const searchValue = (e.target as HTMLFormElement).search.value;
    updateFilters({ q: searchValue });
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

  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMedicineClick = (medicineId: string) => {
    navigate(`/medicines/${medicineId}`);
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
      event.target.value = '';
    }
  };

  const formatPrice = (price: number) => `₹${price.toFixed(0)}`;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-16">
        <div className="container mx-auto px-4">
          {/* Page header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">Online Pharmacy</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Order medicines with prescription upload and get them delivered to your doorstep
            </p>
          </div>

          {/* Delivery coverage banner */}
          {inDeliveryArea === true && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">
                <span className="font-medium">Medicine delivery available in your area</span>
                {feePreview?.fee && ` • Delivery fee: ₹${feePreview.fee}`}
              </p>
            </div>
          )}
          
          {inDeliveryArea === false && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">
                <span className="font-medium">Delivery unavailable:</span> Medicine delivery is not available in your location yet.
              </p>
            </div>
          )}

          {/* Trending medicines carousel */}
          <FeatureGuard feature="SHOW_TRENDING_MEDICINES">
            <TrendingMedicinesCarousel className="mb-12" />
          </FeatureGuard>

          {/* Search and filters */}
          <div className="bg-card p-6 rounded-xl shadow-sm border mb-12">
            <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  name="search"
                  type="text"
                  defaultValue={filters.q || ''}
                  placeholder="Search for medicines, brands, or health conditions..."
                  className="pl-12"
                />
              </div>
              <Button 
                variant={showFilters ? "default" : "outline"}
                size="lg" 
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
                {Object.keys(filters).length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {Object.keys(filters).length}
                  </Badge>
                )}
              </Button>
              
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
                  variant="default" 
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

            {showFilters && (
              <div className="border-t pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  <FacetFilter
                    title="Category"
                    options={categoryOptions}
                    value={filters.category || ''}
                    onChange={(value) => updateFilters({ category: value as string })}
                  />
                  
                  <FacetFilter
                    title="Brand"
                    options={brands}
                    value={filters.brand || ''}
                    onChange={(value) => updateFilters({ brand: value as string })}
                  />
                  
                  <FacetFilter
                    title="Prescription"
                    options={[
                      { value: 'true', label: 'Prescription Required' },
                      { value: 'false', label: 'No Prescription' }
                    ]}
                    value={filters.rx_only?.toString() || ''}
                    onChange={(value) => updateFilters({ rx_only: value === 'true' ? true : value === 'false' ? false : undefined })}
                  />
                  
                  <div className="space-y-3">
                    <h3 className="font-medium text-sm">Price Range</h3>
                    <div className="space-y-2">
                      <Input
                        type="number"
                        placeholder="Min price"
                        value={filters.price_min || ''}
                        onChange={(e) => updateFilters({ price_min: e.target.value ? Number(e.target.value) : undefined })}
                      />
                      <Input
                        type="number"
                        placeholder="Max price"
                        value={filters.price_max || ''}
                        onChange={(e) => updateFilters({ price_max: e.target.value ? Number(e.target.value) : undefined })}
                      />
                    </div>
                  </div>
                  
                  <SortSelect
                    options={sortOptions}
                    value={filters.sort || 'name'}
                    onChange={(value) => updateFilters({ sort: value })}
                  />
                </div>
                
                {Object.keys(filters).length > 0 && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      <X className="w-4 h-4 mr-1" />
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {!filters.q && !filters.category && (
            <div className="mb-12">
              <h2 className="text-2xl font-semibold mb-6">Shop by Categories</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {(categories || []).map((category) => (
                  <Card 
                    key={category.id} 
                    className="group hover:shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:border-primary/20"
                    onClick={() => updateFilters({ category: category.id })}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">
                        {category.icon}
                      </div>
                      <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">{category.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold">
                  {filters.category ? 'Filtered Medicines' : filters.q ? `Search Results` : 'All Medicines'}
                </h2>
                <ResultCount 
                  total={totalMedicines}
                  showing={medicines.length}
                  searchTerm={filters.q}
                />
              </div>
            </div>
            
            {medicinesError ? (
              <LoadingError onRetry={() => window.location.reload()} />
            ) : medicinesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(pageSize)].map((_, index) => (
                  <MedicineCardSkeleton key={index} />
                ))}
              </div>
            ) : medicines.length === 0 ? (
              <EmptyState
                title="No medicines found"
                description={filters.q ? `No medicines found for "${filters.q}"` : 'Try adjusting your search or filters'}
                action={{
                  label: "Clear Filters",
                  onClick: clearFilters
                }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {medicines.map((medicine) => (
                  <Card 
                    key={medicine.id} 
                    className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-primary/20 cursor-pointer"
                    onClick={() => handleMedicineClick(medicine.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant={medicine.requires_prescription ? "destructive" : "secondary"} className="text-xs">
                          {medicine.requires_prescription ? "Prescription Required" : "No Prescription"}
                        </Badge>
                        {medicine.fast_delivery && (
                          <div className="flex items-center gap-1 text-xs text-green-600">
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
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{medicine.rating}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">({medicine.review_count} reviews)</span>
                      </div>

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
                          <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                            {medicine.discount_percentage}% OFF
                          </Badge>
                        )}
                      </div>

                      {medicine.stock_quantity <= 0 && (
                        <Badge variant="destructive" className="text-xs">
                          Out of Stock
                        </Badge>
                      )}

                      <Button 
                        className="w-full group-hover:scale-105 transition-transform duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(medicine);
                        }}
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

            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => page > 1 && handlePageChange(page - 1)}
                        className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => handlePageChange(pageNum)}
                            isActive={page === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => page < totalPages && handlePageChange(page + 1)}
                        className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>

          <div className="mt-16 bg-muted/30 p-8 rounded-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-2xl mb-2">🔒</div>
                <h3 className="font-semibold mb-1">100% Secure</h3>
                <p className="text-sm text-muted-foreground">Encrypted payments & data protection</p>
              </div>
              <div>
                <div className="text-2xl mb-2">✅</div>
                <h3 className="font-semibold mb-1">Authentic Products</h3>
                <p className="text-sm text-muted-foreground">Licensed pharmacies & verified medicines</p>
              </div>
              <div>
                <div className="text-2xl mb-2">🚚</div>
                <h3 className="font-semibold mb-1">Fast Delivery</h3>
                <p className="text-sm text-muted-foreground">Same day delivery in select cities</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MedicinesPage;
