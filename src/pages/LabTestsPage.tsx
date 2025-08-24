import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { FacetFilter } from '@/components/ui/facet-filter';
import { SortSelect } from '@/components/ui/sort-select';
import { ResultCount } from '@/components/ui/result-count';
import { LabTestCardSkeleton } from '@/components/ui/loading-skeletons';
import { EmptyState, LoadingError } from '@/components/ui/error-states';
import { CalendarIcon, Clock, TestTube, FileText, Filter, Star, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useUrlFilters } from '@/hooks/use-url-filters';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useServiceability } from '@/contexts/ServiceabilityContext';

interface LabTest {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  preparation_required: boolean;
  sample_type: string;
  reporting_time: string;
  image_url?: string;
}

const LabTestsPage = () => {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { filters, updateFilters, clearFilters } = useUrlFilters();
  const { visibleLabs, topLabCenter } = useServiceability();

  const page = filters.page || 1;
  const pageSize = 12;

  // Fetch lab tests with filters
  const { data: testsData, isLoading: testsLoading, error: testsError } = useQuery({
    queryKey: ['lab-tests', filters],
    queryFn: async () => {
      let query = supabase
        .from('lab_tests')
        .select('*', { count: 'exact' })
        .eq('is_active', true);

      // Apply filters
      if (filters.q) {
        query = query.or(`name.ilike.%${filters.q}%,description.ilike.%${filters.q}%,category.ilike.%${filters.q}%`);
      }
      
      if (filters.category && filters.category !== 'All') {
        query = query.eq('category', filters.category);
      }
      
      if (filters.fasting !== undefined) {
        query = query.eq('preparation_required', filters.fasting);
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
        case 'name':
          query = query.order('name', { ascending: true });
          break;
        default:
          query = query.order('name', { ascending: true });
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;
      
      return { tests: data || [], total: count || 0 };
    }
  });

  const tests = testsData?.tests || [];
  const totalTests = testsData?.total || 0;
  const totalPages = Math.ceil(totalTests / pageSize);

  const categories = ['All', 'Blood Tests', 'Hormone Tests', 'Diabetes', 'Vitamins', 'Urine Tests', 'Cardiac Tests', 'Radiology'];

  const categoryOptions = categories.map(cat => ({
    value: cat,
    label: cat
  }));

  const sortOptions = [
    { value: 'name', label: 'Name A-Z' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const searchValue = (e.target as HTMLFormElement).search.value;
    updateFilters({ q: searchValue });
  };

  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTestClick = (testId: string) => {
    navigate(`/lab-tests/${testId}`);
  };

  const handleBookTest = (test: LabTest) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to book a test",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }
    navigate(`/lab-tests/${test.id}`);
  };


  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">Lab Tests - Home Collection</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Book lab tests with convenient home sample collection. Our certified phlebotomists will visit your home to collect samples safely.
            </p>
          </div>

          {/* Lab coverage banner */}
          {visibleLabs.length > 0 ? (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">
                Home collection available by <span className="font-medium">{topLabCenter?.center_name}</span>
              </p>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-700 text-sm">
                Home collection is not available in your location. You can still browse tests for clinic visits.
              </p>
            </div>
          )}

          {/* Search and Filters */}
          <div className="bg-card p-6 rounded-xl shadow-sm border mb-12">
            <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  name="search"
                  placeholder="Search tests..."
                  defaultValue={filters.q || ''}
                  className="w-full"
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
            </form>

            {/* Filter Panel */}
            {showFilters && (
              <div className="border-t pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <FacetFilter
                    title="Category"
                    options={categoryOptions}
                    value={filters.category || 'All'}
                    onChange={(value) => updateFilters({ category: value as string })}
                  />
                  
                  <FacetFilter
                    title="Fasting Required"
                    options={[
                      { value: 'true', label: 'Fasting Required' },
                      { value: 'false', label: 'No Fasting' }
                    ]}
                    value={filters.fasting?.toString() || ''}
                    onChange={(value) => updateFilters({ fasting: value === 'true' ? true : value === 'false' ? false : undefined })}
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

          {/* Tests Grid */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold">
                  {filters.category && filters.category !== 'All' ? 'Filtered Tests' : filters.q ? `Search Results` : 'All Tests'}
                </h2>
                <ResultCount 
                  total={totalTests}
                  showing={tests.length}
                  searchTerm={filters.q}
                />
              </div>
            </div>
            
            {testsError ? (
              <LoadingError onRetry={() => window.location.reload()} />
            ) : testsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(pageSize)].map((_, index) => (
                  <LabTestCardSkeleton key={index} />
                ))}
              </div>
            ) : tests.length === 0 ? (
              <EmptyState
                title="No tests found"
                description={filters.q ? `No tests found for "${filters.q}"` : 'Try adjusting your search or filters'}
                action={{
                  label: "Clear Filters",
                  onClick: clearFilters
                }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tests.map((test) => (
              <Card 
                key={test.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleTestClick(test.id)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{test.name}</CardTitle>
                      <Badge variant="secondary" className="mt-2">
                        {test.category}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">₹{test.price}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground text-sm">{test.description}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <TestTube className="w-4 h-4 text-primary" />
                      <span>Sample: {test.sample_type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>Reporting: {test.reporting_time}</span>
                    </div>
                    {test.preparation_required && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-orange-500" />
                        <span className="text-orange-600">Preparation Required</span>
                      </div>
                    )}
                  </div>

                  <Button 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBookTest(test);
                    }}
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Book Test
                  </Button>
                </CardContent>
              </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
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


          {/* Benefits section */}
          <div className="mt-16 bg-muted/30 p-8 rounded-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-2xl mb-2">🏠</div>
                <h3 className="font-semibold mb-1">Home Collection</h3>
                <p className="text-sm text-muted-foreground">Sample collection at your doorstep</p>
              </div>
              <div>
                <div className="text-2xl mb-2">⚡</div>
                <h3 className="font-semibold mb-1">Fast Reports</h3>
                <p className="text-sm text-muted-foreground">Quick turnaround time for results</p>
              </div>
              <div>
                <div className="text-2xl mb-2">🔬</div>
                <h3 className="font-semibold mb-1">Accurate Results</h3>
                <p className="text-sm text-muted-foreground">NABL accredited labs with precise testing</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LabTestsPage;