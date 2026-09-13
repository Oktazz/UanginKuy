"use client";

import { useRouter } from "next/navigation";
import { CustomSelect } from "@/components/ui/CustomSelect";

type DashboardPeriod = "week" | "month" | "year";

const PERIOD_OPTIONS = [
  { value: "week", label: "7 Hari Terakhir" },
  { value: "month", label: "30 Hari Terakhir" },
  { value: "year", label: "12 Bulan Terakhir" },
];

export function PeriodSelect({ value }: { value: DashboardPeriod }) {
  const router = useRouter();

  return (
    <div className="w-44">
      <CustomSelect
        id="dashboard-period"
        value={value}
        onChange={(val) => {
          router.replace(`/admin/dashboard?period=${val}`);
        }}
        options={PERIOD_OPTIONS}
        placeholder="Pilih periode..."
        triggerClassName="h-10 text-xs sm:text-sm font-semibold rounded-xl border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300"
      />
    </div>
  );
}
