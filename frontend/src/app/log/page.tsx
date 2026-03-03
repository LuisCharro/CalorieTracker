'use client';

import { useState, useCallback, useEffect } from 'react';
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
  const [successMessage, setSuccessMessage] = useState('');
  const [loggedCount, setLoggedCount] = useState(0);
  const [recentFoods, setRecentFoods] = useState<RecentFood[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);

  const mealTypes = [
    { value: 'breakfast', label: 'Breakfast', icon: '☀️' },
    { value: 'lunch', label: 'Lunch', icon: '🍽️' },
    { value: 'dinner', label: 'Dinner', icon: '🌙' },
    { value: 'snack', label: 'Snack', icon: '🍎' },
  ];

  // Fetch recent foods on mount
  useEffect(() => {
    const fetchRecentFoods = async () => {
      if (!user?.id) return;
      
      setIsLoadingRecent(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/food-cache/recent?userId=${user.id}&limit=10`
        );
        const data = await response.json();
        
        if (data.success && data.data) {
          // Parse nutrition string if it's a string
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
    };

    fetchRecentFoods();
  }, [user?.id]);

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

  const addRecentFood = useCallback((recentFood: RecentFood) => {
    // Find the first empty slot or add a new item
    const emptyIndex = foodItems.findIndex(item => !item.foodName.trim());
    
    if (emptyIndex >= 0) {
      // Update the empty slot
      const updatedItems = [...foodItems];
      updatedItems[emptyIndex] = {
        id: updatedItems[emptyIndex].id,
        foodName: recentFood.food_name,
        brandName: recentFood.brand_name || '',
        quantity: recentFood.default_quantity,
        unit: recentFood.default_unit,
        nutrition: recentFood.nutrition,
      };
      setFoodItems(updatedItems);
    } else {
      // Add a new item
      setFoodItems(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          foodName: recentFood.food_name,
          brandName: recentFood.brand_name || '',
          quantity: recentFood.default_quantity,
          unit: recentFood.default_unit,
          nutrition: recentFood.nutrition,
        },
      ]);
    }
  }, [foodItems]);

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

  const handleLogMeal = async (andAddMore = false) => {
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

      setLoggedCount(prev => prev + validItems.length);
      setSuccess(true);
      setSuccessMessage(`Logged ${validItems.length} item${validItems.length !== 1 ? 's' : ''} successfully!`);

      if (andAddMore) {
        setFoodItems([
          { id: Date.now().toString(), foodName: '', brandName: '', quantity: 100, unit: 'g', nutrition: null },
        ]);
        setSuccess(false);
      } else {
        setTimeout(() => {
          router.push('/today');
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to log meal:', error);
      setError(error instanceof Error ? error.message : 'Failed to log meal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearForm = () => {
    setFoodItems([
      { id: Date.now().toString(), foodName: '', brandName: '', quantity: 100, unit: 'g', nutrition: null },
    ]);
    setMealName('');
    setError('');
    setSuccess(false);
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
              {successMessage} {loggedCount > 1 && `(Total: ${loggedCount} items this session)`}
            </Alert>
          )}

          {/* Recent Foods Section */}
          {recentFoods.length > 0 && (
            <Card className="shadow-lg shadow-neutral-200/50 border-0 rounded-2xl mb-4">
              <CardHeader className="border-l-4 border-l-primary-500 bg-gradient-to-r from-primary-50/50 to-white border-b border-neutral-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Recent Foods
                  </h3>
                  <span className="text-xs text-neutral-500">
                    Tap to add
                  </span>
                </div>
              </CardHeader>
              <CardBody>
                <div className="flex flex-wrap gap-2">
                  {recentFoods.map((food) => (
                    <button
                      key={food.id}
                      onClick={() => addRecentFood(food)}
                      className="px-3 py-2 bg-neutral-100 hover:bg-primary-50 border border-neutral-200 hover:border-primary-300 rounded-lg text-left transition-colors"
                    >
                      <div className="text-sm font-medium text-neutral-900">
                        {food.food_name}
                      </div>
                      {food.brand_name && (
                        <div className="text-xs text-neutral-500 truncate max-w-[120px]">
                          {food.brand_name}
                        </div>
                      )}
                      <div className="text-xs text-primary-600 mt-1">
                        {food.nutrition?.calories || '—'} cal
                      </div>
                    </button>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {isLoadingRecent && recentFoods.length === 0 && (
            <div className="text-center py-2 text-sm text-neutral-500 mb-4">
              Loading recent foods...
            </div>
          )}

          <Card className="shadow-lg shadow-neutral-200/50 border-0 rounded-2xl mb-4">
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

          <Card className="shadow-lg shadow-neutral-200/50 border-0 rounded-2xl mb-4">
            <CardHeader className="border-l-4 border-l-primary-500 bg-gradient-to-r from-primary-50/50 to-white border-b border-neutral-100">
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
                          className="text-danger-500 hover:text-danger-700 text-sm font-medium px-2 py-1 rounded-md hover:bg-danger-50 transition-all"
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
                        <div className="grid grid-cols-4 gap-2">
                          <div className="bg-primary-50 rounded-xl p-3 text-center">
                            <div className="font-bold text-primary-600 text-lg">{item.nutrition.calories}</div>
                            <div className="text-xs text-primary-600/70 font-medium">cal</div>
                          </div>
                          <div className="bg-blue-50 rounded-xl p-3 text-center">
                            <div className="font-bold text-blue-600 text-lg">{item.nutrition.protein}g</div>
                            <div className="text-xs text-blue-600/70 font-medium">protein</div>
                          </div>
                          <div className="bg-amber-50 rounded-xl p-3 text-center">
                            <div className="font-bold text-amber-600 text-lg">{item.nutrition.carbohydrates}g</div>
                            <div className="text-xs text-amber-600/70 font-medium">carbs</div>
                          </div>
                          <div className="bg-rose-50 rounded-xl p-3 text-center">
                            <div className="font-bold text-rose-600 text-lg">{item.nutrition.fat}g</div>
                            <div className="text-xs text-rose-600/70 font-medium">fat</div>
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
                className="mt-4 hover:bg-neutral-100 hover:border-neutral-300 transition-all duration-200"
              >
                + Add Another Item
              </Button>
            </CardBody>
          </Card>

          <div className="space-y-3">
            <Button
              onClick={() => handleLogMeal(false)}
              isLoading={isLoading}
              isFullWidth
              size="lg"
              disabled={foodItems.every(item => !item.foodName.trim())}
              className="hover:opacity-90 transition-opacity duration-200"
            >
              Log {foodItems.filter(i => i.foodName.trim()).length} Item{foodItems.filter(i => i.foodName.trim()).length !== 1 ? 's' : ''} ({Math.round(totalCalories)} cal)
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleLogMeal(true)}
                variant="outline"
                isFullWidth
                disabled={foodItems.every(item => !item.foodName.trim()) || isLoading}
                className="hover:bg-neutral-100 hover:border-neutral-300 transition-all duration-200"
              >
                Log & Add More
              </Button>
              <Button
                onClick={clearForm}
                variant="outline"
                isFullWidth
                disabled={isLoading}
                className="hover:bg-neutral-100 hover:border-neutral-300 transition-all duration-200"
              >
                Clear Form
              </Button>
            </div>
          </div>

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
