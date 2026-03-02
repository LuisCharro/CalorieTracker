'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardBody, Alert, Input, EmptyState } from '../../../shared/components';
import { Layout, Header } from '../../../shared/layout';
import { useAuth } from '../../../core/auth';
import { RouteGuard } from '../../../core/auth/routeGuard';

interface WaterLog {
  id: string;
  userId: string;
  amountMl: number;
  loggedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface WaterSummary {
  totalMl: number;
}

// API service functions
const waterLogsService = {
  async getWaterLogs(params: { userId: string; page?: number; pageSize?: number }) {
    const response = await fetch(
      `/api/water-logs?userId=${params.userId}&page=${params.page || 1}&pageSize=${params.pageSize || 30}`
    );
    return response.json();
  },

  async getLatestWater(userId: string): Promise<WaterSummary> {
    const response = await fetch(`/api/water-logs/latest?userId=${userId}`);
    const data = await response.json();
    return data.summary || { totalMl: 0 };
  },

  async createWaterLog(params: { userId: string; amountMl: number; loggedAt?: string }) {
    const response = await fetch('/api/water-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return response.json();
  },

  async deleteWaterLog(id: string, userId: string) {
    const response = await fetch(`/api/water-logs/${id}?userId=${userId}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};

export default function SettingsWaterPage() {
  const { user } = useAuth();
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'danger'>('success');
  
  // Quick add amounts (in ml)
  const quickAmounts = [150, 250, 330, 500];
  const [customAmount, setCustomAmount] = useState('');

  const DAILY_GOAL = 2500; // 2.5 liters default

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const [logsResponse, summary] = await Promise.all([
        waterLogsService.getWaterLogs({ userId: user.id, pageSize: 30 }),
        waterLogsService.getLatestWater(user.id),
      ]);

      if (logsResponse.success) {
        setWaterLogs(logsResponse.data);
      }
      setTodayTotal(summary.totalMl);
    } catch (error) {
      console.error('Failed to load water data:', error);
      setMessage('Failed to load water data');
      setMessageType('danger');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAdd = async (amountMl: number) => {
    if (!user?.id) return;

    setIsSaving(true);
    setMessage('');

    try {
      await waterLogsService.createWaterLog({
        userId: user.id,
        amountMl,
      });

      setMessage(`Added ${amountMl}ml successfully!`);
      setMessageType('success');
      await loadData();
    } catch (error) {
      console.error('Failed to log water:', error);
      setMessage(error instanceof Error ? error.message : 'Failed to log water');
      setMessageType('danger');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCustomAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !customAmount) return;

    const amountMl = parseInt(customAmount, 10);
    if (isNaN(amountMl) || amountMl <= 0) {
      setMessage('Please enter a valid amount');
      setMessageType('danger');
      return;
    }

    await handleQuickAdd(amountMl);
    setCustomAmount('');
  };

  const handleDelete = async (id: string) => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      await waterLogsService.deleteWaterLog(id, user.id);
      await loadData();
    } catch (error) {
      console.error('Failed to delete water log:', error);
      setMessage('Failed to delete entry');
      setMessageType('danger');
    } finally {
      setIsSaving(false);
    }
  };

  const progressPercent = Math.min(100, (todayTotal / DAILY_GOAL) * 100);

  return (
    <RouteGuard>
      <Layout>
        <Header title="Water Intake" showBackButton  />
        
        <div className="p-4 space-y-6">
          {/* Today's Progress */}
          <Card>
            <CardBody>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {todayTotal}ml
                </div>
                <div className="text-gray-600 mb-4">
                  of {DAILY_GOAL}ml daily goal
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                  <div 
                    className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="text-sm text-gray-500">
                  {Math.round(progressPercent)}% complete
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Quick Add Buttons */}
          <Card>
            <CardBody>
              <h3 className="font-semibold mb-4">Quick Add</h3>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    onClick={() => handleQuickAdd(amount)}
                    disabled={isSaving}
                  >
                    {amount}ml
                  </Button>
                ))}
              </div>
              
              {/* Custom Amount */}
              <form onSubmit={handleCustomAdd} className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Custom amount (ml)"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  min="1"
                  max="10000"
                />
                <Button type="submit" disabled={isSaving || !customAmount}>
                  Add
                </Button>
              </form>
            </CardBody>
          </Card>

          {/* Message */}
          {message && (
            <Alert type={messageType}>
              {message}
            </Alert>
          )}

          {/* Recent Logs */}
          <Card>
            <CardBody>
              <h3 className="font-semibold mb-4">Recent Entries</h3>
              
              {isLoading ? (
                <div className="text-center py-4 text-gray-500">Loading...</div>
              ) : waterLogs.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No water entries yet. Start logging!
                </div>
              ) : (
                <div className="space-y-2">
                  {waterLogs.map((log) => (
                    <div 
                      key={log.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-blue-600">
                          {log.amountMl}ml
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(log.loggedAt).toLocaleString()}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(log.id)}
                        disabled={isSaving}
                      >
                        ✕
                      </Button>
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
