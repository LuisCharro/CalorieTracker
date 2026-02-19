/**
 * MSW Mock Handlers
 * Handles API requests for E2E tests when no backend is available
 */

import { http, HttpResponse, delay } from 'msw';

const API_BASE_URL = process.env.API_URL || 'http://localhost:4000';

interface User {
  id: string;
  email: string;
  displayName: string;
  preferences: Record<string, unknown>;
  onboardingComplete: boolean;
  createdAt: string;
}

interface FoodLog {
  id: string;
  userId: string;
  foodName: string;
  brandName?: string;
  quantity: number;
  unit: string;
  mealType: string;
  nutrition: {
    calories: number;
    protein?: number;
    carbohydrates?: number;
    fat?: number;
  };
  loggedAt: string;
  createdAt: string;
  isDeleted: boolean;
}

interface Goal {
  id: string;
  userId: string;
  goalType: string;
  targetValue: number;
  isActive: boolean;
  startDate: string;
  endDate?: string;
}

// In-memory storage for mock data
const mockUsers: Map<string, User> = new Map();
const mockFoodLogs: Map<string, FoodLog[]> = new Map();
const mockGoals: Map<string, Goal[]> = new Map();

let userIdCounter = 1;
let logIdCounter = 1;
let goalIdCounter = 1;

