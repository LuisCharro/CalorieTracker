/**
 * Integration tests for auth endpoints
 */

import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import app from '../../api/server.js';
import { cleanupTestDatabase, getTestPool } from '../setup.js';

describe('Auth Endpoints Integration Tests', () => {
  const testEmail = `test-${uuidv4()}@example.com`;
  let userId: string;

  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        displayName: 'Test User',
        preferences: { timezone: 'Europe/Zurich' },
      })
      .expect(201)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data).toHaveProperty('email', testEmail);
    expect(response.body.data).toHaveProperty('displayName', 'Test User');
    expect(response.body.data).toHaveProperty('onboardingComplete', false);

    userId = response.body.data.id;
  });

  it('should not register duplicate email', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        displayName: 'Another User',
      })
      .expect(409)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toHaveProperty('code', 'conflict');
  });

  it('should validate required fields on register', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        displayName: 'Test User',
      })
      .expect(400)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toHaveProperty('code', 'validation_error');
  });

  it('should login user by email', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
      })
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('id', userId);
    expect(response.body.data).toHaveProperty('email', testEmail);
  });

  it('should return 404 for non-existent user login', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
      })
      .expect(404)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toHaveProperty('code', 'not_found');
  });

  it('should get user by ID', async () => {
    const response = await request(app)
      .get(`/api/auth/user/${userId}`)
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('id', userId);
    expect(response.body.data).toHaveProperty('email', testEmail);
  });

  it('should update user', async () => {
    const response = await request(app)
      .patch(`/api/auth/user/${userId}`)
      .send({
        displayName: 'Updated User',
        preferences: { theme: 'dark' },
      })
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('displayName', 'Updated User');
    expect(response.body.data.preferences).toHaveProperty('theme', 'dark');
  });

  it('should soft delete user', async () => {
    const response = await request(app)
      .delete(`/api/auth/user/${userId}`)
      .expect(204);

    expect(response.body).toEqual({});

    // Verify user is soft deleted
    const getResponse = await request(app)
      .get(`/api/auth/user/${userId}`)
      .expect(404);

    expect(getResponse.body.error).toHaveProperty('code', 'not_found');
  });
});
