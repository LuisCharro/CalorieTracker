'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, CardHeader, CardBody, Alert } from '../../shared/components';
import { Layout, Header, Navigation } from '../../shared/layout';
import { useAuth } from '../../core/auth';
import { logsService } from '../../core/api/services';
import { RouteGuard } from '../../core/auth/routeGuard';
import { MealType } from '../../core/contracts/enums';

export default function LogPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [foodText, setFoodText] = useState('');
  const [selectedMeal, setSelectedMeal] = useState<MealType>(MealType.LUNCH);
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedNutrition, setParsedNutrition] = useState<any | null>(null);
  const [error, setError] = useState('');

  const mealTypes = [
    { value: 'breakfast', label: 'Breakfast', icon: '☀️' },
    { value: 'lunch', label: 'Lunch', icon: '🍽️' },
    { value: 'dinner', label: 'Dinner', icon: '🌙' },
    { value: 'snack', label: 'Snack', icon: '🍎' },
  ];

  const handleFoodTextChange = async (value: string) => {
    setFoodText(value);
    setError('');

    // Parse food text when user stops typing (debounced)
    if (value.trim().length > 3) {
      setIsParsing(true);
      try {
        const parsed = await logsService.parseFoodText(value);
        setParsedNutrition(parsed.nutrition);
      } catch (error) {
        // Parsing failed, clear the parsed nutrition
        setParsedNutrition(null);
      } finally {
        setIsParsing(false);
      }
    } else {
      setParsedNutrition(null);
    }
  };

  const handleLogFood = async () => {
    if (!foodText.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      // Parse food text to get nutrition
      let nutrition;
      try {
        const parsed = await logsService.parseFoodText(foodText);
        nutrition = parsed.nutrition;
      } catch (parseError) {
        // If parsing fails, show an error
        throw new Error('Could not parse food description. Try format like "100g chicken" or "2 slices bread"');
      }

      await logsService.createLog({
        userId: user!.id,
        foodName: foodText,
        quantity: 1,
        unit: 'serving',
        mealType: selectedMeal,
        nutrition,
        loggedAt: new Date().toISOString(),
      });

      // Reset form
      setFoodText('');
      setParsedNutrition(null);

      // Show success and redirect to today
      router.push('/today');
    } catch (error) {
      console.error('Failed to log food:', error);
      setError(error instanceof Error ? error.message : 'Failed to log food. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RouteGuard requireAuth requireOnboardingComplete>
      <Layout maxWidth="lg">
        <div className="min-h-screen pb-24">
          <Header title="Log Food" />

          {error && (
            <Alert type="danger" className="mb-4">
              {error}
            </Alert>
          )}

          <Card>
            <CardBody>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                What did you eat?
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Select meal type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {mealTypes.map((meal) => (
                    <button
                      key={meal.value}
                      type="button"
                      onClick={() => setSelectedMeal(meal.value as MealType)}
                      className={`
                        rounded-lg border-2 p-3 text-center transition-all
                        ${selectedMeal === meal.value
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-neutral-200 hover:border-neutral-300'
                        }
                      `}
                    >
                      <div className="text-2xl mb-1">{meal.icon}</div>
                      <div className="text-xs font-medium">{meal.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Food description
                </label>
                <Input
                  type="text"
                  placeholder="e.g., 100g chicken breast or 2 slices bread"
                  value={foodText}
                  onChange={(e) => handleFoodTextChange(e.target.value)}
                  helperText="Describe your meal with quantity and unit"
                  isFullWidth
                />
                <p className="mt-2 text-xs text-neutral-500">
                  💡 Tip: Use format like "100g chicken", "2 slices bread", or "1 apple"
                </p>
              </div>

              {/* Parsed Nutrition Preview */}
              {parsedNutrition && (
                <div className="mb-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                  <h4 className="text-sm font-medium text-neutral-900 mb-3">Estimated Nutrition</h4>
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div>
                      <div className="text-lg font-bold text-primary-600">{parsedNutrition.calories}</div>
                      <div className="text-xs text-neutral-600">Calories</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-neutral-900">{parsedNutrition.protein}g</div>
                      <div className="text-xs text-neutral-600">Protein</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-neutral-900">{parsedNutrition.carbohydrates}g</div>
                      <div className="text-xs text-neutral-600">Carbs</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-neutral-900">{parsedNutrition.fat}g</div>
                      <div className="text-xs text-neutral-600">Fat</div>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleLogFood}
                isLoading={isLoading || isParsing}
                isFullWidth
                size="lg"
                disabled={!foodText.trim()}
              >
                {isParsing ? 'Parsing...' : 'Log Food'}
              </Button>
            </CardBody>
          </Card>

          {/* Quick Add Section */}
          <Card className="mt-6">
            <CardHeader>
              <h3 className="text-lg font-semibold text-neutral-900">
                Quick Add
              </h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {['100g chicken breast', '200g brown rice', '1 large apple', '150g greek yogurt'].map((food, index) => (
                  <button
                    key={index}
                    onClick={() => handleFoodTextChange(food)}
                    className="w-full rounded-lg border border-neutral-200 p-3 text-left hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-900">{food}</span>
                      <svg className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Bottom Navigation */}
        <Navigation
          items={[
            { label: 'Today', href: '/today', icon: (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )},
            { label: 'Log', href: '/log', icon: (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )},
            { label: 'History', href: '/history', icon: (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )},
            { label: 'Settings', href: '/settings/profile', icon: (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )},
          ]}
          activePath="/log"
        />
      </Layout>
    </RouteGuard>
  );
}
