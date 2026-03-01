'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardBody, Alert } from '../../../../shared/components';
import { Layout, Header } from '../../../../shared/layout';
import { useAuth } from '../../../../core/auth';
import { authService } from '../../../../core/api/services';

type UnitSystem = 'metric' | 'imperial';
type WeightGoal = 'lose' | 'maintain' | 'gain';

const goalOptions: { value: WeightGoal; label: string; icon: string; description: string }[] = [
  { value: 'lose', label: 'Lose weight', icon: '📉', description: 'Create a calorie deficit' },
  { value: 'maintain', label: 'Maintain weight', icon: '⚖️', description: 'Stay at my current weight' },
  { value: 'gain', label: 'Gain weight', icon: '📈', description: 'Build muscle or add weight' },
];

export default function OnboardingWeightPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  
  // Metric (kg)
  const [currentWeightKg, setCurrentWeightKg] = useState('');
  const [targetWeightKg, setTargetWeightKg] = useState('');
  
  // Imperial (lbs)
  const [currentWeightLbs, setCurrentWeightLbs] = useState('');
  const [targetWeightLbs, setTargetWeightLbs] = useState('');
  
  const [weightGoal, setWeightGoal] = useState<WeightGoal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Load user's unit preference if set
  useEffect(() => {
    if (user?.unitSystem) {
      setUnitSystem(user.unitSystem);
    }
  }, [user?.unitSystem]);

  const getWeightKg = (value: string): number | null => {
    const val = parseFloat(value);
    if (isNaN(val) || val <= 0) return null;
    return unitSystem === 'metric' ? val : Math.round(val * 0.453592);
  };

  const getWeightLbs = (value: string): number | null => {
    const val = parseFloat(value);
    if (isNaN(val) || val <= 0) return null;
    return unitSystem === 'imperial' ? val : Math.round(val * 2.20462);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const weight = getWeightKg(unitSystem === 'metric' ? currentWeightKg : currentWeightLbs);
    const targetWeight = weightGoal !== 'maintain' 
      ? (unitSystem === 'metric' ? getWeightKg(targetWeightKg) : getWeightKg(targetWeightLbs))
      : null;

    if (!weight) {
      setError('Please enter your current weight');
      return;
    }

    if (weightGoal !== 'maintain' && !targetWeight) {
      setError('Please enter your target weight');
      return;
    }

    setIsLoading(true);

    try {
      if (!user?.id) throw new Error('User not found. Please log in again.');

      await authService.updateCurrentUser({
        weightKg: weight,
        weightGoal: weightGoal || undefined,
        targetWeightKg: targetWeight || undefined,
        unitSystem: unitSystem,
      });

      router.push('/onboarding/activity');
    } catch (err: any) {
      console.error('Failed to save weight:', err);
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const hasTargetWeight = weightGoal && weightGoal !== 'maintain';

  return (
    <Layout maxWidth="lg">
      <div className="min-h-screen pb-24">
        <Header
          title="Step 4 of 5: Your Weight & Goals"
          subtitle="Tell us about your weight goals"
        />

        {error && (
          <Alert type="danger" className="mb-6">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {/* Weight Goal Selection */}
          <Card className="mb-6">
            <CardBody>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                What&apos;s your weight goal?
              </h3>

              <div className="grid gap-3 sm:grid-cols-3">
                {goalOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setWeightGoal(option.value)}
                    className={`
                      relative rounded-lg border-2 p-4 text-left transition-all
                      ${weightGoal === option.value
                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500 ring-offset-2'
                        : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                      }
                    `}
                  >
                    <div className="text-3xl mb-2">{option.icon}</div>
                    <div className="font-medium text-neutral-900">{option.label}</div>
                    <div className="text-sm text-neutral-600">{option.description}</div>
                    {weightGoal === option.value && (
                      <div className="absolute top-2 right-2">
                        <svg className="h-5 w-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Current Weight */}
          <Card className="mb-6">
            <CardBody>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                What&apos;s your current weight?
              </h3>

              {/* Unit Toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setUnitSystem('metric')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    unitSystem === 'metric'
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  Metric (kg)
                </button>
                <button
                  type="button"
                  onClick={() => setUnitSystem('imperial')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    unitSystem === 'imperial'
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  Imperial (lbs)
                </button>
              </div>

              <div className="max-w-xs">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Current Weight ({unitSystem === 'metric' ? 'kg' : 'lbs'})
                </label>
                <input
                  type="number"
                  value={unitSystem === 'metric' ? currentWeightKg : currentWeightLbs}
                  onChange={(e) => unitSystem === 'metric' 
                    ? setCurrentWeightKg(e.target.value) 
                    : setCurrentWeightLbs(e.target.value)
                  }
                  placeholder={unitSystem === 'metric' ? '70' : '154'}
                  min="20"
                  max="500"
                  className="block w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </CardBody>
          </Card>

          {/* Target Weight (only if not maintaining) */}
          {hasTargetWeight && (
            <Card className="mb-6">
              <CardBody>
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  What&apos;s your target weight?
                </h3>

                <div className="max-w-xs">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Target Weight ({unitSystem === 'metric' ? 'kg' : 'lbs'})
                  </label>
                  <input
                    type="number"
                    value={unitSystem === 'metric' ? targetWeightKg : targetWeightLbs}
                    onChange={(e) => unitSystem === 'metric' 
                      ? setTargetWeightKg(e.target.value) 
                      : setTargetWeightLbs(e.target.value)
                    }
                    placeholder={unitSystem === 'metric' ? '65' : '143'}
                    min="20"
                    max="500"
                    className="block w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                  <p className="mt-1 text-sm text-neutral-500">
                    {weightGoal === 'lose' 
                      ? 'Enter a weight lower than your current weight'
                      : 'Enter a weight higher than your current weight'
                    }
                  </p>
                </div>
              </CardBody>
            </Card>
          )}

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/onboarding/profile/height')}
            >
              Back
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              size="lg"
              disabled={!weightGoal || !getWeightKg(unitSystem === 'metric' ? currentWeightKg : currentWeightLbs)}
            >
              Continue
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
