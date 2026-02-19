'use client';

import { useState } from 'react';
import { Button, Card, CardBody, Alert } from '../../../shared/components';
import { Layout, Header } from '../../../shared/layout';
import { useAuth } from '../../../core/auth';
import { authService } from '../../../core/api/services';
import { RouteGuard } from '../../../core/auth/routeGuard';

export default function SettingsPreferencesPage() {
  const { user, refreshUser } = useAuth();
  const [preferences, setPreferences] = useState(user?.preferences || {});
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');

    try {
      await authService.updateCurrentUser({ preferences });
      await refreshUser();
      setMessage('Preferences saved successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      setMessage('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <RouteGuard requireAuth requireOnboardingComplete>
      <Layout maxWidth="md">
        <div className="min-h-screen pb-24">
          <Header
            title="Preferences"
            subtitle="Customize your app experience"
            showBackButton
            onBack={() => window.history.back()}
          />

          {message && (
            <Alert type={message.includes('success') ? 'success' : 'danger'} className="mb-6">
              {message}
            </Alert>
          )}

          <Card>
            <CardBody>
              <h3 className="text-lg font-semibold text-neutral-900 mb-6">
                App Preferences
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                  <div>
                    <div className="text-sm font-medium text-neutral-900">Diet Type</div>
                    <div className="text-xs text-neutral-600">Your eating style</div>
                  </div>
                  <select
                    value={(preferences as any).diet || 'omnivore'}
                    onChange={(e) => setPreferences({ ...preferences, diet: e.target.value })}
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  >
                    <option value="omnivore">Omnivore</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="keto">Keto</option>
                    <option value="paleo">Paleo</option>
                  </select>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                  <div>
                    <div className="text-sm font-medium text-neutral-900">Meal Tracking</div>
                    <div className="text-xs text-neutral-600">Which meals you track</div>
                  </div>
                  <select
                    value={(preferences as any).meals || '["breakfast","lunch","dinner"]'}
                    onChange={(e) => setPreferences({ ...preferences, meals: e.target.value })}
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  >
                    <option value='["breakfast","lunch","dinner"]'>3 meals</option>
                    <option value='["breakfast","lunch","dinner","snack"]'>3 meals + snacks</option>
                  </select>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-medium text-neutral-900">Timezone</div>
                    <div className="text-xs text-neutral-600">For accurate logging times</div>
                  </div>
                  <select
                    value={(preferences as any).timezone || 'UTC'}
                    onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Central European</option>
                  </select>
                </div>
              </div>

              <Button
                onClick={handleSave}
                isLoading={isSaving}
                size="lg"
                isFullWidth
                className="mt-6"
              >
                Save Preferences
              </Button>
            </CardBody>
          </Card>
        </div>
      </Layout>
    </RouteGuard>
  );
}
