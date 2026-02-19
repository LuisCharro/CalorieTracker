'use client';

import { useState } from 'react';
import { Button, Card, CardBody, Alert } from '../../../shared/components';
import { Layout, Header } from '../../../shared/layout';
import { useAuth } from '../../../core/auth';
import { gdprService } from '../../../core/api/services';
import { RouteGuard } from '../../../core/auth/routeGuard';

export default function SettingsPrivacyPage() {
  const { user, refreshUser } = useAuth();
  const [consents, setConsents] = useState({
    analytics: false,
    marketing: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [consentHistory, setConsentHistory] = useState<any[]>([]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');

    try {
      await gdprService.updateConsents({
        userId: user!.id,
        consents: consents,
      });
      await refreshUser();
      setMessage('Privacy settings saved');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
      setMessage('Failed to save privacy settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <RouteGuard requireAuth requireOnboardingComplete>
      <Layout maxWidth="md">
        <div className="min-h-screen pb-24">
          <Header
            title="Privacy Settings"
            subtitle="Manage your data and consent preferences"
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
                Optional Consents
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 border border-neutral-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="analytics"
                    checked={consents.analytics}
                    onChange={(e) => setConsents({ ...consents, analytics: e.target.checked })}
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

                <div className="flex items-start gap-3 p-4 border border-neutral-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="marketing"
                    checked={consents.marketing}
                    onChange={(e) => setConsents({ ...consents, marketing: e.target.checked })}
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

              <Button
                onClick={handleSave}
                isLoading={isSaving}
                size="lg"
                isFullWidth
                className="mt-6"
              >
                Save Settings
              </Button>
            </CardBody>
          </Card>

          <Card className="mt-6">
            <CardBody>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Your Data Rights
              </h3>
              <div className="space-y-3">
                <a
                  href="/settings/gdpr/export"
                  className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span className="text-sm font-medium text-neutral-900">Export My Data</span>
                  </div>
                  <svg className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>

                <a
                  href="/settings/gdpr/delete"
                  className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5 text-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="text-sm font-medium text-danger-900">Delete Account</span>
                  </div>
                  <svg className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </CardBody>
          </Card>
        </div>
      </Layout>
    </RouteGuard>
  );
}
