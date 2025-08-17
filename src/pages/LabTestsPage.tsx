import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CalendarIcon, Clock, TestTube, FileText, Filter, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [tests, setTests] = useState<LabTest[]>([]);
  const [filteredTests, setFilteredTests] = useState<LabTest[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const categories = ['All', 'Blood Tests', 'Hormone Tests', 'Diabetes', 'Vitamins', 'Urine Tests', 'Cardiac Tests', 'Radiology'];

  useEffect(() => {
    fetchTests();
  }, []);

  useEffect(() => {
    filterTests();
  }, [tests, selectedCategory, searchTerm]);

  const fetchTests = async () => {
    try {
      const { data, error } = await supabase
        .from('lab_tests')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setTests(data || []);
    } catch (error) {
      console.error('Error fetching tests:', error);
      toast({
        title: "Error",
        description: "Failed to load lab tests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTests = () => {
    let filtered = tests;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(test => test.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(test =>
        test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTests(filtered);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                    <div className="h-8 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">Diagnostic Tests</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Book lab tests and health packages with home sample collection and accurate reports
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search tests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="whitespace-nowrap"
                  >
                    <Filter className="w-4 h-4 mr-1" />
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Tests Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTests.map((test) => (
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

          {filteredTests.length === 0 && (
            <div className="text-center py-12">
              <TestTube className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tests found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? `No tests found for "${searchTerm}"` : 'Try adjusting your search or filters'}
              </p>
            </div>
          )}

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