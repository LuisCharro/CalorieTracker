'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardBody, Alert, Modal } from '../../../../shared/components';
import { Layout, Header } from '../../../../shared/layout';
import { useAuth } from '../../../../core/auth';
import { gdprService } from '../../../../core/api/services';
import { RouteGuard } from '../../../../core/auth/routeGuard';

export default function SettingsGdprDeletePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setIsDeleting(true);
    setError('');

    try {
      if (!user?.id) throw new Error('User not found');

      const response = await gdprService.requestErasure(user.id);

      // Logout and redirect to landing
      await logout();
      router.push('/');
    } catch (err: any) {
      console.error('Failed to delete account:', err);
      setError(err.message || 'Failed to delete account');
      setShowModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <RouteGuard requireAuth requireOnboardingComplete>
      <Layout maxWidth="md">
        <div className="min-h-screen pb-24">
          <Header
            title="Delete Account"
            subtitle="Permanently delete your account and all data"
            showBackButton
            onBack={() => window.history.back()}
          />

          <Card>
            <CardBody>
              <div className="mb-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-danger-100">
                      <svg className="h-6 w-6 text-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-neutral-900">
                      Account Deletion
                    </h3>
                    <p className="mt-1 text-sm text-neutral-600">
                      This action cannot be undone. Once your account is deleted,
                      all your data will be permanently removed from our servers.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-neutral-900 mb-3">
                  What will be deleted:
                </h4>
                <ul className="space-y-2 text-sm text-neutral-600">
                  <li className="flex items-start gap-2">
                    <svg className="h-5 w-5 text-danger-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>Your profile information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="h-5 w-5 text-danger-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>All food logs and entries</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="h-5 w-5 text-danger-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>Goals and preferences</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="h-5 w-5 text-danger-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>Notification settings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="h-5 w-5 text-danger-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>Consent history</span>
                  </li>
                </ul>
              </div>

              <div className="mb-6 p-4 bg-warning-50 border border-warning-200 rounded-lg">
                <h4 className="text-sm font-semibold text-warning-900 mb-2">
                  Before you delete:
                </h4>
                <ul className="space-y-1 text-sm text-warning-800">
                  <li>• Download your data first if you want a copy</li>
                  <li>• Consider exporting before proceeding</li>
                  <li>• This action is irreversible</li>
                </ul>
              </div>

              {error && (
                <Alert type="danger" className="mb-6">
                  {error}
                </Alert>
              )}

              <Button
                variant="danger"
                onClick={() => setShowModal(true)}
                size="lg"
                isFullWidth
              >
                Delete My Account
              </Button>
            </CardBody>
          </Card>

          <Card className="mt-6">
            <CardBody>
              <h4 className="text-sm font-semibold text-neutral-900 mb-3">
                Changed Your Mind?
              </h4>
              <p className="text-sm text-neutral-600">
                If you have questions or concerns about your account, please contact us
                before deleting. We're here to help!
              </p>
              <a
                href="mailto:support@calorietracker.com"
                className="mt-3 inline-block text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                support@calorietracker.com
              </a>
            </CardBody>
          </Card>

          {/* Confirmation Modal */}
          <Modal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            title="Delete Account"
            size="sm"
          >
            <div className="space-y-4">
              <p className="text-sm text-neutral-600">
                Are you sure you want to delete your account? This action cannot be undone.
              </p>
              <p className="text-sm text-neutral-600">
                All your data will be permanently removed from our servers.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                isLoading={isDeleting}
                className="flex-1"
              >
                Yes, Delete
              </Button>
            </div>
          </Modal>
        </div>
      </Layout>
    </RouteGuard>
  );
}
