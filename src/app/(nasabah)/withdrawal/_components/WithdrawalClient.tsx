"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Wallet,
  XCircle,
  Store,
  Copy,
  Check,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useRouter } from "next/navigation";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Button } from "@/components/ui/button";
import { TabsNav } from "@/components/ui/TabsNav";
import { formatIDR } from "@/utils/format";
import type { ApiResponse } from "@/types/api";
import type { WithdrawalRecord } from "@/services/withdrawal.service";

type Bank = {
  code: string;
  name: string;
};

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

export default function WithdrawalClient({
  currentBalance,
}: {
  currentBalance: number;
}) {
  const router = useRouter();
  const [channelTab, setChannelTab] = useState<"bank" | "counter">("bank");
  const [counterAmount, setCounterAmount] = useState("");
  const [activeToken, setActiveToken] = useState<{
    tokenCode: string;
    expiresAt: string;
    amount: number;
    withdrawalId: string;
  } | null>(null);
  const [tokenSubmitting, setTokenSubmitting] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);

  const [amount, setAmount] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [banks, setBanks] = useState<Bank[]>([]);
  const [fee, setFee] = useState(0);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [validatedName, setValidatedName] = useState("");
  const [requestKey, setRequestKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [loadingPage, setLoadingPage] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const submitCounterToken = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(counterAmount);
    if (!num || num < 10000 || num > currentBalance) return;

    setTokenSubmitting(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/withdrawals/counter-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: num }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setActiveToken(data.data);
      setNotice("Token tarik tunai berhasil dibuat! Tunjukkan kepada admin loket.");
      void loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membuat kode tarik tunai";
      setError(msg);
    } finally {
      setTokenSubmitting(false);
    }
  };

  const loadData = useCallback(async () => {
    setLoadingPage(true);
    try {
      const [banksResponse, withdrawalsResponse] = await Promise.all([
        fetch("/api/withdrawals/banks", { cache: "no-store" }),
        fetch("/api/withdrawals", { cache: "no-store" }),
      ]);
      const bankResult =
        (await banksResponse.json()) as ApiResponse<{
          banks: Bank[];
          fee: number;
          environment: string;
        }>;
      const withdrawalResult =
        (await withdrawalsResponse.json()) as ApiResponse<WithdrawalRecord[]>;

      if (!bankResult.success) throw new Error(bankResult.error);
      if (!withdrawalResult.success) throw new Error(withdrawalResult.error);

      setBanks(bankResult.data.banks);
      setFee(bankResult.data.fee);
      setWithdrawals(withdrawalResult.data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Data penarikan belum dapat dimuat.",
      );
    } finally {
      setLoadingPage(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadData]);

  const numericAmount = Number(amount) || 0;
  const netAmount = Math.max(numericAmount - fee, 0);
  const bankOptions = useMemo(
    () =>
      banks.map((bank) => ({
        value: bank.code,
        label: bank.name,
        description: bank.code.toUpperCase(),
      })),
    [banks],
  );

  const clearValidation = () => {
    setValidatedName("");
    setNotice("");
  };

  const validateAccount = async () => {
    setError("");
    setNotice("");
    setValidating(true);
    try {
      const response = await fetch("/api/withdrawals/validate-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankCode, accountNumber }),
      });
      const result = (await response.json()) as ApiResponse<{
        accountName: string;
      }>;
      if (!result.success) throw new Error(result.error);
      setValidatedName(result.data.accountName);
      setNotice("Format rekening valid untuk kebutuhan simulasi.");
    } catch (validationError) {
      setValidatedName("");
      setError(
        validationError instanceof Error
          ? validationError.message
          : "Rekening tidak dapat divalidasi.",
      );
    } finally {
      setValidating(false);
    }
  };

  const submitWithdrawal = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validatedName) {
      setError("Validasi rekening sebelum mengajukan penarikan.");
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");
    const stableRequestKey = requestKey || crypto.randomUUID();
    if (!requestKey) setRequestKey(stableRequestKey);

    try {
      const response = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numericAmount,
          bankCode,
          accountNumber,
          requestKey: stableRequestKey,
        }),
      });
      const result = (await response.json()) as ApiResponse<WithdrawalRecord>;
      if (!result.success) throw new Error(result.error);

      setNotice(
        "Penarikan dibuat dan menunggu persetujuan admin.",
      );
      setAmount("");
      setRequestKey("");
      await loadData();
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Penarikan belum berhasil diajukan.",
      );
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-12">
      <header className="relative overflow-hidden rounded-3xl bg-primary p-6 text-white shadow-lg sm:p-8">
        <Wallet
          size={72}
          aria-hidden="true"
          className="absolute bottom-4 right-4 opacity-20"
        />
        <div className="relative">
          <p className="text-sm font-semibold text-white/80">
            Saldo tersedia
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {formatIDR.format(currentBalance)}
          </h1>
          <p className="mt-3 max-w-md text-sm font-medium text-white/75">
            Saldo diamankan saat pengajuan dan dikembalikan otomatis bila
            transfer gagal.
          </p>
        </div>
      </header>

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
          {error ? (
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
          ) : (
            <BadgeCheck size={19} className="mt-0.5 shrink-0" />
          )}
          <p className="font-semibold leading-relaxed">{error || notice}</p>
        </div>
      )}

      {/* Channel Switcher */}
      <TabsNav<"bank" | "counter">
        ariaLabel="Metode Penarikan Saldo"
        activeTab={channelTab}
        onChange={setChannelTab}
        tabs={[
          {
            value: "bank",
            label: "Transfer Bank",
            icon: <Building2 size={18} />,
          },
          {
            value: "counter",
            label: "Tarik Tunai di Loket (Gratis Rp 0)",
            icon: <Store size={18} />,
          },
        ]}
      />

      {channelTab === "bank" ? (
        <section className="rounded-3xl border border-gray-100 bg-surface p-6 shadow-sm sm:p-8">
          <div className="mb-7 flex items-start gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <Building2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">
                Ajukan transfer bank
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Format rekening diperiksa secara lokal sebelum saldo dikunci.
              </p>
            </div>
          </div>

          <form onSubmit={submitWithdrawal} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="withdrawal-amount"
                className="text-sm font-bold text-gray-700"
              >
                Nominal penarikan
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-4 flex items-center font-bold text-gray-400">
                  Rp
                </span>
                <input
                  id="withdrawal-amount"
                  type="number"
                  min={10_000}
                  max={currentBalance}
                  step={1_000}
                  required
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-12 pr-4 text-lg font-bold outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                  placeholder="50000"
                />
              </div>
              <p className="text-xs font-medium text-gray-500">
                Minimal Rp10.000 · biaya dipotong dari dana diterima
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">
                  Bank tujuan
                </label>
                <CustomSelect
                  options={bankOptions}
                  value={bankCode}
                  onChange={(value) => {
                    setBankCode(value);
                    clearValidation();
                  }}
                  placeholder={
                    loadingPage ? "Memuat daftar bank..." : "Pilih bank"
                  }
                  triggerClassName="h-14 rounded-2xl bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="withdrawal-account"
                  className="text-sm font-bold text-gray-700"
                >
                  Nomor rekening
                </label>
                <input
                  id="withdrawal-account"
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(event) => {
                    setAccountNumber(event.target.value);
                    clearValidation();
                  }}
                  className="h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-base font-semibold outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                  placeholder="Contoh: 1234567890"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => void validateAccount()}
                disabled={!bankCode || !accountNumber || validating}
                loading={validating}
                loadingLabel="Memeriksa rekening"
                className="h-12 rounded-xl border-primary/30 px-5 font-bold text-primary hover:bg-primary/10"
              >
                <ShieldCheck size={18} className="mr-2" />
                Periksa Nama Rekening
              </Button>

              {validatedName && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2 text-sm font-bold text-emerald-700">
                  <CheckCircle2 size={16} />
                  <span>Atas nama: {validatedName}</span>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-gray-50 p-5">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Nominal diajukan</span>
                <span className="font-semibold text-gray-900">
                  {formatIDR.format(numericAmount)}
                </span>
              </div>
              <div className="mt-2 flex justify-between text-sm text-gray-500">
                <span>Biaya layanan</span>
                <span>- {formatIDR.format(fee)}</span>
              </div>
              <div className="mt-4 flex justify-between border-t border-gray-200 pt-4 font-extrabold text-gray-900">
                <span>Dana diterima</span>
                <span className="text-primary">
                  {formatIDR.format(netAmount)}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={
                !validatedName ||
                numericAmount < 10_000 ||
                numericAmount > currentBalance ||
                netAmount <= 0
              }
              loading={loading}
              loadingLabel="Ajukan Penarikan"
              className="h-14 w-full rounded-2xl bg-primary text-lg font-extrabold text-white shadow-md hover:bg-primary-dark hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              Ajukan Penarikan <ArrowRight size={20} className="ml-2" />
            </Button>
          </form>
        </section>
      ) : (
        <section className="rounded-3xl border border-gray-100 bg-surface p-6 shadow-sm sm:p-8">
          <div className="mb-7 flex items-start gap-3">
            <div className="rounded-2xl bg-emerald-600/10 p-3 text-emerald-600">
              <Store size={24} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">
                Tarik Tunai di Loket Bank Sampah
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Ambil uang tunai langsung dari Admin di loket bank sampah tanpa biaya admin (Gratis Rp 0).
              </p>
            </div>
          </div>

          {activeToken ? (
            <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 p-6 sm:p-8 text-center animate-in zoom-in-95 duration-200">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-4">
                <ShieldCheck size={14} /> Token Siap Dicairkan
              </div>

              <h3 className="text-sm font-semibold text-gray-600 mb-1">
                Tunjukkan Kode Ini ke Petugas Loket:
              </h3>
              <div className="flex items-center justify-center gap-3 my-3">
                <span className="font-mono text-4xl sm:text-5xl font-black text-emerald-900 tracking-widest bg-white px-6 py-2.5 rounded-2xl border-2 border-emerald-300 shadow-sm">
                  {activeToken.tokenCode}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(activeToken.tokenCode);
                    setTokenCopied(true);
                    setTimeout(() => setTokenCopied(false), 2000);
                  }}
                  className="p-3 bg-white hover:bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 transition cursor-pointer shadow-xs"
                  title="Salin Kode"
                >
                  {tokenCopied ? <Check size={20} className="text-emerald-600" /> : <Copy size={20} />}
                </button>
              </div>

              <div className="my-5 inline-block p-4 rounded-2xl bg-white border border-emerald-200/80 shadow-md">
                <QRCodeSVG value={activeToken.tokenCode} size={180} level="H" />
              </div>

              <div className="max-w-xs mx-auto space-y-2 text-xs text-gray-600 bg-white/80 p-3 rounded-xl border border-emerald-100 mb-6">
                <div className="flex justify-between font-bold text-gray-900 text-sm">
                  <span>Nominal Pencairan:</span>
                  <span className="text-emerald-700">{formatIDR.format(activeToken.amount)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-gray-500">
                  <span>Masa Berlaku:</span>
                  <span>30 Menit (hingga {new Date(activeToken.expiresAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB)</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setActiveToken(null);
                  setCounterAmount("");
                }}
                className="w-full sm:w-auto px-6 rounded-xl border-gray-300 font-bold text-gray-700 hover:bg-gray-100"
              >
                Buat Permintaan Baru
              </Button>
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
                    className="h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-12 pr-4 text-lg font-bold outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/20"
                    placeholder="50000"
                  />
                </div>
                <p className="text-xs font-medium text-gray-500">
                  Minimal Rp10.000 · Bebas biaya admin (Gratis)
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-50/60 border border-emerald-100 p-5 space-y-2.5">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Nominal Tunai</span>
                  <span className="font-semibold text-gray-900">
                    {formatIDR.format(Number(counterAmount) || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-emerald-700 font-semibold">
                  <span>Biaya Admin Loket</span>
                  <span className="bg-emerald-100 px-2 py-0.5 rounded-md text-xs font-bold uppercase">Gratis (Rp 0)</span>
                </div>
                <div className="flex justify-between border-t border-emerald-200 pt-3 font-extrabold text-gray-900 text-base">
                  <span>Uang Tunai Diterima di Loket</span>
                  <span className="text-emerald-700">
                    {formatIDR.format(Number(counterAmount) || 0)}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-800 leading-relaxed">
                ℹ️ <strong>Mekanisme:</strong> Setelah menekan tombol di bawah, Anda akan memperoleh <strong>Kode OTP 6-Digit & QR Code</strong> yang berlaku selama 30 menit. Saldo Anda akan ditahan sementara dan baru dicairkan setelah petugas Admin loket memverifikasi kode Anda.
              </div>

              <Button
                type="submit"
                disabled={
                  Number(counterAmount) < 10_000 ||
                  Number(counterAmount) > currentBalance ||
                  tokenSubmitting
                }
                loading={tokenSubmitting}
                loadingLabel="Membuat Token..."
                className="h-14 w-full rounded-2xl bg-emerald-600 text-lg font-extrabold text-white shadow-md hover:bg-emerald-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                Dapatkan Kode Tarik Tunai <ArrowRight size={20} className="ml-2" />
              </Button>
            </form>
          )}
        </section>
      )}

      <section className="rounded-3xl border border-gray-100 bg-surface p-6 shadow-sm sm:p-8" id="riwayat-penarikan">
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
            onClick={() => void loadData()}
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
              const status = statusStyles[withdrawal.status];
              const StatusIcon = status.icon;
              return (
                <article
                  key={withdrawal.id}
                  className="rounded-2xl border border-gray-100 p-4 transition hover:border-primary/20"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-extrabold text-gray-900">
                          {formatIDR.format(withdrawal.amount)}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${status.className}`}
                        >
                          <StatusIcon
                            size={13}
                            className={
                              withdrawal.status === "processing"
                                ? "animate-spin"
                                : ""
                            }
                          />
                          {status.label}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-gray-500">
                        {withdrawal.bank_name.toUpperCase()} · ••••
                        {withdrawal.account_number.slice(-4)} · diterima{" "}
                        {formatIDR.format(withdrawal.net_amount)}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {withdrawal.created_at
                          ? new Date(withdrawal.created_at).toLocaleString(
                              "id-ID",
                            )
                          : "Waktu tidak tersedia"}
                      </p>
                      {withdrawal.failure_reason && (
                        <p className="mt-2 text-xs font-semibold text-red-600">
                          {withdrawal.failure_reason}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
