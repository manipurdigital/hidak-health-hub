import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SearchResult } from "@/integrations/supabase/search";
import { Link } from "react-router-dom";

interface SearchResultsWithAlternativesProps {
  results: SearchResult[];
  isLoading: boolean;
  query: string;
}

export function SearchResultsWithAlternatives({ 
  results, 
  isLoading, 
  query 
}: SearchResultsWithAlternativesProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-muted rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!results.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No results found for "{query}"</p>
        <p className="text-sm mt-1">Try searching by brand name, generic name, or composition</p>
      </div>
    );
  }

  const mainResults = results.filter(r => !r.is_alternative);
  const alternatives = results.filter(r => r.is_alternative);

  const getMatchTypeBadge = (matchType?: string) => {
    switch (matchType) {
      case 'brand_name':
      case 'brand':
        return <Badge variant="secondary" className="text-xs">Brand Match</Badge>;
      case 'generic':
        return <Badge variant="outline" className="text-xs">Generic</Badge>;
      case 'composition_text':
        return <Badge variant="outline" className="text-xs">Composition</Badge>;
      case 'exact_composition':
        return <Badge variant="default" className="text-xs">Same Formula</Badge>;
      case 'same_actives':
        return <Badge variant="secondary" className="text-xs">Same Active</Badge>;
      case 'fuzzy_name':
      case 'fuzzy_brand':
        return <Badge variant="outline" className="text-xs">Similar</Badge>;
      default:
        return null;
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return 'Price not available';
    return `₹${price.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Main Results */}
      {mainResults.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground">
            Search Results for "{query}"
          </h3>
          {mainResults.map((result) => (
            <Link key={result.id} to={result.href}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {result.thumbnail_url && (
                      <img 
                        src={result.thumbnail_url} 
                        alt={result.title}
                        className="w-16 h-16 object-cover rounded-lg bg-muted"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-medium text-sm line-clamp-2">
                            {result.title}
                          </h4>
                          {result.subtitle && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {result.subtitle}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-medium text-sm">
                            {formatPrice(result.price)}
                          </p>
                          {getMatchTypeBadge(result.composition_match_type)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Alternatives Section */}
      {alternatives.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground">
              Similar Composition Alternatives
            </h3>
            {alternatives.map((result) => (
              <Link key={result.id} to={result.href}>
                <Card className="hover:shadow-md transition-shadow border-dashed">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      {result.thumbnail_url && (
                        <img 
                          src={result.thumbnail_url} 
                          alt={result.title}
                          className="w-16 h-16 object-cover rounded-lg bg-muted"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-medium text-sm line-clamp-2">
                              {result.title}
                            </h4>
                            {result.subtitle && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                {result.subtitle}
                              </p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-medium text-sm">
                              {formatPrice(result.price)}
                            </p>
                            {getMatchTypeBadge(result.composition_match_type)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}