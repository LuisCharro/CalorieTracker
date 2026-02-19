'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Card, CardBody, Input } from '../../../shared/components';
import { Layout, Header, Navigation } from '../../../shared/layout';
import { useAuth } from '../../../core/auth';
import { logsService } from '../../../core/api/services';
import { RouteGuard } from '../../../core/auth/routeGuard';
import { MealType } from '../../../core/contracts/enums';

function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const foodName = searchParams.get('foodName') || '';
  const calories = parseInt(searchParams.get('calories') || '0', 10);
  const protein = parseInt(searchParams.get('protein') || '0', 10);
  const carbs = parseInt(searchParams.get('carbs') || '0', 10);
  const fat = parseInt(searchParams.get('fat') || '0', 10);

  const [selectedMeal, setSelectedMeal] = useState<MealType>(MealType.LUNCH);
  const [servings, setServings] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const mealTypes = [
    { value: MealType.BREAKFAST, label: 'Breakfast', icon: '☀️' },
    { value: MealType.LUNCH, label: 'Lunch', icon: '🍽️' },
    { value: MealType.DINNER, label: 'Dinner', icon: '🌙' },
    { value: MealType.SNACK, label: 'Snack', icon: '🍎' },
  ];

  const totalCalories = calories * servings;
  const totalProtein = protein * servings;
  const totalCarbs = carbs * servings;
  const totalFat = fat * servings;

  const handleConfirm = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      await logsService.createLog({
        userId: user.id,
        foodName,
        quantity: servings,
        unit: 'serving',
        mealType: selectedMeal,
        nutrition: {
          calories: totalCalories,
          protein: totalProtein,
          carbohydrates: totalCarbs,
          fat: totalFat,
        },
        loggedAt: new Date().toISOString(),
      });

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
    <Layout maxWidth="lg">
      <div className="min-h-screen pb-24">
        <Header title="Confirm Entry" />

        <Card className="mb-6">
          <CardBody>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              {foodName}
            </h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Select meal type
              </label>
              <div className="grid grid-cols-4 gap-2">
                {mealTypes.map((meal) => (
                  <button
                    key={meal.value}
                    type="button"
                    onClick={() => setSelectedMeal(meal.value)}
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

            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Number of servings
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setServings(Math.max(0.5, servings - 0.5))}
                  className="w-10 h-10 rounded-full border-2 border-neutral-300 flex items-center justify-center text-xl font-bold hover:bg-neutral-50"
                >
                  -
                </button>
                <span className="text-2xl font-semibold w-12 text-center">{servings}</span>
                <button
                  type="button"
                  onClick={() => setServings(servings + 0.5)}
                  className="w-10 h-10 rounded-full border-2 border-neutral-300 flex items-center justify-center text-xl font-bold hover:bg-neutral-50"
                >
                  +
                </button>
              </div>
            </div>

            <div className="bg-neutral-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-neutral-900 mb-3">Nutrition Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary-600">{totalCalories}</div>
                  <div className="text-xs text-neutral-500">Calories</div>
                </div>
                <div>
                  <div className="text-lg font-semibold">{totalProtein}g</div>
                  <div className="text-xs text-neutral-500">Protein</div>
                </div>
                <div>
                  <div className="text-lg font-semibold">{totalCarbs}g</div>
                  <div className="text-xs text-neutral-500">Carbs</div>
                </div>
                <div>
                  <div className="text-lg font-semibold">{totalFat}g</div>
                  <div className="text-xs text-neutral-500">Fat</div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleConfirm}
                isLoading={isLoading}
                className="flex-1"
                size="lg"
              >
                Confirm
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      <Navigation
        items={[
          { label: 'Today', href: '/today', icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
          { label: 'Log', href: '/log', icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> },
          { label: 'History', href: '/history', icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
          { label: 'Settings', href: '/settings/profile', icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
        ]}
        activePath="/log"
      />
    </Layout>
  );
}

export default function LogConfirmPage() {
  return (
    <RouteGuard requireAuth requireOnboardingComplete>
      <Suspense fallback={
        <Layout maxWidth="lg">
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-neutral-200 border-t-primary-500 rounded-full" />
          </div>
        </Layout>
      }>
        <ConfirmContent />
      </Suspense>
    </RouteGuard>
  );
}
