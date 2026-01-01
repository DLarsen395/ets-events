/**
 * Chart.js-based bar chart for earthquake data
 * Supports dynamic bar width based on data density
 */

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { DailyEarthquakeAggregate } from '../../services/usgs-earthquake-api';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ChartJSBarChartProps {
  data: DailyEarthquakeAggregate[];
  title?: string;
}

// Dark mode colors (app is always dark)
const colors = {
  bar: 'rgba(96, 165, 250, 0.8)',  // blue-400
  barBorder: '#60a5fa',
  barHover: 'rgba(147, 197, 253, 0.9)',  // blue-300
  grid: 'rgba(55, 65, 81, 0.5)',  // gray-700
  text: '#d1d5db',  // gray-300
  tooltip: {
    bg: '#1f2937',  // gray-800
    text: '#f3f4f6',  // gray-100
    border: '#374151',  // gray-700
  },
};

/**
 * Get bar thickness based on data length
 */
function getBarThickness(dataLength: number): number | 'flex' {
  if (dataLength <= 7) return 40;
  if (dataLength <= 14) return 30;
  if (dataLength <= 30) return 20;
  if (dataLength <= 90) return 10;
  if (dataLength <= 180) return 5;
  return 3;  // Very thin for year view
}

/**
 * Get appropriate date format based on data length
 */
function formatLabel(date: string, dataLength: number): string {
  const d = new Date(date);
  if (dataLength <= 90) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  // Just month for year view
  return d.toLocaleDateString('en-US', { month: 'short' });
}

export function ChartJSBarChart({ data, title }: ChartJSBarChartProps) {
  const barThickness = getBarThickness(data.length);
  
  // Format labels based on data density
  const labels = data.map(d => formatLabel(d.date, data.length));

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Earthquakes',
        data: data.map(d => d.count),
        backgroundColor: colors.bar,
        borderColor: colors.barBorder,
        borderWidth: data.length > 90 ? 0 : 1,  // No border for very thin bars
        borderRadius: data.length > 90 ? 2 : 4,
        hoverBackgroundColor: colors.barHover,
        barThickness: barThickness,
      },
    ],
  };

  // Calculate max ticks based on data length
  const maxTicksLimit = data.length > 180 ? 12 : data.length > 60 ? 15 : undefined;

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: !!title,
        text: title ?? '',
        color: colors.text,
        font: {
          size: 14,
          weight: 'bold',
        },
      },
      tooltip: {
        backgroundColor: colors.tooltip.bg,
        titleColor: colors.tooltip.text,
        bodyColor: colors.tooltip.text,
        borderColor: colors.tooltip.border,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (items) => {
            // Show full date in tooltip
            const index = items[0]?.dataIndex;
            if (index !== undefined && data[index]) {
              return new Date(data[index].date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
            }
            return items[0]?.label ?? '';
          },
          label: (item) => {
            const dataPoint = data[item.dataIndex];
            const lines = [`Earthquakes: ${item.raw}`];
            if (dataPoint.count > 0) {
              lines.push(`Max: M${dataPoint.maxMagnitude.toFixed(1)}`);
              lines.push(`Avg: M${dataPoint.avgMagnitude.toFixed(1)}`);
            }
            return lines;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: colors.grid,
          display: false,
        },
        ticks: {
          color: colors.text,
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: data.length > 60 ? 10 : 11,
          },
          autoSkip: true,
          maxTicksLimit,
        },
        border: {
          color: colors.grid,
        },
      },
      y: {
        grid: {
          color: colors.grid,
        },
        ticks: {
          color: colors.text,
          font: {
            size: 12,
          },
        },
        border: {
          color: colors.grid,
        },
        title: {
          display: true,
          text: 'Earthquakes',
          color: colors.text,
          font: {
            size: 12,
          },
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div style={{ width: '100%', height: 300 }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
