import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Cpu,
  Ticket,
  TrendingUp,
  Users,
  Wallet,
  Wifi,
  WifiOff,
} from "lucide-react";
import { AdminChart } from "@/components/ui/AdminChart";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { PeriodSelect } from "./PeriodSelect";

type DashboardPeriod = "week" | "month" | "year";
type MetricKey = "customers" | "tickets" | "weight" | "revenue";

type MetricValues = Record<MetricKey, number>;

type ChartPoint = {
  bucket: string;
  weight: number;
};

type Activity = {
  ticketId: string;
  shortId: string | null;
  clientName: string;
  weight: number;
  subtotal: number;
  occurredAt: string;
};

type DashboardData = {
  generatedAt: string;
  totals: MetricValues;
  current: MetricValues;
  previous: MetricValues;
  chart: ChartPoint[];
  activities: Activity[];
};

const emptyMetrics: MetricValues = {
  customers: 0,
  tickets: 0,
  weight: 0,
  revenue: 0,
};

const emptyDashboard: DashboardData = {
  generatedAt: "",
  totals: emptyMetrics,
  current: emptyMetrics,
  previous: emptyMetrics,
  chart: [],
  activities: [],
};

const periodDescriptions: Record<DashboardPeriod, string> = {
  week: "7 hari sebelumnya",
  month: "30 hari sebelumnya",
  year: "12 bulan sebelumnya",
};

function isDashboardPeriod(value: string | undefined): value is DashboardPeriod {
  return value === "week" || value === "month" || value === "year";
}

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseMetrics(value: unknown): MetricValues {
  const metrics =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  return {
    customers: toNumber(metrics.customers),
    tickets: toNumber(metrics.tickets),
    weight: toNumber(metrics.weight),
    revenue: toNumber(metrics.revenue),
  };
}

function parseDashboardData(value: unknown): DashboardData {
  if (!value || typeof value !== "object") return emptyDashboard;

  const payload = value as Record<string, unknown>;
  const chart = Array.isArray(payload.chart)
    ? payload.chart.map((point) => {
        const row = point as Record<string, unknown>;
        return {
          bucket: String(row.bucket ?? ""),
          weight: toNumber(row.weight),
        };
      })
    : [];
  const activities = Array.isArray(payload.activities)
    ? payload.activities.map((item) => {
        const row = item as Record<string, unknown>;
        return {
          ticketId: String(row.ticketId ?? ""),
          shortId: row.shortId ? String(row.shortId) : null,
          clientName: String(row.clientName ?? "Nasabah"),
          weight: toNumber(row.weight),
          subtotal: toNumber(row.subtotal),
          occurredAt: String(row.occurredAt ?? ""),
        };
      })
    : [];

  return {
    generatedAt: String(payload.generatedAt ?? ""),
    totals: parseMetrics(payload.totals),
    current: parseMetrics(payload.current),
    previous: parseMetrics(payload.previous),
    chart,
    activities,
  };
}

function percentageChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

function formatTrend(value: number) {
  const absolute = Math.abs(value);
  const rounded = absolute >= 10 ? Math.round(absolute) : Math.round(absolute * 10) / 10;
  return `${value > 0 ? "+" : value < 0 ? "-" : ""}${rounded.toLocaleString("id-ID")}%`;
}

function formatChartLabel(bucket: string, period: DashboardPeriod) {
  const date = new Date(`${bucket}T00:00:00+08:00`);
  if (Number.isNaN(date.getTime())) return bucket;

  return new Intl.DateTimeFormat("id-ID", {
    month: "short",
    ...(period === "year" ? { year: "2-digit" } : { day: "numeric" }),
    timeZone: "Asia/Makassar",
  }).format(date);
}

function formatRelativeTime(value: string, referenceTime: number) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp) || !Number.isFinite(referenceTime) || referenceTime <= 0) {
    return "Waktu tidak tersedia";
  }

  const elapsedMinutes = Math.max(
    0,
    Math.floor((referenceTime - timestamp) / 60_000),
  );
  if (elapsedMinutes < 1) return "Baru saja";
  if (elapsedMinutes < 60) return `${elapsedMinutes} menit lalu`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours} jam lalu`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays} hari lalu`;
}

