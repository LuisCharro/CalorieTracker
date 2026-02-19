/**
 * Nutrition text parser for food logging
 * Parses text input like "100g chicken breast" and extracts nutrition information
 */

export interface ParsedFood {
  quantity: number;
  unit: string;
  foodName: string;
  nutrition: NutritionInfo;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
}

/**
 * Nutrition database for common foods (per 100g)
 * Values are approximate and suitable for MVP
 */
const NUTRITION_DATABASE: Record<string, NutritionInfo> = {
  // Proteins
  'chicken breast': { calories: 165, protein: 31, carbohydrates: 0, fat: 3.6, fiber: 0 },
  'chicken thigh': { calories: 209, protein: 26, carbohydrates: 0, fat: 10.9, fiber: 0 },
  'beef steak': { calories: 271, protein: 26, carbohydrates: 0, fat: 18.5, fiber: 0 },
  'ground beef': { calories: 332, protein: 26, carbohydrates: 0, fat: 23.8, fiber: 0 },
  'salmon': { calories: 208, protein: 20, carbohydrates: 0, fat: 13, fiber: 0 },
  'tuna': { calories: 144, protein: 28, carbohydrates: 0, fat: 1, fiber: 0 },
  'shrimp': { calories: 99, protein: 24, carbohydrates: 0.2, fat: 0.3, fiber: 0 },
  'egg': { calories: 155, protein: 13, carbohydrates: 1.1, fat: 11, fiber: 0 },
  'tofu': { calories: 144, protein: 17, carbohydrates: 3, fat: 9, fiber: 0.3 },

  // Carbohydrates
  'rice': { calories: 130, protein: 2.7, carbohydrates: 28, fat: 0.3, fiber: 0.4 },
  'brown rice': { calories: 112, protein: 2.6, carbohydrates: 24, fat: 0.9, fiber: 1.8 },
  'pasta': { calories: 131, protein: 5, carbohydrates: 25, fat: 1.1, fiber: 1.5 },
  'bread': { calories: 265, protein: 9, carbohydrates: 49, fat: 3.2, fiber: 2.7 },
  'whole wheat bread': { calories: 247, protein: 13, carbohydrates: 41, fat: 3.4, fiber: 6 },
  'potato': { calories: 77, protein: 2, carbohydrates: 17, fat: 0.1, fiber: 2.2 },
  'sweet potato': { calories: 86, protein: 1.6, carbohydrates: 20, fat: 0.1, fiber: 3 },
  'oats': { calories: 389, protein: 16.9, carbohydrates: 66, fat: 6.9, fiber: 10.6 },
  'quinoa': { calories: 120, protein: 4.4, carbohydrates: 21, fat: 1.9, fiber: 2.8 },
  'corn': { calories: 86, protein: 3.4, carbohydrates: 19, fat: 1.5, fiber: 2.4 },

  // Fruits
  'apple': { calories: 52, protein: 0.3, carbohydrates: 14, fat: 0.2, fiber: 2.4 },
  'banana': { calories: 89, protein: 1.1, carbohydrates: 23, fat: 0.3, fiber: 2.6 },
  'orange': { calories: 47, protein: 0.9, carbohydrates: 12, fat: 0.1, fiber: 2.4 },
  'strawberry': { calories: 32, protein: 0.7, carbohydrates: 7.7, fat: 0.3, fiber: 2 },
  'blueberry': { calories: 57, protein: 0.7, carbohydrates: 14, fat: 0.3, fiber: 2.4 },
  'grape': { calories: 69, protein: 0.7, carbohydrates: 18, fat: 0.2, fiber: 0.9 },
  'avocado': { calories: 160, protein: 2, carbohydrates: 8.5, fat: 15, fiber: 6.7 },

  // Vegetables
  'broccoli': { calories: 34, protein: 2.8, carbohydrates: 7, fat: 0.4, fiber: 2.6 },
  'spinach': { calories: 23, protein: 2.9, carbohydrates: 3.6, fat: 0.4, fiber: 2.2 },
  'carrot': { calories: 41, protein: 0.9, carbohydrates: 10, fat: 0.2, fiber: 2.8 },
  'tomato': { calories: 18, protein: 0.9, carbohydrates: 3.9, fat: 0.2, fiber: 1.2 },
  'cucumber': { calories: 16, protein: 0.7, carbohydrates: 3.6, fat: 0.1, fiber: 0.5 },
  'lettuce': { calories: 15, protein: 1.4, carbohydrates: 2.9, fat: 0.2, fiber: 1.3 },
  'cauliflower': { calories: 25, protein: 1.9, carbohydrates: 5, fat: 0.3, fiber: 2 },

  // Dairy
  'milk': { calories: 42, protein: 3.4, carbohydrates: 5, fat: 1, fiber: 0 },
  'cheese': { calories: 402, protein: 25, carbohydrates: 1.3, fat: 33, fiber: 0 },
  'yogurt': { calories: 59, protein: 10, carbohydrates: 3.6, fat: 0.4, fiber: 0 },
  'greek yogurt': { calories: 73, protein: 10, carbohydrates: 4, fat: 0.4, fiber: 0 },

  // Nuts and seeds
  'almonds': { calories: 579, protein: 21, carbohydrates: 22, fat: 50, fiber: 12.5 },
  'walnuts': { calories: 654, protein: 15, carbohydrates: 14, fat: 65, fiber: 6.7 },
  'peanut butter': { calories: 588, protein: 25, carbohydrates: 20, fat: 50, fiber: 6 },
  'chocolate': { calories: 546, protein: 4.9, carbohydrates: 61, fat: 31, fiber: 7.8 },

  // Common prepared foods
  'pizza': { calories: 266, protein: 11, carbohydrates: 33, fat: 10, fiber: 2.3 },
  'hamburger': { calories: 295, protein: 17, carbohydrates: 30, fat: 14, fiber: 1.3 },
  'hot dog': { calories: 290, protein: 11, carbohydrates: 24, fat: 17, fiber: 0.6 },
  'french fries': { calories: 312, protein: 3.4, carbohydrates: 41, fat: 15, fiber: 3.8 },
  'salad': { calories: 33, protein: 2, carbohydrates: 4.4, fat: 1, fiber: 1.6 },
};

