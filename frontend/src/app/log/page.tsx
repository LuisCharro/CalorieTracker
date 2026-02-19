'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, CardHeader, CardBody, Alert } from '../../shared/components';
import { Layout, Header, Navigation } from '../../shared/layout';
import { useAuth } from '../../core/auth';
import { logsService } from '../../core/api/services';
import { RouteGuard } from '../../core/auth/routeGuard';
import { MealType } from '../../core/contracts/enums';
import type { Nutrition } from '../../core/contracts/enums';
import { useOfflineQueue } from '../../core/contexts/OfflineQueueContext';

interface FoodItem {
  id: string;
  foodName: string;
  brandName: string;
  quantity: number;
  unit: string;
  nutrition: Nutrition | null;
}

export default function LogPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isOnline } = useOfflineQueue();
  const [mealName, setMealName] = useState('');
  const [selectedMeal, setSelectedMeal] = useState<MealType>(MealType.LUNCH);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([
    { id: '1', foodName: '', brandName: '', quantity: 100, unit: 'g', nutrition: null },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const mealTypes = [
    { value: 'breakfast', label: 'Breakfast', icon: '☀️' },
    { value: 'lunch', label: 'Lunch', icon: '🍽️' },
    { value: 'dinner', label: 'Dinner', icon: '🌙' },
    { value: 'snack', label: 'Snack', icon: '🍎' },
  ];

  const addItem = useCallback(() => {
    setFoodItems(prev => [
      ...prev,
      { id: Date.now().toString(), foodName: '', brandName: '', quantity: 100, unit: 'g', nutrition: null },
    ]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setFoodItems(prev => {
      if (prev.length === 1) return prev;
      return prev.filter(item => item.id !== id);
    });
  }, []);

  const updateItem = useCallback((id: string, field: keyof FoodItem, value: string | number | Nutrition | null) => {
    setFoodItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  }, []);

  const parseFoodText = useCallback(async (id: string, foodName: string) => {
    if (foodName.trim().length < 3) {
      updateItem(id, 'nutrition', null);
      return;
    }

    setIsParsing(id);
    try {
      const parsed = await logsService.parseFoodText(foodName);
      updateItem(id, 'nutrition', parsed.nutrition);
      updateItem(id, 'quantity', parsed.quantity);
      updateItem(id, 'unit', parsed.unit);
    } catch {
      updateItem(id, 'nutrition', null);
    } finally {
      setIsParsing(null);
    }
  }, [updateItem]);

  const handleLogMeal = async () => {
    const validItems = foodItems.filter(item => item.foodName.trim() && item.nutrition);
    
    if (validItems.length === 0) {
      setError('Please add at least one food item with valid nutrition data');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      await logsService.createBatchLogs({
        userId: user!.id,
        mealName: mealName.trim() || undefined,
        mealType: selectedMeal,
        items: validItems.map(item => ({
          foodName: item.foodName,
          brandName: item.brandName || undefined,
          quantity: item.quantity,
          unit: item.unit,
          nutrition: item.nutrition!,
        })),
        loggedAt: new Date().toISOString(),
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/today');
      }, 1500);
    } catch (error) {
      console.error('Failed to log meal:', error);
      setError(error instanceof Error ? error.message : 'Failed to log meal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const totalCalories = foodItems.reduce((sum, item) => sum + (item.nutrition?.calories || 0), 0);

  return (
    <RouteGuard requireAuth requireOnboardingComplete>
      <Layout maxWidth="lg">
        <div className="min-h-screen pb-24">
          <Header 
            title="Log Meal" 
            subtitle={!isOnline ? '📴 Offline - will sync later' : undefined}
          />

          {error && (
            <Alert type="danger" className="mb-4">
              {error}
            </Alert>
          )}

          {success && (
            <Alert type="success" className="mb-4">
              Meal logged successfully! Redirecting...
            </Alert>
          )}

          <Card className="mb-4">
            <CardBody>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Meal Details
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Meal Name (optional)
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Healthy Breakfast or My Lunch"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  isFullWidth
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Meal Type
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
            </CardBody>
          </Card>

          <Card className="mb-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-900">
                  Food Items
                </h3>
                <span className="text-sm text-neutral-500">
                  Total: {Math.round(totalCalories)} cal
                </span>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {foodItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-4 bg-neutral-50 rounded-lg border border-neutral-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-sm font-medium text-neutral-700">
                        Item {index + 1}
                      </span>
                      {foodItems.length > 1 && (
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-danger-500 hover:text-danger-700 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <Input
                          type="text"
                          placeholder="Food name (e.g., 100g chicken breast)"
                          value={item.foodName}
                          onChange={(e) => {
                            updateItem(item.id, 'foodName', e.target.value);
                            parseFoodText(item.id, e.target.value);
                          }}
                          isFullWidth
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        />
                        <Input
                          type="text"
                          placeholder="Unit"
                          value={item.unit}
                          onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                        />
                        <Input
                          type="text"
                          placeholder="Brand (opt)"
                          value={item.brandName}
                          onChange={(e) => updateItem(item.id, 'brandName', e.target.value)}
                        />
                      </div>

                      {isParsing === item.id && (
                        <div className="text-sm text-neutral-500 flex items-center gap-2">
                          <div className="animate-spin h-4 w-4 border-2 border-neutral-300 border-t-primary-500 rounded-full" />
                          Parsing nutrition...
                        </div>
                      )}

                      {item.nutrition && (
                        <div className="p-3 bg-white rounded-lg border border-neutral-100">
                          <div className="grid grid-cols-4 gap-2 text-center text-sm">
                            <div>
                              <div className="font-semibold text-primary-600">{item.nutrition.calories}</div>
                              <div className="text-xs text-neutral-500">cal</div>
                            </div>
                            <div>
                              <div className="font-semibold">{item.nutrition.protein}g</div>
                              <div className="text-xs text-neutral-500">protein</div>
                            </div>
                            <div>
                              <div className="font-semibold">{item.nutrition.carbohydrates}g</div>
                              <div className="text-xs text-neutral-500">carbs</div>
                            </div>
                            <div>
                              <div className="font-semibold">{item.nutrition.fat}g</div>
                              <div className="text-xs text-neutral-500">fat</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={addItem}
                variant="outline"
                isFullWidth
                className="mt-4"
              >
                + Add Another Item
              </Button>
            </CardBody>
          </Card>

          <Button
            onClick={handleLogMeal}
            isLoading={isLoading}
            isFullWidth
            size="lg"
            disabled={foodItems.every(item => !item.foodName.trim())}
          >
            Log {foodItems.filter(i => i.foodName.trim()).length} Item{foodItems.filter(i => i.foodName.trim()).length !== 1 ? 's' : ''} ({Math.round(totalCalories)} cal)
          </Button>

          {!isOnline && (
            <p className="text-center text-sm text-neutral-500 mt-3">
              📴 Changes will be saved locally and synced when online
            </p>
          )}
        </div>

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
