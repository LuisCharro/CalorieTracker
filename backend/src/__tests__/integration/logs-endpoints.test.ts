/**
 * Integration tests for food logs endpoints
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { MealType } from '../../shared/enums.js';
import app from '../../api/server.js';
import { query } from '../../db/pool.js';

describe('Food Logs Endpoints Integration Tests', () => {
  let userId: string;
  let foodLogId: string;

  beforeEach(async () => {
    const testEmail = `test-logs-${uuidv4()}@example.com`;
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        displayName: 'Test User',
        password: 'TestPassword123!',
      });

    userId = registerResponse.body.data.id;
  });

  describe('POST /api/logs', () => {
    it('should create a food log', async () => {
      const response = await request(app)
        .post('/api/logs')
        .send({
          userId,
          foodName: 'Chicken Salad',
          brandName: 'Fresh Farms',
          quantity: 300,
          unit: 'g',
          mealType: MealType.LUNCH,
          nutrition: {
            calories: 350,
            protein: 30,
            carbohydrates: 15,
            fat: 18,
          },
        })
        .expect(201)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.food_name).toBe('Chicken Salad');
      expect(parseFloat(response.body.data.quantity)).toBe(300);
      expect(response.body.data.nutrition.calories).toBe(350);

      foodLogId = response.body.data.id;
    });

    it('should validate required fields on create', async () => {
      const response = await request(app)
        .post('/api/logs')
        .send({
          userId,
          foodName: 'Test',
        })
        .expect(400)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'validation_error');
    });
  });

  describe('GET /api/logs/:foodLogId', () => {
    it('should get a food log by ID', async () => {
      const createResponse = await request(app)
        .post('/api/logs')
        .send({
          userId,
          foodName: 'Test Food',
          quantity: 100,
          unit: 'g',
          mealType: MealType.LUNCH,
          nutrition: { calories: 100 },
        });

      const logId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/api/logs/${logId}`)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', logId);
      expect(response.body.data.food_name).toBe('Test Food');
    });
  });

  describe('GET /api/logs', () => {
    it('should get food logs with pagination', async () => {
      await request(app)
        .post('/api/logs')
        .send({
          userId,
          foodName: 'Test Food',
          quantity: 100,
          unit: 'g',
          mealType: MealType.LUNCH,
          nutrition: { calories: 100 },
        });

      const response = await request(app)
        .get(`/api/logs?userId=${userId}&page=1&pageSize=10`)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta).toHaveProperty('page', 1);
      expect(response.body.meta).toHaveProperty('pageSize', 10);
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.summary).toHaveProperty('totalCalories');
    });

    it('should group logs by meal type when groupByMeal=true', async () => {
      await request(app)
        .post('/api/logs/batch')
        .send({
          userId,
          mealType: 'breakfast',
          items: [
            { foodName: 'Eggs', quantity: 2, unit: 'pcs', nutrition: { calories: 140 } },
            { foodName: 'Toast', quantity: 1, unit: 'slice', nutrition: { calories: 80 } },
          ],
        });

      await request(app)
        .post('/api/logs/batch')
        .send({
          userId,
          mealType: 'lunch',
          items: [
            { foodName: 'Sandwich', quantity: 1, unit: 'pcs', nutrition: { calories: 350 } },
          ],
        });

      const response = await request(app)
        .get(`/api/logs?userId=${userId}&groupByMeal=true`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('breakfast');
      expect(response.body.data).toHaveProperty('lunch');
      expect(response.body.data.breakfast).toHaveLength(2);
      expect(response.body.data.lunch).toHaveLength(1);
      expect(response.body.mealTotals.breakfast.calories).toBe(220);
    });
  });

  describe('GET /api/logs/today', () => {
    it('should return grouped logs with item counts and totals', async () => {
      await request(app)
        .post('/api/logs/batch')
        .send({
          userId,
          mealName: 'Healthy Breakfast',
          mealType: 'breakfast',
          items: [
            { foodName: 'Oatmeal', quantity: 100, unit: 'g', nutrition: { calories: 389, protein: 16.9 } },
            { foodName: 'Banana', quantity: 120, unit: 'g', nutrition: { calories: 105, protein: 1.3 } },
          ],
        });

      const response = await request(app)
        .get(`/api/logs/today?userId=${userId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.breakfast.items).toHaveLength(2);
      expect(response.body.data.breakfast.itemCount).toBe(2);
      expect(response.body.data.breakfast.totalCalories).toBe(494);
      expect(response.body.data.breakfast.totalProtein).toBeCloseTo(18.2, 1);
      expect(response.body.summary.totalItems).toBe(2);
      expect(response.body.summary.totalCalories).toBe(494);
    });
  });

  describe('GET /api/logs/meal/:mealType', () => {
    it('should return items for a specific meal type', async () => {
      await request(app)
        .post('/api/logs/batch')
        .send({
          userId,
          mealType: 'dinner',
          items: [
            { foodName: 'Salmon', quantity: 200, unit: 'g', nutrition: { calories: 400, protein: 40 } },
            { foodName: 'Rice', quantity: 150, unit: 'g', nutrition: { calories: 195, protein: 4 } },
          ],
        });

      const response = await request(app)
        .get(`/api/logs/meal/dinner?userId=${userId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.mealType).toBe('dinner');
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.itemCount).toBe(2);
      expect(response.body.data.totals.calories).toBe(595);
      expect(response.body.data.totals.protein).toBe(44);
    });

    it('should reject invalid meal type', async () => {
      const response = await request(app)
        .get(`/api/logs/meal/invalid?userId=${userId}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('validation_error');
    });
  });

  describe('POST /api/logs/batch', () => {
    it('should create multiple items and return complete details', async () => {
      const response = await request(app)
        .post('/api/logs/batch')
        .send({
          userId,
          mealName: 'Test Meal',
          mealType: 'lunch',
          items: [
            { foodName: 'Apple', brandName: 'Generic', quantity: 150, unit: 'g', nutrition: { calories: 78, protein: 0.3 } },
            { foodName: 'Cheese', quantity: 30, unit: 'g', nutrition: { calories: 120, protein: 7 } },
          ],
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.mealName).toBe('Test Meal');
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.totals.calories).toBe(198);
      expect(response.body.data.totals.protein).toBeCloseTo(7.3, 1);

      for (const item of response.body.data.items) {
        expect(item.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        expect(item.foodName).toBeDefined();
        expect(item.quantity).toBeDefined();
        expect(item.nutrition).toBeDefined();
      }
    });

    it('should handle partial failures gracefully', async () => {
      const response = await request(app)
        .post('/api/logs/batch')
        .send({
          userId,
          mealType: 'snack',
          items: [
            { foodName: 'Valid', quantity: 100, unit: 'g', nutrition: { calories: 100 } },
            { foodName: 'Invalid' },
            { foodName: 'Also Valid', quantity: 50, unit: 'g', nutrition: { calories: 50 } },
          ],
        })
        .expect(201);

      expect(response.body.success).toBe(false);
      expect(response.body.data.summary.created).toBe(2);
      expect(response.body.data.summary.errors).toBe(1);
      expect(response.body.data.items[1].success).toBe(false);
      expect(response.body.data.items[1].error).toBeDefined();
    });
  });

  describe('PATCH /api/logs/:foodLogId', () => {
    it('should update a food log', async () => {
      const createResponse = await request(app)
        .post('/api/logs')
        .send({
          userId,
          foodName: 'Original Name',
          quantity: 100,
          unit: 'g',
          mealType: MealType.LUNCH,
          nutrition: { calories: 100 },
        });

      const logId = createResponse.body.data.id;

      const response = await request(app)
        .patch(`/api/logs/${logId}`)
        .send({
          foodName: 'Updated Name',
          quantity: 150,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.food_name).toBe('Updated Name');
      expect(parseFloat(response.body.data.quantity)).toBe(150);
    });
  });

  describe('DELETE /api/logs/:foodLogId', () => {
    it('should soft delete a food log', async () => {
      const createResponse = await request(app)
        .post('/api/logs')
        .send({
          userId,
          foodName: 'To Delete',
          quantity: 100,
          unit: 'g',
          mealType: MealType.LUNCH,
          nutrition: { calories: 100 },
        });

      const logId = createResponse.body.data.id;

      await request(app)
        .delete(`/api/logs/${logId}`)
        .expect(204);

      const getResponse = await request(app)
        .get(`/api/logs/${logId}`)
        .expect(404);

      expect(getResponse.body.error).toHaveProperty('code', 'not_found');
    });
  });
});
