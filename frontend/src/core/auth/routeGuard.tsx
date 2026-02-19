'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import { Loading } from '../../shared/components';

// ============================================================================
// Types
// ============================================================================

interface RouteGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireOnboardingComplete?: boolean;
  redirectTo?: string;
}

// ============================================================================
// Component
// ============================================================================

export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requireAuth = true,
  requireOnboardingComplete = false,
  redirectTo,
}) => {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    // Redirect to login if auth required but not authenticated
    if (requireAuth && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Redirect to onboarding if onboarding required but incomplete
    if (requireOnboardingComplete && isAuthenticated && user && !user.onboardingComplete) {
      router.push('/onboarding/goals');
      return;
    }

    // Redirect authenticated users away from login/signup
    if (!requireAuth && isAuthenticated && (window.location.pathname === '/login' || window.location.pathname === '/signup')) {
      if (user?.onboardingComplete) {
        router.push('/today');
      } else {
        router.push('/onboarding/goals');
      }
      return;
    }
  }, [isLoading, isAuthenticated, user, requireAuth, requireOnboardingComplete, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading size="lg" text="Loading..." />
      </div>
    );
  }

  // If auth required but not authenticated, don't render children (will redirect)
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // If onboarding required but incomplete, don't render children (will redirect)
  if (requireOnboardingComplete && isAuthenticated && user && !user.onboardingComplete) {
    return null;
  }

  return <>{children}</>;
};

export default RouteGuard;
