import { describe, it, expect } from 'vitest';

// Mock RPC mapper functions for testing
function mapMedicineData(data: any) {
  if (!data) return null;
  return {
    id: data.id,
    name: data.name || '',
    price: Number(data.price) || 0,
    description: data.description || '',
    in_stock: Boolean(data.in_stock),
  };
}

function mapLabTestData(data: any) {
  if (!data) return null;
  return {
    id: data.id,
    name: data.name || '',
    price: Number(data.price) || 0,
    preparation_required: Boolean(data.preparation_required),
    sample_type: data.sample_type || 'blood',
  };
}

describe('RPC Mappers', () => {
  describe('mapMedicineData', () => {
    it('should map valid medicine data correctly', () => {
      const input = {
        id: '123',
        name: 'Aspirin',
        price: '10.50',
        description: 'Pain reliever',
        in_stock: true,
      };

      const result = mapMedicineData(input);

      expect(result).toEqual({
        id: '123',
        name: 'Aspirin',
        price: 10.50,
        description: 'Pain reliever',
        in_stock: true,
      });
    });

    it('should handle null/undefined input', () => {
      expect(mapMedicineData(null)).toBeNull();
      expect(mapMedicineData(undefined)).toBeNull();
    });

    it('should provide defaults for missing fields', () => {
      const input = { id: '123' };
      const result = mapMedicineData(input);

      expect(result).toEqual({
        id: '123',
        name: '',
        price: 0,
        description: '',
        in_stock: false,
      });
    });
  });

  describe('mapLabTestData', () => {
    it('should map valid lab test data correctly', () => {
      const input = {
        id: '456',
        name: 'Blood Sugar Test',
        price: '25.00',
        preparation_required: true,
        sample_type: 'blood',
      };

      const result = mapLabTestData(input);

      expect(result).toEqual({
        id: '456',
        name: 'Blood Sugar Test',
        price: 25.00,
        preparation_required: true,
        sample_type: 'blood',
      });
    });

    it('should handle invalid price input', () => {
      const input = {
        id: '456',
        name: 'Test',
        price: 'invalid',
      };

      const result = mapLabTestData(input);
      expect(result?.price).toBe(0);
    });
  });
});