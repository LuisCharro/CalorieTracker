'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardBody, Alert } from '../../../shared/components';
import { Layout, Header } from '../../../shared/layout';
import { useAuth } from '../../../core/auth';
import { authService } from '../../../core/api/services';

type ConsentValue = 'granted' | 'denied' | null;

export default function OnboardingConsentsOptionalPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [optionalConsents, setOptionalConsents] = useState<Record<string, ConsentValue>>({
    analytics: null,
    marketing: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOptionalConsent = (consent: string, value: ConsentValue) => {
    setOptionalConsents(prev => ({ ...prev, [consent]: value }));
  };

  const handleSkip = async () => {
    router.push('/onboarding/complete');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    setIsLoading(true);

    try {
      if (!user?.id) throw new Error('User not found');

      const booleanConsents: Record<string, boolean> = {};
      for (const [key, value] of Object.entries(optionalConsents)) {
        booleanConsents[key] = value === 'granted';
      }

      await authService.submitConsents({
        userId: user.id,
        consents: booleanConsents,
      });

      router.push('/onboarding/complete');
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
          title="Optional: Help Us Improve"
          subtitle="Customize your experience (optional)"
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
                Optional Consents
              </h3>
              <p className="text-sm text-neutral-600 mb-6">
                These help us improve the app but are optional. You can change these later in Settings &gt; Privacy.
              </p>

              <div className="space-y-4">
                <div className="rounded-lg border-2 border-neutral-200 bg-white p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="analytics"
                      checked={optionalConsents.analytics === 'granted'}
                      onChange={(e) => handleOptionalConsent('analytics', e.target.checked ? 'granted' : 'denied')}
                      className="mt-1 h-4 w-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <label htmlFor="analytics" className="font-medium text-neutral-900 cursor-pointer">
                        Analytics
                      </label>
                      <p className="mt-1 text-sm text-neutral-600">
                        Allow anonymous usage analytics to help us improve the app. No personal data is collected.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border-2 border-neutral-200 bg-white p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="marketing"
                      checked={optionalConsents.marketing === 'granted'}
                      onChange={(e) => handleOptionalConsent('marketing', e.target.checked ? 'granted' : 'denied')}
                      className="mt-1 h-4 w-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <label htmlFor="marketing" className="font-medium text-neutral-900 cursor-pointer">
                        Marketing Communications
                      </label>
                      <p className="mt-1 text-sm text-neutral-600">
                        Receive occasional emails about new features, tips, and updates. You can unsubscribe anytime.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-xs text-neutral-500">
                You can change these consents at any time in Settings &gt; Privacy.
              </p>
            </CardBody>
          </Card>

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/onboarding/consents')}
            >
              Back
            </Button>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={handleSkip}
              >
                Skip for now
              </Button>
              <Button
                type="submit"
                isLoading={isLoading}
                size="lg"
              >
                Continue
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
