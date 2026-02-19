'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardHeader, CardBody, Input } from '../../shared/components';
import { Layout, Header, Navigation } from '../../shared/layout';
import { useAuth } from '../../core/auth';
import { logsService } from '../../core/api/services';
import { RouteGuard } from '../../core/auth/routeGuard';
import type { FoodLog } from '../../core/contracts/types';

export default function HistoryPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    loadLogs();
  }, [user?.id]);

  const loadLogs = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const response = await logsService.getLogs({
        pageSize: 100,
      });

      if (response.success) {
        setLogs(response.data);
      }
    } catch (err: any) {
      console.error('Failed to load logs:', err);
      setError(err.message || 'Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.foodName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.brandName && log.brandName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDate = selectedDate === '' || 
      log.loggedAt.startsWith(selectedDate);
    
    return matchesSearch && matchesDate;
  });

  const groupLogsByDate = (logs: FoodLog[]) => {
    const groups: Record<string, FoodLog[]> = {};
    logs.forEach(log => {
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

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardBody>
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Search foods..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  isFullWidth
                />
                
                <Input
                  type="date"
                  label="Filter by date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  isFullWidth
                />

                {(searchTerm || selectedDate) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedDate('');
                    }}
                    size="sm"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>

          {/* History List */}
          {sortedDates.length === 0 ? (
            <Card>
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
                  <Button onClick={() => window.location.href = '/log'} size="lg">
                    Log Your First Meal
                  </Button>
                )}
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-6">
              {sortedDates.map((date) => (
                <div key={date}>
                  <h3 className="text-sm font-semibold text-neutral-600 mb-3">
                    {new Date(date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h3>
                  <div className="space-y-3">
                    {groupedLogs[date].map((log) => (
                      <Card key={log.id}>
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
                                  {new Date(log.loggedAt).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-lg font-bold text-primary-600">
                                {log.nutrition.calories}
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
