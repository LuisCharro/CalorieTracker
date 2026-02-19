'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardBody, Alert } from '../../../shared/components';
import { Layout, Header } from '../../../shared/layout';
import { useAuth } from '../../../core/auth';
import { goalsService } from '../../../core/api/services';
import { RouteGuard } from '../../../core/auth/routeGuard';
import type { Goal } from '../../../core/contracts/types';
import { GoalType } from '../../../core/contracts/enums';

export default function SettingsGoalsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadGoals();
  }, [user?.id]);

  const loadGoals = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const response = await goalsService.getGoals({
        goalType: GoalType.DAILY_CALORIES,
      });

      if (response.success) {
        setGoals(response.data);
      }
    } catch (error) {
      console.error('Failed to load goals:', error);
      setMessage('Failed to load goals');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      await goalsService.deleteGoal(goalId);
      setGoals(prev => prev.filter(g => g.id !== goalId));
      setMessage('Goal deleted successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to delete goal:', error);
      setMessage('Failed to delete goal');
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
            title="Goal Settings"
            subtitle="Manage your calorie goals"
            showBackButton
            onBack={() => window.history.back()}
          />

          {message && (
            <Alert type={message === 'Goal deleted successfully' ? 'success' : 'danger'} className="mb-6">
              {message}
            </Alert>
          )}

          <Card>
            <CardBody>
              <h3 className="text-lg font-semibold text-neutral-900 mb-6">
                Daily Calorie Goals
              </h3>

              {goals.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🎯</div>
                  <p className="text-neutral-600 mb-4">
                    No goals set yet
                  </p>
                  <Button onClick={() => window.location.href = '/onboarding/goals'}>
                    Set Your First Goal
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {goals.map((goal) => (
                    <div
                      key={goal.id}
                      className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-neutral-900">
                          {goal.targetValue.toLocaleString()} calories/day
                        </div>
                        <div className="text-sm text-neutral-600">
                          {new Date(goal.startDate).toLocaleDateString()}
                          {goal.endDate && ` - ${new Date(goal.endDate).toLocaleDateString()}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          goal.isActive ? 'bg-success-100 text-success-700' : 'bg-neutral-100 text-neutral-700'
                        }`}>
                          {goal.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(goal.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Card className="mt-6">
            <CardBody>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Create New Goal
              </h3>
              <p className="text-sm text-neutral-600 mb-4">
                Create a new calorie goal to track your daily intake
              </p>
              <Button
                onClick={() => window.location.href = '/onboarding/goals'}
                variant="outline"
                isFullWidth
              >
                Create Goal
              </Button>
            </CardBody>
          </Card>
        </div>
      </Layout>
    </RouteGuard>
  );
}