/**
 * Default nutrition for unknown foods
 */
const DEFAULT_NUTRITION: NutritionInfo = {
  calories: 100,
  protein: 5,
  carbohydrates: 10,
  fat: 3,
  fiber: 1,
};

/**
 * Common units and their standard sizes in grams
 */
const UNITS: Record<string, number> = {
  g: 1, // grams
  gram: 1,
  grams: 1,
  kg: 1000, // kilograms
  kgm: 1000,
  ml: 1, // milliliters (assuming 1ml = 1g for simplicity)
  milliliter: 1,
  milliliters: 1,
  l: 1000, // liters
  liter: 1000,
  liters: 1000,
  oz: 28.35, // ounces
  ounce: 28.35,
  ounces: 28.35,
  lb: 453.6, // pounds
  pound: 453.6,
  pounds: 453.6,
  cup: 240, // cups (approximate)
  cups: 240,
  tbsp: 15, // tablespoons
  tablespoon: 15,
  tablespoons: 15,
  tsp: 5, // teaspoons
  teaspoon: 5,
  teaspoons: 5,
  slice: 30, // slices (average)
  slices: 30,
  piece: 50, // pieces (average)
  pieces: 50,
  serving: 150, // servings (average)
  servings: 150,
};

/**
 * Parse food text and extract quantity, unit, food name, and nutrition
 * @param text Input text like "100g chicken breast" or "2 slices bread"
 * @returns Parsed food information
 */
