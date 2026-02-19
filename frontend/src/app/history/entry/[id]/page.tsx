'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Card, CardBody, Input, Alert } from '../../../../shared/components';
import { Layout, Header } from '../../../../shared/layout';
import { useAuth } from '../../../../core/auth';
import { logsService } from '../../../../core/api/services';
import { RouteGuard } from '../../../../core/auth/routeGuard';
import { MealType } from '../../../../core/contracts/enums';
import { FoodLog } from '../../../../core/contracts/types';

function EntryDetailContent() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const logId = params.id as string;

  const [log, setLog] = useState<FoodLog | null>(null);
  const [foodName, setFoodName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('serving');
  const [mealType, setMealType] = useState<MealType>(MealType.LUNCH);
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLog = async () => {
      if (!user?.id || !logId) return;

      try {
        const data = await logsService.getLog(logId);
        setLog(data);
        setFoodName(data.foodName);
        setQuantity(data.quantity);
        setUnit(data.unit);
        setMealType(data.mealType);
        setCalories(data.nutrition.calories);
        setProtein(data.nutrition.protein || 0);
        setCarbs(data.nutrition.carbohydrates || 0);
        setFat(data.nutrition.fat || 0);
      } catch (err: any) {
        console.error('Failed to load log:', err);
        setError(err.message || 'Failed to load entry');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLog();
  }, [user?.id, logId]);

  const handleSave = async () => {
    if (!logId) return;

    setIsSaving(true);
    setError('');

    try {
      await logsService.updateLog(logId, {
        foodName,
        quantity,
        unit,
        mealType,
        nutrition: {
          calories,
          protein,
          carbohydrates: carbs,
          fat,
        },
      });

      alert('Entry updated successfully!');
      router.push('/history');
    } catch (err: any) {
      console.error('Failed to update log:', err);
      setError(err.message || 'Failed to update entry');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!logId || !confirm('Are you sure you want to delete this entry?')) return;

    try {
      await logsService.deleteLog(logId);
      alert('Entry deleted');
      router.push('/history');
    } catch (err) {
      console.error('Failed to delete log:', err);
      alert('Failed to delete entry');
    }
  };

  const mealTypes = [
    { value: MealType.BREAKFAST, label: 'Breakfast', icon: '☀️' },
    { value: MealType.LUNCH, label: 'Lunch', icon: '🍽️' },
    { value: MealType.DINNER, label: 'Dinner', icon: '🌙' },
    { value: MealType.SNACK, label: 'Snack', icon: '🍎' },
  ];

  if (isLoading) {
    return (
      <Layout maxWidth="lg">
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-neutral-200 border-t-primary-500 rounded-full" />
        </div>
      </Layout>
    );
  }

  if (!log) {
    return (
      <RouteGuard requireAuth requireOnboardingComplete>
        <Layout maxWidth="lg">
          <Header
            title="Entry Not Found"
            showBackButton
            onBack={() => router.push('/history')}
          />
          <div className="text-center py-12 text-neutral-500">
            <p>The entry you're looking for doesn't exist.</p>
          </div>
        </Layout>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard requireAuth requireOnboardingComplete>
      <Layout maxWidth="lg">
        <div className="min-h-screen pb-24">
          <Header
            title="Edit Entry"
            showBackButton
            onBack={() => router.push('/history')}
          />

          {error && (
            <Alert type="danger" className="mb-6">
              {error}
            </Alert>
          )}

          <Card className="mb-6">
            <CardBody>
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Food Name
                </label>
                <Input
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  placeholder="e.g., Grilled chicken breast"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Quantity
                  </label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    min={0}
                    step={0.5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Unit
                  </label>
                  <Input
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="e.g., serving, g, oz"
                  />
                </div>
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
                      onClick={() => setMealType(meal.value)}
                      className={`
                        rounded-lg border-2 p-3 text-center transition-all
                        ${mealType === meal.value
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
                  Nutrition
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Calories</label>
                    <Input
                      type="number"
                      value={calories}
                      onChange={(e) => setCalories(parseInt(e.target.value) || 0)}
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Protein (g)</label>
                    <Input
                      type="number"
                      value={protein}
                      onChange={(e) => setProtein(parseInt(e.target.value) || 0)}
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Carbs (g)</label>
                    <Input
                      type="number"
                      value={carbs}
                      onChange={(e) => setCarbs(parseInt(e.target.value) || 0)}
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">Fat (g)</label>
                    <Input
                      type="number"
                      value={fat}
                      onChange={(e) => setFat(parseInt(e.target.value) || 0)}
                      min={0}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  className="flex-1"
                >
                  Delete
                </Button>
                <Button
                  onClick={handleSave}
                  isLoading={isSaving}
                  className="flex-1"
                >
                  Save Changes
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </Layout>
    </RouteGuard>
  );
}

export default function HistoryEntryPage() {
  return (
    <Suspense fallback={
      <Layout maxWidth="lg">
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-neutral-200 border-t-primary-500 rounded-full" />
        </div>
      </Layout>
    }>
      <EntryDetailContent />
    </Suspense>
  );
}
