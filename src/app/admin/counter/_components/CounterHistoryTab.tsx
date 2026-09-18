"use client";

import { useState, useMemo } from "react";
import {
  History,
  Calendar,
  RefreshCw,
  AlertCircle,
  Scale,
  Coins,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MonthCalendarPicker } from "@/components/ui/MonthCalendarPicker";
import { formatIDR } from "@/utils/format";
import type {
  CounterHistoryItem,
  DropoffTransactionResult,
  CounterWithdrawalVerification,
} from "@/types/counter";

interface CounterHistoryTabProps {
  historyItems: CounterHistoryItem[];
  loadingHistory: boolean;
  historyError: string;
  onReprintDropoff: (result: DropoffTransactionResult) => void;
  onReprintCashout: (receipt: CounterWithdrawalVerification) => void;
  onRefresh: () => void;
}

export function CounterHistoryTab({
  historyItems,
  loadingHistory,
  historyError,
  onReprintDropoff,
  onReprintCashout,
  onRefresh,
}: CounterHistoryTabProps) {
  const currentMonthKey = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }, []);

  const [monthFilter, setMonthFilter] = useState<string>(currentMonthKey);
  const [typeFilter, setTypeFilter] = useState<"all" | "drop_off" | "cash_counter_withdrawal">("all");

  const historyMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    historyItems.forEach((item) => {
      const ym = item.createdAt ? item.createdAt.slice(0, 7) : null;
      if (ym && /^\d{4}-\d{2}$/.test(ym)) {
        monthsSet.add(ym);
      }
    });
    return Array.from(monthsSet);
  }, [historyItems]);

  const selectedMonthLabel = useMemo(() => {
    if (monthFilter === "all") return "Semua Bulan";
    if (monthFilter && /^\d{4}-\d{2}$/.test(monthFilter)) {
      const [y, m] = monthFilter.split("-").map(Number);
      const date = new Date(y, m - 1, 1);
      return date.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      });
    }
    return monthFilter;
  }, [monthFilter]);

  const itemsInSelectedMonth = useMemo(() => {
    if (monthFilter === "all") return historyItems;
    return historyItems.filter((item) => {
      const ym = item.createdAt ? item.createdAt.slice(0, 7) : "";
      return ym === monthFilter;
    });
  }, [historyItems, monthFilter]);

  const historyCounts = useMemo(
    () => ({
      all: itemsInSelectedMonth.length,
      drop_off: itemsInSelectedMonth.filter((i) => i.type === "drop_off").length,
      cash_counter_withdrawal: itemsInSelectedMonth.filter(
        (i) => i.type === "cash_counter_withdrawal"
      ).length,
    }),
    [itemsInSelectedMonth]
  );

  const filteredHistoryItems = useMemo(() => {
    if (typeFilter === "all") return itemsInSelectedMonth;
    return itemsInSelectedMonth.filter((item) => item.type === typeFilter);
  }, [itemsInSelectedMonth, typeFilter]);

  const monthlyStats = useMemo(() => {
    if (itemsInSelectedMonth.length === 0) return null;
    let totalWeight = 0;
    let dropoffAmount = 0;
    let cashoutAmount = 0;

    for (const item of itemsInSelectedMonth) {
      if (item.type === "drop_off") {
        totalWeight += item.weight || 0;
        dropoffAmount += item.amount || 0;
      } else if (item.type === "cash_counter_withdrawal") {
        cashoutAmount += item.amount || 0;
      }
    }

    return {
      totalTransactions: itemsInSelectedMonth.length,
      totalWeight,
      dropoffAmount,
      cashoutAmount,
    };
  }, [itemsInSelectedMonth]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Month & Type Filter Bar */}
      <section className="rounded-3xl bg-surface border border-gray-100 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Month Calendar Picker */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <Calendar size={15} className="text-primary" />
              <span>Periode Bulan:</span>
            </div>
            <MonthCalendarPicker
              value={monthFilter}
              onChange={setMonthFilter}
              ticketMonths={historyMonths}
            />
            {monthFilter !== "all" && (
              <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg">
                {selectedMonthLabel}
              </span>
            )}
          </div>

          {/* Service Type Filter & Refresh */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl bg-gray-100 p-1 text-xs font-bold text-gray-600">
              <button
                type="button"
                onClick={() => setTypeFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  typeFilter === "all"
                    ? "bg-white text-primary shadow-xs"
                    : "hover:text-gray-900"
                }`}
              >
                Semua ({historyCounts.all})
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("drop_off")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  typeFilter === "drop_off"
                    ? "bg-white text-primary shadow-xs"
                    : "hover:text-gray-900"
                }`}
              >
                Drop-off ({historyCounts.drop_off})
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter("cash_counter_withdrawal")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  typeFilter === "cash_counter_withdrawal"
                    ? "bg-white text-primary shadow-xs"
                    : "hover:text-gray-900"
                }`}
              >
                Tarik Tunai ({historyCounts.cash_counter_withdrawal})
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={onRefresh}
              loading={loadingHistory}
              className="h-9 px-3 rounded-xl text-xs font-bold border-gray-200 text-gray-600 hover:bg-gray-100 cursor-pointer"
              title="Segarkan data riwayat"
            >
              <RefreshCw size={13} className={loadingHistory ? "animate-spin" : ""} />
            </Button>
          </div>
        </div>

        {/* Monthly Summary Statistics Cards */}
        {monthlyStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100 text-xs">
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/60">
              <span className="text-gray-400 font-medium block">Total Transaksi</span>
              <span className="text-base font-extrabold text-gray-900 mt-0.5 block">
                {monthlyStats.totalTransactions}
              </span>
            </div>
            <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
              <span className="text-emerald-700 font-medium block">Total Sampah Drop-off</span>
              <span className="text-base font-extrabold text-emerald-800 mt-0.5 block">
                {monthlyStats.totalWeight.toFixed(1)} kg
              </span>
            </div>
            <div className="bg-primary/5 p-3 rounded-xl border border-primary/15">
              <span className="text-primary font-medium block">Total Saldo/Uang Drop-off</span>
              <span className="text-base font-extrabold text-primary mt-0.5 block">
                {formatIDR.format(monthlyStats.dropoffAmount)}
              </span>
            </div>
            <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100">
              <span className="text-amber-700 font-medium block">Total Kasir Tarik Tunai</span>
              <span className="text-base font-extrabold text-amber-800 mt-0.5 block">
                {formatIDR.format(monthlyStats.cashoutAmount)}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* History Table Card */}
      <section className="rounded-3xl bg-surface border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
            <History size={18} className="text-primary" />
            Catatan Transaksi Loket
          </h2>
          <span className="text-xs text-gray-400 font-mono">
            Menampilkan {filteredHistoryItems.length} transaksi
          </span>
        </div>

        {historyError && (
          <div className="mb-4 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold flex items-center gap-2.5">
            <AlertCircle size={18} className="shrink-0" />
            <span>{historyError}</span>
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Jenis Layanan</th>
                <th className="py-3 px-4">Kode Referensi</th>
                <th className="py-3 px-4">Nasabah</th>
                <th className="py-3 px-4 text-right">Rincian Nominal</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Cetak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {loadingHistory ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-gray-200 rounded w-28" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-gray-200 rounded w-24 ml-auto" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-gray-200 rounded w-16 mx-auto" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-gray-200 rounded w-8 mx-auto" /></td>
                  </tr>
                ))
              ) : filteredHistoryItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 text-sm">
                    {historyItems.length === 0
                      ? "Belum ada riwayat transaksi loket yang tercatat."
                      : `Tidak ada transaksi pada filter "${selectedMonthLabel}".`}
                  </td>
                </tr>
              ) : (
                filteredHistoryItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/70 transition text-xs">
                    <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.type === "drop_off" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-primary/10 text-primary border border-primary/20">
                          <Scale size={11} /> Drop-off
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Coins size={11} /> Tarik Tunai
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                      #{item.referenceCode || item.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-gray-900">{item.clientName}</p>
                      <p className="text-[11px] text-gray-400 font-mono">
                        {item.clientAccountNumber || "-"}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {item.type === "drop_off" ? (
                        <div>
                          <p className="font-bold text-primary">
                            {formatIDR.format(item.amount)}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {item.weight ? `${item.weight} kg` : "-"} •{" "}
                            {item.paymentMethod === "cash" ? "Tunai" : "Saldo"}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-bold text-gray-900">
                            {formatIDR.format(item.amount)}
                          </p>
                          <p className="text-[11px] text-amber-600 font-mono">
                            Token #{item.tokenCode || item.referenceCode}
                          </p>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] uppercase">
                        Selesai
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (item.type === "cash_counter_withdrawal") {
                            onReprintCashout({
                              withdrawalId: item.id,
                              tokenCode: item.tokenCode || item.referenceCode,
                              amount: item.amount,
                              client: {
                                id: "",
                                name: item.clientName,
                                account_number: item.clientAccountNumber,
                                balance: item.balance ?? 0,
                                avatar_url: null,
                              },
                              expiresAt: "",
                              isExpired: false,
                            });
                          } else {
                            onReprintDropoff({
                              ticketId: item.id,
                              ticketShortId: item.referenceCode,
                              clientId: "",
                              clientName: item.clientName,
                              clientAccountNumber: item.clientAccountNumber,
                              paymentMethod: item.paymentMethod || "balance",
                              totalWeight: item.weight || 0,
                              totalAmount: item.amount,
                              carbonSaved: (item.weight || 0) * 0.8,
                              completedAt: item.createdAt,
                              items: item.items || [],
                            });
                          }
                        }}
                        title="Cetak Ulang Struk"
                        className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-gray-600 hover:text-primary hover:bg-primary/10 transition cursor-pointer border border-gray-200 hover:border-primary/30"
                      >
                        <Printer size={13} />
                        <span className="hidden xl:inline text-[11px]">Struk</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
