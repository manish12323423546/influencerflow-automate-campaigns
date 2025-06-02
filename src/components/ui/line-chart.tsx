import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface LineChartProps {
  data: Array<{
    x: number;
    y: number;
    type: string;
    creator: string;
  }>;
  xLabel: string;
  yLabel: string;
  tooltipFormat?: (data: any) => string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  xLabel,
  yLabel,
  tooltipFormat,
}) => {
  const chartData = {
    labels: data.map(d => d.x),
    datasets: [
      {
        label: 'Priority',
        data: data.map(d => d.y),
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.5)',
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: xLabel,
          color: '#fff',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#fff',
        },
      },
      y: {
        title: {
          display: true,
          text: yLabel,
          color: '#fff',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#fff',
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            if (tooltipFormat) {
              return tooltipFormat(data[context.dataIndex]);
            }
            return `Priority: ${context.parsed.y}`;
          },
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
}; 