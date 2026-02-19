/**
 * E2E Test Utilities
 * Helper functions for E2E tests
 * Supports mock mode via E2E_USE_MOCK=true environment variable
 */

import { request } from '@playwright/test';

const API_BASE_URL = process.env.API_URL || 'http://localhost:4000';
const useMock = process.env.E2E_USE_MOCK === 'true';

// ============================================================================
// Mock Storage (in-memory when no backend)
// ============================================================================

interface MockUser {
  id: string;
  email: string;
  displayName?: string;
  preferences?: Record<string, unknown>;
  onboardingComplete: boolean;
  createdAt: string;
}

interface MockFoodLog {
  id: string;
  userId: string;
  foodName: string;
  quantity: number;
  unit: string;
  mealType: string;
  nutrition: { calories: number; protein?: number; carbs?: number; fat?: number };
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
const mockFoodLogs = new Map<string, MockFoodLog[]>();
const mockGoals = new Map<string, MockGoal[]>();
let userIdCounter = 1;
let logIdCounter = 1;
let goalIdCounter = 1;

// ============================================================================
// Types
// ============================================================================

export interface TestUser {
  id: string;
  email: string;
  displayName?: string;
  preferences?: Record<string, unknown>;
}

// ============================================================================
// API Helpers
// ============================================================================

async function createTestApiContext() {
  return await request.newContext({
    baseURL: API_BASE_URL,
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
  });
}

// Mock implementations
function mockRegisterTestUser(displayName?: string): TestUser {
  const userId = `mock-user-${userIdCounter++}`;
  const email = `test-${Date.now()}-${Math.random().toString(36).substring(2, 8)}@example.com`;
  
  const user: MockUser = {
    id: userId,
    email,
    displayName: displayName || 'Test User',
    preferences: { timezone: 'Europe/Zurich' },
    onboardingComplete: false,
    createdAt: new Date().toISOString(),
  };
  
  mockUsers.set(userId, user);
  mockFoodLogs.set(userId, []);
  mockGoals.set(userId, []);
  
  return { id: userId, email, displayName: user.displayName, preferences: user.preferences };
}

function mockLoginTestUser(email: string): TestUser | null {
  for (const user of mockUsers.values()) {
    if (user.email === email) {
      return { id: user.id, email: user.email, displayName: user.displayName };
    }
  }
  return null;
}

function mockCreateTestFoodLog(userId: string, foodName: string, calories: number, mealType: string = 'breakfast') {
  const logs = mockFoodLogs.get(userId) || [];
  const log: MockFoodLog = {
    id: `mock-log-${logIdCounter++}`,
    userId,
    foodName,
    quantity: 1,
    unit: 'serving',
    mealType,
    nutrition: { calories, protein: 10, carbs: 20, fat: 5 },
    loggedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    isDeleted: false,
  };
  logs.push(log);
  mockFoodLogs.set(userId, logs);
  
  // Return object that mimics APIResponse for compatibility
  return {
    ok: () => true,
    json: async () => ({ success: true, data: log }),
    dispose: async () => {},
  } as any;
}

function mockCreateTestGoal(userId: string, targetValue: number) {
  const goals = mockGoals.get(userId) || [];
  const goal: MockGoal = {
    id: `mock-goal-${goalIdCounter++}`,
    userId,
    goalType: 'daily_calories',
    targetValue,
    isActive: true,
    startDate: new Date().toISOString().split('T')[0],
  };
  goals.push(goal);
  mockGoals.set(userId, goals);
  
  // Return object that mimics APIResponse for compatibility
  return {
    ok: () => true,
    json: async () => ({ success: true, data: goal }),
    dispose: async () => {},
  } as any;
}

function mockCompleteOnboarding(userId: string) {
  const user = mockUsers.get(userId);
  if (user) {
    user.onboardingComplete = true;
    mockUsers.set(userId, user);
  }
  mockCreateTestGoal(userId, 2000);
}

function mockDeleteTestUser(userId: string) {
  mockUsers.delete(userId);
  mockFoodLogs.delete(userId);
  mockGoals.delete(userId);
}

function mockGetTodayLogs(userId: string) {
  const logs = mockFoodLogs.get(userId) || [];
  const today = new Date().toISOString().split('T')[0];
  
  const grouped: Record<string, MockFoodLog[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  };
  
  logs.filter(l => l.loggedAt.startsWith(today) && !l.isDeleted).forEach(log => {
    if (grouped[log.mealType]) {
      grouped[log.mealType].push(log);
    }
  });
  
  return grouped;
}

// ============================================================================
// Exported Functions (use mock or real API)
// ============================================================================

export async function registerTestUser(displayName?: string): Promise<TestUser> {
  if (useMock) {
    return mockRegisterTestUser(displayName);
  }
  
  const apiContext = await createTestApiContext();
  const timestamp = Date.now();
  const email = `test-${timestamp}@example.com`;

  const response = await apiContext.post('/api/auth/register', {
    data: {
      email,
      displayName: displayName || `Test User ${timestamp}`,
      preferences: { timezone: 'Europe/Zurich' },
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to register test user: ${await response.text()}`);
  }

  const data = await response.json();
  await apiContext.dispose();

  return {
    id: data.data.id,
    email: data.data.email,
    displayName: data.data.displayName,
    preferences: data.data.preferences,
  };
}

export async function loginTestUser(email: string): Promise<TestUser> {
  if (useMock) {
    const user = mockLoginTestUser(email);
    if (!user) throw new Error('User not found');
    return user;
  }
  
  const apiContext = await createTestApiContext();

  const response = await apiContext.post('/api/auth/login', {
    data: { email },
  });

  if (!response.ok()) {
    throw new Error(`Failed to login test user: ${await response.text()}`);
  }

  const data = await response.json();
  await apiContext.dispose();

  return {
    id: data.data.id,
    email: data.data.email,
    displayName: data.data.displayName,
    preferences: data.data.preferences,
  };
}

export async function createTestFoodLog(
  userId: string,
  foodName: string,
  calories: number,
  mealType: string = 'breakfast'
) {
  if (useMock) {
    return mockCreateTestFoodLog(userId, foodName, calories, mealType);
  }
  
  const apiContext = await createTestApiContext();

  const response = await apiContext.post('/api/logs', {
    data: {
      userId,
      foodName,
      quantity: 1,
      unit: 'serving',
      mealType,
      nutrition: { calories },
    },
  });

  await apiContext.dispose();
  return response;
}

export async function createTestGoal(userId: string, targetValue: number) {
  if (useMock) {
    return mockCreateTestGoal(userId, targetValue);
  }
  
  const apiContext = await createTestApiContext();

  const response = await apiContext.post('/api/goals', {
    data: {
      userId,
      goalType: 'daily_calories',
      targetValue,
      startDate: new Date().toISOString().split('T')[0],
    },
  });

  await apiContext.dispose();
  return response;
}

export async function completeOnboarding(userId: string): Promise<void> {
  if (useMock) {
    mockCompleteOnboarding(userId);
    return;
  }
  
  const apiContext = await createTestApiContext();

  await apiContext.post('/api/goals', {
    data: {
      userId,
      goalType: 'daily_calories',
      targetValue: 2000,
      startDate: new Date().toISOString().split('T')[0],
    },
  });

  await apiContext.patch(`/api/auth/user/${userId}`, {
    data: {
      preferences: { timezone: 'Europe/Zurich' },
    },
  });

  await apiContext.dispose();
}

export async function deleteTestUser(userId: string): Promise<void> {
  if (useMock) {
    mockDeleteTestUser(userId);
    return;
  }
  
  const apiContext = await createTestApiContext();

  try {
    await apiContext.delete(`/api/auth/user/${userId}`);
  } catch (error) {
    console.warn(`Failed to delete test user ${userId}:`, error);
  } finally {
    await apiContext.dispose();
  }
}

export async function cleanupTestUsers(userIds: string[]): Promise<void> {
  const promises = userIds.map(id => deleteTestUser(id));
  await Promise.allSettled(promises);
}

export function generateRandomEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(2, 15)}@example.com`;
}

export function generateRandomString(length: number = 10): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}
