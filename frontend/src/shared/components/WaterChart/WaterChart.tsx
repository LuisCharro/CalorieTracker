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

import type { WaterProgress } from '../../../core/api/services/water-logs.service';

export type TimeRange = '7d' | '30d' | '90d';

export interface WaterChartProps {
  data: WaterProgress[];
  timeRange: TimeRange;
  dailyGoalMl?: number;
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

const formatMl = (value: number): string => {
  return `${value} ml`;
};

export const WaterChart: React.FC<WaterChartProps> = ({
  data,
  timeRange,
  dailyGoalMl = 2000,
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
        <p className="text-sm">No water data for this period</p>
      </div>
    );
  }

  const chartData = data.map(point => ({
    ...point,
    displayDate: formatDate(point.date, timeRange),
  }));

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
            domain={[0, Math.max(dailyGoalMl * 1.5, 3000)]}
            tick={{ fontSize: 11, fill: '#6B7280' }}
            tickFormatter={(value) => `${value}`}
            width={50}
            tickLine={{ stroke: '#E5E7EB' }}
            axisLine={{ stroke: '#E5E7EB' }}
          />
          <Tooltip
            formatter={(value) => {
              const numValue = typeof value === 'number' ? value : 0;
              return [formatMl(numValue), 'Water'];
            }}
            labelFormatter={(label) => `Date: ${label}`}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          />
          <ReferenceLine
            y={dailyGoalMl}
            stroke="#10B981"
            strokeDasharray="5 5"
            label={{ 
              value: 'Goal', 
              position: 'right',
              fontSize: 10,
              fill: '#10B981',
            }}
          />
          <Bar
            dataKey="totalMl"
            fill="#06B6D4"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WaterChart;
