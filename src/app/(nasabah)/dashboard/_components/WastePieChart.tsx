"use client";

import { useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface WastePieChartProps {
  data: { label: string; value: number; color: string }[];
}
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
        display: false,
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
    <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10 py-2">
      {/* Left Column: Pie Chart */}
      <div className="relative h-60 sm:h-64 w-full max-w-xs sm:max-w-sm shrink-0 mx-auto lg:mx-0 flex items-center justify-center">
        <Pie data={chartData} options={options} />
      </div>

      {/* Right Column: Ranked Breakdown List & Progress Bars */}
      <div className="w-full flex-1 space-y-3.5">
        {data.map((item) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          const formattedPercent = percentage.toFixed(1);
          const formattedValue = item.value.toLocaleString('id-ID', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 2,
          });

          return (
            <div key={item.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2.5 font-bold text-gray-800">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-gray-900">
                    {formattedValue} kg
                  </span>
                  <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                    {formattedPercent}%
                  </span>
                </div>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
