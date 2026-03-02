'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

import type { WeightTrendPoint } from '../../../core/api/services/weight-logs.service';

export type TimeRange = '7d' | '30d';

export interface WeightTrendChartProps {
  data: WeightTrendPoint[];
  timeRange: TimeRange;
  targetWeight?: number | null;
  onTimeRangeChange?: (range: TimeRange) => void;
  showTimeRangeToggle?: boolean;
  height?: number;
  compact?: boolean;
}

const formatDate = (dateStr: string, range: TimeRange): string => {
  const date = new Date(dateStr);
  if (range === '7d') {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatWeight = (value: number): string => {
  return `${value.toFixed(1)} kg`;
};

export const WeightTrendChart: React.FC<WeightTrendChartProps> = ({
  data,
  timeRange,
  targetWeight,
  onTimeRangeChange,
  showTimeRangeToggle = false,
  height = 200,
  compact = false,
}) => {
  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center text-gray-500"
        style={{ height }}
      >
        <p className="text-sm">No weight data for this period</p>
      </div>
    );
  }

  const chartData = data.map(point => ({
    ...point,
    displayDate: formatDate(point.date, timeRange),
  }));

  const hasTarget = targetWeight !== null && targetWeight !== undefined;

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
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={chartData}
          margin={compact 
            ? { top: 5, right: 10, left: 0, bottom: 5 }
            : { top: 10, right: 20, left: 10, bottom: 10 }
          }
        >
          {!compact && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
          {!compact && (
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 11, fill: '#6B7280' }}
              tickLine={{ stroke: '#E5E7EB' }}
              axisLine={{ stroke: '#E5E7EB' }}
            />
          )}
          <YAxis
            domain={['dataMin - 1', 'dataMax + 1']}
            tick={{ fontSize: 11, fill: '#6B7280' }}
            tickFormatter={(value) => `${value}`}
            width={45}
            tickLine={{ stroke: '#E5E7EB' }}
            axisLine={{ stroke: '#E5E7EB' }}
          />
          <Tooltip
            formatter={(value) => {
              const numValue = typeof value === 'number' ? value : 0;
              return [formatWeight(numValue), 'Weight'];
            }}
            labelFormatter={(label) => `Date: ${label}`}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          />
          {hasTarget && (
            <ReferenceLine
              y={targetWeight}
              stroke="#10B981"
              strokeDasharray="5 5"
              label={{ 
                value: 'Target', 
                position: 'right',
                fontSize: 10,
                fill: '#10B981',
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ fill: '#3B82F6', strokeWidth: 2, r: compact ? 2 : 4 }}
            activeDot={{ r: 5, fill: '#2563EB' }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeightTrendChart;
