"use client";

import { useState } from "react";
import {
  AlertCircle,
  Ban,
  Building2,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Eye,
  Loader2,
  RefreshCw,
  Store,
  Wallet,
  XCircle,
} from "lucide-react";
import { formatIDR } from "@/utils/format";
import type { ActiveCounterToken, WithdrawalRecord } from "./types";

const statusStyles: Record<
  WithdrawalRecord["status"],
  { label: string; className: string; icon: typeof Clock3 }
> = {
  pending: {
    label: "Menunggu persetujuan",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock3,
  },
  processing: {
    label: "Sedang diproses",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Loader2,
  },
  success: {
    label: "Berhasil",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  failed: {
    label: "Gagal — saldo dikembalikan",
    className: "bg-red-50 text-red-700 border-red-200",
    icon: XCircle,
  },
};

interface WithdrawalHistoryProps {
  withdrawals: WithdrawalRecord[];
  loadingPage: boolean;
  cancellingToken: boolean;
  onRefresh: () => Promise<void>;
  onSelectToken: (token: ActiveCounterToken) => void;
  onCancelToken: (withdrawalId: string) => Promise<void>;
}

export function WithdrawalHistory({
  withdrawals,
  loadingPage,
  cancellingToken,
  onRefresh,
  onSelectToken,
  onCancelToken,
}: WithdrawalHistoryProps) {
  const [copiedHistoryId, setCopiedHistoryId] = useState<string | null>(null);

  return (
    <section
      className="rounded-3xl border border-gray-100 bg-surface p-6 shadow-sm sm:p-8"
      id="riwayat-penarikan"
    >
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">
            Riwayat penarikan
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Pantau proses persetujuan dan transfer dana.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void onRefresh()}
          disabled={loadingPage}
          aria-label="Muat ulang riwayat"
          className="rounded-xl border border-gray-200 p-2.5 text-gray-500 transition hover:border-primary/30 hover:text-primary disabled:opacity-50"
        >
          <RefreshCw
            size={18}
            className={loadingPage ? "animate-spin" : ""}
          />
        </button>
      </div>

      {withdrawals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-12 text-center">
          <Wallet className="mx-auto text-gray-300" size={34} />
          <p className="mt-3 text-sm font-semibold text-gray-500">
            Belum ada riwayat penarikan.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {withdrawals.map((withdrawal) => {
            const isCounter =
              withdrawal.withdrawal_type === "cash_counter" ||
              withdrawal.bank_name === "TUNAI_LOKET";
            const otpCode =
              withdrawal.token_code || (isCounter ? withdrawal.account_number : null);
            const isPending = withdrawal.status === "pending";
            const isExpired =
              isCounter &&
              isPending &&
              withdrawal.token_expires_at &&
              new Date(withdrawal.token_expires_at) < new Date();

            const status = statusStyles[withdrawal.status];
            const StatusIcon = status.icon;

            const displayStatusLabel =
              isCounter && isPending && !isExpired
                ? "Token Aktif (Siap Dicairkan)"
                : isCounter && withdrawal.status === "failed" && withdrawal.refunded_at
                ? "Dibatalkan / Kadaluarsa (Saldo Dikembalikan)"
                : status.label;

            const displayStatusClass =
              isCounter && isPending && !isExpired
                ? "bg-primary/10 text-primary border-primary/20"
                : status.className;

            return (
              <article
                key={withdrawal.id}
                className="rounded-2xl border border-gray-100 p-4 sm:p-5 transition hover:border-primary/20 bg-white"
              >
                <div className="flex flex-col justify-between gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-extrabold text-gray-900 text-base sm:lg">
                        {formatIDR.format(withdrawal.amount)}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${displayStatusClass}`}
                      >
                        <StatusIcon
                          size={13}
                          className={
                            withdrawal.status === "processing"
                              ? "animate-spin"
                              : ""
                          }
                        />
                        {displayStatusLabel}
                      </span>
                    </div>

                    <p className="text-xs text-gray-400">
                      {withdrawal.created_at
                        ? new Date(withdrawal.created_at).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Waktu tidak tersedia"}
                    </p>
                  </div>

                  <div className="text-sm font-medium text-gray-500">
                    {isCounter ? (
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <Store size={14} className="text-primary shrink-0" />
                        <span>Tarik Tunai di Loket</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-gray-600 font-semibold">
                          Diterima: {formatIDR.format(withdrawal.net_amount)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <Building2 size={14} className="text-gray-400 shrink-0" />
                        <span>
                          {withdrawal.bank_name.toUpperCase()} · ••••
                          {withdrawal.account_number.slice(-4)}
                        </span>
                        <span className="text-gray-300">·</span>
                        <span className="text-gray-600 font-semibold">
                          Diterima: {formatIDR.format(withdrawal.net_amount)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Jika Penarikan Loket Masih Pending & Aktif: Tampilkan Banner Kode OTP & Aksi */}
                  {isCounter && isPending && !isExpired && otpCode && (
                    <div className="mt-2 p-3 sm:p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Kode OTP:
                        </span>
                        <div className="font-mono text-xl sm:text-2xl font-black text-gray-900 tracking-wider bg-white px-3.5 py-1 rounded-xl border border-gray-200 shadow-xs">
                          {otpCode.length === 6 ? `${otpCode.slice(0, 3)} · ${otpCode.slice(3, 6)}` : otpCode}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(otpCode);
                            setCopiedHistoryId(withdrawal.id);
                            setTimeout(() => setCopiedHistoryId(null), 2000);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-xs font-bold text-gray-700 transition cursor-pointer"
                        >
                          {copiedHistoryId === withdrawal.id ? (
                            <>
                              <Check size={13} className="text-primary" />
                              <span className="text-primary">Tersalin</span>
                            </>
                          ) : (
                            <>
                              <Copy size={13} />
                              <span>Salin</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-2.5 pt-1 sm:pt-0 border-t sm:border-t-0 border-gray-200 justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectToken({
                              withdrawalId: withdrawal.id,
                              tokenCode: otpCode,
                              expiresAt: withdrawal.token_expires_at || "",
                              amount: withdrawal.amount,
                            });
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition cursor-pointer"
                        >
                          <Eye size={13} />
                          Lihat QR & Detail
                        </button>
                        <button
                          type="button"
                          disabled={cancellingToken}
                          onClick={() => void onCancelToken(withdrawal.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition cursor-pointer"
                        >
                          <Ban size={13} />
                          Batalkan
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Jika Penarikan Loket sudah Selesai atau Gagal/Kadaluarsa: Tampilkan kode referensi jika ada */}
                  {isCounter && (!isPending || isExpired) && otpCode && (
                    <div className="mt-1 text-xs text-gray-500 flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-600">Kode OTP:</span>
                      <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md">
                        {otpCode}
                      </span>
                      {withdrawal.status === "failed" && (
                        <span className="text-emerald-700 font-medium">
                          (Saldo telah dikembalikan)
                        </span>
                      )}
                    </div>
                  )}

                  {withdrawal.failure_reason && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-red-600">
                      <AlertCircle size={13} className="shrink-0" />
                      <span>{withdrawal.failure_reason}</span>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
