'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardBody, Alert } from '../../../../shared/components';
import { Layout, Header } from '../../../../shared/layout';
import { useAuth } from '../../../../core/auth';
import { authService } from '../../../../core/api/services';

type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

const genderOptions: { value: Gender; label: string; icon: string; description: string }[] = [
  { value: 'male', label: 'Male', icon: '👨', description: 'For BMR calculations' },
  { value: 'female', label: 'Female', icon: '👩', description: 'For BMR calculations' },
  { value: 'other', label: 'Other', icon: '🧑', description: 'We\'ll use average values' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say', icon: '🙈', description: 'Skip this question' },
];

export default function OnboardingGenderPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [gender, setGender] = useState<Gender | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!gender) {
      setError('Please select an option');
      return;
    }

    setIsLoading(true);

    try {
      if (!user?.id) throw new Error('User not found. Please log in again.');

      await authService.updateCurrentUser({
        gender: gender,
      });

      router.push('/onboarding/profile/height');
    } catch (err: any) {
      console.error('Failed to save gender:', err);
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout maxWidth="lg">
      <div className="min-h-screen pb-24">
        <Header
          title="Step 2 of 5: Your Gender"
          subtitle="Helps us calculate your calorie needs accurately"
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
                What&apos;s your gender?
              </h3>
              <p className="text-sm text-neutral-600 mb-6">
                Biological sex affects metabolic rate. This helps us calculate your BMR more accurately.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                {genderOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setGender(option.value)}
                    className={`
                      relative rounded-lg border-2 p-4 text-left transition-all
                      ${gender === option.value
                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500 ring-offset-2'
                        : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{option.icon}</span>
                      <div>
                        <div className="font-medium text-neutral-900">{option.label}</div>
                        <div className="text-sm text-neutral-600">{option.description}</div>
                      </div>
                    </div>
                    {gender === option.value && (
                      <div className="absolute top-2 right-2">
                        <svg className="h-5 w-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 bg-neutral-50 rounded-lg">
                <p className="text-xs text-neutral-600">
                  <strong>Privacy note:</strong> This information is used only for BMR calculations. 
                  You can update or remove it anytime in your profile settings.
                </p>
              </div>
            </CardBody>
          </Card>

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/onboarding/profile/birthday')}
            >
              Back
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              size="lg"
              disabled={!gender}
            >
              Continue
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
