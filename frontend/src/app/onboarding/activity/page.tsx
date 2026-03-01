'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardBody, Alert } from '../../../shared/components';
import { Layout, Header } from '../../../shared/layout';
import { useAuth } from '../../../core/auth';
import { authService } from '../../../core/api/services';

type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

const activityOptions: { 
  value: ActivityLevel; 
  label: string; 
  icon: string; 
  description: string;
  calories: string;
}[] = [
  { 
    value: 'sedentary', 
    label: 'Sedentary', 
    icon: '🪑', 
    description: 'Little or no exercise, desk job',
    calories: '1,200 - 1,500'
  },
  { 
    value: 'light', 
    label: 'Lightly Active', 
    icon: '🚶', 
    description: 'Light exercise 1-3 days/week',
    calories: '1,500 - 1,750'
  },
  { 
    value: 'moderate', 
    label: 'Moderately Active', 
    icon: '🏃', 
    description: 'Moderate exercise 3-5 days/week',
    calories: '1,750 - 2,000'
  },
  { 
    value: 'active', 
    label: 'Very Active', 
    icon: '🏋️', 
    description: 'Hard exercise 6-7 days/week',
    calories: '2,000 - 2,500'
  },
  { 
    value: 'very_active', 
    label: 'Extra Active', 
    icon: '🏆', 
    description: 'Very hard exercise, physical job',
    calories: '2,500 - 3,000'
  },
];

export default function OnboardingActivityPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!activityLevel) {
      setError('Please select your activity level');
      return;
    }

    setIsLoading(true);

    try {
      if (!user?.id) throw new Error('User not found. Please log in again.');

      await authService.updateCurrentUser({
        activityLevel: activityLevel,
      });

      // Now go to goals page (which will calculate TDEE based on profile)
      router.push('/onboarding/goals');
    } catch (err: any) {
      console.error('Failed to save activity level:', err);
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout maxWidth="lg">
      <div className="min-h-screen pb-24">
        <Header
          title="Step 5 of 5: Activity Level"
          subtitle="Helps us calculate your daily calorie needs"
        />

        {error && (
          <Alert type="danger" className="mb-6">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardBody>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                How would you describe your activity level?
              </h3>
              <p className="text-sm text-neutral-600 mb-6">
                This helps us calculate your Total Daily Energy Expenditure (TDEE) - the total calories you burn each day.
              </p>

              <div className="space-y-3">
                {activityOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setActivityLevel(option.value)}
                    className={`
                      w-full relative rounded-lg border-2 p-4 text-left transition-all
                      ${activityLevel === option.value
                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500 ring-offset-2'
                        : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{option.icon}</span>
                        <div>
                          <div className="font-medium text-neutral-900">{option.label}</div>
                          <div className="text-sm text-neutral-600">{option.description}</div>
                        </div>
                      </div>
                      {activityLevel === option.value && (
                        <svg className="h-6 w-6 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 bg-neutral-50 rounded-lg">
                <p className="text-xs text-neutral-600">
                  <strong>Tip:</strong> Be honest about your activity level. Choosing a level higher than 
                  your actual activity can lead to inaccurate calorie targets.
                </p>
              </div>
            </CardBody>
          </Card>

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/onboarding/profile/weight')}
            >
              Back
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              size="lg"
              disabled={!activityLevel}
            >
              Continue
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
