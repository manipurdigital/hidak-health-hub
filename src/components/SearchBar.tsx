import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { 
  useSearchSuggestions, 
  useGroupedSuggestions, 
  useTrendingMedicines,
  addRecentSearch,
  trackSearchClick
} from "@/hooks/useSearchSuggestions";
import { SearchDropdown } from "./SearchDropdown";
import { SearchSheet } from "./SearchSheet";
import { useMobile } from "@/hooks/use-mobile";
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
  const isMobile = useMobile();
  
  const debouncedQuery = useDebouncedValue(query, 200);
  const { data: results = [], isLoading, error } = useSearchSuggestions(debouncedQuery);
  const groups = useGroupedSuggestions(results, 5);
  const { data: trendingMedicines = [] } = useTrendingMedicines(8);

  // Count total items for keyboard navigation
  const allItems = React.useMemo(() => {
    const items: any[] = [];
    if (!query.trim()) {
      items.push(...trendingMedicines);
    }
    groups.forEach(group => {
      items.push(...group.items);
      if (group.items.length === 5) items.push({ type: 'viewAll', group });
    });
    return items;
  }, [groups, trendingMedicines, query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    setIsOpen(value.length >= 1 || trendingMedicines.length > 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && e.key !== "Enter") return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (allItems.length > 0) {
          setSelectedIndex(prev => 
            prev < allItems.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (allItems.length > 0) {
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : allItems.length - 1
          );
        }
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && allItems[selectedIndex]) {
          handleItemClick(allItems[selectedIndex]);
        } else if (query.trim()) {
          handleSearch(query.trim());
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

  const handleItemClick = (item: any) => {
    if (item.href) {
      trackSearchClick(item, query);
      addRecentSearch(query);
      navigate(item.href);
    } else if (item.id) {
      navigate(`/medicine/${item.id}`);
    } else if (typeof item === 'string') {
      setQuery(item);
      addRecentSearch(item);
    }
    setQuery("");
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const handleSearch = (searchQuery: string) => {
    addRecentSearch(searchQuery);
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    setQuery("");
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const handleViewAll = (type: string, query: string) => {
    const routes = {
      medicine: '/medicines',
      doctor: '/doctors', 
      lab_test: '/lab-tests'
    };
    const route = routes[type as keyof typeof routes] || '/search';
    navigate(`${route}?q=${encodeURIComponent(query)}`);
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    setIsOpen(query.length >= 1 || trendingMedicines.length > 0);
  };

  const handleInputBlur = () => {
    // Delay closing to allow clicks on results
    setTimeout(() => {
      setIsOpen(false);
      setSelectedIndex(-1);
    }, 200);
  };

  // Mobile sheet
  if (isMobile) {
    return (
      <>
        <div className={cn("relative w-full", className)}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={handleInputChange}
              onFocus={() => setIsOpen(true)}
              className={cn("pl-10 pr-10", inputClassName)}
              aria-label={`Search ${placeholder.toLowerCase()}`}
              role="combobox"
              aria-expanded={isOpen}
              readOnly
            />
          </div>
        </div>
        
        <SearchSheet
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          query={query}
          onQueryChange={setQuery}
          groups={groups}
          trendingMedicines={trendingMedicines}
          isLoading={isLoading}
          error={error}
          onItemClick={handleItemClick}
          onViewAll={handleViewAll}
          onSearch={handleSearch}
        />
      </>
    );
  }

  // Desktop popover
  return (
    <div className={cn("relative w-full", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              className={cn("pl-10 pr-10", inputClassName)}
              aria-label={`Search ${placeholder.toLowerCase()}`}
              aria-expanded={isOpen}
              aria-autocomplete="list"
              aria-describedby={query.length >= 2 && isLoading ? "search-loading" : undefined}
              role="combobox"
            />
            {isLoading && query.length >= 2 && (
              <Loader2 
                id="search-loading"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 animate-spin" 
                aria-label="Loading search results"
              />
            )}
          </div>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-[--radix-popover-trigger-width] p-0 z-50"
          align="start"
          side="bottom"
          sideOffset={4}
        >
          <SearchDropdown
            query={query}
            groups={groups}
            trendingMedicines={trendingMedicines}
            isLoading={isLoading}
            error={error}
            selectedIndex={selectedIndex}
            onItemClick={handleItemClick}
            onViewAll={handleViewAll}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}