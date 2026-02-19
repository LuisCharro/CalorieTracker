'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardBody } from '../../../shared/components';
import { Layout } from '../../../shared/layout';
import { useAuth } from '../../../core/auth';
import { settingsService } from '../../../core/api/services';

export default function OnboardingCompletePage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [isCompleting, setIsCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    completeOnboarding();
  }, []);

  const completeOnboarding = async () => {
    setIsCompleting(true);
    try {
      if (!user?.id) throw new Error('User not found');

      await settingsService.completeOnboarding(user.id);
      await refreshUser();
      setCompleted(true);

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/today');
      }, 3000);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleContinue = () => {
    router.push('/today');
  };

  if (isCompleting) {
    return (
      <Layout maxWidth="md">
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <Card className="w-full">
            <CardBody className="py-12 text-center">
              <div className="mb-6">
                <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-neutral-200 border-t-primary-500" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                Setting up your account...
              </h2>
              <p className="text-neutral-600">
                Please wait while we finalize your preferences.
              </p>
            </CardBody>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout maxWidth="md">
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Card className="w-full">
          <CardBody className="py-12 text-center">
            <div className="mb-6">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success-100">
                <svg className="h-10 w-10 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-neutral-900 mb-3">
              Welcome to CalorieTracker!
            </h2>

            <p className="text-lg text-neutral-600 mb-8">
              Your account is all set up and ready to go.
            </p>

            <div className="mb-8 space-y-3 text-left">
              <div className="flex items-center gap-3 text-neutral-700">
                <svg className="h-5 w-5 text-success-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Your calorie goal has been set</span>
              </div>
              <div className="flex items-center gap-3 text-neutral-700">
                <svg className="h-5 w-5 text-success-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Your preferences are saved</span>
              </div>
              <div className="flex items-center gap-3 text-neutral-700">
                <svg className="h-5 w-5 text-success-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Your privacy settings are configured</span>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-sm text-neutral-500 mb-2">
                Redirecting to your dashboard in 3 seconds...
              </p>
              <div className="mx-auto h-1 w-48 overflow-hidden rounded-full bg-neutral-200">
                <div className="h-full w-full animate-pulse bg-primary-500" />
              </div>
            </div>

            <Button
              onClick={handleContinue}
              size="lg"
              isFullWidth
            >
              Go to Dashboard
            </Button>

            <p className="mt-4 text-sm text-neutral-500">
              or continue waiting for automatic redirect
            </p>
          </CardBody>
        </Card>
      </div>
    </Layout>
  );
}
