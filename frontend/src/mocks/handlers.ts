/**
 * MSW Mock Service Worker
 * Used during E2E testing to mock API responses
 */

import { http, HttpResponse, delay } from 'msw';

interface MockUser {
  id: string;
  email: string;
  displayName: string;
  preferences: Record<string, unknown>;
  onboardingComplete: boolean;
  createdAt: string;
}

interface MockLog {
  id: string;
  userId: string;
  foodName: string;
  quantity: number;
  unit: string;
  mealType: string;
  nutrition: { calories: number; protein?: number; carbohydrates?: number; fat?: number };
  loggedAt: string;
  createdAt: string;
  isDeleted: boolean;
}

interface MockGoal {
  id: string;
  userId: string;
  goalType: string;
  targetValue: number;
  isActive: boolean;
  startDate: string;
}

const mockUsers = new Map<string, MockUser>();
const mockFoodLogs = new Map<string, MockLog[]>();
const mockGoals = new Map<string, MockGoal[]>();

let userIdCounter = 1;
let logIdCounter = 1;
let goalIdCounter = 1;

export const handlers = [
  // Auth
  http.post('/api/auth/register', async ({ request }) => {
    await delay(50);
    const body = await request.json() as { email: string; displayName: string };
    
    const userId = `user-${userIdCounter++}`;
    const user: MockUser = {
      id: userId,
      email: body.email,
      displayName: body.displayName,
      preferences: {},
      onboardingComplete: false,
      createdAt: new Date().toISOString(),
    };
    
    mockUsers.set(userId, user);
    mockFoodLogs.set(userId, []);
    mockGoals.set(userId, []);
    
    return HttpResponse.json({ success: true, data: user });
  }),

  http.post('/api/auth/login', async ({ request }) => {
    await delay(50);
    const body = await request.json() as { email: string };
    
    const user = Array.from(mockUsers.values()).find(u => u.email === body.email);
    if (!user) {
      return HttpResponse.json(
        { success: false, error: { message: 'User not found' } },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({ success: true, data: { id: user.id, email: user.email } });
  }),

  http.get('/api/auth/user/:userId', async ({ params }) => {
    await delay(50);
    const user = mockUsers.get(params.userId as string);
    
    if (!user) {
      return HttpResponse.json(
        { success: false, error: { message: 'User not found' } },
        { status: 404 }
      );
    }
    
    return HttpResponse.json({ success: true, data: user });
  }),

  http.patch('/api/auth/user/:userId', async ({ params, request }) => {
    await delay(50);
    const body = await request.json() as Partial<MockUser>;
    const user = mockUsers.get(params.userId as string);
    
    if (!user) {
      return HttpResponse.json({ success: false, error: { message: 'User not found' } }, { status: 404 });
    }
    
    const updatedUser = { ...user, ...body };
    mockUsers.set(params.userId as string, updatedUser);
    return HttpResponse.json({ success: true, data: updatedUser });
  }),

  http.post('/api/auth/user/:userId/consents', async ({ params }) => {
    await delay(50);
    const user = mockUsers.get(params.userId as string);
    if (user) {
      user.onboardingComplete = true;
      mockUsers.set(params.userId as string, user);
    }
    return HttpResponse.json({ success: true, data: { message: 'Consents saved' } });
  }),

  // Logs
  http.get('/api/logs', async ({ request }) => {
    await delay(50);
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return HttpResponse.json({ success: true, data: [], meta: { total: 0, totalPages: 0 } });
    }
    
    const logs = mockFoodLogs.get(userId) || [];
    return HttpResponse.json({ success: true, data: logs, meta: { total: logs.length, totalPages: 1 } });
  }),

  http.get('/api/logs/today', async ({ request }) => {
    await delay(50);
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return HttpResponse.json({ success: false, error: { message: 'User ID required' } }, { status: 400 });
    }
    
    const today = new Date().toISOString().split('T')[0];
    const logs = (mockFoodLogs.get(userId) || []).filter((log: MockLog) => log.loggedAt.startsWith(today) && !log.isDeleted);
    
    const grouped: Record<string, MockLog[]> = { breakfast: [], lunch: [], dinner: [], snack: [] };
    logs.forEach((log: MockLog) => {
      if (grouped[log.mealType]) grouped[log.mealType].push(log);
    });
    
    return HttpResponse.json({ success: true, data: grouped });
  }),

  http.post('/api/logs', async ({ request }) => {
    await delay(50);
    const body = await request.json() as Omit<MockLog, 'id' | 'createdAt' | 'isDeleted'>;
    
    const log: MockLog = {
      id: `log-${logIdCounter++}`,
      ...body,
      createdAt: new Date().toISOString(),
      isDeleted: false,
    };
    
    const logs = mockFoodLogs.get(body.userId) || [];
    logs.push(log);
    mockFoodLogs.set(body.userId, logs);
    
    return HttpResponse.json({ success: true, data: log });
  }),

  http.get('/api/logs/:id', async ({ params }) => {
    await delay(50);
    for (const logs of mockFoodLogs.values()) {
      const log = logs.find((l: MockLog) => l.id === params.id);
      if (log) return HttpResponse.json({ success: true, data: log });
    }
    return HttpResponse.json({ success: false, error: { message: 'Not found' } }, { status: 404 });
  }),

  http.patch('/api/logs/:id', async ({ params, request }) => {
    await delay(50);
    const body = await request.json() as Partial<MockLog>;
    for (const [userId, logs] of mockFoodLogs.entries()) {
      const index = logs.findIndex((l: MockLog) => l.id === params.id);
      if (index !== -1) {
        logs[index] = { ...logs[index], ...body };
        mockFoodLogs.set(userId, logs);
        return HttpResponse.json({ success: true, data: logs[index] });
      }
    }
    return HttpResponse.json({ success: false, error: { message: 'Not found' } }, { status: 404 });
  }),

  http.delete('/api/logs/:id', async ({ params }) => {
    await delay(50);
    for (const [userId, logs] of mockFoodLogs.entries()) {
      const index = logs.findIndex((l: MockLog) => l.id === params.id);
      if (index !== -1) {
        logs[index].isDeleted = true;
        mockFoodLogs.set(userId, logs);
        return HttpResponse.json({ success: true });
      }
    }
    return HttpResponse.json({ success: false, error: { message: 'Not found' } }, { status: 404 });
  }),

  // Goals
  http.get('/api/goals', async ({ request }) => {
    await delay(50);
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return HttpResponse.json({ success: true, data: [], meta: { total: 0, totalPages: 0 } });
    }
    
    const goals = mockGoals.get(userId) || [];
    return HttpResponse.json({ success: true, data: goals, meta: { total: goals.length, totalPages: 1 } });
  }),

  http.post('/api/goals', async ({ request }) => {
    await delay(50);
    const body = await request.json() as Omit<MockGoal, 'id'>;
    
    const goal: MockGoal = { id: `goal-${goalIdCounter++}`, ...body };
    const goals = mockGoals.get(body.userId) || [];
    goals.push(goal);
    mockGoals.set(body.userId, goals);
    
    return HttpResponse.json({ success: true, data: goal });
  }),

  // Settings
  http.get('/api/settings/notifications/:userId', async () => {
    return HttpResponse.json({
      success: true,
      data: { id: '1', userId: '1', channels: ['email'], reminderTimes: ['08:00'], timezone: 'UTC', updatedAt: new Date().toISOString() },
    });
  }),

  http.patch('/api/settings/notifications/:userId', async ({ request }) => {
    return HttpResponse.json({ success: true, data: await request.json() });
  }),

  // GDPR
  http.get('/api/gdpr/requests', async () => HttpResponse.json({ success: true, data: [], meta: { total: 0, totalPages: 0 } })),
  http.post('/api/gdpr/export/:userId', async () => HttpResponse.json({ success: true, data: { requestId: '1', status: 'completed' } })),
  http.post('/api/gdpr/erase/:userId', async ({ params }) => { 
    mockUsers.delete(params.userId as string); 
    return HttpResponse.json({ success: true, data: { requestId: '1', status: 'completed' } }); 
  }),
  http.delete('/api/auth/user/:userId', async ({ params }) => { 
    mockUsers.delete(params.userId as string); 
    return HttpResponse.json({ success: true }); 
  }),

  // Error simulation handlers for E2E testing
  http.get('/api/test/errors/status', () => {
    return HttpResponse.json({
      success: true,
      data: {
        testModeEnabled: true,
        errorSimulationEnabled: true,
        environment: 'test',
        availableEndpoints: [
          'GET /api/test/errors/500',
          'POST /api/test/errors/500',
          'GET /api/test/errors/timeout',
          'GET /api/test/errors/slow',
          'GET /api/test/errors/network-failure',
          'GET /api/test/errors/503',
          'GET /api/test/errors/429',
          'GET /api/test/errors/401',
          'GET /api/test/errors/403',
          'GET /api/test/errors/400',
        ],
      },
    });
  }),

  http.get('/api/test/errors/500', () => {
    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'internal_error',
          message: 'Simulated server error for testing',
          requestId: `test-${Date.now()}`,
        },
      },
      { status: 500 }
    );
  }),

  http.post('/api/test/errors/500', () => {
    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'internal_error',
          message: 'Simulated server error for testing',
          requestId: `test-${Date.now()}`,
        },
      },
      { status: 500 }
    );
  }),

  http.get('/api/test/errors/timeout', async ({ request }) => {
    const url = new URL(request.url);
    const delayMs = parseInt(url.searchParams.get('delay') || '5000');
    await delay(delayMs);
    return HttpResponse.json({
      success: true,
      data: { message: `Response after ${delayMs}ms delay`, delayed: true },
    });
  }),

  http.get('/api/test/errors/slow', async ({ request }) => {
    const url = new URL(request.url);
    const delayMs = parseInt(url.searchParams.get('delay') || '2000');
    await delay(delayMs);
    return HttpResponse.json({
      success: true,
      data: { message: `Slow response after ${delayMs}ms`, delay: delayMs },
    });
  }),

  http.get('/api/test/errors/503', () => {
    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'service_unavailable',
          message: 'Service temporarily unavailable - simulated for testing',
          retryAfter: 60,
        },
      },
      { status: 503 }
    );
  }),

  http.get('/api/test/errors/429', () => {
    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'rate_limited',
          message: 'Too many requests - simulated for testing',
          retryAfter: 30,
        },
      },
      { status: 429 }
    );
  }),

  http.get('/api/test/errors/401', () => {
    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'unauthorized',
          message: 'Authentication required - simulated for testing',
        },
      },
      { status: 401 }
    );
  }),

  http.get('/api/test/errors/403', () => {
    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'forbidden',
          message: 'Access denied - simulated for testing',
        },
      },
      { status: 403 }
    );
  }),

  http.get('/api/test/errors/400', () => {
    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'validation_error',
          message: 'Validation failed - simulated for testing',
          details: [
            { field: 'email', message: 'Invalid email format' },
            { field: 'password', message: 'Password too short' },
          ],
        },
      },
      { status: 400 }
    );
  }),
];
