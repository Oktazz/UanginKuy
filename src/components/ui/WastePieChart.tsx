"use client";

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface WastePieChartProps {
  data: { label: string; value: number; color: string }[];
}

export function WastePieChart({ data }: WastePieChartProps) {
  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        data: data.map((d) => d.value),
        backgroundColor: data.map((d) => d.color),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: { family: 'Inter', size: 12 },
          color: '#4B5563',
        },
      },
    },
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg border border-gray-100">
        <p className="text-gray-400 text-sm">Belum ada data setoran.</p>
      </div>
    );
  }

  return (
    <div className="relative h-64 w-full flex items-center justify-center">
      <Pie data={chartData} options={options} />
    </div>
  );
}
