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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Button } from "@/components/ui/button";
import type { WithdrawalRecord } from "@/services/withdrawal.service";

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

type Bank = {
  code: string;
  name: string;
};

type ApiResponse<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; message?: string };

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
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider">
              MODE SIMULASI
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold text-white/80">
              <ShieldCheck size={14} /> Transfer bank aman
            </span>
          </div>
          <p className="text-sm font-semibold text-white/80">
            Saldo tersedia
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {currencyFormatter.format(currentBalance)}
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
                inputMode="numeric"
                pattern="[0-9]*"
                required
                value={accountNumber}
                onChange={(event) => {
                  setAccountNumber(event.target.value.replace(/\D/g, ""));
                  clearValidation();
                }}
                className="h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 font-semibold outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                placeholder="Masukkan nomor rekening"
              />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={validateAccount}
            disabled={!bankCode || accountNumber.length < 5}
            loading={validating}
            loadingLabel="Validasi rekening"
            className="h-12 w-full items-center justify-center rounded-xl border-primary/30 bg-primary/5 font-bold text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShieldCheck size={19} className="mr-2" />
            Validasi rekening
          </Button>

          {validatedName && (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
              <BadgeCheck size={22} className="shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Nama nasabah (simulasi)
                </p>
                <p className="font-extrabold">{validatedName}</p>
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-gray-50 p-5">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Nominal dari saldo</span>
              <span>{currencyFormatter.format(numericAmount)}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm text-gray-500">
              <span>Biaya layanan</span>
              <span>- {currencyFormatter.format(fee)}</span>
            </div>
            <div className="mt-4 flex justify-between border-t border-gray-200 pt-4 font-extrabold text-gray-900">
              <span>Dana diterima</span>
              <span className="text-primary">
                {currencyFormatter.format(netAmount)}
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

      <section className="rounded-3xl border border-gray-100 bg-surface p-6 shadow-sm sm:p-8">
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
                          {currencyFormatter.format(withdrawal.amount)}
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
                        {currencyFormatter.format(withdrawal.net_amount)}
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
