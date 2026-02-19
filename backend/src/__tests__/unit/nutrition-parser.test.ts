/**
 * Unit tests for nutrition parser
 */

import {
  parseFoodText,
  getSupportedFoods,
  ParsedFood,
  NutritionInfo,
} from '../../api/utils/nutrition-parser';

describe('parseFoodText', () => {
  describe('basic parsing', () => {
    it('should parse simple text with grams', () => {
      const result = parseFoodText('100g chicken breast');

      expect(result.quantity).toBe(100);
      expect(result.unit).toBe('g');
      expect(result.foodName).toBe('Chicken Breast');
      expect(result.nutrition.calories).toBeGreaterThan(0);
      expect(result.nutrition.protein).toBeGreaterThan(0);
    });

    it('should parse text without explicit unit', () => {
      const result = parseFoodText('1 apple');

      expect(result.quantity).toBe(1);
      expect(result.unit).toBe('g');
      expect(result.foodName).toBe('Apple');
      expect(result.nutrition.calories).toBeGreaterThan(0);
    });

    it('should parse text with ounces', () => {
      const result = parseFoodText('4oz chicken breast');

      expect(result.quantity).toBe(4);
      expect(result.unit).toBe('oz');
      expect(result.foodName).toBe('Chicken Breast');
    });

    it('should parse text with slices', () => {
      const result = parseFoodText('2 slices bread');

      expect(result.quantity).toBe(2);
      expect(result.unit).toBe('slices');
      expect(result.foodName).toBe('Bread');
    });

    it('should parse text with cups', () => {
      const result = parseFoodText('1 cup rice');

      expect(result.quantity).toBe(1);
      expect(result.unit).toBe('cup');
      expect(result.foodName).toBe('Rice');
    });
  });

  describe('nutrition accuracy', () => {
    it('should calculate correct calories for 100g chicken breast', () => {
      const result = parseFoodText('100g chicken breast');

      expect(result.nutrition.calories).toBe(165);
      expect(result.nutrition.protein).toBe(31);
      expect(result.nutrition.carbohydrates).toBe(0);
      expect(result.nutrition.fat).toBe(3.6);
    });

    it('should calculate correct calories for 200g rice', () => {
      const result = parseFoodText('200g rice');

      // 130 calories per 100g, so 260 for 200g
      expect(result.nutrition.calories).toBe(260);
      expect(result.nutrition.carbohydrates).toBe(56);
    });

    it('should calculate correct calories for 1 apple', () => {
      const result = parseFoodText('1 apple');

      // 1 apple in grams (default unit) with 52 calories per 100g
      expect(result.nutrition.calories).toBeGreaterThan(0);
      expect(result.nutrition.calories).toBeLessThan(10); // 1 gram is small
    });

    it('should calculate correct calories for 4oz salmon', () => {
      const result = parseFoodText('4oz salmon');

      // 208 calories per 100g, 4oz = ~113g
      expect(result.nutrition.calories).toBeGreaterThan(200);
      expect(result.nutrition.calories).toBeLessThan(300);
    });

    it('should scale nutrition correctly', () => {
      const result100g = parseFoodText('100g chicken breast');
      const result200g = parseFoodText('200g chicken breast');

      expect(result200g.nutrition.calories).toBe(result100g.nutrition.calories * 2);
      expect(result200g.nutrition.protein).toBe(result100g.nutrition.protein * 2);
    });
  });

  describe('food name matching', () => {
    it('should match exact food name', () => {
      const result = parseFoodText('100g chicken breast');
      expect(result.foodName).toBe('Chicken Breast');
    });

    it('should match partial food name', () => {
      const result = parseFoodText('100g chicken');
      expect(result.foodName).toBe('Chicken');
      expect(result.nutrition.calories).toBeGreaterThan(0);
    });

    it('should use default nutrition for unknown food', () => {
      const result = parseFoodText('100g exotic fruit');

      expect(result.foodName).toBe('Exotic Fruit');
      expect(result.nutrition.calories).toBe(100); // Default
      expect(result.nutrition.protein).toBe(5);
    });
  });

  describe('unit handling', () => {
    it('should handle grams (g)', () => {
      const result = parseFoodText('100g rice');
      expect(result.unit).toBe('g');
    });

    it('should handle ounces (oz)', () => {
      const result = parseFoodText('8oz beef');
      expect(result.unit).toBe('oz');
    });

    it('should handle pounds (lb)', () => {
      const result = parseFoodText('1lb ground beef');
      expect(result.unit).toBe('lb');
    });

    it('should handle milliliters (ml)', () => {
      const result = parseFoodText('250ml milk');
      expect(result.unit).toBe('ml');
    });

    it('should handle tablespoons (tbsp)', () => {
      const result = parseFoodText('2 tbsp peanut butter');
      expect(result.unit).toBe('tbsp');
    });

    it('should handle teaspoons (tsp)', () => {
      const result = parseFoodText('1 tsp oil');
      expect(result.unit).toBe('tsp');
    });
  });

  describe('error handling', () => {
    it('should throw error for invalid quantity', () => {
      expect(() => parseFoodText('abc chicken')).toThrow();
    });

    it('should throw error for zero quantity', () => {
      expect(() => parseFoodText('0g chicken')).toThrow();
    });

    it('should throw error for negative quantity', () => {
      expect(() => parseFoodText('-100g chicken')).toThrow();
    });

    it('should throw error for missing food name', () => {
      expect(() => parseFoodText('100g')).toThrow();
    });

    it('should throw error for empty text', () => {
      expect(() => parseFoodText('')).toThrow();
    });

    it('should throw error for whitespace only', () => {
      expect(() => parseFoodText('   ')).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle decimal quantities', () => {
      const result = parseFoodText('150.5g chicken breast');
      expect(result.quantity).toBe(150.5);
      expect(result.nutrition.calories).toBeGreaterThan(200);
    });

    it('should handle large quantities', () => {
      const result = parseFoodText('1000g rice');
      expect(result.quantity).toBe(1000);
      expect(result.nutrition.calories).toBe(1300); // 130 * 10
    });

    it('should handle multi-word food names', () => {
      const result = parseFoodText('100g greek yogurt');
      expect(result.foodName).toBe('Greek Yogurt');
    });

    it('should capitalize words correctly', () => {
      const result = parseFoodText('100g CHICKEN BREAST');
      expect(result.foodName).toBe('Chicken Breast');
    });
  });

  describe('various food types', () => {
    it('should parse proteins correctly', () => {
      const chicken = parseFoodText('100g chicken breast');
      expect(chicken.nutrition.protein).toBeGreaterThan(20);

      const salmon = parseFoodText('100g salmon');
      expect(salmon.nutrition.protein).toBeGreaterThan(15);

      const egg = parseFoodText('100g egg');
      expect(egg.nutrition.protein).toBeGreaterThan(10);
    });

    it('should parse carbohydrates correctly', () => {
      const rice = parseFoodText('100g rice');
      expect(rice.nutrition.carbohydrates).toBeGreaterThan(20);

      const bread = parseFoodText('100g bread');
      expect(bread.nutrition.carbohydrates).toBeGreaterThan(40);

      const potato = parseFoodText('100g potato');
      expect(potato.nutrition.carbohydrates).toBeGreaterThan(10);
    });

    it('should parse fruits correctly', () => {
      const apple = parseFoodText('100g apple');
      expect(apple.nutrition.calories).toBe(52);
      expect(apple.nutrition.fiber).toBeGreaterThan(2);

      const banana = parseFoodText('100g banana');
      expect(banana.nutrition.calories).toBe(89);
    });

    it('should parse vegetables correctly', () => {
      const broccoli = parseFoodText('100g broccoli');
      expect(broccoli.nutrition.calories).toBeLessThan(50);
      expect(broccoli.nutrition.fiber).toBeGreaterThan(2);

      const spinach = parseFoodText('100g spinach');
      expect(spinach.nutrition.calories).toBeLessThan(30);
    });

    it('should parse nuts and seeds correctly', () => {
      const almonds = parseFoodText('100g almonds');
      expect(almonds.nutrition.calories).toBeGreaterThan(500);
      expect(almonds.nutrition.fat).toBeGreaterThan(40);

      const peanutButter = parseFoodText('100g peanut butter');
      expect(peanutButter.nutrition.calories).toBeGreaterThan(500);
    });
  });
});

describe('getSupportedFoods', () => {
  it('should return a non-empty list of foods', () => {
    const foods = getSupportedFoods();

    expect(Array.isArray(foods)).toBe(true);
    expect(foods.length).toBeGreaterThan(0);
  });

  it('should include common foods', () => {
    const foods = getSupportedFoods();

    expect(foods).toContain('Chicken Breast');
    expect(foods).toContain('Rice');
    expect(foods).toContain('Apple');
    expect(foods).toContain('Bread');
  });

  it('should capitalize food names correctly', () => {
    const foods = getSupportedFoods();

    // Check that all items are capitalized
    for (const food of foods) {
      expect(food).toMatch(/^[A-Z]/);
    }
  });
});
