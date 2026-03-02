'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, CardHeader, CardBody, Alert, EmptyState, Modal, Input } from '../../shared/components';
import { Layout, Header, Navigation } from '../../shared/layout';
import { useAuth } from '../../core/auth';
import { logsService, goalsService, weightLogsService } from '../../core/api/services';
import type { WeightProgress } from '../../core/api/services/weight-logs.service';
import { RouteGuard } from '../../core/auth/routeGuard';
import type { FoodLog, Goal } from '../../core/contracts/types';
import type { Nutrition } from '../../core/contracts/enums';
import { MealType, GoalType } from '../../core/contracts/enums';
import { useOfflineQueue } from '../../core/contexts/OfflineQueueContext';
import { OfflineQueueIndicator } from '../../components/offline/OfflineQueueIndicator';

interface MealGroup {
  items: FoodLog[];
  itemCount: number;
  totalCalories: number;
  totalProtein: number;
}

interface RecentFood {
  id: string;
  food_name: string;
  brand_name: string | null;
  default_quantity: number;
  default_unit: string;
  nutrition: Nutrition | null;
  use_count: number;
  last_used_at: string;
}

export default function TodayPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isOnline, isSyncing, hasPendingOperations, sync } = useOfflineQueue();
  const [todayLogs, setTodayLogs] = useState<Record<MealType, MealGroup>>({
    breakfast: { items: [], itemCount: 0, totalCalories: 0, totalProtein: 0 },
    lunch: { items: [], itemCount: 0, totalCalories: 0, totalProtein: 0 },
    dinner: { items: [], itemCount: 0, totalCalories: 0, totalProtein: 0 },
    snack: { items: [], itemCount: 0, totalCalories: 0, totalProtein: 0 },
  });
  const [goals, setGoals] = useState<Goal[]>([]);
  const [totalCalories, setTotalCalories] = useState(0);
  const [totalProtein, setTotalProtein] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [recentFoods, setRecentFoods] = useState<RecentFood[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const [weightProgress, setWeightProgress] = useState<WeightProgress | null>(null);
  const [isLoadingWeight, setIsLoadingWeight] = useState(false);
  const [weightError, setWeightError] = useState('');
  
  // Quick weight modal state
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [isSavingWeight, setIsSavingWeight] = useState(false);
  const [quickWeightValue, setQuickWeightValue] = useState('');
  const [quickWeightUnit, setQuickWeightUnit] = useState('kg');
  const [quickWeightNotes, setQuickWeightNotes] = useState('');
  const [quickWeightMessage, setQuickWeightMessage] = useState('');
  const [quickWeightMessageType, setQuickWeightMessageType] = useState<'success' | 'danger'>('success');

  const loadTodayData = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      if (hasPendingOperations && isOnline) {
        await sync();
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/logs/today?userId=${user.id}`);
      const data = await response.json();

      if (data.success) {
        const grouped = data.data;
        setTodayLogs({
          breakfast: grouped.breakfast || { items: [], itemCount: 0, totalCalories: 0, totalProtein: 0 },
          lunch: grouped.lunch || { items: [], itemCount: 0, totalCalories: 0, totalProtein: 0 },
          dinner: grouped.dinner || { items: [], itemCount: 0, totalCalories: 0, totalProtein: 0 },
          snack: grouped.snack || { items: [], itemCount: 0, totalCalories: 0, totalProtein: 0 },
        });
        setTotalCalories(data.summary?.totalCalories || 0);
        setTotalProtein(data.summary?.totalProtein || 0);
      }

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
  }, [user?.id, hasPendingOperations, isOnline, sync]);

  // Fetch recent foods
  const fetchRecentFoods = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoadingRecent(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/food-cache/recent?userId=${user.id}&limit=10`
      );
      const data = await response.json();
      
      if (data.success && data.data) {
        const parsedFoods = data.data.map((food: RecentFood) => ({
          ...food,
          nutrition: typeof food.nutrition === 'string' 
            ? JSON.parse(food.nutrition) 
            : food.nutrition,
        }));
        setRecentFoods(parsedFoods);
      }
    } catch (err) {
      console.error('Failed to fetch recent foods:', err);
    } finally {
      setIsLoadingRecent(false);
    }
  }, [user?.id]);

  // Fetch weight progress
  const fetchWeightProgress = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoadingWeight(true);
    setWeightError('');
    try {
      const progress = await weightLogsService.getProgress(user.id);
      setWeightProgress(progress);
    } catch (err: any) {
      console.error('Failed to fetch weight progress:', err);
      setWeightError(err.message || 'Failed to load weight progress');
    } finally {
      setIsLoadingWeight(false);
    }
  }, [user?.id]);

  // Quick weight save handler
  const handleQuickWeightSave = async () => {
    if (!user?.id || !quickWeightValue) return;

    setIsSavingWeight(true);
    setQuickWeightMessage('');

    try {
      const weightValueNum = parseFloat(quickWeightValue);
      if (isNaN(weightValueNum) || weightValueNum <= 0) {
        throw new Error('Please enter a valid weight');
      }

      await weightLogsService.createWeightLog({
        userId: user.id,
        weightValue: weightValueNum,
        weightUnit: quickWeightUnit,
        notes: quickWeightNotes || undefined,
      });

      // Refresh weight progress immediately
      await fetchWeightProgress();

      // Reset and close modal
      setQuickWeightMessage('Weight logged successfully!');
      setQuickWeightMessageType('success');
      setQuickWeightValue('');
      setQuickWeightNotes('');
      setTimeout(() => {
        setShowWeightModal(false);
        setQuickWeightMessage('');
      }, 1000);
    } catch (err: any) {
      console.error('Failed to save weight:', err);
      setQuickWeightMessage(err.message || 'Failed to log weight');
      setQuickWeightMessageType('danger');
    } finally {
      setIsSavingWeight(false);
    }
  };

  const openQuickWeightModal = () => {
    // Pre-fill with current weight if available
    if (weightProgress?.currentWeight) {
      setQuickWeightValue(weightProgress.currentWeight.toString());
    } else {
      setQuickWeightValue('');
    }
    setQuickWeightNotes('');
    setQuickWeightMessage('');
    setShowWeightModal(true);
  };

  useEffect(() => {
    loadTodayData();
    fetchRecentFoods();
    fetchWeightProgress();
  }, [loadTodayData, fetchRecentFoods, fetchWeightProgress]);

  const handleDeleteItem = async (logId: string) => {
    setDeletingId(logId);
    try {
      await logsService.deleteLog(logId);
      setShowDeleteConfirm(null);
      await loadTodayData();
    } catch (err) {
      console.error('Failed to delete item:', err);
      setError('Failed to delete item');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddRecentFood = (mealType: MealType) => {
    // Navigate to log page with the meal type pre-selected
    router.push(`/log?mealType=${mealType}`);
  };

  const dailyGoal = goals.find(g => g.goalType === 'daily_calories');
  const targetCalories = dailyGoal?.targetValue || 2000;
  const remainingCalories = targetCalories - totalCalories;
  const progress = Math.min((totalCalories / targetCalories) * 100, 100);
  const totalItems = Object.values(todayLogs).reduce((sum, meal) => sum + meal.itemCount, 0);

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
                    {Math.round(totalCalories)} / {targetCalories}
                  </span>
                </div>
                <div className="h-3 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-neutral-900">{Math.round(totalCalories)}</div>
                  <div className="text-xs text-neutral-600">Calories</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-neutral-900">{Math.round(totalProtein)}g</div>
                  <div className="text-xs text-neutral-600">Protein</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${remainingCalories >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                    {Math.round(remainingCalories)}
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

          {/* Weight Progress Card */}
          {isLoadingWeight ? (
            <Card className="mb-6">
              <CardBody className="py-8 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-neutral-200 border-t-primary-500 rounded-full mx-auto" />
                <p className="text-sm text-neutral-500 mt-2">Loading weight progress...</p>
              </CardBody>
            </Card>
          ) : weightError ? (
            <Card className="mb-6">
              <CardBody className="py-6 text-center">
                <p className="text-sm text-danger-600 mb-3">{weightError}</p>
                <Button size="sm" onClick={fetchWeightProgress}>
                  Retry
                </Button>
              </CardBody>
            </Card>
          ) : !weightProgress?.hasData ? (
            <Card className="mb-6">
              <CardBody className="py-6">
                <EmptyState
                  icon="⚖️"
                  title="No weight data yet"
                  description="Start tracking your weight to see your progress here"
                  actionLabel="Log Weight"
                  onAction={openQuickWeightModal}
                />
              </CardBody>
            </Card>
          ) : (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⚖️</span>
                    <h3 className="text-lg font-semibold text-neutral-900">Weight Progress</h3>
                  </div>
                  <Button size="sm" onClick={openQuickWeightModal}>
                    + Log Weight
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                  <div>
                    <div className="text-sm text-neutral-500">Start</div>
                    <div className="text-xl font-bold text-neutral-900">
                      {weightProgress.startWeight} kg
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-neutral-500">Current</div>
                    <div className="text-xl font-bold text-primary-600">
                      {weightProgress.currentWeight} kg
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-neutral-500">Change</div>
                    <div className={`text-xl font-bold ${(weightProgress.changeKg || 0) >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                      {weightProgress.changeKg != null ? (weightProgress.changeKg >= 0 ? '+' : '') + weightProgress.changeKg.toFixed(1) : '—'} kg
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-neutral-500">Progress</div>
                    <div className="text-xl font-bold text-neutral-900">
                      {weightProgress.progressPercent != null ? Math.round(weightProgress.progressPercent) : 0}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-neutral-500">Goal</div>
                    <div className="text-xl font-bold text-neutral-900 capitalize">
                      {weightProgress.goalType?.replace('_', ' ') || '—'}
                    </div>
                  </div>
                </div>
                {weightProgress.progressPercent != null && (
                  <div className="mt-4">
                    <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 transition-all duration-500"
                        style={{ width: `${Math.min(weightProgress.progressPercent, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* Meals */}
          {(Object.keys(mealIcons) as MealType[]).map((mealType) => {
            const meal = todayLogs[mealType];

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
                        {meal.itemCount > 0 && (
                          <p className="text-xs text-neutral-500">
                            {meal.itemCount} item{meal.itemCount !== 1 ? 's' : ''} • {Math.round(meal.totalProtein)}g protein
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-primary-600">
                        {Math.round(meal.totalCalories)}
                      </span>
                      <span className="text-sm text-neutral-500"> cal</span>
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  {meal.items.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-neutral-500 mb-3">
                        No {mealType} logged yet
                      </p>
                      
                      {/* Recent Foods Section */}
                      {recentFoods.length > 0 && !isLoadingRecent && (
                        <div className="mb-4">
                          <p className="text-xs text-neutral-500 mb-2">Quick add from recent:</p>
                          <div className="flex flex-wrap gap-2 justify-center">
                            {recentFoods.slice(0, 5).map((food) => (
                              <button
                                key={food.id}
                                onClick={() => handleAddRecentFood(mealType)}
                                className="px-3 py-2 bg-neutral-100 hover:bg-primary-50 border border-neutral-200 hover:border-primary-300 rounded-lg text-left transition-colors"
                              >
                                <div className="text-sm font-medium text-neutral-900">
                                  {food.food_name}
                                </div>
                                {food.brand_name && (
                                  <div className="text-xs text-neutral-500 truncate max-w-[100px]">
                                    {food.brand_name}
                                  </div>
                                )}
                                <div className="text-xs text-primary-600 mt-1">
                                  {food.nutrition?.calories || '—'} cal
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {isLoadingRecent && (
                        <div className="text-xs text-neutral-400 mb-3">Loading recent foods...</div>
                      )}

                      <Link href="/log">
                        <Button size="sm" variant="outline">
                          + Add Food
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {meal.items.map((log, index) => (
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
                                {log.foodName || (log as any).food_name || 'Unnamed food'}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-neutral-500">
                                <span>{log.quantity} {log.unit}</span>
                                {(log.brandName || (log as any).brand_name) && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate">{log.brandName || (log as any).brand_name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right flex-shrink-0">
                              <div className="text-sm font-semibold text-primary-600">
                                {log.nutrition?.calories || 0} cal
                              </div>
                              <div className="text-xs text-neutral-500">
                                P: {log.nutrition?.protein || 0}g
                              </div>
                            </div>
                            {showDeleteConfirm === log.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDeleteItem(log.id)}
                                  disabled={deletingId === log.id}
                                  className="px-2 py-1 text-xs bg-danger-500 text-white rounded hover:bg-danger-600"
                                >
                                  {deletingId === log.id ? '...' : 'Confirm'}
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(null)}
                                  className="px-2 py-1 text-xs bg-neutral-300 text-neutral-700 rounded hover:bg-neutral-400"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowDeleteConfirm(log.id)}
                                className="p-1 text-neutral-400 hover:text-danger-500 transition-colors"
                                title="Delete item"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
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
          {totalItems === 0 && (
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

        {/* Quick Weight Modal */}
        <Modal
          isOpen={showWeightModal}
          onClose={() => setShowWeightModal(false)}
          title="Log Weight"
          footer={
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowWeightModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleQuickWeightSave}
                disabled={isSavingWeight || !quickWeightValue}
                className="flex-1"
              >
                {isSavingWeight ? 'Saving...' : 'Save Weight'}
              </Button>
            </div>
          }
        >
          {quickWeightMessage && (
            <Alert
              type={quickWeightMessageType}
              className="mb-4"
            >
              {quickWeightMessage}
            </Alert>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Weight
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="500"
                  placeholder="Enter weight"
                  value={quickWeightValue}
                  onChange={(e) => setQuickWeightValue(e.target.value)}
                  className="flex-1"
                />
                <select
                  value={quickWeightUnit}
                  onChange={(e) => setQuickWeightUnit(e.target.value)}
                  className="px-3 py-2 border border-neutral-300 rounded-lg bg-white"
                >
                  <option value="kg">kg</option>
                  <option value="lb">lb</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Notes (optional)
              </label>
              <Input
                type="text"
                placeholder="Add a note..."
                value={quickWeightNotes}
                onChange={(e) => setQuickWeightNotes(e.target.value)}
              />
            </div>
          </div>
        </Modal>

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
