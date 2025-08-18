import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useUniversalSearch } from "@/hooks/useUniversalSearch";
import { SearchResult } from "@/integrations/supabase/search";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  inputClassName?: string;
}

export function SearchBar({ 
  className, 
  placeholder = "Search medicines, doctors, lab tests…",
  inputClassName,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const debouncedQuery = useDebouncedValue(query, 250);
  const { data: results = [], isLoading, error } = useUniversalSearch(debouncedQuery);

  // Group results by type and alternatives
  const groupedResults = React.useMemo(() => {
    const mainMedicines = results.filter(r => r.type === "medicine" && !r.is_alternative);
    const alternatives = results.filter(r => r.type === "medicine" && r.is_alternative);
    
    const groups = {
      medicine: mainMedicines,
      alternatives: alternatives,
      doctor: results.filter(r => r.type === "doctor"),
      lab_test: results.filter(r => r.type === "lab_test"),
    };
    return groups;
  }, [results]);

  // Flatten results for keyboard navigation
  const flatResults = React.useMemo(() => {
    return [
      ...groupedResults.medicine,
      ...groupedResults.alternatives,
      ...groupedResults.doctor,
      ...groupedResults.lab_test,
    ];
  }, [groupedResults]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    setIsOpen(value.length >= 2);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && e.key !== "Enter") return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (flatResults.length > 0) {
          setSelectedIndex(prev => 
            prev < flatResults.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (flatResults.length > 0) {
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : flatResults.length - 1
          );
        }
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && flatResults[selectedIndex]) {
          handleResultClick(flatResults[selectedIndex]);
        } else if (query.trim()) {
          // Universal search handoff - navigate to corresponding list route with query
          handleUniversalSearch(query.trim());
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.href);
    setQuery("");
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const handleUniversalSearch = (searchQuery: string) => {
    // Determine which route to navigate to based on current page
    const currentPath = location.pathname;
    let targetRoute = '/medicines'; // Default to medicines
    
    if (currentPath.startsWith('/lab-tests')) {
      targetRoute = '/lab-tests';
    } else if (currentPath.startsWith('/doctors')) {
      targetRoute = '/doctors';
    } else if (currentPath.startsWith('/medicines')) {
      targetRoute = '/medicines';
    }
    
    // Navigate with query parameter
    navigate(`${targetRoute}?q=${encodeURIComponent(searchQuery)}`);
    setQuery("");
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const handleInputBlur = (e: React.FocusEvent) => {
    // Delay closing to allow clicks on results
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    }, 200);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "medicine": return "Medicines";
      case "alternatives": return "Similar Alternatives";
      case "doctor": return "Doctors";
      case "lab_test": return "Lab Tests";
      default: return "";
    }
  };

  const getCompositionInfo = (result: SearchResult) => {
    if (result.type === 'medicine' && result.composition_family_key) {
      const normalizedKey = result.composition_family_key
        .split('+')
        .map(key => key.charAt(0).toUpperCase() + key.slice(1))
        .join(' + ');
      return `Same actives: ${normalizedKey}`;
    }
    return null;
  };

  const getMatchTypeBadge = (matchType?: string) => {
    if (!matchType) return null;
    
    switch (matchType) {
      case 'brand_name':
      case 'brand':
        return <Badge variant="secondary" className="text-xs ml-2">Brand</Badge>;
      case 'generic':
        return <Badge variant="outline" className="text-xs ml-2">Generic</Badge>;
      case 'composition_text':
        return <Badge variant="outline" className="text-xs ml-2">Composition</Badge>;
      case 'exact_composition':
        return <Badge variant="default" className="text-xs ml-2">Same Formula</Badge>;
      case 'same_actives':
        return <Badge variant="secondary" className="text-xs ml-2">Same Active</Badge>;
      default:
        return null;
    }
  };

  const renderResultGroup = (type: keyof typeof groupedResults, items: SearchResult[]) => {
    if (items.length === 0) return null;

    return (
      <div key={type} className={cn("py-2", type === "alternatives" && "border-t border-dashed")}>
        <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">
          {getTypeLabel(type)}
        </div>
        {items.map((result, index) => {
          const globalIndex = flatResults.findIndex(r => r.id === result.id);
          const isSelected = globalIndex === selectedIndex;
          
          return (
            <div
              key={result.id}
              className={cn(
                "flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors",
                isSelected 
                  ? "bg-accent text-accent-foreground" 
                  : "hover:bg-muted/50"
              )}
              onClick={() => handleResultClick(result)}
            >
              {result.thumbnail_url ? (
                <img
                  src={result.thumbnail_url}
                  alt={result.title}
                  className="w-8 h-8 rounded object-cover bg-muted"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                  <Search className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate flex items-center">
                  {result.title}
                  {getMatchTypeBadge(result.composition_match_type)}
                </div>
                {result.subtitle && (
                  <div className="text-xs text-muted-foreground truncate">
                    {result.subtitle}
                  </div>
                )}
                {result.type === 'medicine' && getCompositionInfo(result) && (
                  <div className="text-xs text-muted-foreground truncate italic">
                    {getCompositionInfo(result)}
                  </div>
                )}
              </div>
              {result.price && (
                <div className="text-sm font-medium text-primary">
                  ₹{result.price}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleInputBlur}
          className={cn("pl-10 pr-10", inputClassName)}
        />
        {isLoading && query.length >= 2 && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 animate-spin" />
        )}
      </div>

      {isOpen && query.length >= 2 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
              Searching...
            </div>
          ) : error ? (
            <div className="p-4 text-center text-destructive text-sm">
              Search failed. Please try again.
            </div>
          ) : flatResults.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No results found for "{query}"
            </div>
          ) : (
            <>
              {renderResultGroup("medicine", groupedResults.medicine)}
              {renderResultGroup("alternatives", groupedResults.alternatives)}
              {renderResultGroup("doctor", groupedResults.doctor)}
              {renderResultGroup("lab_test", groupedResults.lab_test)}
            </>
          )}
        </div>
      )}
    </div>
  );
}