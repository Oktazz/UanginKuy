"use client";

import { useState, useEffect } from "react";
import { Scale, Coins, History } from "lucide-react";
import { TabsNav } from "@/components/ui/TabsNav";
import {
  CounterDropoffTab,
  type WasteCategory,
} from "./CounterDropoffTab";
import { CounterCashoutTab } from "./CounterCashoutTab";
import { CounterHistoryTab } from "./CounterHistoryTab";
import {
  CounterReceiptModals,
  type WarehouseInfo,
} from "./CounterReceiptModals";
import type {
  DropoffTransactionResult,
  CounterWithdrawalVerification,
  CounterHistoryItem,
} from "@/types/counter";

export type { WasteCategory };

interface CounterClientProps {
  categories: WasteCategory[];
  warehouse?: WarehouseInfo;
}

export default function CounterClient({
  categories,
  warehouse,
}: CounterClientProps) {
  const [activeTab, setActiveTab] = useState<"dropoff" | "cashout" | "history">("dropoff");
  const [warehouseInfo, setWarehouseInfo] = useState<WarehouseInfo | null>(warehouse || null);

  // Modal / Receipt States (shared between tabs for printing / reprinting)
  const [dropoffResult, setDropoffResult] = useState<DropoffTransactionResult | null>(null);
  const [cashoutReceipt, setCashoutReceipt] = useState<CounterWithdrawalVerification | null>(null);

  // History Tab State
  const [historyItems, setHistoryItems] = useState<CounterHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");

  // Fetch warehouse info if not provided via server prop
  useEffect(() => {
    if (warehouse) {
      setWarehouseInfo(warehouse);
      return;
    }
    fetch("/api/warehouse-location")
      .then((res) => res.json())
      .then((res) => {
        if (res?.data) {
          setWarehouseInfo({
            name: res.data.name,
            address: res.data.address,
            phone: res.data.phone,
          });
        }
      })
      .catch(() => {});
  }, [warehouse]);

  // Fetch History for Tab 3
  const loadHistory = async () => {
    setLoadingHistory(true);
    setHistoryError("");
    try {
      const res = await fetch("/api/counter/history?limit=200");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setHistoryItems(json.data || []);
    } catch (err: unknown) {
      setHistoryError(err instanceof Error ? err.message : "Gagal memuat riwayat transaksi.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleTabChange = (tab: "dropoff" | "cashout" | "history") => {
    setActiveTab(tab);
    if (tab === "history") {
      void loadHistory();
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-100">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Loket Bank Sampah
          </h1>
          <p className="text-sm font-medium text-gray-500">
            Penerimaan Sampah Drop-off & Kasir Tarik Tunai di Lokasi
          </p>
        </div>

        {/* Tab Switcher */}
        <TabsNav<"dropoff" | "cashout" | "history">
          ariaLabel="Navigasi Loket Bank Sampah"
          activeTab={activeTab}
          onChange={handleTabChange}
          fullWidth={false}
          className="self-start sm:self-auto"
          tabs={[
            {
              value: "dropoff",
              label: "Penimbangan Drop-off",
              icon: <Scale size={16} />,
            },
            {
              value: "cashout",
              label: "Kasir Tarik Tunai",
              icon: <Coins size={16} />,
            },
            {
              value: "history",
              label: "Riwayat Loket",
              icon: <History size={16} />,
            },
          ]}
        />
      </header>

      {/* Tab 1: Drop-off POS */}
      {activeTab === "dropoff" && (
        <CounterDropoffTab
          categories={categories}
          onDropoffSuccess={(result) => setDropoffResult(result)}
        />
      )}

      {/* Tab 2: Kasir Tarik Tunai */}
      {activeTab === "cashout" && (
        <CounterCashoutTab
          onCashoutSuccess={(receipt) => setCashoutReceipt(receipt)}
        />
      )}

      {/* Tab 3: Riwayat Loket */}
      {activeTab === "history" && (
        <CounterHistoryTab
          historyItems={historyItems}
          loadingHistory={loadingHistory}
          historyError={historyError}
          onRefresh={loadHistory}
          onReprintDropoff={(result) => setDropoffResult(result)}
          onReprintCashout={(receipt) => setCashoutReceipt(receipt)}
        />
      )}

      {/* Shared Receipt & Thermal Print Modals */}
      <CounterReceiptModals
        dropoffResult={dropoffResult}
        onCloseDropoff={() => setDropoffResult(null)}
        cashoutReceipt={cashoutReceipt}
        onCloseCashout={() => setCashoutReceipt(null)}
        warehouseInfo={warehouseInfo}
      />
    </div>
  );
}
