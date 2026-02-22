#!/usr/bin/env node

/**
 * End-to-End Test for CalorieTracker
 * Simulates a user flow: login → log foods → check history
 */

const axios = require('axios');

const API_URL = 'http://localhost:4000';

// Test user data
const testUser = {
  email: 'test@example.com',
  password: 'testpassword123',
  name: 'Test User',
};

// Test foods to log
const testFoods = [
  {
    foodName: 'Greek yogurt with berries',
    mealType: 'breakfast',
    quantity: 1,
    unit: 'serving',
    nutrition: { calories: 250, protein: 15, carbs: 30, fat: 5 },
  },
  {
    foodName: 'Grilled chicken breast with brown rice',
    mealType: 'lunch',
    quantity: 1,
    unit: 'serving',
    nutrition: { calories: 450, protein: 40, carbs: 45, fat: 10 },
  },
  {
    foodName: 'Apple',
    mealType: 'snack',
    quantity: 1,
    unit: 'medium',
    nutrition: { calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
  },
  {
    foodName: 'Salmon with vegetables',
    mealType: 'dinner',
    quantity: 1,
    unit: 'serving',
    nutrition: { calories: 500, protein: 35, carbs: 20, fat: 30 },
  },
];

let authToken = null;
let userId = null;

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'blue');
  console.log('='.repeat(60));
}

function testResult(testName, passed, details = '') {
  const status = passed ? '✓ PASS' : '✗ FAIL';
  const color = passed ? 'green' : 'red';
  log(`${status}: ${testName}`, color);
  if (details) {
    log(`  ${details}`, 'yellow');
  }
  return passed;
}

// Test 1: Check if backend is running
async function testBackendHealth() {
  section('Test 1: Backend Health Check');
  try {
    // Try to hit the logs endpoint (even with invalid UUID, it should respond)
    const response = await axios.get(`${API_URL}/api/logs?userId=test&pageSize=1`, { timeout: 5000 });
    testResult('Backend is reachable', response.status === 200);
  } catch (error) {
    // If we get a 400 or 500, the backend is running, just the data is invalid
    if (error.response && (error.response.status === 400 || error.response.status === 500)) {
      testResult('Backend is reachable', true, 'Backend responded (endpoint exists)');
      return true;
    }
    testResult('Backend is reachable', false, `Error: ${error.message}`);
    return false;
  }
  return true;
}

// Test 2: Create or login test user
async function testUserAuth() {
  section('Test 2: User Authentication');
  try {
    // Try to register (may fail if user already exists)
    // Note: Password is being required even though schema doesn't include it (BUG)
    try {
      const registerResponse = await axios.post(`${API_URL}/api/auth/register`, {
        email: testUser.email,
        displayName: testUser.name,
        password: testUser.password, // BUG: Password required but not in schema
      });
      if (registerResponse.data.success) {
        userId = registerResponse.data.data.id;
        testResult('User registration successful', true, `User ID: ${userId}`);
      }
    } catch (registerError) {
      // User might already exist, try login
      if (registerError.response?.status === 409) {
        log('User already exists, trying login...', 'yellow');
      } else {
        log(`Registration failed: ${registerError.message}`, 'yellow');
        if (registerError.response) {
          log(`  Response: ${JSON.stringify(registerError.response.data)}`, 'yellow');
        }
      }
    }

    // Login to get user ID
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password,
    });

    if (loginResponse.data.success) {
      userId = loginResponse.data.data.id;
      testResult('User login successful', true, `User ID: ${userId}`);
      return true;
    } else {
      testResult('User login successful', false, 'No success flag in response');
      return false;
    }
  } catch (error) {
    testResult('User authentication', false, `Error: ${error.message}`);
    if (error.response) {
      log(`  Response: ${JSON.stringify(error.response.data)}`, 'yellow');
    }
    return false;
  }
}

