import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search, MapPin, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResult {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface AreaSearchBarProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  placeholder?: string;
  className?: string;
}

export function AreaSearchBar({ onLocationSelect, placeholder = "Search for an area, city, or address...", className }: AreaSearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);

  // Initialize Google Places services
  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      autocompleteService.current = new google.maps.places.AutocompleteService();
      
      // Create a dummy map element for PlacesService (not displayed)
      const mapDiv = document.createElement('div');
      const map = new google.maps.Map(mapDiv);
      placesService.current = new google.maps.places.PlacesService(map);
    }
  }, []);

  // Debounced search function
  const searchPlaces = useCallback(
    debounce((searchQuery: string) => {
      if (!searchQuery.trim() || !autocompleteService.current) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      autocompleteService.current.getPlacePredictions(
        {
          input: searchQuery,
          types: ['(regions)'], // Focus on geographical areas
          componentRestrictions: { country: 'in' }, // Restrict to India
        },
        (predictions, status) => {
          setIsLoading(false);
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setResults(predictions.slice(0, 5)); // Limit to 5 results
          } else {
            setResults([]);
          }
        }
      );
    }, 300),
    []
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    
    if (value.trim()) {
      setIsLoading(true);
      setIsOpen(true);
      searchPlaces(value);
    } else {
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
    }
  };

  // Handle result selection
  const handleResultSelect = (result: SearchResult) => {
    if (!placesService.current) return;

    setQuery(result.description);
    setIsOpen(false);
    setResults([]);

    // Get place details to fetch coordinates
    placesService.current.getDetails(
      {
        placeId: result.place_id,
        fields: ['geometry', 'formatted_address'],
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          const location = place.geometry.location;
          onLocationSelect({
            lat: location.lat(),
            lng: location.lng(),
            address: place.formatted_address || result.description,
          });
        }
      }
    );
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleResultSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query && setIsOpen(true)}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (query || isLoading) && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto border shadow-lg">
          <div ref={resultsRef} className="py-2">
            {isLoading ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">
                Searching...
              </div>
            ) : results.length > 0 ? (
              results.map((result, index) => (
                <div
                  key={result.place_id}
                  onClick={() => handleResultSelect(result)}
                  className={cn(
                    "px-4 py-3 cursor-pointer hover:bg-accent flex items-start gap-3 transition-colors",
                    selectedIndex === index && "bg-accent"
                  )}
                >
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {result.structured_formatting.main_text}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {result.structured_formatting.secondary_text}
                    </div>
                  </div>
                </div>
              ))
            ) : query ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">
                No areas found for "{query}"
              </div>
            ) : null}
          </div>
        </Card>
      )}
    </div>
  );
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}