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
  Legend,
} from 'recharts';

import type { WeightTrendPoint } from '../../../core/api/services/weight-logs.service';
import type { DailySummary } from '../../../core/api/services/logs.service';

export type TimeRange = '7d' | '30d' | '90d';

export interface CombinedChartProps {
  weightData: WeightTrendPoint[];
  calorieData: DailySummary[];
  timeRange: TimeRange;
  targetWeight?: number | null;
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

const formatWeight = (value: number): string => `${value.toFixed(1)} kg`;
const formatCalories = (value: number): string => `${Math.round(value)} kcal`;

export const CombinedChart: React.FC<CombinedChartProps> = ({
  weightData,
  calorieData,
  timeRange,
  targetWeight,
  calorieGoal,
  onTimeRangeChange,
  showTimeRangeToggle = false,
  height = 300,
}) => {
  const hasWeight = weightData && weightData.length > 0;
  const hasCalories = calorieData && calorieData.length > 0;

  if (!hasWeight && !hasCalories) {
    return (
      <div 
        className="flex items-center justify-center text-gray-500"
        style={{ height }}
      >
        <p className="text-sm">No data available for this period</p>
      </div>
    );
  }

  const dateToData = new Map<string, { weight?: number; calories?: number }>();
  
  weightData?.forEach(point => {
    const dateKey = point.date;
    if (!dateToData.has(dateKey)) {
      dateToData.set(dateKey, {});
    }
    dateToData.get(dateKey)!.weight = point.weight;
  });

  calorieData?.forEach(point => {
    const dateKey = point.date;
    if (!dateToData.has(dateKey)) {
      dateToData.set(dateKey, {});
    }
    dateToData.get(dateKey)!.calories = point.totalCalories;
  });

  const chartData = Array.from(dateToData.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      displayDate: formatDate(date, timeRange),
      weight: data.weight,
      calories: data.calories,
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
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 60, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 11, fill: '#6B7280' }}
            tickLine={{ stroke: '#E5E7EB' }}
            axisLine={{ stroke: '#E5E7EB' }}
          />
          <YAxis
            yAxisId="weight"
            orientation="left"
            tick={{ fontSize: 11, fill: '#3B82F6' }}
            tickFormatter={(value) => `${value}`}
            width={45}
            tickLine={{ stroke: '#E5E7EB' }}
            axisLine={{ stroke: '#E5E7EB' }}
            label={{ 
              value: 'kg', 
              angle: -90, 
              position: 'insideLeft',
              fill: '#3B82F6',
              fontSize: 11,
            }}
          />
          <YAxis
            yAxisId="calories"
            orientation="right"
            tick={{ fontSize: 11, fill: '#F59E0B' }}
            tickFormatter={(value) => `${value}`}
            width={50}
            tickLine={{ stroke: '#E5E7EB' }}
            axisLine={{ stroke: '#E5E7EB' }}
            label={{ 
              value: 'kcal', 
              angle: 90, 
              position: 'insideRight',
              fill: '#F59E0B',
              fontSize: 11,
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
            formatter={(value, name) => {
              const numValue = typeof value === 'number' ? value : 0;
              if (name === 'weight') {
                return value != null ? [formatWeight(numValue), 'Weight'] : ['—', 'Weight'];
              }
              return value != null ? [formatCalories(numValue), 'Calories'] : ['—', 'Calories'];
            }}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={(value) => {
              return value === 'weight' ? 'Weight (kg)' : 'Calories (kcal)';
            }}
          />
          {targetWeight && (
            <ReferenceLine
              yAxisId="weight"
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
          {calorieGoal && (
            <ReferenceLine
              yAxisId="calories"
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
          <Line
            yAxisId="weight"
            type="monotone"
            dataKey="weight"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 5, fill: '#2563EB' }}
            connectNulls={false}
            name="weight"
          />
          <Line
            yAxisId="calories"
            type="monotone"
            dataKey="calories"
            stroke="#F59E0B"
            strokeWidth={2}
            dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 5, fill: '#D97706' }}
            connectNulls={false}
            name="calories"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CombinedChart;
