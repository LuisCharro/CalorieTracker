'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardBody, Alert, Input } from '../../shared/components';
import { Layout, Header } from '../../shared/layout';
import { useAuth } from '../../core/auth';
import exercisesService, { type Exercise, type ExerciseSummary } from '../../core/api/services/exercises.service';
import { RouteGuard } from '../../core/auth/routeGuard';

export default function ExercisesPage() {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [summary, setSummary] = useState<ExerciseSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'danger'>('success');
  
  // Form state
  const [exerciseName, setExerciseName] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [caloriesBurned, setCaloriesBurned] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const [exercisesResponse, summaryData] = await Promise.all([
        exercisesService.getExercises({ userId: user.id, pageSize: 30 }),
        exercisesService.getExerciseSummary(user.id),
      ]);

      if (exercisesResponse.success) {
        setExercises(exercisesResponse.data);
      }
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to load exercise data:', error);
      setMessage('Failed to load exercise data');
      setMessageType('danger');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !exerciseName || !durationMinutes) return;

    setIsSaving(true);
    setMessage('');

    try {
      const durationMinutesNum = parseInt(durationMinutes, 10);
      if (isNaN(durationMinutesNum) || durationMinutesNum <= 0) {
        throw new Error('Please enter a valid duration');
      }

      let caloriesNum: number | undefined = undefined;
      if (caloriesBurned) {
        caloriesNum = parseInt(caloriesBurned, 10);
        if (isNaN(caloriesNum) || caloriesNum < 0) {
          throw new Error('Please enter valid calories');
        }
      }

      await exercisesService.createExercise({
        userId: user.id,
        name: exerciseName,
        durationMinutes: durationMinutesNum,
        caloriesBurned: caloriesNum,
      });

      setMessage('Exercise logged successfully!');
      setMessageType('success');
      setExerciseName('');
      setDurationMinutes('');
      setCaloriesBurned('');
      await loadData();
    } catch (error) {
      console.error('Failed to log exercise:', error);
      setMessage(error instanceof Error ? error.message : 'Failed to log exercise');
      setMessageType('danger');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (exerciseId: string) => {
    if (!user?.id || !confirm('Are you sure you want to delete this entry?')) return;

    try {
      await exercisesService.deleteExercise(exerciseId, user.id);
      setMessage('Entry deleted');
      setMessageType('success');
      await loadData();
    } catch (error) {
      console.error('Failed to delete exercise:', error);
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
            title="Exercises"
            subtitle="Log and track your physical activities"
            showBackButton
            onBack={() => window.history.back()}
          />

          {message && (
            <Alert type={messageType} className="mb-6">
              {message}
            </Alert>
          )}

          {/* Summary Card */}
          {summary && (
            <Card className="mb-6">
              <CardBody>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-neutral-500 mb-1">Workouts</p>
                    <p className="text-2xl font-bold text-primary-600">
                      {summary.totalWorkouts}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500 mb-1">Minutes</p>
                    <p className="text-2xl font-bold text-primary-600">
                      {summary.totalMinutes}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500 mb-1">Calories</p>
                    <p className="text-2xl font-bold text-primary-600">
                      {summary.totalCalories}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Log New Exercise Form */}
          <Card className="mb-6">
            <CardBody>
              <h2 className="text-lg font-semibold mb-4">Log Exercise</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <Input
                    type="text"
                    placeholder="Exercise name (e.g., Running, Cycling)"
                    value={exerciseName}
                    onChange={(e) => setExerciseName(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-3 mb-4">
                  <div className="flex-1">
                    <Input
                      type="number"
                      min="1"
                      max="1440"
                      placeholder="Duration (minutes)"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="number"
                      min="0"
                      max="10000"
                      placeholder="Calories burned (optional)"
                      value={caloriesBurned}
                      onChange={(e) => setCaloriesBurned(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSaving || !exerciseName || !durationMinutes}
                >
                  {isSaving ? 'Saving...' : 'Log Exercise'}
                </Button>
              </form>
            </CardBody>
          </Card>

          {/* Exercise History */}
          <Card>
            <CardBody>
              <h2 className="text-lg font-semibold mb-4">History</h2>
              {exercises.length === 0 ? (
                <p className="text-neutral-500 text-center py-4">
                  No exercises logged yet
                </p>
              ) : (
                <div className="space-y-3">
                  {exercises.map((exercise) => (
                    <div
                      key={exercise.id}
                      className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold">{exercise.name}</p>
                        <p className="text-sm text-neutral-500">
                          {exercise.duration_minutes} min
                          {exercise.calories_burned && ` • ${exercise.calories_burned} cal`}
                        </p>
                        <p className="text-sm text-neutral-400">
                          {formatDate(exercise.created_at)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(exercise.id)}
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
