'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardBody } from '../../shared/components';
import { Layout } from '../../shared/layout';
import { useAuth } from '../../core/auth';

export default function OnboardingWelcomePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    // If user already completed onboarding, redirect to dashboard
    if (!authLoading && user?.onboardingComplete) {
      router.push('/today');
    }
  }, [user, authLoading, router]);

  const handleGetStarted = () => {
    router.push('/onboarding/profile/birthday');
  };

  const handleAlreadyHaveAccount = () => {
    router.push('/login');
  };

  if (authLoading) {
    return (
      <Layout maxWidth="md">
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout maxWidth="md">
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
        <Card className="w-full">
          <CardBody className="py-12 text-center">
            {/* App Logo/Icon */}
            <div className="mb-8">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-primary-100">
                <svg className="h-12 w-12 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
            </div>

            {/* Welcome Text */}
            <h1 className="text-4xl font-bold text-neutral-900 mb-4">
              Welcome to CalorieTracker
            </h1>
            
            <p className="text-lg text-neutral-600 mb-8 max-w-md mx-auto">
              Your personal nutrition companion. Track your calories, monitor your progress, and reach your health goals.
            </p>

            {/* Features */}
            <div className="mb-10 space-y-4 text-left max-w-sm mx-auto">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-success-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900">Track Calories Easily</h3>
                  <p className="text-sm text-neutral-600">Log your meals with our extensive food database</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-success-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900">Personalized Goals</h3>
                  <p className="text-sm text-neutral-600">We calculate your daily calorie needs based on your profile</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-success-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900">Track Progress</h3>
                  <p className="text-sm text-neutral-600">Visualize your journey with charts and insights</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleGetStarted}
                size="lg"
                isFullWidth
              >
                Get Started
              </Button>
              
              <div className="pt-2">
                <p className="text-sm text-neutral-600">
                  Already have an account?{' '}
                  <button
                    onClick={handleAlreadyHaveAccount}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </div>

            {/* Privacy Note */}
            <p className="mt-8 text-xs text-neutral-500">
              By continuing, you agree to our Terms of Service and Privacy Policy.
              We respect your data and will never share it without your consent.
            </p>
          </CardBody>
        </Card>
      </div>
    </Layout>
  );
}
