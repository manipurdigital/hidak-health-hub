// Placeholder implementation for recommendations
export interface RecItem {
  medicine_id: string;
  id: string;
  name: string;
  price: number;
  discount_price?: number;
  image_url?: string;
  manufacturer: string;
  expected_qty: number;
  score: number;
}

export async function getCachedRecommendations(userId: string): Promise<RecItem[]> {
  // Placeholder implementation
  return [];
}

export async function setCachedRecommendations(userId: string, items: RecItem[]): Promise<void> {
  // Placeholder implementation
  return;
}
