"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, BadgeCheck, Building2, Store, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { TabsNav } from "@/components/ui/TabsNav";
import { formatIDR } from "@/utils/format";
import type { ApiResponse } from "@/types/api";
import type { ActiveCounterToken, Bank, WithdrawalRecord } from "./types";
import { WithdrawalBankTab } from "./WithdrawalBankTab";
import { WithdrawalCashoutTab } from "./WithdrawalCashoutTab";
import { WithdrawalHistory } from "./WithdrawalHistory";

export default function WithdrawalClient({
  currentBalance,
}: {
  currentBalance: number;
}) {
  const router = useRouter();
  const [channelTab, setChannelTab] = useState<"bank" | "counter">("bank");
  const [activeToken, setActiveToken] = useState<ActiveCounterToken | null>(null);
  const [cancellingToken, setCancellingToken] = useState(false);

  const [banks, setBanks] = useState<Bank[]>([]);
  const [fee, setFee] = useState(0);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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
        const tokenResult = (await counterTokenResponse.json()) as ApiResponse<ActiveCounterToken | null>;
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

  const handleSelectToken = (token: ActiveCounterToken) => {
    setChannelTab("counter");
    setActiveToken(token);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        <WithdrawalBankTab
          currentBalance={currentBalance}
          banks={banks}
          fee={fee}
          loadingPage={loadingPage}
          onSuccess={setNotice}
          onError={setError}
          onRefreshData={loadData}
        />
      ) : (
        <WithdrawalCashoutTab
          currentBalance={currentBalance}
          activeToken={activeToken}
          setActiveToken={setActiveToken}
          cancellingToken={cancellingToken}
          onCancelToken={handleCancelToken}
          onSuccess={setNotice}
          onError={setError}
          onRefreshData={loadData}
        />
      )}

      <WithdrawalHistory
        withdrawals={withdrawals}
        loadingPage={loadingPage}
        cancellingToken={cancellingToken}
        onRefresh={loadData}
        onSelectToken={handleSelectToken}
        onCancelToken={handleCancelToken}
      />
    </div>
  );
}
