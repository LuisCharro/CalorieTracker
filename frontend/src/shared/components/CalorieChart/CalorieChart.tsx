'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

import type { DailySummary } from '../../../core/api/services/logs.service';

export type TimeRange = '7d' | '30d' | '90d';

export interface CalorieChartProps {
  data: DailySummary[];
  timeRange: TimeRange;
  calorieGoal?: number;
  onTimeRangeChange?: (range: TimeRange) => void;
  showTimeRangeToggle?: boolean;
  height?: number;
}

const formatDate = (dateStr: string, range: TimeRange): string => {
  const date = new Date(dateStr);
  if (range === '7d') {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatCalories = (value: number): string => {
  return `${Math.round(value)} kcal`;
};

export const CalorieChart: React.FC<CalorieChartProps> = ({
  data,
  timeRange,
  calorieGoal,
  onTimeRangeChange,
  showTimeRangeToggle = false,
  height = 250,
}) => {
  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center text-gray-500"
        style={{ height }}
      >
        <p className="text-sm">No calorie data for this period</p>
      </div>
    );
  }

  const chartData = data.map(point => ({
    ...point,
    displayDate: formatDate(point.date, timeRange),
  }));

  const hasGoal = calorieGoal !== null && calorieGoal !== undefined && calorieGoal > 0;

  return (
    <div>
      {showTimeRangeToggle && (
        <div className="flex justify-end mb-2">
          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => onTimeRangeChange?.('7d')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                timeRange === '7d'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              7D
            </button>
            <button
              onClick={() => onTimeRangeChange?.('30d')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                timeRange === '30d'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              30D
            </button>
            <button
              onClick={() => onTimeRangeChange?.('90d')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                timeRange === '90d'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              90D
            </button>
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 11, fill: '#6B7280' }}
            tickLine={{ stroke: '#E5E7EB' }}
            axisLine={{ stroke: '#E5E7EB' }}
          />
          <YAxis
            domain={[0, 'dataMax + 200']}
            tick={{ fontSize: 11, fill: '#6B7280' }}
            tickFormatter={(value) => `${value}`}
            width={50}
            tickLine={{ stroke: '#E5E7EB' }}
            axisLine={{ stroke: '#E5E7EB' }}
          />
          <Tooltip
            formatter={(value) => {
              const numValue = typeof value === 'number' ? value : 0;
              return [formatCalories(numValue), 'Calories'];
            }}
            labelFormatter={(label) => `Date: ${label}`}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          />
          {hasGoal && (
            <ReferenceLine
              y={calorieGoal}
              stroke="#10B981"
              strokeDasharray="5 5"
              label={{ 
                value: 'Goal', 
                position: 'right',
                fontSize: 10,
                fill: '#10B981',
              }}
            />
          )}
          <Bar
            dataKey="totalCalories"
            fill="#3B82F6"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CalorieChart;
