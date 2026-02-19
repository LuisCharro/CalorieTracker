'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardHeader, CardBody, Alert } from '../../../shared/components';
import { Layout, Header } from '../../../shared/layout';
import { useAuth } from '../../../core/auth';
import { authService } from '../../../core/api/services';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export default function OnboardingPreferencesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<Record<string, string>>({
    diet: 'omnivore',
    meals: JSON.stringify(['breakfast', 'lunch', 'dinner']),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const dietOptions = [
    { value: 'omnivore', label: 'Omnivore', icon: '🍽️' },
    { value: 'vegetarian', label: 'Vegetarian', icon: '🥬' },
    { value: 'vegan', label: 'Vegan', icon: '🌱' },
    { value: 'keto', label: 'Keto', icon: '🥑' },
    { value: 'paleo', label: 'Paleo', icon: '🥩' },
  ];

  const mealOptions = [
    { value: 'breakfast', label: 'Breakfast', icon: '☀️' },
    { value: 'lunch', label: 'Lunch', icon: '🍽️' },
    { value: 'dinner', label: 'Dinner', icon: '🌙' },
    { value: 'snack', label: 'Snacks', icon: '🍎' },
  ];

  const handleMealToggle = (meal: MealType) => {
    const currentMeals = JSON.parse(preferences.meals) as MealType[];
    const updatedMeals = currentMeals.includes(meal)
      ? currentMeals.filter(m => m !== meal)
      : [...currentMeals, meal];
    setPreferences(prev => ({ ...prev, meals: JSON.stringify(updatedMeals) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!user?.id) throw new Error('User not found. Please log in again.');

      await authService.updateCurrentUser({
        preferences: preferences,
      });

      router.push('/onboarding/consents');
    } catch (err: any) {
      console.error('Failed to save preferences:', err);
      setError(err.message || 'Failed to save preferences. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout maxWidth="lg">
      <div className="min-h-screen pb-24">
        <Header
          title="Step 2 of 3: Your Preferences"
          subtitle="Customize your tracking experience"
        />

        {error && (
          <Alert type="danger" className="mb-6">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardBody>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                What's your eating style?
              </h3>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {dietOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPreferences(prev => ({ ...prev, diet: option.value }))}
                    className={`
                      relative rounded-lg border-2 p-4 text-left transition-all
                      ${preferences.diet === option.value
                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500 ring-offset-2'
                        : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                      }
                    `}
                  >
                    <div className="text-2xl mb-2">{option.icon}</div>
                    <div className="font-medium text-neutral-900">{option.label}</div>
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Which meals do you track?
              </h3>
              <p className="text-sm text-neutral-600 mb-4">
                Select the meal types you want to track. You can change this later.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                {mealOptions.map((option) => {
                  const isSelected = (JSON.parse(preferences.meals) as MealType[]).includes(option.value as MealType);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleMealToggle(option.value as MealType)}
                      className={`
                        relative rounded-lg border-2 p-4 text-left transition-all
                        ${isSelected
                          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500 ring-offset-2'
                          : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{option.icon}</span>
                          <span className="font-medium text-neutral-900">{option.label}</span>
                        </div>
                        {isSelected && (
                          <svg className="h-5 w-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Timezone
                </label>
                <input
                  type="text"
                  value={preferences.timezone}
                  readOnly
                  className="block w-full rounded-lg border border-neutral-300 bg-neutral-100 px-4 py-2 text-neutral-500"
                />
                <p className="mt-1 text-sm text-neutral-500">
                  Automatically detected from your device
                </p>
              </div>

              <div className="mt-6 flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/onboarding/goals')}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  isLoading={isLoading}
                  size="lg"
                >
                  Continue
                </Button>
              </div>
            </CardBody>
          </Card>
        </form>
      </div>
    </Layout>
  );
}
