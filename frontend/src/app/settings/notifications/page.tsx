'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardBody, Alert, Input } from '../../../shared/components';
import { Layout, Header } from '../../../shared/layout';
import { useAuth } from '../../../core/auth';
import { settingsService } from '../../../core/api/services';
import { RouteGuard } from '../../../core/auth/routeGuard';
import type { NotificationSettings } from '../../../core/contracts/types';

export default function SettingsNotificationsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Partial<NotificationSettings>>({
    emailReminders: true,
    mealReminders: true,
    reminderTimes: ['08:00', '12:00', '18:00'],
    goalAlerts: true,
    weeklySummary: true,
    marketingEmails: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'danger'>('success');

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user?.id) return;

      try {
        const response = await settingsService.getNotificationSettings(user.id);
        setSettings(response);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [user?.id]);

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    setMessage('');

    try {
      await settingsService.updateNotificationSettings(user.id, settings);
      setMessage('Settings saved successfully');
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setMessage('Failed to save settings');
      setMessageType('danger');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Layout maxWidth="md">
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-neutral-200 border-t-primary-500 rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <RouteGuard requireAuth requireOnboardingComplete>
      <Layout maxWidth="md">
        <div className="min-h-screen pb-24">
          <Header
            title="Notification Settings"
            subtitle="Manage how you receive updates"
          />

          {message && (
            <Alert type={messageType} className="mb-6">
              {message}
            </Alert>
          )}

          <Card className="mb-6">
            <CardBody>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Email Notifications
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                  <div>
                    <div className="font-medium text-neutral-900">Meal Reminders</div>
                    <div className="text-sm text-neutral-500">Get reminded to log your meals</div>
                  </div>
                  <button
                    onClick={() => handleToggle('mealReminders')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.mealReminders ? 'bg-primary-500' : 'bg-neutral-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.mealReminders ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                  <div>
                    <div className="font-medium text-neutral-900">Goal Alerts</div>
                    <div className="text-sm text-neutral-500">Get notified when you reach your daily goals</div>
                  </div>
                  <button
                    onClick={() => handleToggle('goalAlerts')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.goalAlerts ? 'bg-primary-500' : 'bg-neutral-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.goalAlerts ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                  <div>
                    <div className="font-medium text-neutral-900">Weekly Summary</div>
                    <div className="text-sm text-neutral-500">Receive a weekly summary of your progress</div>
                  </div>
                  <button
                    onClick={() => handleToggle('weeklySummary')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.weeklySummary ? 'bg-primary-500' : 'bg-neutral-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.weeklySummary ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium text-neutral-900">Marketing Emails</div>
                    <div className="text-sm text-neutral-500">Receive emails about new features and updates</div>
                  </div>
                  <button
                    onClick={() => handleToggle('marketingEmails')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.marketingEmails ? 'bg-primary-500' : 'bg-neutral-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.marketingEmails ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="mb-6">
            <CardBody>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Reminder Times
              </h3>
              <p className="text-sm text-neutral-500 mb-4">
                Set when you'd like to receive meal reminders
              </p>

              <div className="space-y-3">
                {settings.reminderTimes?.map((time, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => {
                        const newTimes = [...(settings.reminderTimes || [])];
                        newTimes[index] = e.target.value;
                        setSettings(prev => ({ ...prev, reminderTimes: newTimes }));
                      }}
                    />
                    <button
                      onClick={() => {
                        const newTimes = (settings.reminderTimes || []).filter((_, i) => i !== index);
                        setSettings(prev => ({ ...prev, reminderTimes: newTimes }));
                      }}
                      className="text-neutral-400 hover:text-danger-600"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}

                {(settings.reminderTimes || []).length < 5 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newTimes = [...(settings.reminderTimes || []), '12:00'];
                      setSettings(prev => ({ ...prev, reminderTimes: newTimes }));
                    }}
                  >
                    + Add Reminder Time
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>

          <Button
            onClick={handleSave}
            isLoading={isSaving}
            isFullWidth
            size="lg"
          >
            Save Settings
          </Button>
        </div>
      </Layout>
    </RouteGuard>
  );
}
