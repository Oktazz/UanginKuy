"use client";

import { useState } from "react";
import { Coins, AlertCircle, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/utils/format";
import type { CounterWithdrawalVerification } from "@/types/counter";

interface CounterCashoutTabProps {
  onCashoutSuccess: (receipt: CounterWithdrawalVerification) => void;
}

export function CounterCashoutTab({
  onCashoutSuccess,
}: CounterCashoutTabProps) {
  const [tokenInput, setTokenInput] = useState("");
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);
  const [verifiedWithdrawal, setVerifiedWithdrawal] = useState<CounterWithdrawalVerification | null>(null);
  const [isExecutingCashout, setIsExecutingCashout] = useState(false);
  const [cashoutError, setCashoutError] = useState("");

  // Verify Token for Cash Out
  const handleVerifyToken = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tokenInput.trim()) return;

    setIsVerifyingToken(true);
    setCashoutError("");
    setVerifiedWithdrawal(null);
    try {
      const res = await fetch(`/api/counter/cash-out?token=${encodeURIComponent(tokenInput.trim())}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      setVerifiedWithdrawal(json.data);
    } catch (err: unknown) {
      setCashoutError(err instanceof Error ? err.message : "Token tidak valid atau kadaluarsa.");
    } finally {
      setIsVerifyingToken(false);
    }
  };

  // Execute Cash Out
  const handleExecuteCashout = async () => {
    if (!verifiedWithdrawal) return;

    setIsExecutingCashout(true);
    setCashoutError("");
    try {
      const res = await fetch("/api/counter/cash-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenCode: verifiedWithdrawal.tokenCode }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      const completedData: CounterWithdrawalVerification = json.data || verifiedWithdrawal;
      onCashoutSuccess(completedData);
      setVerifiedWithdrawal(null);
      setTokenInput("");
    } catch (err: unknown) {
      setCashoutError(err instanceof Error ? err.message : "Gagal mencairkan penarikan tunai.");
    } finally {
      setIsExecutingCashout(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      <section className="rounded-3xl bg-surface border border-gray-100 p-6 sm:p-8 shadow-sm">
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <Coins size={24} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">
              Kasir Pencairan Tarik Tunai
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Verifikasi kode token tarik tunai 6 digit dari aplikasi nasabah untuk menyerahkan uang fisik.
            </p>
          </div>
        </div>

        {cashoutError && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold flex items-center gap-2.5">
            <AlertCircle size={20} className="shrink-0" />
            <span>{cashoutError}</span>
          </div>
        )}

        <form onSubmit={handleVerifyToken} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Masukkan Kode Token 6-Digit / Scan QR
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={10}
                placeholder="Contoh: 482910"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value.replace(/\D/g, ""))}
                className="flex-1 h-14 px-5 rounded-2xl border border-gray-200 bg-gray-50 text-xl font-mono font-black tracking-widest outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition"
              />
              <Button
                type="submit"
                disabled={!tokenInput.trim() || isVerifyingToken}
                loading={isVerifyingToken}
                className="h-14 px-6 rounded-2xl bg-primary hover:bg-primary-dark text-white font-bold transition-colors shadow-sm cursor-pointer"
              >
                Verifikasi
              </Button>
            </div>
          </div>
        </form>

        {/* Verification Result Card */}
        {verifiedWithdrawal && (
          <div className="mt-6 rounded-2xl border-2 border-primary/20 bg-primary/5 p-6 space-y-4 animate-in zoom-in-95 duration-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <ShieldCheck size={16} /> Token Terverifikasi
              </span>
              <span className="font-mono text-sm font-black text-primary bg-white px-3 py-1 rounded-lg border border-primary/20 shadow-2xs">
                #{verifiedWithdrawal.tokenCode}
              </span>
            </div>

            <div className="flex items-center gap-3.5 pt-2">
              <div className="relative shrink-0">
                {verifiedWithdrawal.client.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={verifiedWithdrawal.client.avatar_url}
                    alt={verifiedWithdrawal.client.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-primary/30 shadow-sm"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {verifiedWithdrawal.client.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary border-2 border-white flex items-center justify-center">
                  <CheckCircle2 size={12} className="text-white" />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-base">{verifiedWithdrawal.client.name}</h4>
                <p className="text-xs text-gray-500 font-mono">
                  {verifiedWithdrawal.client.account_number || "UKN-MEMBER"}
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-white p-4 border border-primary/15 shadow-2xs space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Uang Tunai Yang Harus Diserahkan:</span>
              </div>
              <div className="text-3xl font-black text-primary tracking-tight">
                {formatIDR.format(verifiedWithdrawal.amount)}
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="button"
                onClick={handleExecuteCashout}
                disabled={isExecutingCashout}
                loading={isExecutingCashout}
                loadingLabel="Memproses..."
                className="w-full h-14 rounded-2xl bg-primary hover:bg-primary-dark text-white font-extrabold text-base shadow-md transition-colors cursor-pointer"
              >
                Konfirmasi & Serahkan Uang Tunai ({formatIDR.format(verifiedWithdrawal.amount)})
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
