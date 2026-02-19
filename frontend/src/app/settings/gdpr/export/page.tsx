'use client';

import { useState } from 'react';
import { Button, Card, CardBody, Alert } from '../../../../shared/components';
import { Layout, Header } from '../../../../shared/layout';
import { useAuth } from '../../../../core/auth';
import { gdprService } from '../../../../core/api/services';
import { RouteGuard } from '../../../../core/auth/routeGuard';

export default function SettingsGdprExportPage() {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [exportData, setExportData] = useState<any>(null);
  const [error, setError] = useState('');

  const handleExport = async () => {
    setIsExporting(true);
    setError('');
    setExportData(null);

    try {
      if (!user?.id) throw new Error('User not found');

      const response = await gdprService.requestExport({ userId: user.id });
      
      if (response.success) {
        setExportData(response.data);
        
        // Create downloadable file
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `calorietracker-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        throw new Error(response.error?.message || 'Export failed');
      }
    } catch (err: any) {
      console.error('Failed to export data:', err);
      setError(err.message || 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <RouteGuard requireAuth requireOnboardingComplete>
      <Layout maxWidth="md">
        <div className="min-h-screen pb-24">
          <Header
            title="Export My Data"
            subtitle="Download a copy of your personal information"
            showBackButton
            onBack={() => window.history.back()}
          />

          <Card>
            <CardBody>
              <div className="mb-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
                      <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-neutral-900">
                      Data Export
                    </h3>
                    <p className="mt-1 text-sm text-neutral-600">
                      Download all your personal data in JSON format. This includes your profile,
                      food logs, goals, and settings.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-neutral-900 mb-3">
                  What's included in the export:
                </h4>
                <ul className="space-y-2 text-sm text-neutral-600">
                  <li className="flex items-start gap-2">
                    <svg className="h-5 w-5 text-success-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Profile information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="h-5 w-5 text-success-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>All food logs and entries</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="h-5 w-5 text-success-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Goals and preferences</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="h-5 w-5 text-success-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Notification settings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="h-5 w-5 text-success-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Consent history</span>
                  </li>
                </ul>
              </div>

              {error && (
                <Alert type="danger" className="mb-6">
                  {error}
                </Alert>
              )}

              <Button
                onClick={handleExport}
                isLoading={isExporting}
                size="lg"
                isFullWidth
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Data
              </Button>

              {exportData && (
                <div className="mt-6 p-4 bg-success-50 border border-success-200 rounded-lg">
                  <p className="text-sm text-success-900">
                    ✅ Export complete! Your data has been downloaded.
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          <Card className="mt-6">
            <CardBody>
              <h4 className="text-sm font-semibold text-neutral-900 mb-3">
                Need Help?
              </h4>
              <p className="text-sm text-neutral-600 mb-3">
                If you have questions about your data or need assistance with the export,
                please contact us at:
              </p>
              <a
                href="mailto:privacy@calorietracker.com"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                privacy@calorietracker.com
              </a>
            </CardBody>
          </Card>
        </div>
      </Layout>
    </RouteGuard>
  );
}