export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE_URL}/api/auth/register`, async ({ request }) => {
    await delay(100);
    const body = await request.json() as { email: string; displayName: string; preferences?: Record<string, unknown> };
    
    const userId = `user-${userIdCounter++}`;
    const user: User = {
      id: userId,
      email: body.email,
      displayName: body.displayName || 'Test User',
      preferences: body.preferences || {},
      onboardingComplete: false,
      createdAt: new Date().toISOString(),
    };
    
    mockUsers.set(userId, user);
    mockFoodLogs.set(userId, []);
    mockGoals.set(userId, []);
    
    return HttpResponse.json({ success: true, data: user });
  }),

  http.post(`${API_BASE_URL}/api/auth/login`, async ({ request }) => {
    await delay(100);
    const body = await request.json() as { email: string };
    
    const user = Array.from(mockUsers.values()).find(u => u.email === body.email);
    if (!user) {
      return HttpResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({ success: true, data: { id: user.id, email: user.email } });
  }),

  http.get(`${API_BASE_URL}/api/auth/user/:userId`, async ({ params }) => {
    await delay(100);
    const userId = params.userId as string;
    const user = mockUsers.get(userId);
    
    if (!user) {
      return HttpResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }
    
    return HttpResponse.json({ success: true, data: user });
  }),

  http.patch(`${API_BASE_URL}/api/auth/user/:userId`, async ({ params, request }) => {
    await delay(100);
    const userId = params.userId as string;
    const user = mockUsers.get(userId);
    const body = await request.json() as Partial<User>;
    
    if (!user) {
      return HttpResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }
    
    const updatedUser = { ...user, ...body };
    mockUsers.set(userId, updatedUser);
    
    return HttpResponse.json({ success: true, data: updatedUser });
  }),

  http.post(`${API_BASE_URL}/api/auth/user/:userId/consents`, async ({ params, request }) => {
    await delay(100);
    const userId = params.userId as string;
    const body = await request.json() as { consents: Record<string, boolean> };
    
    const user = mockUsers.get(userId);
    if (!user) {
      return HttpResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }
    
    // Mark onboarding as complete if consents are given
    if (body.consents.privacy_policy && body.consents.terms_of_service) {
      user.onboardingComplete = true;
      mockUsers.set(userId, user);
    }
    
    return HttpResponse.json({ success: true, data: { message: 'Consents saved' } });
  }),

  // Food logs endpoints
  http.get(`${API_BASE_URL}/api/logs`, async ({ request }) => {
    await delay(100);
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return HttpResponse.json({ success: true, data: [], meta: { total: 0, totalPages: 0 } });
    }
    
    const logs = mockFoodLogs.get(userId) || [];
    return HttpResponse.json({ success: true, data: logs, meta: { total: logs.length, totalPages: 1 } });
  }),

  http.get(`${API_BASE_URL}/api/logs/today`, async ({ request }) => {
    await delay(100);
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return HttpResponse.json(
        { success: false, error: { message: 'User ID required' } },
        { status: 400 }
      );
    }
    
    const today = new Date().toISOString().split('T')[0];
    const logs = (mockFoodLogs.get(userId) || []).filter(
      log => log.loggedAt.startsWith(today) && !log.isDeleted
    );
    
    const grouped: Record<string, FoodLog[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };
    
    logs.forEach(log => {
      if (grouped[log.mealType]) {
        grouped[log.mealType].push(log);
      }
    });
    
    return HttpResponse.json({ success: true, data: grouped });
  }),

  http.post(`${API_BASE_URL}/api/logs`, async ({ request }) => {
    await delay(100);
    const body = await request.json() as Omit<FoodLog, 'id' | 'createdAt' | 'isDeleted'>;
    
    const log: FoodLog = {
      ...body,
      id: `log-${logIdCounter++}`,
      createdAt: new Date().toISOString(),
      isDeleted: false,
    };
    
    const logs = mockFoodLogs.get(body.userId) || [];
    logs.push(log);
    mockFoodLogs.set(body.userId, logs);
    
    return HttpResponse.json({ success: true, data: log });
  }),

  http.get(`${API_BASE_URL}/api/logs/:logId`, async ({ params }) => {
    await delay(100);
    const logId = params.logId as string;
    
    for (const logs of mockFoodLogs.values()) {
      const log = logs.find(l => l.id === logId);
      if (log) {
        return HttpResponse.json({ success: true, data: log });
      }
    }
    
    return HttpResponse.json(
      { success: false, error: { message: 'Log not found' } },
      { status: 404 }
    );
  }),

  http.patch(`${API_BASE_URL}/api/logs/:logId`, async ({ params, request }) => {
    await delay(100);
    const logId = params.logId as string;
    const body = await request.json() as Partial<FoodLog>;
    
    for (const [userId, logs] of mockFoodLogs.entries()) {
      const index = logs.findIndex(l => l.id === logId);
      if (index !== -1) {
        logs[index] = { ...logs[index], ...body };
        mockFoodLogs.set(userId, logs);
        return HttpResponse.json({ success: true, data: logs[index] });
      }
    }
    
    return HttpResponse.json(
      { success: false, error: { message: 'Log not found' } },
      { status: 404 }
    );
  }),

  http.delete(`${API_BASE_URL}/api/logs/:logId`, async ({ params }) => {
    await delay(100);
    const logId = params.logId as string;
    
    for (const [userId, logs] of mockFoodLogs.entries()) {
      const index = logs.findIndex(l => l.id === logId);
      if (index !== -1) {
        logs[index].isDeleted = true;
        mockFoodLogs.set(userId, logs);
        return HttpResponse.json({ success: true });
      }
    }
    
    return HttpResponse.json(
      { success: false, error: { message: 'Log not found' } },
      { status: 404 }
    );
  }),

  // Goals endpoints
  http.get(`${API_BASE_URL}/api/goals`, async ({ request }) => {
    await delay(100);
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return HttpResponse.json({ success: true, data: [], meta: { total: 0, totalPages: 0 } });
    }
    
    const goals = mockGoals.get(userId) || [];
    return HttpResponse.json({ success: true, data: goals, meta: { total: goals.length, totalPages: 1 } });
  }),

  http.post(`${API_BASE_URL}/api/goals`, async ({ request }) => {
    await delay(100);
    const body = await request.json() as Omit<Goal, 'id'>;
    
    const goal: Goal = {
      ...body,
      id: `goal-${goalIdCounter++}`,
    };
    
    const goals = mockGoals.get(body.userId) || [];
    goals.push(goal);
    mockGoals.set(body.userId, goals);
    
    return HttpResponse.json({ success: true, data: goal });
  }),

  // Settings endpoints
  http.get(`${API_BASE_URL}/api/settings/notifications/:userId`, async () => {
    await delay(100);
    return HttpResponse.json({
      success: true,
      data: {
        id: 'settings-1',
        userId: 'user-1',
        channels: ['email'],
        reminderTimes: ['08:00', '12:00', '18:00'],
        timezone: 'Europe/Zurich',
        updatedAt: new Date().toISOString(),
      },
    });
  }),

  http.patch(`${API_BASE_URL}/api/settings/notifications/:userId`, async ({ request }) => {
    await delay(100);
    const body = await request.json();
    return HttpResponse.json({ success: true, data: body });
  }),

  // GDPR endpoints
  http.get(`${API_BASE_URL}/api/gdpr/requests`, async ({ request }) => {
    await delay(100);
    return HttpResponse.json({ success: true, data: [], meta: { total: 0, totalPages: 0 } });
  }),

  http.post(`${API_BASE_URL}/api/gdpr/export/:userId`, async () => {
    await delay(100);
    return HttpResponse.json({
      success: true,
      data: { requestId: 'export-1', status: 'completed', message: 'Export ready' },
    });
  }),

  http.post(`${API_BASE_URL}/api/gdpr/erase/:userId`, async ({ params }) => {
    await delay(100);
    const userId = params.userId as string;
    mockUsers.delete(userId);
    return HttpResponse.json({
      success: true,
      data: { requestId: 'erase-1', status: 'completed', message: 'Account deleted' },
    });
  }),

  // Delete user
  http.delete(`${API_BASE_URL}/api/auth/user/:userId`, async ({ params }) => {
    await delay(100);
    const userId = params.userId as string;
    mockUsers.delete(userId);
    mockFoodLogs.delete(userId);
    mockGoals.delete(userId);
    return HttpResponse.json({ success: true });
  }),
];
