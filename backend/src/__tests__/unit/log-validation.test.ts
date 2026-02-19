/**
 * Unit tests for food log validation
 */

import { describe, it, expect } from '@jest/globals';
import { validateBody, ValidationError, nutritionSchema, createFoodLogSchema } from '../../api/validation/schemas.js';
import { MealType } from '../../shared/enums.js';

describe('Food Log Validation', () => {
  describe('Nutrition Schema', () => {
    it('should validate correct nutrition data', () => {
      const data = {
        calories: 500,
        protein: 25,
        carbohydrates: 50,
        fat: 15,
      };

      const result = nutritionSchema.parse(data);
      expect(result).toEqual(data);
    });

    it('should validate nutrition with only required calories', () => {
      const data = {
        calories: 500,
      };

      const result = nutritionSchema.parse(data);
      expect(result).toEqual(data);
    });

    it('should reject negative calories', () => {
      const data = {
        calories: -100,
      };

      expect(() => nutritionSchema.parse(data)).toThrow();
    });

    it('should reject zero calories', () => {
      const data = {
        calories: 0,
      };

      expect(() => nutritionSchema.parse(data)).toThrow();
    });

    it('should reject negative macro values', () => {
      const data = {
        calories: 500,
        protein: -10,
      };

      expect(() => nutritionSchema.parse(data)).toThrow();
    });
  });

  describe('Create Food Log Schema', () => {
    it('should validate correct food log data', () => {
      const data = {
        userId: '00000000-0000-0000-0000-000000000001',
        foodName: 'Chicken Salad',
        quantity: 300,
        unit: 'g',
        mealType: MealType.LUNCH,
        nutrition: {
          calories: 350,
          protein: 30,
          carbohydrates: 15,
          fat: 18,
        },
      };

      const result = createFoodLogSchema.parse(data);
      expect(result).toEqual(data);
    });

    it('should validate food log with optional fields', () => {
      const data = {
        userId: '00000000-0000-0000-0000-000000000001',
        foodName: 'Apple',
        quantity: 1,
        unit: 'piece',
        mealType: MealType.SNACK,
        nutrition: {
          calories: 95,
        },
      };

      const result = createFoodLogSchema.parse(data);
      expect(result).toEqual(data);
    });

    it('should reject invalid UUID', () => {
      const data = {
        userId: 'invalid-uuid',
        foodName: 'Test',
        quantity: 100,
        unit: 'g',
        mealType: MealType.LUNCH,
        nutrition: { calories: 100 },
      };

      expect(() => createFoodLogSchema.parse(data)).toThrow();
    });

    it('should reject empty food name', () => {
      const data = {
        userId: '00000000-0000-0000-0000-000000000001',
        foodName: '',
        quantity: 100,
        unit: 'g',
        mealType: MealType.LUNCH,
        nutrition: { calories: 100 },
      };

      expect(() => createFoodLogSchema.parse(data)).toThrow();
    });

    it('should reject negative quantity', () => {
      const data = {
        userId: '00000000-0000-0000-0000-000000000001',
        foodName: 'Test',
        quantity: -50,
        unit: 'g',
        mealType: MealType.LUNCH,
        nutrition: { calories: 100 },
      };

      expect(() => createFoodLogSchema.parse(data)).toThrow();
    });

    it('should reject zero quantity', () => {
      const data = {
        userId: '00000000-0000-0000-0000-000000000001',
        foodName: 'Test',
        quantity: 0,
        unit: 'g',
        mealType: MealType.LUNCH,
        nutrition: { calories: 100 },
      };

      expect(() => createFoodLogSchema.parse(data)).toThrow();
    });
  });

  describe('validateBody Helper', () => {
    it('should return validated data for valid input', () => {
      const data = {
        calories: 500,
      };

      const result = validateBody(nutritionSchema, data);
      expect(result).toEqual(data);
    });

    it('should throw ValidationError for invalid input', () => {
      const data = {
        calories: 'not a number',
      };

      expect(() => validateBody(nutritionSchema, data)).toThrow(ValidationError);
    });

    it('should include error details in ValidationError', () => {
      const data = {
        calories: -100,
      };

      try {
        validateBody(nutritionSchema, data);
        fail('Should have thrown ValidationError');
      } catch (error) {
        if (error instanceof ValidationError) {
          expect(error.errors).toHaveLength(1);
          expect(error.errors[0].path).toBe('calories');
          expect(error.errors[0].message).toContain('positive');
        }
      }
    });
  });
});
