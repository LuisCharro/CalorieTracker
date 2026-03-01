'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardBody, Alert, Input } from '../../../shared/components';
import { Layout, Header } from '../../../shared/layout';
import { useAuth } from '../../../core/auth';
import { weightLogsService, type WeightLog } from '../../../core/api/services';
import { RouteGuard } from '../../../core/auth/routeGuard';

export default function SettingsWeightPage() {
  const { user } = useAuth();
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [latestWeight, setLatestWeight] = useState<WeightLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'danger'>('success');
  
  // Form state
  const [weightValue, setWeightValue] = useState('');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const [logsResponse, latest] = await Promise.all([
        weightLogsService.getWeightLogs({ userId: user.id, pageSize: 30 }),
        weightLogsService.getLatestWeight(user.id),
      ]);

      if (logsResponse.success) {
        setWeightLogs(logsResponse.data);
      }
      setLatestWeight(latest);
    } catch (error) {
      console.error('Failed to load weight data:', error);
      setMessage('Failed to load weight data');
      setMessageType('danger');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !weightValue) return;

    setIsSaving(true);
    setMessage('');

    try {
      const weightValueNum = parseFloat(weightValue);
      if (isNaN(weightValueNum) || weightValueNum <= 0) {
        throw new Error('Please enter a valid weight');
      }

      await weightLogsService.createWeightLog({
        userId: user.id,
        weightValue: weightValueNum,
        weightUnit,
        notes: notes || undefined,
      });

      setMessage('Weight logged successfully!');
      setMessageType('success');
      setWeightValue('');
      setNotes('');
      await loadData();
    } catch (error) {
      console.error('Failed to log weight:', error);
      setMessage(error instanceof Error ? error.message : 'Failed to log weight');
      setMessageType('danger');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (logId: string) => {
    if (!user?.id || !confirm('Are you sure you want to delete this entry?')) return;

    try {
      await weightLogsService.deleteWeightLog(logId, user.id);
      setMessage('Entry deleted');
      setMessageType('success');
      await loadData();
    } catch (error) {
      console.error('Failed to delete weight log:', error);
      setMessage('Failed to delete entry');
      setMessageType('danger');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
            title="Weight Tracking"
            subtitle="Log and track your body weight"
            showBackButton
            onBack={() => window.history.back()}
          />

          {message && (
            <Alert type={messageType} className="mb-6" >
              {message}
            </Alert>
          )}

          {/* Current Weight Card */}
          {latestWeight && (
            <Card className="mb-6">
              <CardBody>
                <div className="text-center">
                  <p className="text-sm text-neutral-500 mb-1">Current Weight</p>
                  <p className="text-4xl font-bold text-primary-600">
                    {latestWeight.weight_value} {latestWeight.weight_unit}
                  </p>
                  <p className="text-sm text-neutral-400 mt-2">
                    {formatDate(latestWeight.logged_at)}
                  </p>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Log New Weight Form */}
          <Card className="mb-6">
            <CardBody>
              <h2 className="text-lg font-semibold mb-4">Log New Weight</h2>
              <form onSubmit={handleSubmit}>
                <div className="flex gap-3 mb-4">
                  <div className="flex-1">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="500"
                      placeholder="Weight"
                      value={weightValue}
                      onChange={(e) => setWeightValue(e.target.value)}
                      required
                    />
                  </div>
                  <select
                    value={weightUnit}
                    onChange={(e) => setWeightUnit(e.target.value)}
                    className="px-3 py-2 border border-neutral-300 rounded-lg bg-white"
                  >
                    <option value="kg">kg</option>
                    <option value="lb">lb</option>
                  </select>
                </div>
                <div className="mb-4">
                  <Input
                    type="text"
                    placeholder="Notes (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSaving || !weightValue}
                >
                  {isSaving ? 'Saving...' : 'Log Weight'}
                </Button>
              </form>
            </CardBody>
          </Card>

          {/* Weight History */}
          <Card>
            <CardBody>
              <h2 className="text-lg font-semibold mb-4">History</h2>
              {weightLogs.length === 0 ? (
                <p className="text-neutral-500 text-center py-4">
                  No weight entries yet
                </p>
              ) : (
                <div className="space-y-3">
                  {weightLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold">
                          {log.weight_value} {log.weight_unit}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {formatDate(log.logged_at)}
                        </p>
                        {log.notes && (
                          <p className="text-sm text-neutral-400 mt-1">
                            {log.notes}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="text-neutral-400 hover:text-red-500 transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </Layout>
    </RouteGuard>
  );
}
