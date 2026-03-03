'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardBody, CardHeader, Alert, Input, EmptyState, Modal } from '../../../shared/components';
import { Layout, Header } from '../../../shared/layout';
import { useAuth } from '../../../core/auth';
import { weightLogsService, type WeightLog, type WeightProgress } from '../../../core/api/services';
import { WeightTrendChart, type TimeRange } from '../../../shared/components/WeightTrendChart';
import { RouteGuard } from '../../../core/auth/routeGuard';

export default function SettingsWeightPage() {
  const { user } = useAuth();
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [latestWeight, setLatestWeight] = useState<WeightLog | null>(null);
  const [weightProgress, setWeightProgress] = useState<WeightProgress | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'danger'>('success');
  
  // Form state
  const [weightValue, setWeightValue] = useState('');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [notes, setNotes] = useState('');

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLog, setEditingLog] = useState<WeightLog | null>(null);
  const [editWeightValue, setEditWeightValue] = useState('');
  const [editWeightUnit, setEditWeightUnit] = useState('kg');
  const [editNotes, setEditNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editMessage, setEditMessage] = useState('');
  const [editMessageType, setEditMessageType] = useState<'success' | 'danger'>('success');

  // Delete confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const [logsResponse, latest, progress] = await Promise.all([
        weightLogsService.getWeightLogs({ userId: user.id, pageSize: 30 }),
        weightLogsService.getLatestWeight(user.id),
        weightLogsService.getProgress(user.id),
      ]);

      if (logsResponse.success) {
        setWeightLogs(logsResponse.data);
      }
      setLatestWeight(latest);
      setWeightProgress(progress);
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
    if (!user?.id) return;
    
    // Show confirmation modal instead of browser confirm
    setDeletingLogId(logId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!user?.id || !deletingLogId) return;

    setIsDeleting(true);
    try {
      await weightLogsService.deleteWeightLog(deletingLogId, user.id);
      setMessage('Entry deleted');
      setMessageType('success');
      setShowDeleteConfirm(false);
      setDeletingLogId(null);
      await loadData();
    } catch (error) {
      console.error('Failed to delete weight log:', error);
      setMessage('Failed to delete entry');
      setMessageType('danger');
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = (log: WeightLog) => {
    setEditingLog(log);
    setEditWeightValue(log.weight_value.toString());
    setEditWeightUnit(log.weight_unit);
    setEditNotes(log.notes || '');
    setEditMessage('');
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    if (!user?.id || !editingLog) return;

    setIsEditing(true);
    setEditMessage('');

    try {
      const weightValueNum = parseFloat(editWeightValue);
      if (isNaN(weightValueNum) || weightValueNum <= 0) {
        throw new Error('Please enter a valid weight');
      }

      await weightLogsService.updateWeightLog(editingLog.id, {
        userId: user.id,
        weightValue: weightValueNum,
        weightUnit: editWeightUnit,
        notes: editNotes || undefined,
      });

      setMessage('Entry updated successfully!');
      setMessageType('success');
      setShowEditModal(false);
      setEditingLog(null);
      await loadData();
    } catch (error) {
      console.error('Failed to update weight log:', error);
      setEditMessage(error instanceof Error ? error.message : 'Failed to update entry');
      setEditMessageType('danger');
    } finally {
      setIsEditing(false);
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
            <Card className="mb-6 shadow-lg shadow-neutral-200/50 border-0 rounded-2xl">
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
          <Card className="mb-6 shadow-lg shadow-neutral-200/50 border-0 rounded-2xl">
              <CardHeader className="border-l-4 border-l-primary-500 bg-gradient-to-r from-primary-50/30 to-white border-b border-neutral-100">
                <h2 className="text-lg font-semibold">Log New Weight</h2>
              </CardHeader>
              <CardBody>
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

          {/* Weight Trend Chart */}
          {weightProgress?.hasData && (
            <Card className="mb-6 shadow-lg shadow-neutral-200/50 border-0 rounded-2xl">
              <CardHeader className="border-l-4 border-l-primary-500 bg-gradient-to-r from-primary-50/30 to-white border-b border-neutral-100">
                <h2 className="text-lg font-semibold">Weight Trend</h2>
              </CardHeader>
              <CardBody>
                <WeightTrendChart
                  data={timeRange === '7d' ? weightProgress.trend7d : weightProgress.trend30d}
                  timeRange={timeRange}
                  targetWeight={weightProgress.targetWeight}
                  onTimeRangeChange={setTimeRange}
                  showTimeRangeToggle
                  height={250}
                />
              </CardBody>
            </Card>
          )}

          {/* Weight History */}
          <Card className="shadow-lg shadow-neutral-200/50 border-0 rounded-2xl">
            <CardHeader className="border-l-4 border-l-primary-500 bg-gradient-to-r from-primary-50/30 to-white border-b border-neutral-100">
              <h2 className="text-lg font-semibold">History</h2>
            </CardHeader>
            <CardBody>
              {weightLogs.length === 0 ? (
                <EmptyState
                  icon="⚖️"
                  title="No weight entries yet"
                  description="Start tracking your weight to see your progress over time"
                  actionLabel="Log Weight"
                />
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(log)}
                          className="text-neutral-400 hover:text-primary-500 transition-colors p-1"
                          title="Edit entry"
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(log.id)}
                          className="text-neutral-400 hover:text-red-500 transition-colors p-1"
                          title="Delete entry"
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
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Edit Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Weight Entry"
          footer={
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEdit}
                disabled={isEditing || !editWeightValue}
                className="flex-1"
              >
                {isEditing ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          }
        >
          {editMessage && (
            <Alert type={editMessageType} className="mb-4">
              {editMessage}
            </Alert>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Weight
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="500"
                  placeholder="Weight"
                  value={editWeightValue}
                  onChange={(e) => setEditWeightValue(e.target.value)}
                  className="flex-1"
                />
                <select
                  value={editWeightUnit}
                  onChange={(e) => setEditWeightUnit(e.target.value)}
                  className="px-3 py-2 border border-neutral-300 rounded-lg bg-white"
                >
                  <option value="kg">kg</option>
                  <option value="lb">lb</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Notes (optional)
              </label>
              <Input
                type="text"
                placeholder="Add a note..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
              />
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setDeletingLogId(null);
          }}
          title="Delete Weight Entry"
          footer={
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingLogId(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={isDeleting}
                variant="danger"
                className="flex-1"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          }
        >
          <p className="text-neutral-600">
            Are you sure you want to delete this weight entry? This action cannot be undone.
          </p>
        </Modal>
      </Layout>
    </RouteGuard>
  );
}
