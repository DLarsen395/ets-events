/**
 * Chart.js-based bar chart for earthquake data
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

export function ChartJSBarChart({ data, title }: ChartJSBarChartProps) {
  // Format labels
  const labels = data.map(d => 
    new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  );

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Earthquakes',
        data: data.map(d => d.count),
        backgroundColor: colors.bar,
        borderColor: colors.barBorder,
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: colors.barHover,
      },
    ],
  };

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
          title: (items) => items[0]?.label ?? '',
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
            size: 11,
          },
          autoSkip: true,
          maxTicksLimit: data.length > 14 ? 10 : undefined,
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
