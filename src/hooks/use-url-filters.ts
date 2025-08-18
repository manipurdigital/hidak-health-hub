import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

export interface FilterState {
  q?: string;
  category?: string;
  brand?: string;
  specialty?: string;
  city?: string;
  rx_only?: boolean;
  fasting?: boolean;
  price_min?: number;
  price_max?: number;
  fee_min?: number;
  fee_max?: number;
  sort?: string;
  page?: number;
}

export const useUrlFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo((): FilterState => {
    const params: FilterState = {};
    
    // String filters
    const q = searchParams.get('q');
    if (q) params.q = q;
    
    const category = searchParams.get('category');
    if (category) params.category = category;
    
    const brand = searchParams.get('brand');
    if (brand) params.brand = brand;
    
    const specialty = searchParams.get('specialty');
    if (specialty) params.specialty = specialty;
    
    const city = searchParams.get('city');
    if (city) params.city = city;
    
    const sort = searchParams.get('sort');
    if (sort) params.sort = sort;
    
    // Boolean filters
    const rx_only = searchParams.get('rx_only');
    if (rx_only === 'true') params.rx_only = true;
    
    const fasting = searchParams.get('fasting');
    if (fasting === 'true') params.fasting = true;
    
    // Number filters
    const price_min = searchParams.get('price_min');
    if (price_min) params.price_min = Number(price_min);
    
    const price_max = searchParams.get('price_max');
    if (price_max) params.price_max = Number(price_max);
    
    const fee_min = searchParams.get('fee_min');
    if (fee_min) params.fee_min = Number(fee_min);
    
    const fee_max = searchParams.get('fee_max');
    if (fee_max) params.fee_max = Number(fee_max);
    
    const page = searchParams.get('page');
    if (page) params.page = Number(page);
    
    return params;
  }, [searchParams]);

  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    const updatedParams = new URLSearchParams(searchParams);
    
    // Remove undefined/empty values and update existing ones
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === null) {
        updatedParams.delete(key);
      } else {
        updatedParams.set(key, String(value));
      }
    });
    
    // Reset page when filters change (except when only page is being updated)
    if (Object.keys(newFilters).some(key => key !== 'page')) {
      updatedParams.delete('page');
    }
    
    setSearchParams(updatedParams);
  }, [searchParams, setSearchParams]);

  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  return {
    filters,
    updateFilters,
    clearFilters
  };
};