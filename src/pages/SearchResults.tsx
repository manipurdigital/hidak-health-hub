
// @ts-nocheck
import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSearchSuggestions, addRecentSearch } from "@/hooks/useSearchSuggestions";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { SearchResult } from "@/integrations/supabase/search";

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = React.useState(initialQuery);
  const debouncedQuery = useDebouncedValue(query, 200);
  
  const { data: resultsData, isLoading, error } = useSearchSuggestions(debouncedQuery, 20);
  const results: SearchResult[] = (resultsData as SearchResult[]) ?? [];

  React.useEffect(() => {
    if (initialQuery) {
      addRecentSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    if (newQuery.trim()) {
      setSearchParams({ q: newQuery.trim() });
      addRecentSearch(newQuery.trim());
    }
  };

  const handleResultClick = (result: any) => {
    navigate(result.href);
  };

  const groupedResults = React.useMemo(() => {
    const medicines = results.filter(r => r.type === "medicine" && !r.is_alternative);
    const labTests = results.filter(r => r.type === "lab_test");
    const doctors = results.filter(r => r.type === "doctor");
    
    return { medicines, labTests, doctors };
  }, [results]);

  const totalResults = results.length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search medicines, doctors, lab tests…"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
          
          {debouncedQuery && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <span>Search results for</span>
              <Badge variant="secondary">"{debouncedQuery}"</Badge>
              <span>•</span>
              <span>{totalResults} results found</span>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mr-3" />
            <span>Searching...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-12 text-destructive">
            <p>Search failed. Please try again.</p>
          </div>
        )}

        {!isLoading && !error && debouncedQuery && totalResults === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No results found</h2>
            <p className="text-muted-foreground mb-4">
              No matches for "{debouncedQuery}". Try a different search term.
            </p>
            <p className="text-sm text-muted-foreground">
              Try brand name (e.g., Calpol) or salt (e.g., Paracetamol 650)
            </p>
          </div>
        )}

        {!isLoading && !error && totalResults > 0 && (
          <div className="space-y-8">
            {/* Medicines */}
            {groupedResults.medicines.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  Medicines
                  <Badge variant="secondary">{groupedResults.medicines.length}</Badge>
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {groupedResults.medicines.map((medicine) => (
                    <div
                      key={medicine.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleResultClick(medicine)}
                    >
                      <div className="flex items-start gap-3">
                        {medicine.thumbnail_url ? (
                          <img
                            src={medicine.thumbnail_url}
                            alt={medicine.title}
                            className="w-12 h-12 rounded object-cover bg-muted"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                            <Search className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{medicine.title}</h3>
                          {medicine.subtitle && (
                            <p className="text-sm text-muted-foreground truncate">
                              {medicine.subtitle}
                            </p>
                          )}
                          {medicine.price && (
                            <p className="text-lg font-semibold text-primary mt-1">
                              ₹{medicine.price}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Lab Tests */}
            {groupedResults.labTests.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  Lab Tests
                  <Badge variant="secondary">{groupedResults.labTests.length}</Badge>
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {groupedResults.labTests.map((test) => (
                    <div
                      key={test.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleResultClick(test)}
                    >
                      <h3 className="font-medium mb-1">{test.title}</h3>
                      {test.subtitle && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {test.subtitle}
                        </p>
                      )}
                      {test.price && (
                        <p className="text-lg font-semibold text-primary">
                          ₹{test.price}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Doctors */}
            {groupedResults.doctors.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  Doctors
                  <Badge variant="secondary">{groupedResults.doctors.length}</Badge>
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {groupedResults.doctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleResultClick(doctor)}
                    >
                      <div className="flex items-start gap-3">
                        {doctor.thumbnail_url ? (
                          <img
                            src={doctor.thumbnail_url}
                            alt={doctor.title}
                            className="w-12 h-12 rounded-full object-cover bg-muted"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <Search className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{doctor.title}</h3>
                          {doctor.subtitle && (
                            <p className="text-sm text-muted-foreground truncate">
                              {doctor.subtitle}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}