'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button, Card, CardHeader, CardBody, Input } from '../../shared/components';
import { Layout, Header, Navigation } from '../../shared/layout';
import { useAuth } from '../../core/auth';
import { logsService } from '../../core/api/services';
import { RouteGuard } from '../../core/auth/routeGuard';
import type { FoodLog } from '../../core/contracts/types';

type QuickFilter = 'all' | 'today' | 'yesterday' | 'week';

export default function HistoryPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');

  // Get today's date in local timezone
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);
  const weekAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  }, []);

  useEffect(() => {
    loadLogs();
  }, [user?.id]);

  // Prevent browser from auto-filling date on mount
  useEffect(() => {
    setSelectedDate('');
  }, []);

  // Reset quick filter when date is manually selected
  useEffect(() => {
    if (selectedDate) {
      setQuickFilter('all');
    }
  }, [selectedDate]);

  const loadLogs = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const response = await logsService.getLogs({
        userId: user.id,
        pageSize: 200,
      });

      if (response.success) {
        // Transform snake_case from API to camelCase
        const transformedLogs = (response.data || []).map((log: any) => ({
          ...log,
          loggedAt: log.logged_at || log.loggedAt,
          foodName: log.food_name || log.foodName,
          brandName: log.brand_name || log.brandName,
          mealType: log.meal_type || log.mealType,
          createdAt: log.created_at || log.createdAt,
          updatedAt: log.updated_at || log.updatedAt,
        }));
        setLogs(transformedLogs);
      }
    } catch (err: any) {
      console.error('Failed to load logs:', err);
      setError(err.message || 'Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  const getQuickFilterDates = (): { start?: string; end?: string } => {
    switch (quickFilter) {
      case 'today':
        return { start: today };
      case 'yesterday':
        return { start: yesterday, end: yesterday };
      case 'week':
        return { start: weekAgo };
      default:
        return {};
    }
  };

  const filteredLogs = useMemo(() => {
    const quickDates = getQuickFilterDates();
    
    return logs.filter(log => {
      if (!log.loggedAt) return false;

      const logDate = log.loggedAt.split('T')[0];

      // Search filter
      const matchesSearch = !searchTerm ||
        (log.foodName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.brandName?.toLowerCase().includes(searchTerm.toLowerCase()));

      // Quick filter (today/yesterday/week)
      let matchesQuick = true;
      if (quickFilter === 'today') {
        matchesQuick = logDate === today;
      } else if (quickFilter === 'yesterday') {
        matchesQuick = logDate === yesterday;
      } else if (quickFilter === 'week') {
        matchesQuick = logDate >= weekAgo;
      }

      // Manual date filter
      const matchesDate = !selectedDate || logDate.startsWith(selectedDate);

      return matchesSearch && matchesQuick && matchesDate;
    });
  }, [logs, searchTerm, selectedDate, quickFilter, today, yesterday, weekAgo]);

  const groupLogsByDate = (logs: FoodLog[]) => {
    const groups: Record<string, FoodLog[]> = {};
    logs.forEach(log => {
      if (!log.loggedAt) return;
      const date = log.loggedAt.split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(log);
    });
    return groups;
  };

  const groupedLogs = groupLogsByDate(filteredLogs);
  const sortedDates = Object.keys(groupedLogs).sort((a, b) => b.localeCompare(a));

  const getDayLabel = (dateStr: string): string => {
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTotalCaloriesForDate = (dateLogs: FoodLog[]): number => {
    return dateLogs.reduce((sum, log) => sum + (log.nutrition?.calories || 0), 0);
  };

  if (isLoading) {
    return (
      <Layout maxWidth="lg">
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-neutral-200 border-t-primary-500 rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <RouteGuard requireAuth requireOnboardingComplete>
      <Layout maxWidth="lg">
        <div className="min-h-screen pb-24">
          <Header title="History" />

          {error && (
            <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg text-danger-900">
              {error}
            </div>
          )}

          {/* Quick Filters */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setQuickFilter('all'); setSelectedDate(''); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  quickFilter === 'all' && !selectedDate
                    ? 'bg-primary-500 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => { setQuickFilter('today'); setSelectedDate(''); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  quickFilter === 'today'
                    ? 'bg-primary-500 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => { setQuickFilter('yesterday'); setSelectedDate(''); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  quickFilter === 'yesterday'
                    ? 'bg-primary-500 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                Yesterday
              </button>
              <button
                onClick={() => { setQuickFilter('week'); setSelectedDate(''); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  quickFilter === 'week'
                    ? 'bg-primary-500 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                This Week
              </button>
            </div>
          </div>

          {/* Search and Date Filter */}
          <Card className="shadow-md shadow-neutral-200/50 border-0 rounded-2xl mb-6">
            <CardBody>
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Search foods..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  isFullWidth
                />
                
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      type="date"
                      label="Or pick a specific date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      isFullWidth
                    />
                  </div>
                  {(searchTerm || selectedDate || quickFilter !== 'all') && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedDate('');
                        setQuickFilter('all');
                      }}
                      size="sm"
                      className="mt-5 hover:bg-neutral-100 hover:border-neutral-400 transition-colors duration-200"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Results count */}
          {filteredLogs.length > 0 && (
            <div className="mb-4 text-sm text-neutral-600">
              Showing {filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''}
            </div>
          )}

          {/* History List */}
          {sortedDates.length === 0 ? (
            <Card className="shadow-md shadow-neutral-200/50 border-0 rounded-2xl">
              <CardBody className="py-12 text-center">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                  No food logs found
                </h3>
                <p className="text-sm text-neutral-600 mb-6">
                  {logs.length === 0 
                    ? 'Start logging your meals to build your history'
                    : 'Try adjusting your filters'}
                </p>
                {logs.length === 0 && (
                  <Button 
                    onClick={() => window.location.href = '/log'} 
                    size="lg"
                    className="hover:bg-primary-700 hover:shadow-lg transition-all duration-200"
                  >
                    Log Your First Meal
                  </Button>
                )}
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-6">
              {sortedDates.map((date) => (
                <div key={date}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-neutral-600">
                      {getDayLabel(date)}
                    </h3>
                    <span className="text-sm font-medium text-primary-600">
                      {getTotalCaloriesForDate(groupedLogs[date])} cal
                    </span>
                  </div>
                  <div className="space-y-3">
                    {groupedLogs[date].map((log) => (
                      <Card 
                        key={log.id} 
                        className="shadow-md shadow-neutral-200/50 border-0 rounded-2xl mb-4 hover:shadow-lg hover:shadow-neutral-200/70 transition-all duration-200 cursor-pointer"
                      >
                        <CardBody>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="text-base font-medium text-neutral-900">
                                {log.foodName}
                              </div>
                              {log.brandName && (
                                <div className="text-sm text-neutral-500">{log.brandName}</div>
                              )}
                              <div className="mt-1 flex items-center gap-3 text-xs text-neutral-500">
                                <span className="capitalize bg-neutral-100 px-2 py-1 rounded">
                                  {log.mealType}
                                </span>
                                <span>
                                  {log.quantity} {log.unit}
                                </span>
                                <span>
                                  {log.loggedAt ? new Date(log.loggedAt).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  }) : ''}
                                </span>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-lg font-bold text-primary-600">
                                {log.nutrition?.calories || 0}
                              </div>
                              <div className="text-xs text-neutral-500">calories</div>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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
          activePath="/history"
        />
      </Layout>
    </RouteGuard>
  );
}
