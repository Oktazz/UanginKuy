"use client";

import { useState } from "react";
import {
  ArrowRight,
  Ban,
  Check,
  Clock3,
  Copy,
  Info,
  ShieldCheck,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/utils/format";
import type { ApiResponse } from "@/types/api";
import type { ActiveCounterToken } from "./types";

interface WithdrawalCashoutTabProps {
  currentBalance: number;
  activeToken: ActiveCounterToken | null;
  setActiveToken: (token: ActiveCounterToken | null) => void;
  cancellingToken: boolean;
  onCancelToken: (withdrawalId?: string) => Promise<void>;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onRefreshData: () => Promise<void>;
}

export function WithdrawalCashoutTab({
  currentBalance,
  activeToken,
  setActiveToken,
  cancellingToken,
  onCancelToken,
  onSuccess,
  onError,
  onRefreshData,
}: WithdrawalCashoutTabProps) {
  const [counterAmount, setCounterAmount] = useState("");
  const [tokenSubmitting, setTokenSubmitting] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);

  const numericCounterAmount = Number(counterAmount) || 0;

  const submitCounterToken = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(counterAmount);
    if (!num || num < 10000 || num > currentBalance) return;

    setTokenSubmitting(true);
    onError("");
    onSuccess("");
    try {
      const res = await fetch("/api/withdrawals/counter-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: num }),
      });
      const data = (await res.json()) as ApiResponse<ActiveCounterToken>;
      if (!data.success) throw new Error(data.error);

      setActiveToken(data.data);
      onSuccess("Token tarik tunai berhasil dibuat! Tunjukkan kepada admin loket.");
      void onRefreshData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membuat kode tarik tunai";
      onError(msg);
    } finally {
      setTokenSubmitting(false);
    }
  };

  return (
    <section className="rounded-3xl border border-gray-100 bg-surface p-6 shadow-sm sm:p-8">
      <div className="mb-7 flex items-start gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">
            Tarik Tunai di Loket Bank Sampah
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Ambil uang tunai langsung di loket bank sampah tanpa potongan biaya admin.
          </p>
        </div>
      </div>

      {activeToken ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 text-center space-y-5">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold">
            <ShieldCheck size={14} /> Token Siap Dicairkan
          </div>

          <div>
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">
              Tunjukkan Kode Ini ke Petugas Loket:
            </h3>
            {/* Tampilan Mobile: Kartu blok solid menyatu dengan pemisah titik tengah yang mudah dibaca di layar kecil */}
            <div className="sm:hidden flex items-center justify-center mb-3">
              <div className="w-full max-w-[280px] bg-gray-100 border-2 border-gray-200 rounded-2xl py-3.5 px-4 flex items-center justify-center gap-2.5 font-mono text-3xl font-black text-gray-900 tracking-wider">
                {activeToken.tokenCode.length === 6 ? (
                  <>
                    <span>{activeToken.tokenCode.slice(0, 3)}</span>
                    <span className="text-gray-400 font-normal">·</span>
                    <span>{activeToken.tokenCode.slice(3, 6)}</span>
                  </>
                ) : (
                  <span>{activeToken.tokenCode}</span>
                )}
              </div>
            </div>

            {/* Tampilan Desktop & Tablet: Ubin digit terpisah yang rapi dan elegan */}
            <div className="hidden sm:flex items-center justify-center gap-2.5 mb-3">
              {activeToken.tokenCode.split("").map((digit, idx) => (
                <span
                  key={idx}
                  className="w-13 h-18 rounded-2xl bg-gray-100 border-2 border-gray-200 flex items-center justify-center font-mono text-4xl font-black text-gray-900"
                >
                  {digit}
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(activeToken.tokenCode);
                setTokenCopied(true);
                setTimeout(() => setTokenCopied(false), 2000);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 text-xs font-bold text-gray-700 transition cursor-pointer"
            >
              {tokenCopied ? (
                <>
                  <Check size={14} className="text-primary" />
                  <span className="text-primary font-bold">Kode Berhasil Disalin!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Salin Kode OTP</span>
                </>
              )}
            </button>
          </div>

          <div className="my-1 inline-block p-4 rounded-2xl bg-white border border-gray-200">
            <QRCodeSVG value={activeToken.tokenCode} size={160} level="H" />
          </div>

          <div className="max-w-xs mx-auto space-y-2 text-xs text-gray-600 bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div className="flex justify-between items-center font-bold text-gray-900 text-sm">
              <span>Nominal Pencairan:</span>
              <span className="text-primary font-black text-base">
                {formatIDR.format(activeToken.amount)}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-gray-500 pt-2 border-t border-gray-200">
              <span className="flex items-center gap-1">
                <Clock3 size={13} />
                Masa Berlaku:
              </span>
              <span className="font-semibold text-gray-700">
                30 Menit (hingga {new Date(activeToken.expiresAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB)
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={cancellingToken}
              loading={cancellingToken}
              loadingLabel="Membatalkan..."
              onClick={() => void onCancelToken(activeToken.withdrawalId)}
              className="w-full sm:w-auto px-5 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-bold text-sm"
            >
              <Ban size={15} className="mr-1.5" />
              Batalkan & Kembalikan Saldo
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submitCounterToken} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="counter-amount"
              className="text-sm font-bold text-gray-700"
            >
              Nominal Penarikan Tunai
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-4 flex items-center font-bold text-gray-400">
                Rp
              </span>
              <input
                id="counter-amount"
                type="number"
                min={10_000}
                max={currentBalance}
                step={1_000}
                required
                value={counterAmount}
                onChange={(e) => setCounterAmount(e.target.value)}
                className="h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-12 pr-4 text-lg font-bold outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                placeholder="50000"
              />
            </div>
            <p className="text-xs font-medium text-gray-500">
              Minimal penarikan Rp10.000
            </p>
          </div>

          <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5 space-y-2.5">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Nominal diajukan</span>
              <span className="font-semibold text-gray-900">
                {numericCounterAmount > 0 ? formatIDR.format(numericCounterAmount) : "-"}
              </span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Biaya layanan</span>
              <span>{numericCounterAmount > 0 ? `- ${formatIDR.format(0)}` : "-"}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-3 font-extrabold text-gray-900 text-base">
              <span>Dana diterima di loket</span>
              <span className="text-primary font-black">
                {numericCounterAmount > 0 ? formatIDR.format(numericCounterAmount) : "-"}
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-[#faf6ea] border border-[#e7e1b1] p-4 text-xs text-gray-800 leading-relaxed flex items-start gap-3">
            <Info size={18} className="text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-gray-900">Mekanisme Penarikan di Loket</p>
              <p className="text-gray-600 leading-relaxed">
                Setelah menekan tombol di bawah, Anda akan memperoleh <strong>Kode OTP 6-Digit & QR Code</strong> yang berlaku selama 30 menit. Saldo Anda akan ditahan sementara dan diserahkan secara tunai setelah diverifikasi oleh petugas loket.
              </p>
            </div>
          </div>

          <Button
            type="submit"
            disabled={
              numericCounterAmount < 10_000 ||
              numericCounterAmount > currentBalance ||
              tokenSubmitting
            }
            loading={tokenSubmitting}
            loadingLabel="Membuat Token..."
            className="h-14 w-full rounded-2xl bg-primary text-lg font-extrabold text-white shadow-md hover:bg-primary-dark hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            Dapatkan Kode Tarik Tunai <ArrowRight size={20} className="ml-2" />
          </Button>
        </form>
      )}
    </section>
  );
}
