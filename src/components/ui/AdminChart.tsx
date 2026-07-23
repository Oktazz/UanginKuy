"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function AdminChart() {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1F2937',
        bodyColor: '#1F2937',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: "'Inter', sans-serif",
            size: 12,
          }
        }
      },
      y: {
        grid: {
          color: '#F3F4F6',
        },
        border: {
          dash: [4, 4],
        },
        ticks: {
          font: {
            family: "'Inter', sans-serif",
            size: 12,
          },
          padding: 10,
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  const labels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  const data = {
    labels,
    datasets: [
      {
        label: 'Berat Sampah (Kg)',
        data: [65, 80, 55, 95, 70, 110, 85],
        borderColor: '#306D29',
        backgroundColor: 'rgba(48, 109, 41, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: '#306D29',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="h-full w-full">
      <Line options={options} data={data} />
    </div>
  );
}
