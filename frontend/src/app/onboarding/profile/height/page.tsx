'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardBody, Alert } from '../../../../shared/components';
import { Layout, Header } from '../../../../shared/layout';
import { useAuth } from '../../../../core/auth';
import { authService } from '../../../../core/api/services';

type UnitSystem = 'metric' | 'imperial';

export default function OnboardingHeightPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  
  // Metric (cm)
  const [heightCm, setHeightCm] = useState('');
  
  // Imperial (feet + inches)
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Load user's unit preference if set
  useEffect(() => {
    if (user?.unitSystem) {
      setUnitSystem(user.unitSystem);
    }
  }, [user?.unitSystem]);

  const getHeightCm = (): number | null => {
    if (unitSystem === 'metric') {
      const val = parseFloat(heightCm);
      return val > 0 && val <= 300 ? val : null;
    } else {
      const ft = parseInt(heightFt) || 0;
      const inc = parseInt(heightIn) || 0;
      if (ft > 0 || inc > 0) {
        return Math.round((ft * 12 + inc) * 2.54);
      }
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const heightValue = getHeightCm();
    if (!heightValue) {
      setError('Please enter a valid height');
      return;
    }

    setIsLoading(true);

    try {
      if (!user?.id) throw new Error('User not found. Please log in again.');

      await authService.updateCurrentUser({
        heightCm: heightValue,
        unitSystem: unitSystem,
      });

      router.push('/onboarding/profile/weight');
    } catch (err: any) {
      console.error('Failed to save height:', err);
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const heightCmValue = parseFloat(heightCm);

  return (
    <Layout maxWidth="lg">
      <div className="min-h-screen pb-24">
        <Header
          title="Step 3 of 5: Your Height"
          subtitle="Helps us calculate your calorie needs"
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
                How tall are you?
              </h3>

              {/* Unit Toggle */}
              <div className="flex gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => setUnitSystem('metric')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    unitSystem === 'metric'
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  Metric (cm)
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
                  Imperial (ft/in)
                </button>
              </div>

              {unitSystem === 'metric' ? (
                <div className="max-w-xs">
                  <label htmlFor="height-cm" className="block text-sm font-medium text-neutral-700 mb-2">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    id="height-cm"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    placeholder="170"
                    min="50"
                    max="300"
                    className="block w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                  <p className="mt-1 text-sm text-neutral-500">
                    Typical range: 140-220 cm
                  </p>
                </div>
              ) : (
                <div className="flex gap-4 max-w-xs">
                  <div className="flex-1">
                    <label htmlFor="height-ft" className="block text-sm font-medium text-neutral-700 mb-2">
                      Feet
                    </label>
                    <input
                      type="number"
                      id="height-ft"
                      value={heightFt}
                      onChange={(e) => setHeightFt(e.target.value)}
                      placeholder="5"
                      min="1"
                      max="8"
                      className="block w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="height-in" className="block text-sm font-medium text-neutral-700 mb-2">
                      Inches
                    </label>
                    <input
                      type="number"
                      id="height-in"
                      value={heightIn}
                      onChange={(e) => setHeightIn(e.target.value)}
                      placeholder="9"
                      min="0"
                      max="11"
                      className="block w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                </div>
              )}

              {/* Height preview */}
              {getHeightCm() && (
                <div className="mt-4 p-4 bg-primary-50 rounded-lg">
                  <p className="text-sm text-primary-700">
                    Your height: <strong>{getHeightCm()} cm</strong>
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/onboarding/profile/gender')}
            >
              Back
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              size="lg"
              disabled={!getHeightCm()}
            >
              Continue
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
