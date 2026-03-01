/**
 * Unit Conversion Utilities
 * Provides conversion functions for weight, volume, and energy units
 */

// Conversion constants
const LBS_PER_KG = 2.20462;
const OZ_PER_G = 0.035274;
const ML_PER_L = 1000;
const FL_OZ_PER_ML = 0.033814;
const CUPS_PER_ML = 0.00422675;
const TBSP_PER_ML = 0.067628;
const TSP_PER_ML = 0.202884;
const KJ_PER_KCAL = 4.184;

// ==================== Weight Conversions ====================

/**
 * Convert kilograms to pounds
 * @param kg - Weight in kilograms
 * @returns Weight in pounds
 */
export function kgToLb(kg: number): number {
  return kg * LBS_PER_KG;
}

/**
 * Convert pounds to kilograms
 * @param lb - Weight in pounds
 * @returns Weight in kilograms
 */
export function lbToKg(lb: number): number {
  return lb / LBS_PER_KG;
}

/**
 * Convert grams to ounces
 * @param g - Weight in grams
 * @returns Weight in ounces
 */
export function gToOz(g: number): number {
  return g * OZ_PER_G;
}

/**
 * Convert ounces to grams
 * @param oz - Weight in ounces
 * @returns Weight in grams
 */
export function ozToG(oz: number): number {
  return oz / OZ_PER_G;
}

// ==================== Volume Conversions ====================

/**
 * Convert liters to milliliters
 * @param l - Volume in liters
 * @returns Volume in milliliters
 */
export function lToMl(l: number): number {
  return l * ML_PER_L;
}

/**
 * Convert milliliters to liters
 * @param ml - Volume in milliliters
 * @returns Volume in liters
 */
export function mlToL(ml: number): number {
  return ml / ML_PER_L;
}

/**
 * Convert liters to fluid ounces
 * @param l - Volume in liters
 * @returns Volume in fluid ounces
 */
export function lToFlOz(l: number): number {
  return l * ML_PER_L * FL_OZ_PER_ML;
}

/**
 * Convert fluid ounces to liters
 * @param flOz - Volume in fluid ounces
 * @returns Volume in liters
 */
export function flOzToL(flOz: number): number {
  return (flOz / FL_OZ_PER_ML) / ML_PER_L;
}

/**
 * Convert milliliters to fluid ounces
 * @param ml - Volume in milliliters
 * @returns Volume in fluid ounces
 */
export function mlToFlOz(ml: number): number {
  return ml * FL_OZ_PER_ML;
}

/**
 * Convert fluid ounces to milliliters
 * @param flOz - Volume in fluid ounces
 * @returns Volume in milliliters
 */
export function flOzToMl(flOz: number): number {
  return flOz / FL_OZ_PER_ML;
}

/**
 * Convert milliliters to cups
 * @param ml - Volume in milliliters
 * @returns Volume in cups
 */
export function mlToCup(ml: number): number {
  return ml * CUPS_PER_ML;
}

/**
 * Convert cups to milliliters
 * @param cups - Volume in cups
 * @returns Volume in milliliters
 */
export function cupToMl(cups: number): number {
  return cups / CUPS_PER_ML;
}

/**
 * Convert milliliters to tablespoons
 * @param ml - Volume in milliliters
 * @returns Volume in tablespoons
 */
export function mlToTbsp(ml: number): number {
  return ml * TBSP_PER_ML;
}

/**
 * Convert tablespoons to milliliters
 * @param tbsp - Volume in tablespoons
 * @returns Volume in milliliters
 */
export function tbspToMl(tbsp: number): number {
  return tbsp / TBSP_PER_ML;
}

/**
 * Convert milliliters to teaspoons
 * @param ml - Volume in milliliters
 * @returns Volume in teaspoons
 */
export function mlToTsp(ml: number): number {
  return ml * TSP_PER_ML;
}

/**
 * Convert teaspoons to milliliters
 * @param tsp - Volume in teaspoons
 * @returns Volume in milliliters
 */
export function tspToMl(tsp: number): number {
  return tsp / TSP_PER_ML;
}

// ==================== Energy Conversions ====================

/**
 * Convert kilocalories to kilojoules
 * @param kcal - Energy in kilocalories
 * @returns Energy in kilojoules
 */
export function kcalToKj(kcal: number): number {
  return kcal * KJ_PER_KCAL;
}

/**
 * Convert kilojoules to kilocalories
 * @param kj - Energy in kilojoules
 * @returns Energy in kilocalories
 */
export function kjToKcal(kj: number): number {
  return kj / KJ_PER_KCAL;
}
