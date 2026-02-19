'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Card, CardHeader, CardBody } from '../../shared/components';
import { Layout, Header, Navigation } from '../../shared/layout';
import { useAuth } from '../../core/auth';
import { logsService } from '../../core/api/services';
import { RouteGuard } from '../../core/auth/routeGuard';
import { MealType } from '../../core/contracts/enums';

export default function LogPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [foodText, setFoodText] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<MealType>(MealType.LUNCH);
  const [isLoading, setIsLoading] = useState(false);

  const mealTypes = [
    { value: 'breakfast', label: 'Breakfast', icon: '☀️' },
    { value: 'lunch', label: 'Lunch', icon: '🍽️' },
    { value: 'dinner', label: 'Dinner', icon: '🌙' },
    { value: 'snack', label: 'Snack', icon: '🍎' },
  ];

  const handleLogFood = async () => {
    if (!foodText.trim()) return;

    setIsLoading(true);
    try {
      // Mock nutrition parsing - in production, this would come from an API
      const nutrition = {
        calories: Math.floor(Math.random() * 500) + 100,
        protein: Math.floor(Math.random() * 30),
        carbs: Math.floor(Math.random() * 50),
        fat: Math.floor(Math.random() * 20),
      };

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
      setSuggestions([]);

      // Show success and redirect to today
      alert('Food logged successfully!');
      router.push('/today');
    } catch (error) {
      console.error('Failed to log food:', error);
      alert('Failed to log food. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RouteGuard requireAuth requireOnboardingComplete>
      <Layout maxWidth="lg">
        <div className="min-h-screen pb-24">
          <Header title="Log Food" />

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
                  placeholder="e.g., Grilled chicken breast with rice"
                  value={foodText}
                  onChange={(e) => setFoodText(e.target.value)}
                  helperText="Describe your meal in plain text"
                  isFullWidth
                />
                <p className="mt-2 text-xs text-neutral-500">
                  💡 Tip: Include details like &quot;grilled&quot;, &quot;with sauce&quot;, or portion size for better tracking
                </p>
              </div>

              <Button
                onClick={handleLogFood}
                isLoading={isLoading}
                isFullWidth
                size="lg"
                disabled={!foodText.trim()}
              >
                Log Food
              </Button>
            </CardBody>
          </Card>

          {/* Quick Add Section */}
          <Card className="mt-6">
            <CardHeader>
              <h3 className="text-lg font-semibold text-neutral-900">
                Recent Foods
              </h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {['Grilled chicken breast', 'Brown rice', 'Green salad', 'Greek yogurt'].map((food, index) => (
                  <button
                    key={index}
                    onClick={() => setFoodText(food)}
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
