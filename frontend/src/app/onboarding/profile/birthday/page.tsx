'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardBody, Alert } from '../../../../shared/components';
import { Layout, Header } from '../../../../shared/layout';
import { useAuth } from '../../../../core/auth';
import { authService } from '../../../../core/api/services';

export default function OnboardingBirthdayPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [birthDate, setBirthDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculate age from birth date
  const age = useMemo(() => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let calculatedAge = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      calculatedAge--;
    }
    return calculatedAge;
  }, [birthDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!birthDate) {
      setError('Please enter your birthday');
      return;
    }

    if (age !== null && (age < 13 || age > 120)) {
      setError('You must be at least 13 years old to use CalorieTracker');
      return;
    }

    setIsLoading(true);

    try {
      if (!user?.id) throw new Error('User not found. Please log in again.');

      await authService.updateCurrentUser({
        dateOfBirth: birthDate,
      });

      router.push('/onboarding/profile/gender');
    } catch (err: any) {
      console.error('Failed to save birthday:', err);
      setError(err.message || 'Failed to save birthday. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate min date (13 years ago) and max date (120 years ago)
  const today = new Date();
  const minDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate())
    .toISOString().split('T')[0];
  const maxDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate())
    .toISOString().split('T')[0];

  return (
    <Layout maxWidth="lg">
      <div className="min-h-screen pb-24">
        <Header
          title="Step 1 of 5: Your Birthday"
          subtitle="We use this to calculate your daily calorie needs"
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
                When were you born?
              </h3>
              <p className="text-sm text-neutral-600 mb-6">
                Your age helps us calculate your basal metabolic rate (BMR) - the calories your body burns at rest.
              </p>

              <div className="max-w-xs">
                <label htmlFor="birthday" className="block text-sm font-medium text-neutral-700 mb-2">
                  Birthday
                </label>
                <input
                  type="date"
                  id="birthday"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  min={maxDate}
                  max={minDate}
                  className="block w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-900 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  required
                />
              </div>

              {age !== null && (
                <div className="mt-4 p-4 bg-primary-50 rounded-lg">
                  <p className="text-sm text-primary-700">
                    You are <strong>{age} years old</strong>
                  </p>
                </div>
              )}

              <div className="mt-6 p-4 bg-neutral-50 rounded-lg">
                <p className="text-xs text-neutral-600">
                  <strong>Privacy note:</strong> Your birthday is stored securely and only used for calorie calculations. 
                  We never share this information with third parties.
                </p>
              </div>
            </CardBody>
          </Card>

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/onboarding')}
            >
              Back
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              size="lg"
              disabled={!birthDate}
            >
              Continue
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
