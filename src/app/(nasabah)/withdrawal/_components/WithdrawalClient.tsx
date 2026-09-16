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
  Info,
  Ban,
  Eye,
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
  const [cancellingToken, setCancellingToken] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [copiedHistoryId, setCopiedHistoryId] = useState<string | null>(null);

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

  const handleCancelToken = async (withdrawalId?: string) => {
    if (
      !window.confirm(
        "Apakah Anda yakin ingin membatalkan penarikan tunai ini? Saldo akan segera dikembalikan ke akun Anda."
      )
    ) {
      return;
    }

    setCancellingToken(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/withdrawals/counter-token", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawalId: withdrawalId || activeToken?.withdrawalId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setActiveToken(null);
      setCounterAmount("");
      setNotice(
        `Penarikan tunai berhasil dibatalkan. Saldo ${formatIDR.format(
          data.data.refundedAmount
        )} telah dikembalikan ke akun Anda.`
      );
      await loadData();
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membatalkan penarikan tunai";
      setError(msg);
    } finally {
      setCancellingToken(false);
    }
  };

  const loadData = useCallback(async () => {
    setLoadingPage(true);
    try {
      const [banksResponse, withdrawalsResponse, counterTokenResponse] = await Promise.all([
        fetch("/api/withdrawals/banks", { cache: "no-store" }),
        fetch("/api/withdrawals", { cache: "no-store" }),
        fetch("/api/withdrawals/counter-token", { cache: "no-store" }),
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

      if (counterTokenResponse.ok) {
        const tokenResult = (await counterTokenResponse.json()) as ApiResponse<{
          withdrawalId: string;
          tokenCode: string;
          expiresAt: string;
          amount: number;
        } | null>;
        if (tokenResult.success) {
          setActiveToken(tokenResult.data);
        }
      }
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
  const numericCounterAmount = Number(counterAmount) || 0;
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
        result.data.status === "success"
          ? `Penarikan dana ${formatIDR.format(
              result.data.amount,
            )} berhasil diproses secara otomatis dan telah ditransfer ke rekening ${result.data.bank_name.toUpperCase()}!`
          : "Penarikan berhasil diajukan dan sedang diproses.",
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
            label: "Tarik Tunai di Loket",
            icon: <Store size={18} />,
          },
        ]}
      />

      {channelTab === "bank" ? (
        <section className="rounded-3xl border border-gray-100 bg-surface p-6 shadow-sm sm:p-8">
          <div className="mb-7 flex items-start gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">
                Transfer Bank Otomatis
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Penarikan diproses secara otomatis dan dana langsung ditransfer ke rekening bank tujuan Anda.
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

            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5 space-y-2.5">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Nominal diajukan</span>
                <span className="font-semibold text-gray-900">
                  {numericAmount > 0 ? formatIDR.format(numericAmount) : "-"}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Biaya layanan</span>
                <span>{numericAmount > 0 ? `- ${formatIDR.format(fee)}` : "-"}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3 font-extrabold text-gray-900">
                <span>Dana diterima</span>
                <span className="text-primary font-black">
                  {numericAmount > 0 ? formatIDR.format(netAmount) : "-"}
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
              loadingLabel="Mentransfer Dana..."
              className="h-14 w-full rounded-2xl bg-primary text-lg font-extrabold text-white shadow-md hover:bg-primary-dark hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              Transfer Sekarang <ArrowRight size={20} className="ml-2" />
            </Button>
          </form>
        </section>
      ) : (
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
                  <span className="text-primary font-black text-base">{formatIDR.format(activeToken.amount)}</span>
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
                  onClick={() => handleCancelToken(activeToken.withdrawalId)}
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
                        <p className="font-extrabold text-gray-900 text-base sm:text-lg">
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
                              setChannelTab("counter");
                              setActiveToken({
                                withdrawalId: withdrawal.id,
                                tokenCode: otpCode,
                                expiresAt: withdrawal.token_expires_at || "",
                                amount: withdrawal.amount,
                              });
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition cursor-pointer"
                          >
                            <Eye size={13} />
                            Lihat QR & Detail
                          </button>
                          <button
                            type="button"
                            disabled={cancellingToken}
                            onClick={() => handleCancelToken(withdrawal.id)}
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
    </div>
  );
}
