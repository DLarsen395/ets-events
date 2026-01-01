/**
 * Recharts-based bar chart for earthquake data
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DailyEarthquakeAggregate } from '../../services/usgs-earthquake-api';

// Type for recharts tooltip props
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DailyEarthquakeAggregate & { label: string }; value: number }>;
  label?: string;
}

interface RechartsBarChartProps {
  data: DailyEarthquakeAggregate[];
  title?: string;
}

// Dark mode colors (app is always dark)
const colors = {
  bar: '#60a5fa',  // blue-400
  barHover: '#93c5fd',  // blue-300
  grid: '#374151',  // gray-700
  text: '#d1d5db',  // gray-300
  tooltip: {
    bg: '#1f2937',  // gray-800
    border: '#374151',  // gray-700
    text: '#f3f4f6',  // gray-100
  },
};

/**
 * Custom tooltip component
 */
function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload as DailyEarthquakeAggregate;

  return (
    <div
      style={{
        backgroundColor: colors.tooltip.bg,
        border: `1px solid ${colors.tooltip.border}`,
        borderRadius: '0.5rem',
        padding: '0.75rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
      }}
    >
      <p style={{ 
        color: colors.tooltip.text, 
        fontWeight: 600, 
        marginBottom: '0.25rem',
        fontSize: '0.875rem',
      }}>
        {label}
      </p>
      <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
        Earthquakes: <span style={{ color: colors.bar, fontWeight: 600 }}>{data.count}</span>
      </p>
      {data.count > 0 && (
        <>
          <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            Max: M{data.maxMagnitude.toFixed(1)}
          </p>
          <p style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
            Avg: M{data.avgMagnitude.toFixed(1)}
          </p>
        </>
      )}
    </div>
  );
}

export function RechartsBarChart({ data, title }: RechartsBarChartProps) {
  // Format data with labels
  const chartData = data.map(d => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {title && (
        <h3 style={{ 
          color: colors.text, 
          fontSize: '1rem', 
          fontWeight: 600, 
          marginBottom: '0.5rem',
          textAlign: 'center',
        }}>
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart 
          data={chartData} 
          margin={{ top: 10, right: 10, left: 0, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: colors.text, fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={60}
            interval={data.length > 14 ? Math.floor(data.length / 10) : 0}
            tickLine={{ stroke: colors.grid }}
            axisLine={{ stroke: colors.grid }}
          />
          <YAxis
            tick={{ fill: colors.text, fontSize: 12 }}
            tickLine={{ stroke: colors.grid }}
            axisLine={{ stroke: colors.grid }}
            label={{
              value: 'Earthquakes',
              angle: -90,
              position: 'insideLeft',
              fill: colors.text,
              style: { textAnchor: 'middle', fontSize: 12 },
            }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
          <Bar
            dataKey="count"
            fill={colors.bar}
            radius={[4, 4, 0, 0]}
            maxBarSize={50}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
