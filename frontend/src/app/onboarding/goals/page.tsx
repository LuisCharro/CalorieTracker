'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardHeader, CardBody, Alert } from '../../../shared/components';
import { Layout, Header } from '../../../shared/layout';
import { useAuth } from '../../../core/auth';
import { goalsService } from '../../../core/api/services';
import { GoalType } from '../../../core/contracts/enums';

export default function OnboardingGoalsPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [selectedGoal, setSelectedGoal] = useState<'lose' | 'maintain' | 'gain'>('maintain');
  const [targetCalories, setTargetCalories] = useState(2000);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const goalPresets = {
    lose: { calories: 1800, label: 'Lose weight', icon: '📉' },
    maintain: { calories: 2000, label: 'Maintain weight', icon: '⚖️' },
    gain: { calories: 2500, label: 'Gain weight', icon: '📈' },
  };

  const handleGoalSelect = (goal: 'lose' | 'maintain' | 'gain') => {
    setSelectedGoal(goal);
    setTargetCalories(goalPresets[goal].calories);
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

  return (
    <Layout maxWidth="lg">
      <div className="min-h-screen pb-24">
        <Header
          title="Step 1 of 3: Set Your Goals"
          subtitle="Let's personalize your experience"
        />

        {error && (
          <Alert type="danger" className="mb-6">
            {error}
          </Alert>
        )}

        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              What's your primary goal?
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
              >
                Continue
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </Layout>
  );
}
