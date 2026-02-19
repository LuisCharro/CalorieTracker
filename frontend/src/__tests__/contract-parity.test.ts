/**
 * Contract Parity Tests
 * Verifies that FrontEnd enums match BackEnd enums exactly
 * These tests prevent contract drift between FE and BE
 */

import {
  GoalType,
  MealType,
  ConsentType,
  GDPRRequestType,
  GDPRRequestStatus,
  SecurityEventType,
  SecurityEventSeverity,
  ProcessingActivityType,
  LegalBasis,
} from '../core/contracts/enums';

// ============================================================================
// Canonical Backend Enum Values
// These must match the Backend enums exactly
// Source: /Users/luis/Repos/CalorieTracker_BackEnd/src/shared/enums.ts
// ============================================================================

const BACKEND_ENUMS = {
  GoalType: {
    DAILY_CALORIES: 'daily_calories',
  },

  MealType: {
    BREAKFAST: 'breakfast',
    LUNCH: 'lunch',
    DINNER: 'dinner',
    SNACK: 'snack',
  },

  ConsentType: {
    PRIVACY_POLICY: 'privacy_policy',
    TERMS_OF_SERVICE: 'terms_of_service',
    ANALYTICS: 'analytics',
    MARKETING: 'marketing',
  },

  GDPRRequestType: {
    ACCESS: 'access',
    PORTABILITY: 'portability',
    ERASURE: 'erasure',
    RECTIFICATION: 'rectification',
  },

  GDPRRequestStatus: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    REJECTED: 'rejected',
  },

  SecurityEventType: {
    LOGIN_SUCCESS: 'login_success',
    LOGIN_FAILURE: 'login_failure',
    PASSWORD_CHANGE: 'password_change',
    EMAIL_CHANGE: 'email_change',
    CONSENT_WITHDRAWN: 'consent_withdrawn',
    DATA_EXPORT: 'data_export',
    DATA_ERASURE_REQUEST: 'data_erasure_request',
  },

  SecurityEventSeverity: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
  },

  ProcessingActivityType: {
    USER_REGISTRATION: 'user_registration',
    FOOD_LOGGING: 'food_logging',
    GOAL_TRACKING: 'goal_tracking',
    CONSENT_MANAGEMENT: 'consent_management',
    DATA_EXPORT: 'data_export',
    DATA_ERASURE: 'data_erasure',
  },

  LegalBasis: {
    CONSENT: 'consent',
    CONTRACT: 'contract',
    LEGAL_OBLIGATION: 'legal_obligation',
    VITAL_INTERESTS: 'vital_interests',
    PUBLIC_TASK: 'public_task',
    LEGITIMATE_INTERESTS: 'legitimate_interests',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if two enums have matching keys and values
 */
function enumsMatch(frontendEnum: Record<string, string>, backendEnum: Record<string, string>): boolean {
  const frontendKeys = Object.keys(frontendEnum);
  const backendKeys = Object.keys(backendEnum);

  // Check for same number of keys
  if (frontendKeys.length !== backendKeys.length) {
    return false;
  }

  // Check for matching keys
  for (const key of frontendKeys) {
    if (!(key in backendEnum)) {
      return false;
    }

    // Check for matching values
    if (frontendEnum[key] !== backendEnum[key]) {
      return false;
    }
  }

  // Check that backend doesn't have extra keys
  for (const key of backendKeys) {
    if (!(key in frontendEnum)) {
      return false;
    }
  }

  return true;
}

// ============================================================================
// Tests
// ============================================================================

describe('Contract Parity: FrontEnd vs BackEnd Enums', () => {
  describe('GoalType', () => {
    test('should match backend GoalType enum exactly', () => {
      expect(enumsMatch(GoalType, BACKEND_ENUMS.GoalType)).toBe(true);
    });

    test('should have DAILY_CALORIES with correct value', () => {
      expect(GoalType.DAILY_CALORIES).toBe(BACKEND_ENUMS.GoalType.DAILY_CALORIES);
    });
  });

  describe('MealType', () => {
    test('should match backend MealType enum exactly', () => {
      expect(enumsMatch(MealType, BACKEND_ENUMS.MealType)).toBe(true);
    });

    test('should have all required meal types', () => {
      expect(MealType.BREAKFAST).toBe(BACKEND_ENUMS.MealType.BREAKFAST);
      expect(MealType.LUNCH).toBe(BACKEND_ENUMS.MealType.LUNCH);
      expect(MealType.DINNER).toBe(BACKEND_ENUMS.MealType.DINNER);
      expect(MealType.SNACK).toBe(BACKEND_ENUMS.MealType.SNACK);
    });
  });

  describe('ConsentType', () => {
    test('should match backend ConsentType enum exactly', () => {
      expect(enumsMatch(ConsentType, BACKEND_ENUMS.ConsentType)).toBe(true);
    });

    test('should have all required consent types', () => {
      expect(ConsentType.PRIVACY_POLICY).toBe(BACKEND_ENUMS.ConsentType.PRIVACY_POLICY);
      expect(ConsentType.TERMS_OF_SERVICE).toBe(BACKEND_ENUMS.ConsentType.TERMS_OF_SERVICE);
      expect(ConsentType.ANALYTICS).toBe(BACKEND_ENUMS.ConsentType.ANALYTICS);
      expect(ConsentType.MARKETING).toBe(BACKEND_ENUMS.ConsentType.MARKETING);
    });
  });

  describe('GDPRRequestType', () => {
    test('should match backend GDPRRequestType enum exactly', () => {
      expect(enumsMatch(GDPRRequestType, BACKEND_ENUMS.GDPRRequestType)).toBe(true);
    });

    test('should have all required GDPR request types', () => {
      expect(GDPRRequestType.ACCESS).toBe(BACKEND_ENUMS.GDPRRequestType.ACCESS);
      expect(GDPRRequestType.PORTABILITY).toBe(BACKEND_ENUMS.GDPRRequestType.PORTABILITY);
      expect(GDPRRequestType.ERASURE).toBe(BACKEND_ENUMS.GDPRRequestType.ERASURE);
      expect(GDPRRequestType.RECTIFICATION).toBe(BACKEND_ENUMS.GDPRRequestType.RECTIFICATION);
    });
  });

  describe('GDPRRequestStatus', () => {
    test('should match backend GDPRRequestStatus enum exactly', () => {
      expect(enumsMatch(GDPRRequestStatus, BACKEND_ENUMS.GDPRRequestStatus)).toBe(true);
    });

    test('should have all required GDPR request statuses', () => {
      expect(GDPRRequestStatus.PENDING).toBe(BACKEND_ENUMS.GDPRRequestStatus.PENDING);
      expect(GDPRRequestStatus.PROCESSING).toBe(BACKEND_ENUMS.GDPRRequestStatus.PROCESSING);
      expect(GDPRRequestStatus.COMPLETED).toBe(BACKEND_ENUMS.GDPRRequestStatus.COMPLETED);
      expect(GDPRRequestStatus.REJECTED).toBe(BACKEND_ENUMS.GDPRRequestStatus.REJECTED);
    });
  });

  describe('SecurityEventType', () => {
    test('should match backend SecurityEventType enum exactly', () => {
      expect(enumsMatch(SecurityEventType, BACKEND_ENUMS.SecurityEventType)).toBe(true);
    });

    test('should have all required security event types', () => {
      expect(SecurityEventType.LOGIN_SUCCESS).toBe(BACKEND_ENUMS.SecurityEventType.LOGIN_SUCCESS);
      expect(SecurityEventType.LOGIN_FAILURE).toBe(BACKEND_ENUMS.SecurityEventType.LOGIN_FAILURE);
      expect(SecurityEventType.PASSWORD_CHANGE).toBe(BACKEND_ENUMS.SecurityEventType.PASSWORD_CHANGE);
      expect(SecurityEventType.EMAIL_CHANGE).toBe(BACKEND_ENUMS.SecurityEventType.EMAIL_CHANGE);
      expect(SecurityEventType.CONSENT_WITHDRAWN).toBe(BACKEND_ENUMS.SecurityEventType.CONSENT_WITHDRAWN);
      expect(SecurityEventType.DATA_EXPORT).toBe(BACKEND_ENUMS.SecurityEventType.DATA_EXPORT);
      expect(SecurityEventType.DATA_ERASURE_REQUEST).toBe(BACKEND_ENUMS.SecurityEventType.DATA_ERASURE_REQUEST);
    });
  });

  describe('SecurityEventSeverity', () => {
    test('should match backend SecurityEventSeverity enum exactly', () => {
      expect(enumsMatch(SecurityEventSeverity, BACKEND_ENUMS.SecurityEventSeverity)).toBe(true);
    });

    test('should have all required severity levels', () => {
      expect(SecurityEventSeverity.LOW).toBe(BACKEND_ENUMS.SecurityEventSeverity.LOW);
      expect(SecurityEventSeverity.MEDIUM).toBe(BACKEND_ENUMS.SecurityEventSeverity.MEDIUM);
      expect(SecurityEventSeverity.HIGH).toBe(BACKEND_ENUMS.SecurityEventSeverity.HIGH);
      expect(SecurityEventSeverity.CRITICAL).toBe(BACKEND_ENUMS.SecurityEventSeverity.CRITICAL);
    });
  });

  describe('ProcessingActivityType', () => {
    test('should match backend ProcessingActivityType enum exactly', () => {
      expect(enumsMatch(ProcessingActivityType, BACKEND_ENUMS.ProcessingActivityType)).toBe(true);
    });

    test('should have all required activity types', () => {
      expect(ProcessingActivityType.USER_REGISTRATION).toBe(BACKEND_ENUMS.ProcessingActivityType.USER_REGISTRATION);
      expect(ProcessingActivityType.FOOD_LOGGING).toBe(BACKEND_ENUMS.ProcessingActivityType.FOOD_LOGGING);
      expect(ProcessingActivityType.GOAL_TRACKING).toBe(BACKEND_ENUMS.ProcessingActivityType.GOAL_TRACKING);
      expect(ProcessingActivityType.CONSENT_MANAGEMENT).toBe(BACKEND_ENUMS.ProcessingActivityType.CONSENT_MANAGEMENT);
      expect(ProcessingActivityType.DATA_EXPORT).toBe(BACKEND_ENUMS.ProcessingActivityType.DATA_EXPORT);
      expect(ProcessingActivityType.DATA_ERASURE).toBe(BACKEND_ENUMS.ProcessingActivityType.DATA_ERASURE);
    });
  });

  describe('LegalBasis', () => {
    test('should match backend LegalBasis enum exactly', () => {
      expect(enumsMatch(LegalBasis, BACKEND_ENUMS.LegalBasis)).toBe(true);
    });

    test('should have all required legal bases', () => {
      expect(LegalBasis.CONSENT).toBe(BACKEND_ENUMS.LegalBasis.CONSENT);
      expect(LegalBasis.CONTRACT).toBe(BACKEND_ENUMS.LegalBasis.CONTRACT);
      expect(LegalBasis.LEGAL_OBLIGATION).toBe(BACKEND_ENUMS.LegalBasis.LEGAL_OBLIGATION);
      expect(LegalBasis.VITAL_INTERESTS).toBe(BACKEND_ENUMS.LegalBasis.VITAL_INTERESTS);
      expect(LegalBasis.PUBLIC_TASK).toBe(BACKEND_ENUMS.LegalBasis.PUBLIC_TASK);
      expect(LegalBasis.LEGITIMATE_INTERESTS).toBe(BACKEND_ENUMS.LegalBasis.LEGITIMATE_INTERESTS);
    });
  });
});
