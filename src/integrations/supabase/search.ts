import { supabase } from "./client";

export interface SearchResult {
  type: "medicine" | "doctor" | "lab_test";
  id: string;
  title: string;
  subtitle: string | null;
  thumbnail_url: string | null;
  price: number | null;
  href: string;
}

export async function universalSearch(
  query: string,
  maxPerGroup: number = 5
): Promise<SearchResult[]> {
  const { data, error } = await supabase.rpc("universal_search", {
    q: query,
    max_per_group: maxPerGroup,
  });

  if (error) {
    console.error("Search error:", error);
    throw new Error(error.message);
  }

  return (data || []) as SearchResult[];
}