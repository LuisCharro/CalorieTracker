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
        password: 'TestPassword123!',
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
    expect(response.body.data).toHaveProperty('token');

    userId = response.body.data.id;
  });

  it('should not register duplicate email', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: 'TestPassword123!',
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
        password: 'TestPassword123!',
      })
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('id', userId);
    expect(response.body.data).toHaveProperty('email', testEmail);
    expect(response.body.data).toHaveProperty('token');
  });

  it('should return 404 for non-existent user login', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'SomePassword123!',
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

describe('Auth Error Attack Scenarios', () => {
  let validUserId: string;
  const validEmail = `attack-test-${uuidv4()}@example.com`;

  beforeAll(async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: validEmail,
        password: 'ValidPassword123!',
        displayName: 'Attack Test User',
      });
    validUserId = response.body.data.id;
  });

  describe('Registration Attack Scenarios', () => {
    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: 'TestPassword123!',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should reject short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: `short-pw-${uuidv4()}@example.com`,
          password: 'short',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should reject empty body', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should reject malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send('{"email": "test@example.com", "password": "Test123!"')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Login Attack Scenarios', () => {
    it('should reject wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: validEmail,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('unauthorized');
    });

    it('should reject login with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: validEmail,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should reject login with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'TestPassword123!',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('validation_error');
    });
  });

  describe('User Operations Attack Scenarios', () => {
    it('should reject get user with invalid UUID', async () => {
      const response = await request(app)
        .get('/api/auth/user/not-a-uuid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should reject get user with non-existent UUID', async () => {
      const fakeId = uuidv4();
      const response = await request(app)
        .get(`/api/auth/user/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('not_found');
    });

    it('should reject update with no fields', async () => {
      const response = await request(app)
        .patch(`/api/auth/user/${validUserId}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should reject update non-existent user', async () => {
      const fakeId = uuidv4();
      const response = await request(app)
        .patch(`/api/auth/user/${fakeId}`)
        .send({ displayName: 'Hacker' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('not_found');
    });
  });

  describe('Onboarding Attack Scenarios', () => {
    it('should reject onboarding completion with invalid UUID', async () => {
      const response = await request(app)
        .patch('/api/auth/user/not-a-uuid/onboarding')
        .send({ onboardingComplete: true })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('validation_error');
    });

    it('should reject onboarding for non-existent user', async () => {
      const fakeId = uuidv4();
      const response = await request(app)
        .patch(`/api/auth/user/${fakeId}/onboarding`)
        .send({ onboardingComplete: true })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('not_found');
    });
  });
});