export default async function AdminDashboard(props: {
  searchParams: Promise<{ period?: string }>;
}) {
  const searchParams = await props.searchParams;
  const period = isDashboardPeriod(searchParams.period)
    ? searchParams.period
    : "week";
  const supabase = await createClient(await cookies());

  const [dashboardResult, devicesResult] = await Promise.all([
    supabase.rpc("get_admin_dashboard", { p_period: period }),
    supabase
      .from("iot_devices")
      .select("id, is_online, last_ping")
      .order("last_ping", { ascending: false }),
  ]);

  const errors: string[] = [];
  if (dashboardResult.error) {
    console.error("Failed to load admin dashboard:", dashboardResult.error);
    errors.push("Data analitik gagal dimuat. Pastikan migration dashboard sudah diterapkan.");
  }
  if (devicesResult.error) {
    console.error("Failed to load IoT devices:", devicesResult.error);
    errors.push("Status perangkat IoT gagal dimuat.");
  }

  const dashboard = dashboardResult.error
    ? emptyDashboard
    : parseDashboardData(dashboardResult.data);
  const devices = devicesResult.data ?? [];
  const referenceTime = Date.parse(dashboard.generatedAt);
  const onlineCutoff = referenceTime - 5 * 60_000;
  const onlineDevices = devices.filter(
    (device) =>
      Number.isFinite(referenceTime) &&
      device.is_online === true &&
      device.last_ping !== null &&
      new Date(device.last_ping).getTime() >= onlineCutoff,
  );
  const latestPing = devices.find((device) => device.last_ping)?.last_ping ?? null;

  const kpis = [
    {
      key: "customers" as const,
      title: "Total Nasabah",
      value: dashboard.totals.customers.toLocaleString("id-ID"),
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      key: "tickets" as const,
      title: "Total Tiket",
      value: dashboard.totals.tickets.toLocaleString("id-ID"),
      icon: Ticket,
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
    {
      key: "weight" as const,
      title: "Total Sampah Terkumpul",
      value: `${dashboard.totals.weight.toLocaleString("id-ID", {
        maximumFractionDigits: 1,
      })} Kg`,
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      key: "revenue" as const,
      title: "Total Pembayaran Nasabah",
      value: `Rp ${dashboard.totals.revenue.toLocaleString("id-ID", {
        maximumFractionDigits: 0,
      })}`,
      icon: Wallet,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
  ].map((kpi) => {
    const trend = percentageChange(
      dashboard.current[kpi.key],
      dashboard.previous[kpi.key],
    );
    return { ...kpi, trend, isPositive: trend >= 0 };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Dashboard Overview
          </h2>
          <p className="text-gray-500 mt-2 font-medium">
            Ringkasan aktivitas platform UanginKuy dari data operasional terbaru.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-surface px-4 py-3 shadow-sm">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              onlineDevices.length > 0
                ? "bg-success/10 text-success"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {onlineDevices.length > 0 ? <Wifi size={20} /> : <WifiOff size={20} />}
          </div>
          <div>
            <p className="text-sm font-extrabold text-gray-900">
              {onlineDevices.length} dari {devices.length} timbangan online
            </p>
            <p className="mt-0.5 text-xs font-medium text-gray-400">
              {latestPing
                ? `Ping terakhir ${formatRelativeTime(latestPing, referenceTime)}`
                : "Belum ada ping perangkat"}
            </p>
          </div>
        </div>
      </header>

      {errors.length > 0 && (
        <div
          role="alert"
          className="flex gap-3 rounded-2xl border border-error/20 bg-error/5 p-4 text-error"
        >
          <AlertTriangle className="mt-0.5 shrink-0" size={20} />
          <div>
            <p className="font-extrabold">Sebagian data dashboard tidak tersedia</p>
            {errors.map((error) => (
              <p key={error} className="mt-1 text-sm font-medium">
                {error}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.key}
              className="bg-surface rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${kpi.bg}`}>
                  <Icon size={24} className={kpi.color} />
                </div>
                <div
                  className={`flex items-center space-x-1 text-xs font-bold px-2 py-1 rounded-full ${
                    kpi.isPositive
                      ? "text-success bg-success/10"
                      : "text-error bg-error/10"
                  }`}
                  title={`Dibanding ${periodDescriptions[period]}`}
                >
                  {kpi.isPositive ? (
                    <ArrowUpRight size={14} />
                  ) : (
                    <ArrowDownRight size={14} />
                  )}
                  <span>{formatTrend(kpi.trend)}</span>
                </div>
              </div>
              <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">
                {kpi.title}
              </h3>
              <p className="text-3xl font-black text-gray-900 tracking-tight">
                {kpi.value}
              </p>
              <p className="mt-2 text-xs font-medium text-gray-400">
                dibanding {periodDescriptions[period]}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface rounded-3xl p-8 shadow-sm border border-gray-100">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Volume Sampah</h3>
              <p className="text-sm text-gray-500 mt-1">
                Berat sampah dari penjemputan yang telah selesai.
              </p>
            </div>
            <PeriodSelect value={period} />
          </div>
          <div className="h-80">
            <AdminChart
              labels={dashboard.chart.map((point) =>
                formatChartLabel(point.bucket, period),
              )}
              values={dashboard.chart.map((point) => point.weight)}
            />
          </div>
        </div>

        <div className="bg-surface rounded-3xl p-8 shadow-sm border border-gray-100">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Aktivitas Terbaru</h3>
            <Cpu size={20} className="text-gray-300" aria-hidden="true" />
          </div>

          {dashboard.activities.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
              <CheckCircle2 size={38} className="text-gray-200" />
              <p className="mt-4 font-bold text-gray-600">
                Belum ada penjemputan selesai
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Aktivitas terbaru akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {dashboard.activities.map((activity) => (
                <div key={activity.ticketId} className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={18} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900">
                      Tiket {activity.shortId ? `#${activity.shortId}` : "Penjemputan"} Selesai
                    </p>
                    <p className="mt-1 truncate text-xs text-gray-500">
                      {activity.clientName} · {activity.weight.toLocaleString("id-ID", {
                        maximumFractionDigits: 2,
                      })} Kg · Rp {activity.subtotal.toLocaleString("id-ID", {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                    <span className="mt-2 inline-block text-[10px] font-bold uppercase text-gray-400">
                      {formatRelativeTime(activity.occurredAt, referenceTime)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Link
            href="/admin/routes"
            className="mt-8 block w-full rounded-xl bg-primary/5 py-3 text-center text-sm font-bold text-primary transition-colors hover:bg-primary/10"
          >
            Lihat Tiket Aktif
          </Link>
        </div>
      </div>
    </div>
  );
}
