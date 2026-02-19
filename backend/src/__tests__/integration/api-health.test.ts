/**
 * Integration test for API health endpoint
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../../api/server.js';

describe('API Health Integration Tests', () => {
  it('should return health check', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('service', 'calorietracker-backend');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('should return 404 for non-existent endpoint', async () => {
    const response = await request(app)
      .get('/api/non-existent')
      .expect(404)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toHaveProperty('code', 'not_found');
  });
});
