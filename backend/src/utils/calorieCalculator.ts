/**
 * Calorie Calculator Service
 * Provides TDEE (Total Daily Energy Expenditure) and BMR (Basal Metabolic Rate) calculations
 * Uses the Mifflin-St Jeor Equation
 */

// ==================== Types ====================

export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export interface UserProfile {
  gender: Gender;
  age: number; // years
  weight: number; // kg
  height: number; // cm
  activityLevel: ActivityLevel;
}

export interface CalorieResult {
  bmr: number; // Basal Metabolic Rate (kcal/day)
  tdee: number; // Total Daily Energy Expenditure (kcal/day)
  targetCalories: {
    maintain: number;
    lose_0_5kg: number;
    lose_1kg: number;
    gain_0_5kg: number;
    gain_1kg: number;
  };
}

// ==================== Constants ====================

// Activity level multipliers
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,    // Little or no exercise
  light: 1.375,      // Light exercise 1-3 days/week
  moderate: 1.55,    // Moderate exercise 3-5 days/week
  active: 1.725,     // Hard exercise 6-7 days/week
  very_active: 1.9,  // Very hard exercise, physical job
};

// Calorie adjustments for weight goals (per week)
const CALORIE_ADJUSTMENTS = {
  lose_0_5kg: -500,  // Lose 0.5kg per week
  lose_1kg: -1000,   // Lose 1kg per week
  gain_0_5kg: 500,   // Gain 0.5kg per week
  gain_1kg: 1000,    // Gain 1kg per week
};

// ==================== BMR Calculation ====================

/**
 * Calculate BMR using Mifflin-St Jeor Equation
 * @param profile - User profile with gender, age, weight, height
 * @returns BMR in kcal/day
 * 
 * Formula:
 * - Men: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) + 5
 * - Women: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) - 161
 */
export function calculateBMR(profile: UserProfile): number {
  const { gender, age, weight, height } = profile;
  
  // Base calculation: 10 × weight + 6.25 × height - 5 × age
  const baseBMR = (10 * weight) + (6.25 * height) - (5 * age);
  
  // Gender adjustment
  return gender === 'male' ? baseBMR + 5 : baseBMR - 161;
}

// ==================== TDEE Calculation ====================

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 * @param profile - User profile with activity level
 * @param bmr - Basal Metabolic Rate (optional, will calculate if not provided)
 * @returns TDEE in kcal/day
 */
export function calculateTDEE(profile: UserProfile, bmr?: number): number {
  const baseBMR = bmr ?? calculateBMR(profile);
  const multiplier = ACTIVITY_MULTIPLIERS[profile.activityLevel];
  return Math.round(baseBMR * multiplier);
}

// ==================== Complete Calorie Calculation ====================

/**
 * Calculate complete calorie breakdown including targets for different goals
 * @param profile - Complete user profile
 * @returns Object containing BMR, TDEE, and target calories for various goals
 */
export function calculateCalories(profile: UserProfile): CalorieResult {
  const bmr = calculateBMR(profile);
  const tdee = calculateTDEE(profile, bmr);
  
  // Calculate target calories for different weight goals
  const targetCalories = {
    maintain: tdee,
    lose_0_5kg: Math.max(1200, tdee + CALORIE_ADJUSTMENTS.lose_0_5kg), // Min 1200 kcal
    lose_1kg: Math.max(1200, tdee + CALORIE_ADJUSTMENTS.lose_1kg),
    gain_0_5kg: tdee + CALORIE_ADJUSTMENTS.gain_0_5kg,
    gain_1kg: tdee + CALORIE_ADJUSTMENTS.gain_1kg,
  };
  
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories,
  };
}

// ==================== Utility Functions ====================

/**
 * Get activity level display name
 * @param level - Activity level key
 * @returns Human-readable activity level
 */
export function getActivityLevelName(level: ActivityLevel): string {
  const names: Record<ActivityLevel, string> = {
    sedentary: 'Sedentary (little or no exercise)',
    light: 'Lightly Active (exercise 1-3 days/week)',
    moderate: 'Moderately Active (exercise 3-5 days/week)',
    active: 'Active (hard exercise 6-7 days/week)',
    very_active: 'Very Active (very hard exercise/physical job)',
  };
  return names[level];
}

/**
 * Get activity level from string (case-insensitive)
 * @param value - Activity level string
 * @returns ActivityLevel enum value or undefined
 */
export function parseActivityLevel(value: string): ActivityLevel | undefined {
  const normalized = value.toLowerCase().replace(/[_\s-]/g, '_');
  const mapping: Record<string, ActivityLevel> = {
    sedentary: 'sedentary',
    light: 'light',
    lightly_active: 'light',
    moderate: 'moderate',
    moderately_active: 'moderate',
    active: 'active',
    very_active: 'very_active',
  };
  return mapping[normalized];
}

/**
 * Estimate TDEE based on typical day (quick estimation without full profile)
 * @param currentCalories - Current daily calorie intake
 * @param goal - Weight goal ('lose', 'maintain', 'gain')
 * @returns Estimated target calories
 */
export function estimateTargetCalories(currentCalories: number, goal: 'lose' | 'maintain' | 'gain'): number {
  const adjustments = {
    lose: -500,
    maintain: 0,
    gain: 500,
  };
  return Math.round(currentCalories + adjustments[goal]);
}
