import React from "react";
import { Search, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { SearchDropdown } from "./SearchDropdown";
import { SearchSuggestionGroup, TrendingMedicine } from "@/hooks/useSearchSuggestions";
import { cn } from "@/lib/utils";

interface SearchSheetProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (query: string) => void;
  groups: SearchSuggestionGroup[];
  trendingMedicines: TrendingMedicine[];
  isLoading: boolean;
  error: Error | null;
  onItemClick: (result: any) => void;
  onViewAll: (type: string, query: string) => void;
  onSearch: (query: string) => void;
}

export function SearchSheet({
  isOpen,
  onClose,
  query,
  onQueryChange,
  groups,
  trendingMedicines,
  isLoading,
  error,
  onItemClick,
  onViewAll,
  onSearch,
}: SearchSheetProps) {
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Count total items for navigation
    const totalItems = 
      (query.trim() ? 0 : trendingMedicines.length) +
      groups.reduce((acc, group) => acc + group.items.length + (group.items.length === 5 ? 1 : 0), 0);

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (totalItems > 0) {
          setSelectedIndex(prev => 
            prev < totalItems - 1 ? prev + 1 : 0
          );
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (totalItems > 0) {
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : totalItems - 1
          );
        }
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          // Handle selection based on index
          // This would need to be implemented similar to SearchDropdown
        } else if (query.trim()) {
          onSearch(query.trim());
        }
        break;
      case "Escape":
        e.preventDefault();
        onClose();
        break;
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      // Reset selection when sheet opens
      setSelectedIndex(-1);
      // Focus input with slight delay
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="top" className="h-full flex flex-col p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search medicines, doctors, lab tests…"
                value={query}
                onChange={(e) => {
                  onQueryChange(e.target.value);
                  setSelectedIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                className="pl-10 pr-4 h-12 text-base"
                role="combobox"
                aria-expanded={true}
                aria-autocomplete="list"
                aria-label="Search medicines, doctors, lab tests"
              />
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-md transition-colors"
              aria-label="Close search"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden">
          <SearchDropdown
            query={query}
            groups={groups}
            trendingMedicines={trendingMedicines}
            isLoading={isLoading}
            error={error}
            selectedIndex={selectedIndex}
            onItemClick={(item) => {
              onItemClick(item);
              onClose();
            }}
            onViewAll={(type, query) => {
              onViewAll(type, query);
              onClose();
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}