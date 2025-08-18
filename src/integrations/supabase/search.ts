import { supabase } from "./client";

export interface SearchResult {
  type: "medicine" | "doctor" | "lab_test";
  id: string;
  title: string;
  subtitle: string | null;
  thumbnail_url: string | null;
  price: number | null;
  href: string;
  group_key?: string;
  is_alternative?: boolean;
  composition_match_type?: string;
  // Medicine-specific fields
  composition_key?: string;
  composition_family_key?: string;
  rank_score?: number;
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

// Helper function to group medicines by composition family
export function groupMedicinesByComposition(results: SearchResult[]): Map<string, SearchResult[]> {
  const medicineGroups = new Map<string, SearchResult[]>();
  
  results
    .filter(result => result.type === "medicine" && result.group_key)
    .forEach(medicine => {
      const groupKey = medicine.group_key!;
      if (!medicineGroups.has(groupKey)) {
        medicineGroups.set(groupKey, []);
      }
      medicineGroups.get(groupKey)!.push(medicine);
    });
  
  return medicineGroups;
}

// Enhanced search with v2 function that uses dedicated medicine search
export async function universalSearchV2(
  query: string,
  maxPerGroup: number = 5
): Promise<SearchResult[]> {
  const { data, error } = await supabase.rpc("universal_search_v2", {
    q: query,
    max_per_group: maxPerGroup,
  });

  if (error) {
    console.error("Search error:", error);
    throw new Error(error.message);
  }

  return (data || []) as SearchResult[];
}