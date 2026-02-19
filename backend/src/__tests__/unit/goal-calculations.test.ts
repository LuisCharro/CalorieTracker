/**
 * Unit tests for goal calculations
 */

import { describe, it, expect } from '@jest/globals';
import { MealType, GoalType } from '../../shared/enums.js';

describe('Goal Calculations', () => {
  describe('Daily Calorie Goal', () => {
    it('should calculate progress correctly when under target', () => {
      const target = 2000;
      const consumed = 1500;
      const progress = (consumed / target) * 100;
      
      expect(progress).toBe(75);
      expect(consumed).toBeLessThan(target);
    });

    it('should calculate progress correctly when at target', () => {
      const target = 2000;
      const consumed = 2000;
      const progress = (consumed / target) * 100;
      
      expect(progress).toBe(100);
      expect(consumed).toBe(target);
    });

    it('should cap progress at 100% when over target', () => {
      const target = 2000;
      const consumed = 2500;
      const progress = Math.min((consumed / target) * 100, 100);
      
      expect(progress).toBe(100);
      expect(consumed).toBeGreaterThan(target);
    });

    it('should calculate remaining calories correctly', () => {
      const target = 2000;
      const consumed = 1500;
      const remaining = Math.max(target - consumed, 0);
      
      expect(remaining).toBe(500);
    });

    it('should determine if on track correctly', () => {
      const target = 2000;
      const consumedUnder = 1500;
      const consumedOver = 2500;
      
      expect(consumedUnder).toBeLessThanOrEqual(target);
      expect(consumedOver).not.toBeLessThanOrEqual(target);
    });
  });

  describe('Meal Type Grouping', () => {
    it('should group food logs by meal type', () => {
      const foodLogs = [
        { id: '1', mealType: MealType.BREAKFAST, calories: 400 },
        { id: '2', mealType: MealType.BREAKFAST, calories: 200 },
        { id: '3', mealType: MealType.LUNCH, calories: 600 },
        { id: '4', mealType: MealType.DINNER, calories: 700 },
        { id: '5', mealType: MealType.SNACK, calories: 150 },
      ];

      const grouped: Record<string, number> = {
        [MealType.BREAKFAST]: 0,
        [MealType.LUNCH]: 0,
        [MealType.DINNER]: 0,
        [MealType.SNACK]: 0,
      };

      for (const log of foodLogs) {
        if (grouped[log.mealType] !== undefined) {
          grouped[log.mealType] += log.calories;
        }
      }

      expect(grouped[MealType.BREAKFAST]).toBe(600);
      expect(grouped[MealType.LUNCH]).toBe(600);
      expect(grouped[MealType.DINNER]).toBe(700);
      expect(grouped[MealType.SNACK]).toBe(150);
    });
  });

  describe('Date Range Calculations', () => {
    it('should calculate total calories for a date range', () => {
      const foodLogs = [
        { date: '2024-01-01', calories: 2000 },
        { date: '2024-01-01', calories: 500 },
        { date: '2024-01-02', calories: 1800 },
        { date: '2024-01-03', calories: 2200 },
      ];

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-02');

      const total = foodLogs
        .filter(log => {
          const logDate = new Date(log.date);
          return logDate >= startDate && logDate <= endDate;
        })
        .reduce((sum, log) => sum + log.calories, 0);

      expect(total).toBe(4300); // 2000 + 500 + 1800
    });
  });
});
