"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Landmark,
  Loader2,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import type { WithdrawalRecord } from "@/services/withdrawal.service";
import { createClient } from "@/utils/supabase/client";

type AdminWithdrawal = WithdrawalRecord & {
  profiles: { name: string } | null;
};

type ApiResponse<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; message?: string };

type RealtimeStatus = "connecting" | "live" | "fallback";

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const statusMeta = {
  pending: {
    label: "Menunggu persetujuan",
    icon: Clock3,
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  processing: {
    label: "Sedang diproses",
    icon: Loader2,
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  success: {
    label: "Berhasil",
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  failed: {
    label: "Ditolak / saldo kembali",
    icon: XCircle,
    className: "bg-red-50 text-red-700 border-red-200",
  },
} satisfies Record<
  WithdrawalRecord["status"],
  { label: string; icon: typeof Clock3; className: string }
>;

export default function WithdrawalAdminClient() {
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [submittingId, setSubmittingId] = useState("");
  const [realtimeStatus, setRealtimeStatus] =
    useState<RealtimeStatus>("connecting");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadWithdrawals = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/withdrawals", {
        cache: "no-store",
      });
      const result = (await response.json()) as ApiResponse<AdminWithdrawal[]>;
      if (!result.success) throw new Error(result.error);
      setWithdrawals(result.data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Data penarikan belum dapat dimuat.",
      );
    } finally {
      setHasLoaded(true);
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let refreshTimeout: number | undefined;
    let fallbackInterval: number | undefined;
    let active = true;
    const supabase = createClient();

    const scheduleRefresh = () => {
      if (refreshTimeout) window.clearTimeout(refreshTimeout);
      refreshTimeout = window.setTimeout(() => {
        if (active) void loadWithdrawals(false);
      }, 250);
    };

    const startFallback = () => {
      if (!active) return;
      setRealtimeStatus("fallback");
      if (!fallbackInterval) {
        fallbackInterval = window.setInterval(
          () => void loadWithdrawals(false),
          5_000,
        );
      }
    };

    const initialLoadTimeout = window.setTimeout(
      () => void loadWithdrawals(),
      0,
    );

    if (typeof WebSocket === "undefined") {
      console.warn("WebSocket unavailable - using polling fallback", {
        realtime: "disabled",
      });
      startFallback();
      return () => {
        active = false;
        window.clearTimeout(initialLoadTimeout);
        if (refreshTimeout) window.clearTimeout(refreshTimeout);
        if (fallbackInterval) window.clearInterval(fallbackInterval);
      };
    }

    const channel = supabase
      .channel("admin-withdrawals")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "withdrawals",
          select: ["id", "status", "updated_at"],
        },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "withdrawals",
          select: ["id", "status", "updated_at"],
        },
        scheduleRefresh,
      );

    try {
      channel.subscribe((status, subscribeError) => {
        if (!active) return;

        if (status === "SUBSCRIBED") {
          if (fallbackInterval) {
            window.clearInterval(fallbackInterval);
            fallbackInterval = undefined;
          }
          setRealtimeStatus("live");
          scheduleRefresh();
          return;
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Withdrawal Realtime subscription failed:", {
            status,
            error: subscribeError,
          });
          startFallback();
          return;
        }

        if (status === "CLOSED") startFallback();
      });
    } catch (subscribeError) {
      console.error("Withdrawal Realtime unavailable:", subscribeError);
      startFallback();
    }

    return () => {
      active = false;
      window.clearTimeout(initialLoadTimeout);
      if (refreshTimeout) window.clearTimeout(refreshTimeout);
      if (fallbackInterval) window.clearInterval(fallbackInterval);
      void supabase.removeChannel(channel);
    };
  }, [loadWithdrawals]);

  const processWithdrawal = async (
    withdrawalId: string,
    action: "approve" | "reject",
  ) => {
    setSubmittingId(withdrawalId);
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        `/api/admin/withdrawals/${withdrawalId}/${action}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body:
            action === "reject"
              ? JSON.stringify({ reason: "Ditolak oleh admin." })
              : undefined,
        },
      );
      const result = (await response.json()) as ApiResponse<WithdrawalRecord>;
      if (!result.success) throw new Error(result.error);

      setNotice(
        action === "approve"
          ? "Transfer simulasi berhasil disetujui."
          : "Penarikan ditolak dan saldo nasabah telah dikembalikan.",
      );
      await loadWithdrawals();
    } catch (processError) {
      setError(
        processError instanceof Error
          ? processError.message
          : "Penarikan belum berhasil diproses.",
      );
    } finally {
      setSubmittingId("");
    }
  };

  const pendingCount = withdrawals.filter(
    (item) => item.status === "pending",
  ).length;
  const completedCount = withdrawals.filter(
    (item) => item.status === "success",
  ).length;

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-primary">
            <ShieldCheck size={17} />
            MODE SIMULASI
            <span
              className={`ml-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${
                realtimeStatus === "live"
                  ? "bg-emerald-50 text-emerald-700"
                  : realtimeStatus === "fallback"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-gray-100 text-gray-500"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  realtimeStatus === "live"
                    ? "bg-emerald-500"
                    : realtimeStatus === "fallback"
                      ? "bg-amber-500"
                      : "animate-pulse bg-gray-400"
                }`}
              />
              {realtimeStatus === "live"
                ? "Realtime aktif"
                : realtimeStatus === "fallback"
                  ? "Pembaruan otomatis"
                  : "Menghubungkan"}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Persetujuan Penarikan
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
            Tinjau rekening dan nominal. Persetujuan menyelesaikan transfer
            simulasi, sedangkan penolakan mengembalikan saldo secara otomatis.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadWithdrawals()}
          disabled={loading}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-600 transition hover:border-primary/30 hover:text-primary disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={`mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Muat ulang
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Total pengajuan",
            value: withdrawals.length,
            icon: Landmark,
            className: "bg-primary/10 text-primary",
          },
          {
            label: "Menunggu admin",
            value: pendingCount,
            icon: Clock3,
            className: "bg-amber-100 text-amber-700",
          },
          {
            label: "Berhasil",
            value: completedCount,
            icon: CheckCircle2,
            className: "bg-emerald-100 text-emerald-700",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className={`mb-4 inline-flex rounded-xl p-2.5 ${item.className}`}>
                <Icon size={20} />
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{item.value}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-gray-400">
                {item.label}
              </p>
            </div>
          );
        })}
      </div>

      {(error || notice) && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error ? <AlertCircle size={19} /> : <BadgeCheck size={19} />}
          <p className="font-semibold">{error || notice}</p>
        </div>
      )}

      <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="font-extrabold text-gray-900">Daftar penarikan</h2>
          <p className="mt-1 text-sm text-gray-500">
            Nomor rekening disamarkan untuk mengurangi paparan data.
          </p>
        </div>

        {!hasLoaded || loading ? (
          <div className="flex justify-center py-20 text-primary">
            <Loader2 size={30} className="animate-spin" />
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="py-20 text-center text-sm font-semibold text-gray-400">
            Belum ada pengajuan penarikan.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {withdrawals.map((withdrawal) => {
              const meta = statusMeta[withdrawal.status];
              const StatusIcon = meta.icon;
              const submitting = submittingId === withdrawal.id;
              return (
                <article key={withdrawal.id} className="p-6">
                  <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr_auto] xl:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-extrabold text-gray-900">
                          {withdrawal.profiles?.name ?? "Nasabah"}
                        </p>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${meta.className}`}>
                          <StatusIcon size={13} /> {meta.label}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-gray-600">
                        {withdrawal.beneficiary_name ?? "Nasabah"} · {withdrawal.bank_name.toUpperCase()} · ••••{withdrawal.account_number.slice(-4)}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        Ref: {withdrawal.provider_reference_no ?? withdrawal.id.slice(0, 8)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Saldo / diterima
                      </p>
                      <p className="mt-1 font-extrabold text-gray-900">
                        {currencyFormatter.format(withdrawal.amount)}
                        <span className="mx-2 text-gray-300">→</span>
                        <span className="text-primary">{currencyFormatter.format(withdrawal.net_amount)}</span>
                      </p>
                    </div>

                    {withdrawal.status === "pending" && (
                      <div className="flex flex-wrap gap-2 xl:justify-end">
                        <button
                          type="button"
                          onClick={() => void processWithdrawal(withdrawal.id, "reject")}
                          disabled={submitting}
                          className="inline-flex h-10 items-center rounded-xl border border-red-200 px-4 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          <XCircle size={14} className="mr-1.5" /> Tolak
                        </button>
                        <button
                          type="button"
                          onClick={() => void processWithdrawal(withdrawal.id, "approve")}
                          disabled={submitting}
                          className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-xs font-bold text-white transition hover:bg-primary-dark disabled:opacity-50"
                        >
                          {submitting ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <CheckCircle2 size={14} className="mr-1.5" />}
                          Setujui
                        </button>
                      </div>
                    )}
                  </div>

                  {withdrawal.failure_reason && (
                    <p className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">
                      {withdrawal.failure_reason}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
