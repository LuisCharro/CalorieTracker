'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardBody, Alert } from '../../../shared/components';
import { Layout, Header } from '../../../shared/layout';
import { useAuth } from '../../../core/auth';
import { goalsService } from '../../../core/api/services';
import { GoalType } from '../../../core/contracts/enums';

// Simple BMR and TDEE calculation
const calculateBMR = (weightKg: number, heightCm: number, age: number, gender: string): number => {
  // Mifflin-St Jeor Equation
  if (gender === 'male') {
    return (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
  } else if (gender === 'female') {
    return (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
  }
  // Default for other/prefer_not_to_say (average)
  return (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 78;
};

const calculateTDEE = (bmr: number, activityLevel: string): number => {
  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  return Math.round(bmr * (multipliers[activityLevel] || 1.2));
};

export default function OnboardingGoalsPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  
  // Calculate age from dateOfBirth
  const age = useMemo(() => {
    if (!user?.dateOfBirth) return null;
    const today = new Date();
    const birth = new Date(user.dateOfBirth);
    let calculatedAge = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      calculatedAge--;
    }
    return calculatedAge;
  }, [user?.dateOfBirth]);

  // Calculate BMR and TDEE from profile
  const { bmr, tdee, recommendedCalories } = useMemo(() => {
    if (!user?.weightKg || !user?.heightCm || !age || !user?.gender || !user?.activityLevel) {
      return { bmr: 0, tdee: 0, recommendedCalories: 2000 };
    }
    
    const calculatedBmr = calculateBMR(
      user.weightKg,
      user.heightCm,
      age,
      user.gender
    );
    const calculatedTdee = calculateTDEE(calculatedBmr, user.activityLevel);
    
    // Default to maintain weight, will adjust based on goal
    return { 
      bmr: calculatedBmr, 
      tdee: calculatedTdee,
      recommendedCalories: calculatedTdee 
    };
  }, [user?.weightKg, user?.heightCm, age, user?.gender, user?.activityLevel]);

  const [selectedGoal, setSelectedGoal] = useState<'lose' | 'maintain' | 'gain'>('maintain');
  const [targetCalories, setTargetCalories] = useState(2000);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Update target calories when goal changes
  useEffect(() => {
    const goalAdjustments: Record<string, number> = {
      lose: 0.8,      // 20% deficit
      maintain: 1.0,  // maintenance
      gain: 1.15,     // 15% surplus
    };
    setTargetCalories(Math.round(tdee * (goalAdjustments[selectedGoal] || 1)));
  }, [selectedGoal, tdee]);

  const goalPresets = {
    lose: { calories: Math.round(tdee * 0.8), label: 'Lose weight', icon: '📉', description: '~20% calorie deficit' },
    maintain: { calories: tdee, label: 'Maintain weight', icon: '⚖️', description: 'Maintenance calories' },
    gain: { calories: Math.round(tdee * 1.15), label: 'Gain weight', icon: '📈', description: '~15% calorie surplus' },
  };

  const handleGoalSelect = (goal: 'lose' | 'maintain' | 'gain') => {
    setSelectedGoal(goal);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!user?.id) throw new Error('User not found. Please log in again.');

      await goalsService.createGoal({
        userId: user.id,
        goalType: GoalType.DAILY_CALORIES,
        targetValue: targetCalories,
        startDate: new Date().toISOString().split('T')[0],
      });

      router.push('/onboarding/preferences');
    } catch (err: any) {
      console.error('Failed to save goal:', err);
      setError(err.message || 'Failed to save goal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if we have enough profile data
  const hasProfileData = !!(user?.weightKg && user?.heightCm && age && user?.gender && user?.activityLevel);

  return (
    <Layout maxWidth="lg">
      <div className="min-h-screen pb-24">
        <Header
          title="Step 6: Your Calorie Goal"
          subtitle="Based on your profile"
        />

        {!hasProfileData && (
          <Alert type="warning" className="mb-6">
            Please complete your profile first (birthday, gender, height, weight, activity level)
          </Alert>
        )}

        {error && (
          <Alert type="danger" className="mb-6">
            {error}
          </Alert>
        )}

        {hasProfileData && (
          <Card className="mb-6">
            <CardBody>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Your Calculated Needs
              </h3>
              
              <div className="grid gap-4 sm:grid-cols-2 mb-4">
                <div className="p-4 bg-neutral-50 rounded-lg">
                  <div className="text-sm text-neutral-600 mb-1">Basal Metabolic Rate (BMR)</div>
                  <div className="text-2xl font-bold text-neutral-900">{bmr}</div>
                  <div className="text-xs text-neutral-500">Calories your body burns at rest</div>
                </div>
                <div className="p-4 bg-neutral-50 rounded-lg">
                  <div className="text-sm text-neutral-600 mb-1">Total Daily Energy Expenditure</div>
                  <div className="text-2xl font-bold text-neutral-900">{tdee}</div>
                  <div className="text-xs text-neutral-500">Calories you burn with activity</div>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        <Card className="mb-6">
          <CardBody>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              What&apos;s your primary goal?
            </h3>

            <div className="grid gap-4 sm:grid-cols-3">
              {(Object.keys(goalPresets) as Array<'lose' | 'maintain' | 'gain'>).map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => handleGoalSelect(goal)}
                  className={`
                    relative rounded-lg border-2 p-4 text-left transition-all
                    ${selectedGoal === goal
                      ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500 ring-offset-2'
                      : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                    }
                  `}
                >
                  <div className="text-3xl mb-2">{goalPresets[goal].icon}</div>
                  <div className="font-medium text-neutral-900">{goalPresets[goal].label}</div>
                  <div className="text-sm text-neutral-600">{goalPresets[goal].description}</div>
                </button>
              ))}
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Daily calorie target
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1200"
                  max="4000"
                  step="50"
                  value={targetCalories}
                  onChange={(e) => setTargetCalories(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
                <div className="text-2xl font-bold text-neutral-900 min-w-[80px] text-right">
                  {targetCalories}
                </div>
              </div>
              <p className="mt-2 text-sm text-neutral-600">
                Recommended range: 1,200 - 4,000 calories per day
              </p>
            </div>

            <div className="mt-6 p-4 bg-neutral-50 rounded-lg">
              <p className="text-sm text-neutral-600">
                <strong>Note:</strong> These are general guidelines. Consult with a healthcare professional
                for personalized nutrition advice based on your specific needs, activity level, and health goals.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                onClick={handleSubmit}
                isLoading={isLoading}
                size="lg"
                disabled={!hasProfileData}
              >
                Continue
              </Button>
            </div>
          </CardBody>
        </Card>

        {!hasProfileData && (
          <div className="flex justify-start">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/onboarding/activity')}
            >
              Back to Profile
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