// Test 3: Log multiple foods
async function testLogFoods() {
  section('Test 3: Log Foods');
  const results = [];

  for (const food of testFoods) {
    try {
      const response = await axios.post(`${API_URL}/api/logs`, {
        userId,
        ...food,
        loggedAt: new Date().toISOString(),
      });

      const passed = response.data.success && response.data.data.id;
      testResult(`Log food: ${food.foodName}`, passed, passed ? `Log ID: ${response.data.data.id}` : '');
      results.push(passed);
    } catch (error) {
      testResult(`Log food: ${food.foodName}`, false, `Error: ${error.message}`);
      if (error.response) {
        log(`  Response: ${JSON.stringify(error.response.data)}`, 'yellow');
      }
      results.push(false);
    }
  }

  const allPassed = results.every((r) => r);
  testResult('All foods logged successfully', allPassed);
  return allPassed;
}

// Test 4: Get logs (history)
async function testGetLogs() {
  section('Test 4: Get History Logs');
  try {
    const response = await axios.get(`${API_URL}/api/logs`, {
      params: {
        userId,
        pageSize: 100,
      },
    });

    const passed = response.data.success && Array.isArray(response.data.data);
    testResult('Get logs successful', passed, `Found ${response.data.data?.length || 0} logs`);

    if (passed) {
      log('\nLogged foods:', 'blue');
      response.data.data.forEach((foodLog, index) => {
        log(
          `  ${index + 1}. ${foodLog.food_name} (${foodLog.meal_type}) - ${foodLog.nutrition?.calories} calories`,
          'reset'
        );
      });
    }

    return passed;
  } catch (error) {
    testResult('Get logs successful', false, `Error: ${error.message}`);
    if (error.response) {
      log(`  Response: ${JSON.stringify(error.response.data)}`, 'yellow');
      log(`  Status: ${error.response.status}`, 'yellow');
    }
    return false;
  }
}

// Test 5: Get today's logs
async function testGetTodayLogs() {
  section("Test 5: Get Today's Logs");
  try {
    const response = await axios.get(`${API_URL}/api/logs/today`, {
      params: { userId },
    });

    const passed = response.data.success && response.data.data;
    testResult('Get today logs successful', passed);

    if (passed) {
      log('\nToday logs by meal type:', 'blue');
      const meals = ['breakfast', 'lunch', 'dinner', 'snack'];
      meals.forEach((meal) => {
        const mealLogs = response.data.data[meal] || [];
        if (mealLogs.length > 0) {
          log(`  ${meal}:`, 'reset');
          mealLogs.forEach((foodLog) => {
            log(`    - ${foodLog.food_name} (${foodLog.nutrition?.calories} cal)`, 'reset');
          });
        }
      });
    }

    return passed;
  } catch (error) {
    testResult('Get today logs successful', false, `Error: ${error.message}`);
    if (error.response) {
      log(`  Response: ${JSON.stringify(error.response.data)}`, 'yellow');
    }
    return false;
  }
}

// Test 6: Get recent foods (this endpoint might not exist yet)
async function testGetRecentFoods() {
  section('Test 6: Get Recent Foods (Feature Check)');
  try {
    const response = await axios.get(`${API_URL}/api/logs/recent`, {
      params: { userId, limit: 10 },
    });

    testResult('Recent foods endpoint exists', true, `Found ${response.data.data?.length || 0} recent foods`);
    return true;
  } catch (error) {
    if (error.response?.status === 404) {
      testResult('Recent foods endpoint exists', false, 'Endpoint not implemented yet (expected in Phase 2)');
    } else {
      testResult('Recent foods endpoint exists', false, `Error: ${error.message}`);
    }
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('\n');
  log('╔════════════════════════════════════════════════════════════╗', 'blue');
  log('║     CalorieTracker End-to-End Test Suite                 ║', 'blue');
  log('╚════════════════════════════════════════════════════════════╝', 'blue');

  const results = [];

  // Run all tests
  results.push(await testBackendHealth());

  if (results[0]) {
    results.push(await testUserAuth());

    if (results[1]) {
      results.push(await testLogFoods());
      results.push(await testGetLogs());
      results.push(await testGetTodayLogs());
      results.push(await testGetRecentFoods());
    }
  }

  // Summary
  section('Test Summary');
  const passed = results.filter((r) => r).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);

  log(`\nResults: ${passed}/${total} tests passed (${percentage}%)`, passed === total ? 'green' : 'yellow');

  if (passed === total) {
    log('\n✅ All tests passed! The app is working correctly.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please review the issues above.', 'yellow');
  }

  process.exit(passed === total ? 0 : 1);
}

// Run tests
runTests().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
