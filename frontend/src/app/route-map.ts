export const routeMap = {
  public: ['/', '/login', '/signup', '/privacy', '/terms'],
  onboarding: [
    '/onboarding/goals',
    '/onboarding/preferences',
    '/onboarding/consents',
    '/onboarding/consents-optional',
    '/onboarding/complete'
  ],
  core: ['/log', '/log/search', '/log/confirm', '/today', '/today/meal/[id]', '/history', '/history/entry/[id]'],
  settings: [
    '/settings/profile',
    '/settings/goals',
    '/settings/preferences',
    '/settings/notifications',
    '/settings/privacy',
    '/settings/gdpr/export',
    '/settings/gdpr/delete'
  ]
};
