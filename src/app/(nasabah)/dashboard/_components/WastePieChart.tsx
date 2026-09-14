"use client";

import { useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface WastePieChartProps {
  data: { label: string; value: number; color: string }[];
}

const FONT_FAMILY = "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

export function WastePieChart({ data }: WastePieChartProps) {
  const total = useMemo(() => data.reduce((acc, curr) => acc + curr.value, 0), [data]);

  const chartData = useMemo(() => ({
    labels: data.map((d) => d.label),
    datasets: [
      {
        data: data.map((d) => d.value),
        backgroundColor: data.map((d) => d.color),
        borderWidth: 1,
      },
    ],
  }), [data]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle' as const,
          boxWidth: 8,
          boxHeight: 8,
          padding: 16,
          font: {
            family: FONT_FAMILY,
            size: 13,
            weight: 500,
          },
          color: '#374151',
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const val = Number(context.parsed) || 0;
            const percentage = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
            return ` ${label}: ${val.toLocaleString('id-ID')} kg (${percentage}%)`;
          },
        },
      },
    },
  }), [total]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg border border-gray-100">
        <p className="text-gray-400 text-sm">Belum ada data setoran.</p>
      </div>
    );
  }

  return (
    <div className="relative h-64 w-full max-w-sm mx-auto">
      <Pie data={chartData} options={options} />
    </div>
  );
}
