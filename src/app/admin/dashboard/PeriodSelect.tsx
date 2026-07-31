"use client";

import { useRouter } from "next/navigation";

type DashboardPeriod = "week" | "month" | "year";

export function PeriodSelect({ value }: { value: DashboardPeriod }) {
  const router = useRouter();

  return (
    <label htmlFor="dashboard-period">
      <span className="sr-only">Periode grafik</span>
      <select
        id="dashboard-period"
        value={value}
        onChange={(event) => {
          router.replace(`/admin/dashboard?period=${event.target.value}`);
        }}
        className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-primary focus:border-primary block p-2.5 font-medium outline-none"
      >
        <option value="week">7 Hari Terakhir</option>
        <option value="month">30 Hari Terakhir</option>
        <option value="year">12 Bulan Terakhir</option>
      </select>
    </label>
  );
}
