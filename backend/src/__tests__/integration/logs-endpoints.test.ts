/**
 * Integration tests for food logs endpoints
 */

import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { MealType } from '../../shared/enums.js';
import app from '../../api/server.js';

describe('Food Logs Endpoints Integration Tests', () => {
  let userId: string;
  let foodLogId: string;

  beforeAll(async () => {
    // Register a test user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: `test-logs-${uuidv4()}@example.com`,
        displayName: 'Test User',
      });

    userId = registerResponse.body.data.id;
  });

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
    expect(response.body.data).toHaveProperty('foodName', 'Chicken Salad');
    expect(response.body.data).toHaveProperty('quantity', 300);
    expect(response.body.data.nutrition).toHaveProperty('calories', 350);

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

  it('should get a food log by ID', async () => {
    const response = await request(app)
      .get(`/api/logs/${foodLogId}`)
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('id', foodLogId);
    expect(response.body.data).toHaveProperty('foodName', 'Chicken Salad');
  });

  it('should get food logs with pagination', async () => {
    const response = await request(app)
      .get(`/api/logs?userId=${userId}&page=1&pageSize=10`)
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.meta).toHaveProperty('page', 1);
    expect(response.body.meta).toHaveProperty('pageSize', 10);
    expect(response.body.meta).toHaveProperty('total');
  });

  it('should filter food logs by meal type', async () => {
    const response = await request(app)
      .get(`/api/logs?userId=${userId}&mealType=${MealType.LUNCH}`)
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toBeInstanceOf(Array);
    response.body.data.forEach((log: any) => {
      expect(log.meal_type).toBe(MealType.LUNCH);
    });
  });

  it('should update a food log', async () => {
    const response = await request(app)
      .patch(`/api/logs/${foodLogId}`)
      .send({
        foodName: 'Grilled Chicken Salad',
        quantity: 350,
      })
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('foodName', 'Grilled Chicken Salad');
    expect(response.body.data).toHaveProperty('quantity', 350);
  });

  it('should soft delete a food log', async () => {
    const response = await request(app)
      .delete(`/api/logs/${foodLogId}`)
      .expect(204);

    expect(response.body).toEqual({});

    // Verify log is soft deleted
    const getResponse = await request(app)
      .get(`/api/logs/${foodLogId}`)
      .expect(404);

    expect(getResponse.body.error).toHaveProperty('code', 'not_found');
  });

  it('should get today\'s food logs grouped by meal', async () => {
    // Create a log for today
    await request(app)
      .post('/api/logs')
      .send({
        userId,
        foodName: 'Oatmeal',
        quantity: 100,
        unit: 'g',
        mealType: MealType.BREAKFAST,
        nutrition: { calories: 389 },
      });

    const response = await request(app)
      .get(`/api/logs/today?userId=${userId}`)
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('breakfast');
    expect(response.body.data).toHaveProperty('lunch');
    expect(response.body.data).toHaveProperty('dinner');
    expect(response.body.data).toHaveProperty('snack');
  });
});