export function parseFoodText(text: string): ParsedFood {
  const trimmed = text.trim();

  if (!trimmed) {
    throw new Error(`Cannot parse empty food text`);
  }

  // Try to extract quantity and unit from the beginning
  const quantityRegex = /^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?\s*(.*)/;
  const match = trimmed.match(quantityRegex);

  if (!match) {
    throw new Error(`Could not parse food text: "${text}". Expected format: "100g chicken" or "2 slices bread"`);
  }

  const quantity = parseFloat(match[1]);
  const potentialUnit = match[2];
  const remainingText = match[3].trim();

  if (isNaN(quantity) || quantity <= 0) {
    throw new Error(`Invalid quantity: ${quantity}. Must be a positive number.`);
  }

  // Check if the potential unit is actually a unit or part of the food name
  let unit: string;
  let foodName: string;
  const normalizedPotentialUnit = potentialUnit?.toLowerCase();

  if (potentialUnit && UNITS[normalizedPotentialUnit]) {
    // The potential unit is a real unit
    unit = potentialUnit;
    if (!remainingText) {
      throw new Error(`No food name found in text: "${text}"`);
    }
    foodName = remainingText.toLowerCase();
  } else if (potentialUnit) {
    // The potential unit might be part of the food name (e.g., "apple" in "1 apple")
    unit = 'g';
    if (remainingText) {
      foodName = `${potentialUnit} ${remainingText}`.trim().toLowerCase();
    } else {
      foodName = potentialUnit.toLowerCase();
    }
  } else {
    // No unit specified, default to grams
    unit = 'g';
    if (!remainingText) {
      throw new Error(`No food name found in text: "${text}"`);
    }
    foodName = remainingText.toLowerCase();
  }

  // Normalize unit and get weight in grams
  const normalizedUnit = unit.toLowerCase();
  const unitMultiplier = UNITS[normalizedUnit] || UNITS['g'];
  const weightInGrams = quantity * unitMultiplier;

  // Look up nutrition in database
  const baseNutrition = findNutritionInDatabase(foodName);
  const scaledNutrition = scaleNutrition(baseNutrition, weightInGrams);

  return {
    quantity,
    unit,
    foodName: capitalizeWords(foodName),
    nutrition: {
      calories: Math.round(scaledNutrition.calories),
      protein: Math.round(scaledNutrition.protein * 10) / 10,
      carbohydrates: Math.round(scaledNutrition.carbohydrates * 10) / 10,
      fat: Math.round(scaledNutrition.fat * 10) / 10,
      fiber: Math.round(scaledNutrition.fiber * 10) / 10,
    },
  };
}

/**
 * Find nutrition info in database by matching food name
 * @param foodName Lowercase food name to search for
 * @returns Nutrition info or default if not found
 */
function findNutritionInDatabase(foodName: string): NutritionInfo {
  // Direct match
  if (NUTRITION_DATABASE[foodName]) {
    return NUTRITION_DATABASE[foodName];
  }

  // Partial match - find the food name that contains the search term
  const keys = Object.keys(NUTRITION_DATABASE);
  for (const key of keys) {
    if (foodName.includes(key) || key.includes(foodName)) {
      return NUTRITION_DATABASE[key];
    }
  }

  // Return default nutrition for unknown foods
  return DEFAULT_NUTRITION;
}

/**
 * Scale nutrition values based on weight
 * @param base Base nutrition per 100g
 * @param weightInGrams Actual weight in grams
 * @returns Scaled nutrition values
 */
function scaleNutrition(base: NutritionInfo, weightInGrams: number): NutritionInfo {
  const scale = weightInGrams / 100;
  return {
    calories: base.calories * scale,
    protein: base.protein * scale,
    carbohydrates: base.carbohydrates * scale,
    fat: base.fat * scale,
    fiber: base.fiber * scale,
  };
}

/**
 * Capitalize the first letter of each word
 * @param str Input string
 * @returns Capitalized string
 */
function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Get list of all supported foods
 * @returns Array of food names
 */
export function getSupportedFoods(): string[] {
  return Object.keys(NUTRITION_DATABASE).map(capitalizeWords);
}
