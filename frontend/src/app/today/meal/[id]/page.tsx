'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Card, CardBody, Alert } from '../../../../shared/components';
import { Layout, Header } from '../../../../shared/layout';
import { useAuth } from '../../../../core/auth';
import { logsService } from '../../../../core/api/services';
import { RouteGuard } from '../../../../core/auth/routeGuard';
import { MealType } from '../../../../core/contracts/enums';
import { FoodLog } from '../../../../core/contracts/types';

function MealDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const mealTypeParam = searchParams.get('mealType') || 'lunch';
  const mealType = mealTypeParam.toUpperCase() as MealType;

  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      if (!user?.id) return;

      try {
        const response = await logsService.getLogs({
          userId: user.id,
          startDate: date,
          endDate: date,
          mealType,
        });

        if (response.success) {
          setLogs(response.data);
        }
      } catch (err: any) {
        console.error('Failed to load logs:', err);
        setError(err.message || 'Failed to load meal');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [user?.id, date, mealType]);

  const mealLabels: Record<MealType, string> = {
    [MealType.BREAKFAST]: 'Breakfast',
    [MealType.LUNCH]: 'Lunch',
    [MealType.DINNER]: 'Dinner',
    [MealType.SNACK]: 'Snack',
  };

  const mealIcons: Record<MealType, string> = {
    [MealType.BREAKFAST]: '☀️',
    [MealType.LUNCH]: '🍽️',
    [MealType.DINNER]: '🌙',
    [MealType.SNACK]: '🍎',
  };

  const totalCalories = logs.reduce((sum, log) => sum + log.nutrition.calories, 0);
  const totalProtein = logs.reduce((sum, log) => sum + (log.nutrition.protein || 0), 0);
  const totalCarbs = logs.reduce((sum, log) => sum + (log.nutrition.carbohydrates || 0), 0);
  const totalFat = logs.reduce((sum, log) => sum + (log.nutrition.fat || 0), 0);

  const handleDeleteLog = async (logId: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      await logsService.deleteLog(logId);
      setLogs(logs.filter(log => log.id !== logId));
    } catch (err) {
      console.error('Failed to delete log:', err);
      alert('Failed to delete entry');
    }
  };

  if (isLoading) {
    return (
      <Layout maxWidth="lg">
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-neutral-200 border-t-primary-500 rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <RouteGuard requireAuth requireOnboardingComplete>
      <Layout maxWidth="lg">
        <div className="min-h-screen pb-24">
          <Header
            title={`${mealIcons[mealType]} ${mealLabels[mealType]}`}
            subtitle={new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            showBackButton
            onBack={() => router.push('/today')}
          />

          {error && (
            <Alert type="danger" className="mb-6">
              {error}
            </Alert>
          )}

          <Card className="mb-6">
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-900">Nutrition Summary</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/log')}
                >
                  + Add Food
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="bg-neutral-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-primary-600">{totalCalories}</div>
                  <div className="text-xs text-neutral-500">Calories</div>
                </div>
                <div className="bg-neutral-50 rounded-lg p-3">
                  <div className="text-lg font-semibold">{totalProtein}g</div>
                  <div className="text-xs text-neutral-500">Protein</div>
                </div>
                <div className="bg-neutral-50 rounded-lg p-3">
                  <div className="text-lg font-semibold">{totalCarbs}g</div>
                  <div className="text-xs text-neutral-500">Carbs</div>
                </div>
                <div className="bg-neutral-50 rounded-lg p-3">
                  <div className="text-lg font-semibold">{totalFat}g</div>
                  <div className="text-xs text-neutral-500">Fat</div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Food Entries</h3>
              {logs.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <p>No food logged for this meal yet.</p>
                  <Button
                    variant="ghost"
                    onClick={() => router.push('/log')}
                    className="mt-2"
                  >
                    Log some food
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-neutral-900">{log.foodName}</div>
                        {log.brandName && (
                          <div className="text-sm text-neutral-500">{log.brandName}</div>
                        )}
                        <div className="text-xs text-neutral-400 mt-1">
                          {log.quantity} {log.unit}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-semibold text-primary-600">{log.nutrition.calories} cal</div>
                          <div className="text-xs text-neutral-500">
                            P: {log.nutrition.protein || 0}g • C: {log.nutrition.carbohydrates || 0}g • F: {log.nutrition.fat || 0}g
                          </div>
                        </div>
                        <button
                          onClick={() => router.push(`/history/entry/${log.id}`)}
                          className="text-neutral-400 hover:text-primary-600"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          className="text-neutral-400 hover:text-danger-600"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </Layout>
    </RouteGuard>
  );
}

export default function TodayMealPage() {
  return (
    <Suspense fallback={
      <Layout maxWidth="lg">
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-neutral-200 border-t-primary-500 rounded-full" />
        </div>
      </Layout>
    }>
      <MealDetailContent />
    </Suspense>
  );
}
