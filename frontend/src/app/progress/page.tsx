'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button, Card, CardHeader, CardBody, Alert, EmptyState } from '../../shared/components';
import { Layout, Header, Navigation } from '../../shared/layout';
import { useAuth } from '../../core/auth';
import { logsService, weightLogsService, waterLogsService, goalsService } from '../../core/api/services';
import { WeightTrendChart, CalorieChart, WaterChart } from '../../shared/components';
import type { TimeRange as WeightTimeRange } from '../../shared/components/WeightTrendChart';
import type { TimeRange as CalorieTimeRange } from '../../shared/components/CalorieChart';
import type { TimeRange as WaterTimeRange } from '../../shared/components/WaterChart';
import type { DailySummary } from '../../core/api/services/logs.service';
import type { WeightProgress } from '../../core/api/services/weight-logs.service';
import type { WaterProgress } from '../../core/api/services/water-logs.service';
import type { Goal } from '../../core/contracts/types';
import { GoalType } from '../../core/contracts/enums';
import { RouteGuard } from '../../core/auth/routeGuard';

type ProgressTab = 'weight' | 'calories' | 'macros' | 'water';

export default function ProgressPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ProgressTab>('calories');
  
  const [weightProgress, setWeightProgress] = useState<WeightProgress | null>(null);
  const [calorieData, setCalorieData] = useState<DailySummary[]>([]);
  const [waterData, setWaterData] = useState<WaterProgress[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  
  const [weightTimeRange, setWeightTimeRange] = useState<WeightTimeRange>('30d');
  const [calorieTimeRange, setCalorieTimeRange] = useState<CalorieTimeRange>('30d');
  const [waterTimeRange, setWaterTimeRange] = useState<WaterTimeRange>('30d');
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const getDateRange = (range: string): { startDate: string; endDate: string } => {
    const endDate = new Date().toISOString().split('T')[0];
    let startDate: string;
    
    switch (range) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
    
    return { startDate, endDate };
  };

  const loadData = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError('');

    try {
        const [weight, calories, water, goalsData] = await Promise.all([
        weightLogsService.getProgress(user.id),
        logsService.getDailySummary(
          user.id,
          getDateRange(calorieTimeRange).startDate,
          getDateRange(calorieTimeRange).endDate
        ),
        waterLogsService.getProgress(
          user.id,
          getDateRange(waterTimeRange).startDate,
          getDateRange(waterTimeRange).endDate
        ),
        goalsService.getGoals({ userId: user.id }),
      ]);

      setWeightProgress(weight);
      setCalorieData(calories);
      setWaterData(water);
      if (goalsData.data) {
        setGoals(goalsData.data);
      }
    } catch (err) {
      console.error('Failed to load progress data:', err);
      setError('Failed to load progress data');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, calorieTimeRange, waterTimeRange]);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id, loadData]);

  const getActiveCalorieGoal = (): number => {
    const activeGoal = goals.find(g => g.isActive && g.goalType === GoalType.DAILY_CALORIES);
    return activeGoal?.targetValue || 2000;
  };

  const getAverageCalories = (): number => {
    if (!calorieData.length) return 0;
    const total = calorieData.reduce((sum, day) => sum + day.totalCalories, 0);
    return Math.round(total / calorieData.length);
  };

  const getTotalCalories = (): number => {
    return calorieData.reduce((sum, day) => sum + day.totalCalories, 0);
  };

  const getAverageWater = (): number => {
    if (!waterData.length) return 0;
    const total = waterData.reduce((sum, day) => sum + day.totalMl, 0);
    return Math.round(total / waterData.length);
  };

  const tabs: { id: ProgressTab; label: string }[] = [
    { id: 'calories', label: 'Calories' },
    { id: 'weight', label: 'Weight' },
    { id: 'macros', label: 'Macros' },
    { id: 'water', label: 'Water' },
  ];

  return (
    <RouteGuard requireAuth requireOnboardingComplete>
      <Layout maxWidth="md">
        <div className="min-h-screen pb-24">
          <Header
            title="Progress"
            subtitle="Track your fitness journey"
          />

          {error && (
            <Alert type="danger" className="mb-6">
              {error}
            </Alert>
          )}

          {/* Tab Navigation */}
          <div className="flex overflow-x-auto gap-2 mb-6 pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <Card>
              <CardBody className="py-12 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-neutral-200 border-t-primary-500 rounded-full mx-auto" />
                <p className="text-sm text-neutral-500 mt-2">Loading progress...</p>
              </CardBody>
            </Card>
          ) : (
            <>
              {/* Calories Tab */}
              {activeTab === 'calories' && (
                <Card>
                  <CardHeader>
                    <h2 className="text-lg font-semibold">Calorie Intake</h2>
                  </CardHeader>
                  <CardBody>
                    <CalorieChart
                      data={calorieData}
                      timeRange={calorieTimeRange}
                      calorieGoal={getActiveCalorieGoal()}
                      onTimeRangeChange={setCalorieTimeRange}
                      showTimeRangeToggle
                      height={250}
                    />
                    
                    <div className="mt-6 grid grid-cols-3 gap-4 text-center pt-4 border-t border-neutral-200">
                      <div>
                        <div className="text-sm text-neutral-500">Average</div>
                        <div className="text-xl font-bold text-neutral-900">
                          {getAverageCalories()} kcal
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-neutral-500">Total</div>
                        <div className="text-xl font-bold text-neutral-900">
                          {getTotalCalories().toLocaleString()} kcal
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-neutral-500">Days</div>
                        <div className="text-xl font-bold text-neutral-900">
                          {calorieData.length}
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Weight Tab */}
              {activeTab === 'weight' && (
                <Card>
                  <CardHeader>
                    <h2 className="text-lg font-semibold">Weight Progress</h2>
                  </CardHeader>
                  <CardBody>
                    {weightProgress?.hasData ? (
                      <>
                        <WeightTrendChart
                          data={weightTimeRange === '7d' ? weightProgress.trend7d : weightProgress.trend30d}
                          timeRange={weightTimeRange}
                          targetWeight={weightProgress.targetWeight}
                          onTimeRangeChange={setWeightTimeRange}
                          showTimeRangeToggle
                          height={250}
                        />
                        
                        <div className="mt-6 grid grid-cols-3 gap-4 text-center pt-4 border-t border-neutral-200">
                          <div>
                            <div className="text-sm text-neutral-500">Start</div>
                            <div className="text-xl font-bold text-neutral-900">
                              {weightProgress.startWeight} kg
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-neutral-500">Current</div>
                            <div className="text-xl font-bold text-primary-600">
                              {weightProgress.currentWeight} kg
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-neutral-500">Target</div>
                            <div className="text-xl font-bold text-neutral-900">
                              {weightProgress.targetWeight || '—'} kg
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <EmptyState
                        icon="⚖️"
                        title="No weight data"
                        description="Start logging your weight to see progress"
                        actionLabel="Log Weight"
                        onAction={() => {}}
                      />
                    )}
                  </CardBody>
                </Card>
              )}

              {/* Macros Tab */}
              {activeTab === 'macros' && (
                <Card>
                  <CardHeader>
                    <h2 className="text-lg font-semibold">Macro Breakdown</h2>
                  </CardHeader>
                  <CardBody>
                    {calorieData.length > 0 ? (
                      <>
                        <div className="flex justify-center gap-8 py-4">
                          {(() => {
                            const avgProtein = calorieData.reduce((sum, d) => sum + d.totalProtein, 0) / calorieData.length;
                            const avgCarbs = calorieData.reduce((sum, d) => sum + d.totalCarbs, 0) / calorieData.length;
                            const avgFat = calorieData.reduce((sum, d) => sum + d.totalFat, 0) / calorieData.length;
                            const total = avgProtein + avgCarbs + avgFat;
                            
                            return (
                              <>
                                <div className="text-center">
                                  <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                                    <span className="text-2xl font-bold text-blue-600">{total > 0 ? Math.round((avgProtein / total) * 100) : 0}%</span>
                                  </div>
                                  <div className="text-sm text-neutral-500">Protein</div>
                                  <div className="font-semibold">{Math.round(avgProtein)}g avg</div>
                                </div>
                                <div className="text-center">
                                  <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-2">
                                    <span className="text-2xl font-bold text-yellow-600">{total > 0 ? Math.round((avgCarbs / total) * 100) : 0}%</span>
                                  </div>
                                  <div className="text-sm text-neutral-500">Carbs</div>
                                  <div className="font-semibold">{Math.round(avgCarbs)}g avg</div>
                                </div>
                                <div className="text-center">
                                  <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
                                    <span className="text-2xl font-bold text-red-600">{total > 0 ? Math.round((avgFat / total) * 100) : 0}%</span>
                                  </div>
                                  <div className="text-sm text-neutral-500">Fat</div>
                                  <div className="font-semibold">{Math.round(avgFat)}g avg</div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-neutral-200">
                          <p className="text-sm text-neutral-500 text-center">
                            Based on {calorieData.length} days of data
                          </p>
                        </div>
                      </>
                    ) : (
                      <EmptyState
                        icon="🥗"
                        title="No macro data"
                        description="Start logging food to see macro breakdown"
                        actionLabel="Log Food"
                        onAction={() => {}}
                      />
                    )}
                  </CardBody>
                </Card>
              )}

              {/* Water Tab */}
              {activeTab === 'water' && (
                <Card>
                  <CardHeader>
                    <h2 className="text-lg font-semibold">Water Intake</h2>
                  </CardHeader>
                  <CardBody>
                    {waterData.length > 0 ? (
                      <>
                        <WaterChart
                          data={waterData}
                          timeRange={waterTimeRange}
                          dailyGoalMl={2000}
                          onTimeRangeChange={setWaterTimeRange}
                          showTimeRangeToggle
                          height={250}
                        />
                        
                        <div className="mt-6 grid grid-cols-3 gap-4 text-center pt-4 border-t border-neutral-200">
                          <div>
                            <div className="text-sm text-neutral-500">Average</div>
                            <div className="text-xl font-bold text-neutral-900">
                              {getAverageWater()} ml
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-neutral-500">Best Day</div>
                            <div className="text-xl font-bold text-success-600">
                              {Math.max(...waterData.map(d => d.totalMl))} ml
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-neutral-500">Days</div>
                            <div className="text-xl font-bold text-neutral-900">
                              {waterData.length}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <EmptyState
                        icon="💧"
                        title="No water data"
                        description="Start logging water intake to see progress"
                        actionLabel="Log Water"
                        onAction={() => {}}
                      />
                    )}
                  </CardBody>
                </Card>
              )}
            </>
          )}

          {/* Bottom Navigation */}
          <Navigation
            items={[
              { label: 'Today', href: '/today', icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )},
              { label: 'Log', href: '/log', icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              )},
              { label: 'Progress', href: '/progress', icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              )},
              { label: 'History', href: '/history', icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )},
              { label: 'Settings', href: '/settings/profile', icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )},
            ]}
            activePath="/progress"
          />
        </div>
      </Layout>
    </RouteGuard>
  );
}
