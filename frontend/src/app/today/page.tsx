'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, CardHeader, CardBody, Alert } from '../../shared/components';
import { Layout, Header, Navigation } from '../../shared/layout';
import { useAuth } from '../../core/auth';
import { logsService, goalsService } from '../../core/api/services';
import { RouteGuard } from '../../core/auth/routeGuard';
import type { FoodLog, Goal } from '../../core/contracts/types';
import { MealType, GoalType } from '../../core/contracts/enums';
import { useOfflineQueue } from '../../core/contexts/OfflineQueueContext';
import { OfflineQueueIndicator } from '../../components/offline/OfflineQueueIndicator';

export default function TodayPage() {
  const { user } = useAuth();
  const { isOnline, isSyncing, counts, sync } = useOfflineQueue();
  const [todayLogs, setTodayLogs] = useState<Record<MealType, FoodLog[]>>({
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  });
  const [goals, setGoals] = useState<Goal[]>([]);
  const [totalCalories, setTotalCalories] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTodayData();
  }, [user?.id]);

  const loadTodayData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Load today's logs
      const todayLogs = await logsService.getTodayLogs(user.id);
      setTodayLogs(todayLogs);
      const total = Object.values(todayLogs).flat().reduce(
        (sum, log) => sum + log.nutrition.calories,
        0
      );
      setTotalCalories(total);

      // Load active goals
      const goalsResponse = await goalsService.getGoals({
        userId: user.id,
        isActive: true,
        goalType: GoalType.DAILY_CALORIES,
      });
      if (goalsResponse.success) {
        setGoals(goalsResponse.data);
      }
    } catch (err: any) {
      console.error('Failed to load today data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const dailyGoal = goals.find(g => g.goalType === 'daily_calories');
  const targetCalories = dailyGoal?.targetValue || 2000;
  const remainingCalories = targetCalories - totalCalories;
  const progress = Math.min((totalCalories / targetCalories) * 100, 100);

  const mealIcons: Record<MealType, string> = {
    breakfast: '☀️',
    lunch: '🍽️',
    dinner: '🌙',
    snack: '🍎',
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
            title="Today"
            subtitle={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          />

          {/* Offline & Sync Status */}
          <div className="mb-4">
            <OfflineQueueIndicator />
            {!isOnline && (
              <Alert type="warning" className="mt-2">
                📴 You're offline. Changes will sync when back online.
              </Alert>
            )}
            {isSyncing && (
              <div className="flex items-center gap-2 text-sm text-primary-600 mt-2">
                <div className="animate-spin h-4 w-4 border-2 border-primary-300 border-t-primary-600 rounded-full" />
                Syncing offline changes...
              </div>
            )}
          </div>

          {error && (
            <Alert type="danger" className="mb-6">
              {error}
            </Alert>
          )}

          {/* Calories Overview */}
          <Card className="mb-6">
            <CardBody>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-600">Calories today</span>
                  <span className="text-sm text-neutral-600">
                    {totalCalories} / {targetCalories}
                  </span>
                </div>
                <div className="h-3 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-neutral-900">{totalCalories}</div>
                  <div className="text-xs text-neutral-600">Consumed</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${remainingCalories >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                    {remainingCalories}
                  </div>
                  <div className="text-xs text-neutral-600">Remaining</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary-600">{Math.round(progress)}%</div>
                  <div className="text-xs text-neutral-600">Progress</div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Link href="/log">
              <Button size="lg" isFullWidth>
                <span className="text-xl mr-2">+</span> Log Food
              </Button>
            </Link>
            <Link href="/history">
              <Button size="lg" variant="outline" isFullWidth>
                View History
              </Button>
            </Link>
          </div>

          {/* Meals */}
          {(Object.keys(mealIcons) as MealType[]).map((mealType) => {
            const logs = todayLogs[mealType];
            const mealCalories = logs.reduce((sum, log) => sum + log.nutrition.calories, 0);
            const itemCount = logs.length;

            return (
              <Card key={mealType} className="mb-4">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{mealIcons[mealType]}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900 capitalize">
                          {mealType}
                        </h3>
                        {itemCount > 0 && (
                          <p className="text-xs text-neutral-500">
                            {itemCount} item{itemCount !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-neutral-900">
                        {mealCalories} cal
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  {logs.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-neutral-500 mb-3">
                        No {mealType} logged yet
                      </p>
                      <Link href="/log">
                        <Button size="sm" variant="outline">
                          + Add Food
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {logs.map((log, index) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between py-3 px-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-semibold">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-neutral-900 truncate">
                                {log.foodName}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-neutral-500">
                                <span>{log.quantity} {log.unit}</span>
                                {log.brandName && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate">{log.brandName}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-3">
                            <div className="text-sm font-semibold text-primary-600">
                              {log.nutrition.calories} cal
                            </div>
                            <div className="text-xs text-neutral-500">
                              P: {log.nutrition.protein || 0}g
                            </div>
                          </div>
                        </div>
                      ))}
                      <Link href="/log" className="block mt-3">
                        <Button size="sm" variant="outline" isFullWidth>
                          + Add More to {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}

          {/* Empty State */}
          {Object.values(todayLogs).every(logs => logs.length === 0) && (
            <Card>
              <CardBody className="py-12 text-center">
                <div className="text-6xl mb-4">🥗</div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                  No meals logged today
                </h3>
                <p className="text-sm text-neutral-600 mb-6">
                  Start tracking your nutrition by logging your first meal
                </p>
                <Link href="/log">
                  <Button size="lg">Log Your First Meal</Button>
                </Link>
              </CardBody>
            </Card>
          )}
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
          activePath="/today"
        />
      </Layout>
    </RouteGuard>
  );
}
