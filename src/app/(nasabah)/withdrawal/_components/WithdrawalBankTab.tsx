"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/utils/format";
import type { ApiResponse } from "@/types/api";
import type { Bank, WithdrawalRecord } from "./types";

interface WithdrawalBankTabProps {
  currentBalance: number;
  banks: Bank[];
  fee: number;
  loadingPage: boolean;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onRefreshData: () => Promise<void>;
}

export function WithdrawalBankTab({
  currentBalance,
  banks,
  fee,
  loadingPage,
  onSuccess,
  onError,
  onRefreshData,
}: WithdrawalBankTabProps) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [validatedName, setValidatedName] = useState("");
  const [requestKey, setRequestKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);

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
    onSuccess("");
  };

  const validateAccount = async () => {
    onError("");
    onSuccess("");
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
      onSuccess("Format rekening valid untuk kebutuhan simulasi.");
    } catch (validationError) {
      setValidatedName("");
      onError(
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
      onError("Validasi rekening sebelum mengajukan penarikan.");
      return;
    }

    setLoading(true);
    onError("");
    onSuccess("");
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

      onSuccess(
        result.data.status === "success"
          ? `Penarikan dana ${formatIDR.format(
              result.data.amount,
            )} berhasil diproses secara otomatis dan telah ditransfer ke rekening ${result.data.bank_name.toUpperCase()}!`
          : "Penarikan berhasil diajukan dan sedang diproses.",
      );
      setAmount("");
      setRequestKey("");
      await onRefreshData();
      router.refresh();
    } catch (submitError) {
      onError(
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

        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => void validateAccount()}
            disabled={!bankCode || !accountNumber || validating}
            loading={validating}
            loadingLabel="Memeriksa rekening"
            className="h-12 w-full rounded-xl border-primary/30 px-5 font-bold text-primary hover:bg-primary/10"
          >
            <ShieldCheck size={18} className="mr-2" />
            Periksa Nama Rekening
          </Button>

          {validatedName && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700">
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
  );
}
