import React from "react";
import { useNavigate } from "react-router-dom";
import { Search, TrendingUp, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchResult } from "@/integrations/supabase/search";
import {
  SearchSuggestionGroup,
  TrendingMedicine,
  trackSearchClick,
  addRecentSearch,
  getRecentSearches
} from "@/hooks/useSearchSuggestions";

interface SearchDropdownProps {
  query: string;
  groups: SearchSuggestionGroup[];
  trendingMedicines: TrendingMedicine[];
  isLoading: boolean;
  error: Error | null;
  selectedIndex: number;
  onItemClick: (result: SearchResult | TrendingMedicine | string) => void;
  onViewAll: (type: string, query: string) => void;
}

export function SearchDropdown({
  query,
  groups,
  trendingMedicines,
  isLoading,
  error,
  selectedIndex,
  onItemClick,
  onViewAll,
}: SearchDropdownProps) {
  const navigate = useNavigate();
  const recentSearches = getRecentSearches();
  const showEmpty = !isLoading && !error && query.length >= 2;
  const showTrending = !query.trim() && trendingMedicines.length > 0;
  const showRecent = !query.trim() && recentSearches.length > 0;

  // Flatten all items for keyboard navigation
  const allItems = React.useMemo(() => {
    const items: Array<{ type: 'result' | 'trending' | 'recent' | 'viewAll'; item: any; groupType?: string }> = [];
    
    if (showTrending) {
      trendingMedicines.forEach(item => items.push({ type: 'trending', item }));
    }
    
    if (showRecent) {
      recentSearches.forEach(item => items.push({ type: 'recent', item }));
    }
    
    groups.forEach(group => {
      group.items.forEach(item => items.push({ type: 'result', item, groupType: group.type }));
      if (group.items.length === 5) {
        items.push({ type: 'viewAll', item: group, groupType: group.type });
      }
    });
    
    return items;
  }, [groups, trendingMedicines, recentSearches, showTrending, showRecent]);

  const handleItemClick = (item: any, type: string) => {
    if (type === 'result') {
      trackSearchClick(item, query);
      addRecentSearch(query);
      navigate(item.href);
    } else if (type === 'trending') {
      navigate(`/medicine/${item.id}`);
    } else if (type === 'recent') {
      addRecentSearch(item);
      onItemClick(item);
    } else if (type === 'viewAll') {
      onViewAll(item.type, query);
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-primary/20 text-primary font-medium">
          {part}
        </mark>
      ) : part
    );
  };

  if (isLoading && query.length >= 2) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
        Searching...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-destructive text-sm">
        Search failed. Please try again.
      </div>
    );
  }

  if (showEmpty && groups.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        <Search className="w-4 h-4 mx-auto mb-2" />
        <p>No matches for "{query}"</p>
        <p className="text-xs mt-1">
          Try brand name (e.g., Calpol) or salt (e.g., Paracetamol 650)
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      {/* Trending medicines when empty */}
      {showTrending && (
        <div className="py-2">
          <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b flex items-center gap-2">
            <TrendingUp className="w-3 h-3" />
            Trending Medicines
          </div>
          {trendingMedicines.map((medicine, index) => {
            const globalIndex = allItems.findIndex(item => 
              item.type === 'trending' && item.item.id === medicine.id
            );
            const isSelected = globalIndex === selectedIndex;
            
            return (
              <button
                key={medicine.id}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                  isSelected 
                    ? "bg-accent text-accent-foreground" 
                    : "hover:bg-muted/50"
                )}
                onClick={() => handleItemClick(medicine, 'trending')}
              >
                {medicine.thumbnail_url ? (
                  <img
                    src={medicine.thumbnail_url}
                    alt={medicine.name}
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
                  <div className="font-medium text-sm truncate">{medicine.name}</div>
                </div>
                <div className="text-sm font-medium text-primary">
                  ₹{medicine.price}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Recent searches when empty */}
      {showRecent && (
        <div className="py-2">
          <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b flex items-center gap-2">
            <Clock className="w-3 h-3" />
            Recent Searches
          </div>
          {recentSearches.slice(0, 5).map((search, index) => {
            const globalIndex = allItems.findIndex(item => 
              item.type === 'recent' && item.item === search
            );
            const isSelected = globalIndex === selectedIndex;
            
            return (
              <button
                key={search}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                  isSelected 
                    ? "bg-accent text-accent-foreground" 
                    : "hover:bg-muted/50"
                )}
                onClick={() => handleItemClick(search, 'recent')}
              >
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{search}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Search result groups */}
      {groups.map((group) => (
        <div key={group.type} className="py-2">
          <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">
            {group.title}
          </div>
          {group.items.map((result) => {
            const globalIndex = allItems.findIndex(item => 
              item.type === 'result' && item.item.id === result.id
            );
            const isSelected = globalIndex === selectedIndex;
            
            return (
              <button
                key={result.id}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                  isSelected 
                    ? "bg-accent text-accent-foreground" 
                    : "hover:bg-muted/50"
                )}
                onClick={() => handleItemClick(result, 'result')}
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
                  <div className="font-medium text-sm truncate">
                    {highlightMatch(result.title, query)}
                  </div>
                  {result.subtitle && (
                    <div className="text-xs text-muted-foreground truncate">
                      {highlightMatch(result.subtitle, query)}
                    </div>
                  )}
                </div>
                {result.price && (
                  <div className="text-sm font-medium text-primary">
                    ₹{result.price}
                  </div>
                )}
              </button>
            );
          })}
          
          {/* View all link */}
          {group.items.length === 5 && (
            <button
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors text-primary hover:bg-muted/50",
                allItems.findIndex(item => 
                  item.type === 'viewAll' && item.groupType === group.type
                ) === selectedIndex && "bg-accent"
              )}
              onClick={() => handleItemClick(group, 'viewAll')}
            >
              <Search className="w-4 h-4" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">
                  View all {group.title.toLowerCase()} results
                </div>
              </div>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}