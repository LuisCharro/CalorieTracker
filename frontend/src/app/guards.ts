export type LifecycleState =
  | 'unauthenticated'
  | 'authenticated_onboarding_incomplete'
  | 'authenticated_onboarding_complete'
  | 'soft_deleted';

export function resolveLifecycleState(input: {
  isAuthenticated: boolean;
  onboardingComplete?: boolean;
  isDeleted?: boolean;
}): LifecycleState {
  if (!input.isAuthenticated) return 'unauthenticated';
  if (input.isDeleted) return 'soft_deleted';
  if (!input.onboardingComplete) return 'authenticated_onboarding_incomplete';
  return 'authenticated_onboarding_complete';
}
