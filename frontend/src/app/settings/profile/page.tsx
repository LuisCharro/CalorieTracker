'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardBody, Input, Alert } from '../../../shared/components';
import { Layout, Header } from '../../../shared/layout';
import { useAuth } from '../../../core/auth';
import { authService } from '../../../core/api/services';
import { RouteGuard } from '../../../core/auth/routeGuard';

export default function SettingsProfilePage() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'danger'>('success');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');

    try {
      await authService.updateCurrentUser({
        displayName: formData.displayName,
      });

      await refreshUser();
      setMessage('Profile updated successfully');
      setMessageType('success');

      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
      setMessage('Failed to update profile. Please try again.');
      setMessageType('danger');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      await logout();
      router.push('/login');
    }
  };

  return (
    <RouteGuard requireAuth requireOnboardingComplete>
      <Layout maxWidth="md">
        <div className="min-h-screen pb-24">
          <Header
            title="Profile Settings"
            subtitle="Manage your account information"
          />

          {message && (
            <Alert type={messageType} className="mb-6">
              {message}
            </Alert>
          )}

          <Card>
            <CardBody>
              <h3 className="text-lg font-semibold text-neutral-900 mb-6">
                Profile Information
              </h3>

              <form onSubmit={handleSave} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Display Name
                  </label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="John Doe"
                    value={formData.displayName}
                    onChange={handleChange}
                    helperText="This name will be shown in the app"
                    isFullWidth
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    helperText="Email cannot be changed"
                    isFullWidth
                  />
                </div>

                <Button
                  type="submit"
                  isLoading={isSaving}
                  isFullWidth
                  size="lg"
                >
                  Save Changes
                </Button>
              </form>
            </CardBody>
          </Card>

          <Card className="mt-6">
            <CardBody>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Account Actions
              </h3>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  isFullWidth
                >
                  Log Out
                </Button>

                <a
                  href="/settings/gdpr/export"
                  className="block w-full"
                >
                  <Button
                    variant="outline"
                    isFullWidth
                  >
                    Export My Data
                  </Button>
                </a>

                <a
                  href="/settings/gdpr/delete"
                  className="block w-full"
                >
                  <Button
                    variant="danger"
                    isFullWidth
                  >
                    Delete Account
                  </Button>
                </a>
              </div>
            </CardBody>
          </Card>

          <div className="mt-6 grid grid-cols-3 gap-4">
            <a href="/settings/goals" className="text-center">
              <div className="rounded-lg border border-neutral-200 p-4 hover:border-primary-500 transition-colors">
                <div className="text-2xl mb-2">🎯</div>
                <div className="text-sm font-medium text-neutral-900">Goals</div>
              </div>
            </a>
            <a href="/settings/preferences" className="text-center">
              <div className="rounded-lg border border-neutral-200 p-4 hover:border-primary-500 transition-colors">
                <div className="text-2xl mb-2">⚙️</div>
                <div className="text-sm font-medium text-neutral-900">Preferences</div>
              </div>
            </a>
            <a href="/settings/privacy" className="text-center">
              <div className="rounded-lg border border-neutral-200 p-4 hover:border-primary-500 transition-colors">
                <div className="text-2xl mb-2">🔒</div>
                <div className="text-sm font-medium text-neutral-900">Privacy</div>
              </div>
            </a>
          </div>
        </div>
      </Layout>
    </RouteGuard>
  );
}
