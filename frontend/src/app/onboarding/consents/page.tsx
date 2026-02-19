'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardBody, Alert } from '../../../shared/components';
import { Layout, Header } from '../../../shared/layout';
import { useAuth } from '../../../core/auth';
import { authService } from '../../../core/api/services';

type ConsentValue = 'granted' | 'denied' | null;

export default function OnboardingConsentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [requiredConsents, setRequiredConsents] = useState<Record<string, ConsentValue>>({
    privacy_policy: null,
    terms_of_service: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isAllRequiredGranted = Object.values(requiredConsents).every(v => v === 'granted');

  const handleRequiredConsent = (consent: string, value: ConsentValue) => {
    setRequiredConsents(prev => ({ ...prev, [consent]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isAllRequiredGranted) {
      setError('You must accept the required consents to continue');
      return;
    }

    setIsLoading(true);

    try {
      if (!user?.id) throw new Error('User not found');

      const booleanConsents: Record<string, boolean> = {};
      for (const [key, value] of Object.entries(requiredConsents)) {
        booleanConsents[key] = value === 'granted';
      }

      await authService.submitConsents({
        userId: user.id,
        consents: booleanConsents,
      });

      router.push('/onboarding/consents-optional');
    } catch (err: any) {
      console.error('Failed to save consents:', err);
      setError(err.message || 'Failed to save consents. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout maxWidth="lg">
      <div className="min-h-screen pb-24">
        <Header
          title="Step 3 of 3: Your Privacy"
          subtitle="Review and accept our terms"
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
                Required Consents
              </h3>
              <p className="text-sm text-neutral-600 mb-4">
                You must accept these to use CalorieTracker.
              </p>

              <div className="space-y-4">
                <div className="rounded-lg border-2 border-neutral-200 bg-white p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="privacy_policy"
                      checked={requiredConsents.privacy_policy === 'granted'}
                      onChange={(e) => handleRequiredConsent('privacy_policy', e.target.checked ? 'granted' : 'denied')}
                      className="mt-1 h-4 w-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                      required
                    />
                    <div className="flex-1">
                      <label htmlFor="privacy_policy" className="font-medium text-neutral-900 cursor-pointer">
                        Privacy Policy
                      </label>
                      <p className="mt-1 text-sm text-neutral-600">
                        I have read and agree to the{' '}
                        <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">
                          Privacy Policy
                        </a>, including how my data is collected, used, and protected.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border-2 border-neutral-200 bg-white p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="terms_of_service"
                      checked={requiredConsents.terms_of_service === 'granted'}
                      onChange={(e) => handleRequiredConsent('terms_of_service', e.target.checked ? 'granted' : 'denied')}
                      className="mt-1 h-4 w-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                      required
                    />
                    <div className="flex-1">
                      <label htmlFor="terms_of_service" className="font-medium text-neutral-900 cursor-pointer">
                        Terms of Service
                      </label>
                      <p className="mt-1 text-sm text-neutral-600">
                        I have read and agree to the{' '}
                        <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">
                          Terms of Service
                        </a>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/onboarding/preferences')}
            >
              Back
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              size="lg"
              disabled={!isAllRequiredGranted}
            >
              Continue
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
