"use client";

import { useState, useEffect } from "react";
import {
  Scale,
  Coins,
  History,
  Search,
  User,
  Plus,
  Trash2,
  Wifi,
  CheckCircle2,
  AlertCircle,
  Printer,
  X,
  Banknote,
  Wallet,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Ticket,
  Phone,
  MapPin,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TabsNav } from "@/components/ui/TabsNav";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { ThermalReceipt } from "@/components/receipts/ThermalReceipt";
import { printThermalElement } from "@/utils/thermal-print";
import { formatIDR } from "@/utils/format";
import type {
  NasabahSearchRecord,
  DropoffItemInput,
  DropoffTransactionResult,
  CounterWithdrawalVerification,
  CounterHistoryItem,
} from "@/types/counter";

interface WasteCategory {
  id: number;
  name: string;
  material_group: string;
  price_per_kg: number;
  carbon_factor: number;
}

interface CounterClientProps {
  categories: WasteCategory[];
  warehouse?: {
    name?: string;
    address?: string;
    phone?: string;
  };
}

export default function CounterClient({ categories, warehouse }: CounterClientProps) {
  const [activeTab, setActiveTab] = useState<"dropoff" | "cashout" | "history">("dropoff");
  const [warehouseInfo, setWarehouseInfo] = useState(warehouse);

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

  // ==========================================
  // TAB 1: DROPOFF POS STATE
  // ==========================================
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<NasabahSearchRecord[]>([]);
  const [selectedClient, setSelectedClient] = useState<NasabahSearchRecord | null>(null);
  const [linkedTicketId, setLinkedTicketId] = useState<string | null>(null);
  const [ticketShortId, setTicketShortId] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<number>(categories[0]?.id || 1);
  const [inputWeight, setInputWeight] = useState<string>("");
  const [items, setItems] = useState<(DropoffItemInput & { categoryName: string })[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "balance">("cash");
  const [submittingDropoff, setSubmittingDropoff] = useState(false);
  const [dropoffResult, setDropoffResult] = useState<DropoffTransactionResult | null>(null);
  const [dropoffError, setDropoffError] = useState("");

  // IoT Sync State
  const [isSyncingIot, setIsSyncingIot] = useState(false);
  const [iotStatusMessage, setIotStatusMessage] = useState<string | null>(null);
  const [iotError, setIotError] = useState<string | null>(null);

  // ==========================================
  // TAB 2: CASH OUT (TARIK TUNAI) STATE
  // ==========================================
  const [tokenInput, setTokenInput] = useState("");
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);
  const [verifiedWithdrawal, setVerifiedWithdrawal] = useState<CounterWithdrawalVerification | null>(null);
  const [isExecutingCashout, setIsExecutingCashout] = useState(false);
  const [cashoutError, setCashoutError] = useState("");
  const [cashoutReceipt, setCashoutReceipt] = useState<CounterWithdrawalVerification | null>(null);

  // ==========================================
  // TAB 3: HISTORY STATE
  // ==========================================
  const [historyItems, setHistoryItems] = useState<CounterHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");

  // Search Nasabah Debounce
  useEffect(() => {
    if (!searchQuery.trim()) return;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/counter/search-nasabah?q=${encodeURIComponent(searchQuery.trim())}`);
        const json = await res.json();
        if (json.success) {
          setSearchResults(json.data || []);
        }
      } catch (err: unknown) {
        console.error("Search nasabah failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search Nasabah by Member ID or Ticket
  const handleSearchSubmit = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setIsSearching(true);
    setDropoffError("");
    try {
      // 1. Direct Member ID lookup
      const idRes = await fetch(`/api/counter/search-nasabah?id=${encodeURIComponent(q)}`);
      const idJson = await idRes.json();
      if (idJson.success && idJson.data) {
        setSelectedClient(idJson.data);
        setLinkedTicketId(null);
        setTicketShortId(null);
        setSearchResults([]);
        setSearchQuery("");
        return;
      }

      // 2. Ticket Short ID lookup
      if (q.toUpperCase().startsWith("TK-") || q.length === 8) {
        const ticketRes = await fetch(`/api/counter/search-nasabah?ticket=${encodeURIComponent(q)}`);
        const ticketJson = await ticketRes.json();
        if (ticketJson.success && ticketJson.data) {
          const t = ticketJson.data;
          setLinkedTicketId(t.id);
          setTicketShortId(t.short_id);
          if (t.client) {
            setSelectedClient({
              id: t.client.id,
              name: t.client.name,
              account_number: t.client.account_number,
              balance: Number(t.client.balance || 0),
              avatar_url: t.client.avatar_url,
              phone_number: t.user_addresses?.phone_number || null,
              address: t.user_addresses?.full_address || null,
            });
          }
          setSearchResults([]);
          setSearchQuery("");
          return;
        }
      }

      // 3. Fallback general query
      const generalRes = await fetch(`/api/counter/search-nasabah?q=${encodeURIComponent(q)}`);
      const generalJson = await generalRes.json();
      if (generalJson.success && Array.isArray(generalJson.data) && generalJson.data.length > 0) {
        if (generalJson.data.length === 1) {
          setSelectedClient(generalJson.data[0]);
          setSearchResults([]);
          setSearchQuery("");
        } else {
          setSearchResults(generalJson.data);
        }
      } else {
        setDropoffError(`Nasabah dengan ID "${q}" tidak ditemukan.`);
      }
    } catch {
      setDropoffError("Gagal mencari data nasabah.");
    } finally {
      setIsSearching(false);
    }
  };

  // Sync Weight with IoT Digital Scale
  const handleSyncIot = async () => {
    setIsSyncingIot(true);
    setIotError(null);
    setIotStatusMessage(null);
    try {
      const res = await fetch("/api/iot/latest", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || "Gagal menghubungi perangkat timbangan IoT");
      }

      const val = json.data.liveWeight ?? json.data.weight;
      if (val !== null && val !== undefined) {
        setInputWeight(val.toString());
        setIotStatusMessage(`Bobot tersinkronisasi: ${val} kg (${json.data.deviceId})`);
      } else {
        setIotError("Nilai timbangan belum terbaca (0 kg).");
      }
    } catch (err: unknown) {
      setIotError(err instanceof Error ? err.message : "Gagal sinkronisasi IoT.");
    } finally {
      setIsSyncingIot(false);
    }
  };

  // Add Item to weighing table
  const handleAddItem = () => {
    const w = parseFloat(inputWeight);
    if (!w || isNaN(w) || w <= 0) return;

    const cat = categories.find((c) => c.id === selectedCategory);
    if (!cat) return;

    const subtotal = Math.round(w * cat.price_per_kg);
    setItems((prev) => [
      ...prev,
      {
        wasteCategoryId: cat.id,
        categoryName: cat.name,
        weight: w,
        priceApplied: cat.price_per_kg,
        subtotal,
      },
    ]);

    setInputWeight("");
    setIotStatusMessage(null);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalCarbon = items.reduce((sum, item) => {
    const cat = categories.find((c) => c.id === item.wasteCategoryId);
    return sum + item.weight * (cat?.carbon_factor || 2.5);
  }, 0);

  // Submit Dropoff
  const handleSubmitDropoff = async () => {
    if (!selectedClient) {
      setDropoffError("Silakan pilih nasabah terlebih dahulu.");
      return;
    }
    if (items.length === 0) {
      setDropoffError("Minimal tambahkan 1 jenis sampah yang ditimbang.");
      return;
    }

    setSubmittingDropoff(true);
    setDropoffError("");
    try {
      const payload = {
        clientId: selectedClient.id,
        ticketId: linkedTicketId,
        paymentMethod,
        items: items.map((i) => ({
          wasteCategoryId: i.wasteCategoryId,
          weight: i.weight,
          priceApplied: i.priceApplied,
          subtotal: i.subtotal,
        })),
      };

      const res = await fetch("/api/counter/drop-off", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      setDropoffResult({
        ...json.data,
        items:
          json.data?.items && json.data.items.length > 0
            ? json.data.items
            : items.map((i) => ({
                categoryName: i.categoryName,
                weight: i.weight,
                priceApplied: i.priceApplied,
                subtotal: i.subtotal,
              })),
        clientAccountNumber:
          json.data?.clientAccountNumber || selectedClient.account_number,
      });
      // Reset form
      setItems([]);
      setSelectedClient(null);
      setLinkedTicketId(null);
      setTicketShortId(null);
      setSearchQuery("");
    } catch (err: unknown) {
      setDropoffError(err instanceof Error ? err.message : "Gagal memproses transaksi drop-off.");
    } finally {
      setSubmittingDropoff(false);
    }
  };

  // Verify Token for Cash Out
  const handleVerifyToken = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tokenInput.trim()) return;

    setIsVerifyingToken(true);
    setCashoutError("");
    setVerifiedWithdrawal(null);
    setCashoutReceipt(null);
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
      setCashoutReceipt(completedData);
      setVerifiedWithdrawal(null);
      setTokenInput("");
    } catch (err: unknown) {
      setCashoutError(err instanceof Error ? err.message : "Gagal mencairkan penarikan tunai.");
    } finally {
      setIsExecutingCashout(false);
    }
  };

  // Fetch History
  const loadHistory = async () => {
    setLoadingHistory(true);
    setHistoryError("");
    try {
      const res = await fetch("/api/counter/history?limit=40");
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

  // Print handlers for thermal receipts (only triggers on print action)
  const handlePrintDropoff = () => {
    const el = document.getElementById("dropoff-thermal-receipt");
    if (!el) return;
    const refCode =
      dropoffResult?.ticketShortId ||
      dropoffResult?.ticketId.substring(0, 8).toUpperCase() ||
      "LOKET";
    printThermalElement(el, {
      documentTitle: `Struk-Setor-${refCode}`,
    });
  };

  const handlePrintCashout = () => {
    const el = document.getElementById("cashout-thermal-receipt");
    if (!el) return;
    const refCode =
      cashoutReceipt?.tokenCode ||
      cashoutReceipt?.withdrawalId.substring(0, 8).toUpperCase() ||
      "KASIR";
    printThermalElement(el, {
      documentTitle: `Struk-Tarik-${refCode}`,
    });
  };

  // Keyboard shortcut listener (Enter for print, Esc for close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (dropoffResult) setDropoffResult(null);
        if (cashoutReceipt) setCashoutReceipt(null);
      } else if (e.key === "Enter" && !e.shiftKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          if (dropoffResult) {
            e.preventDefault();
            handlePrintDropoff();
          } else if (cashoutReceipt) {
            e.preventDefault();
            handlePrintCashout();
          }
        }
      }
    };

    if (dropoffResult || cashoutReceipt) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [dropoffResult, cashoutReceipt]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Loket Bank Sampah
              </h1>
              <p className="text-sm font-medium text-gray-500">
                Penerimaan Sampah Drop-off & Kasir Tarik Tunai di Lokasi
              </p>
            </div>
          </div>
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

      {/* ========================================================================= */}
      {/* TAB 1: PENIMBANGAN DROP-OFF */}
      {/* ========================================================================= */}
      {activeTab === "dropoff" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {dropoffError && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">
              <AlertCircle size={20} className="shrink-0" />
              <span>{dropoffError}</span>
            </div>
          )}

          {/* Section 1: Identifikasi & Profil Nasabah */}
          <section className="rounded-3xl bg-surface border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <User size={18} className="text-primary" />
                1. Identifikasi & Profil Nasabah
              </h3>
              {selectedClient && (
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20 flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-primary" />
                  ID Terverifikasi
                </span>
              )}
            </div>

            {!selectedClient ? (
              <div className="space-y-3 relative">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                    <input
                      type="text"
                      placeholder="Masukkan atau scan Member ID Nasabah (contoh: UKN-XXXXXX)..."
                      value={searchQuery}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSearchQuery(val);
                        if (!val.trim()) {
                          setSearchResults([]);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void handleSearchSubmit();
                      }}
                      className="w-full h-13 pl-11 pr-4 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-mono font-medium outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleSearchSubmit()}
                    loading={isSearching}
                    className="h-13 px-5 rounded-2xl font-bold border-gray-200 text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    <Search size={16} className="mr-1.5" />
                    Cari ID
                  </Button>
                </div>

                {/* Search Dropdown Loading Skeleton */}
                {isSearching && searchResults.length === 0 && (
                  <div className="absolute top-14 left-0 right-0 z-30 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden divide-y divide-gray-100 p-3 space-y-2">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-2">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                          <div className="space-y-1.5">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                        <div className="space-y-1 items-end flex flex-col">
                          <Skeleton className="h-3 w-10" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Search Dropdown Results */}
                {searchResults.length > 0 && (
                  <div className="absolute top-14 left-0 right-0 z-30 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden divide-y divide-gray-100">
                    {searchResults.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => {
                          setSelectedClient(client);
                          setSearchResults([]);
                          setSearchQuery("");
                        }}
                        className="w-full text-left p-4 hover:bg-gray-50 transition flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          {client.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={client.avatar_url}
                              alt={client.name}
                              className="w-10 h-10 rounded-xl object-cover border border-gray-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                              {client.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{client.name}</p>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">
                              {client.account_number || "Tanpa ID"} • {client.phone_number || "Tanpa No HP"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-400 font-medium">Saldo</span>
                          <p className="text-sm font-bold text-primary">{formatIDR.format(client.balance)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-3xl border border-primary/20 bg-primary/5 p-5 sm:p-6 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-5 border-b border-gray-100">
                  {/* Avatar & Main Info */}
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="relative shrink-0">
                      {selectedClient.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={selectedClient.avatar_url}
                          alt={selectedClient.name}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-primary/30 shadow-md"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center font-extrabold text-xl shadow-md">
                          {selectedClient.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary border-2 border-white flex items-center justify-center">
                        <CheckCircle2 size={12} className="text-white" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-extrabold text-gray-900 text-lg">
                          {selectedClient.name}
                        </h4>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-primary/10 text-primary">
                          Nasabah
                        </span>
                        {ticketShortId && (
                          <span className="inline-flex items-center gap-1 bg-primary text-white text-[11px] font-bold px-2.5 py-0.5 rounded-lg shadow-xs">
                            <Ticket size={12} /> Tiket #{ticketShortId}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Member ID:</span>
                        <span className="font-mono text-xs font-extrabold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-lg tracking-wider">
                          {selectedClient.account_number || "UKN-MEMBER"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Saldo & Action */}
                  <div className="flex items-center justify-between md:justify-end gap-3 self-stretch md:self-auto">
                    <div className="bg-white px-4 py-2.5 rounded-2xl border border-primary/15 shadow-xs text-right flex-1 md:flex-initial">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Saldo Dompet Nasabah
                      </span>
                      <p className="text-lg sm:text-xl font-black text-primary mt-0.5">
                        {formatIDR.format(selectedClient.balance)}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSelectedClient(null);
                        setLinkedTicketId(null);
                        setTicketShortId(null);
                        setSearchQuery("");
                      }}
                      className="h-11 px-3.5 rounded-xl border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 font-bold text-xs cursor-pointer"
                      title="Ganti Nasabah"
                    >
                      <X size={15} className="mr-1" />
                      Ganti ID
                    </Button>
                  </div>
                </div>

                {/* Sub-profile Details: Phone & Address */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 text-xs">
                  <div className="flex items-center gap-2.5 text-gray-600 bg-white/70 p-2.5 rounded-xl border border-gray-100">
                    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                      <Phone size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-gray-400 block uppercase">No. Telepon / WA</span>
                      <span className="font-semibold text-gray-900 truncate block">
                        {selectedClient.phone_number || "Tidak ada nomor HP"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-gray-600 bg-white/70 p-2.5 rounded-xl border border-gray-100">
                    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                      <MapPin size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-gray-400 block uppercase">Alamat Domisili</span>
                      <span className="font-semibold text-gray-900 truncate block" title={selectedClient.address || selectedClient.city || undefined}>
                        {selectedClient.address || selectedClient.city || "Alamat belum diatur"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Section 2: Input Timbangan */}
          <section className="rounded-3xl bg-surface border border-gray-100 p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Scale size={18} className="text-primary" />
              2. Penimbangan Sampah
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
              <div className="md:col-span-5">
                <label
                  htmlFor="counter-waste-category"
                  className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5"
                >
                  Kategori Sampah
                </label>
                <CustomSelect
                  id="counter-waste-category"
                  value={String(selectedCategory)}
                  onChange={(val) => setSelectedCategory(Number(val))}
                  options={categories.map((cat) => ({
                    value: String(cat.id),
                    label: `${cat.name} — ${formatIDR.format(cat.price_per_kg)}/kg`,
                  }))}
                  placeholder="Pilih Kategori Sampah..."
                  triggerClassName="h-12 rounded-xl border-gray-200 bg-gray-50 text-sm font-semibold hover:border-gray-300 focus:bg-white focus:border-primary"
                />
              </div>

              <div className="md:col-span-4">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Berat (kg)
                  </label>
                  <button
                    type="button"
                    onClick={handleSyncIot}
                    disabled={isSyncingIot}
                    className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Wifi size={12} className={isSyncingIot ? "animate-pulse text-amber-500" : ""} />
                    {isSyncingIot ? "Membaca..." : "Sync IoT Timbangan"}
                  </button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  placeholder="Contoh: 2.5"
                  value={inputWeight}
                  onChange={(e) => setInputWeight(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddItem();
                  }}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-bold outline-none focus:border-primary focus:bg-white transition"
                />
              </div>

              <div className="md:col-span-3 flex items-end">
                <Button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!inputWeight || parseFloat(inputWeight) <= 0}
                  className="w-full h-12 rounded-xl bg-primary text-white font-bold shadow-sm hover:bg-primary-dark cursor-pointer"
                >
                  <Plus size={18} className="mr-1.5" />
                  Tambah Item
                </Button>
              </div>
            </div>

            {/* IoT Feedback Alert */}
            {iotStatusMessage && (
              <div className="mb-4 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center gap-2">
                <CheckCircle2 size={15} />
                <span>{iotStatusMessage}</span>
              </div>
            )}
            {iotError && (
              <div className="mb-4 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-xl flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{iotError}</span>
              </div>
            )}

            {/* Tabel Sampah Ditimbang */}
            <div className="rounded-2xl border border-gray-200 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Kategori Sampah</th>
                    <th className="py-3 px-4 text-right">Berat</th>
                    <th className="py-3 px-4 text-right">Harga/kg</th>
                    <th className="py-3 px-4 text-right">Subtotal</th>
                    <th className="py-3 px-4 text-center w-12">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">
                        Belum ada item sampah yang ditambahkan ke timbangan.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/70 transition">
                        <td className="py-3 px-4 font-semibold text-gray-900">{item.categoryName}</td>
                        <td className="py-3 px-4 text-right font-bold text-gray-800">{item.weight} kg</td>
                        <td className="py-3 px-4 text-right text-gray-500">{formatIDR.format(item.priceApplied)}</td>
                        <td className="py-3 px-4 text-right font-bold text-primary">
                          {formatIDR.format(item.subtotal)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-gray-400 hover:text-red-600 transition p-1 cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {items.length > 0 && (
                  <tfoot className="bg-gray-50/80 font-bold border-t-2 border-gray-200 text-gray-900">
                    <tr>
                      <td className="py-3 px-4">Total</td>
                      <td className="py-3 px-4 text-right text-primary font-black">{totalWeight.toFixed(2)} kg</td>
                      <td className="py-3 px-4 text-right text-xs text-gray-500">
                        ~{totalCarbon.toFixed(1)} kg CO₂e
                      </td>
                      <td className="py-3 px-4 text-right text-primary text-base font-black">
                        {formatIDR.format(totalAmount)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </section>

          {/* Section 3: Pilihan Pembayaran & Penyelesaian */}
          <section className="rounded-3xl bg-surface border border-gray-100 p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Banknote size={18} className="text-primary" />
              3. Opsi Pembayaran Hasil Sampah
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <label
                className={`relative flex items-start p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                  paymentMethod === "cash"
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={paymentMethod === "cash"}
                  onChange={() => setPaymentMethod("cash")}
                  className="mt-1 w-4 h-4 text-primary focus:ring-primary"
                />
                <div className="ml-3">
                  <div className="flex items-center gap-2">
                    <Banknote size={18} className="text-primary" />
                    <span className="font-extrabold text-gray-900 text-sm sm:text-base">
                      Bayar Tunai (Cash di Lokasi)
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    Admin menyerahkan uang fisik langsung ke nasabah. Saldo akun nasabah <strong>TIDAK bertambah</strong>, tetapi statistik sampah & jejak karbon tetap tercatat.
                  </p>
                </div>
              </label>

              <label
                className={`relative flex items-start p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                  paymentMethod === "balance"
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="balance"
                  checked={paymentMethod === "balance"}
                  onChange={() => setPaymentMethod("balance")}
                  className="mt-1 w-4 h-4 text-primary focus:ring-primary"
                />
                <div className="ml-3">
                  <div className="flex items-center gap-2">
                    <Wallet size={18} className="text-primary" />
                    <span className="font-extrabold text-gray-900 text-sm sm:text-base">
                      Masuk Saldo Akun Nasabah
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    Uang otomatis masuk ke saldo akun UanginKuy nasabah. Nasabah dapat mencairkannya kapan saja lewat transfer bank atau tarik tunai loket.
                  </p>
                </div>
              </label>
            </div>

            <Button
              type="button"
              onClick={handleSubmitDropoff}
              disabled={!selectedClient || items.length === 0 || submittingDropoff}
              loading={submittingDropoff}
              loadingLabel="Menyimpan Transaksi..."
              className="w-full h-14 rounded-2xl bg-primary hover:bg-primary-dark text-white font-extrabold text-lg shadow-md transition cursor-pointer"
            >
              Selesaikan Transaksi ({formatIDR.format(totalAmount)}) <ArrowRight size={20} className="ml-2" />
            </Button>
          </section>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: KASIR TARIK TUNAI */}
      {/* ========================================================================= */}
      {activeTab === "cashout" && (
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
      )}

      {/* ========================================================================= */}
      {/* TAB 3: RIWAYAT TRANSAKSI LOKET */}
      {/* ========================================================================= */}
      {activeTab === "history" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <section className="rounded-3xl bg-surface border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Riwayat Transaksi Loket</h3>
                <p className="text-xs text-gray-500 mt-0.5">Daftar transaksi drop-off sampah dan pencairan kasir hari ini.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={loadHistory}
                disabled={loadingHistory}
                className="rounded-xl font-bold"
              >
                <RefreshCw size={14} className={loadingHistory ? "animate-spin mr-1.5" : "mr-1.5"} />
                Segarkan
              </Button>
            </div>

            {historyError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-700 text-xs font-semibold">
                {historyError}
              </div>
            )}

            <div className="rounded-2xl border border-gray-200 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Jenis Transaksi</th>
                    <th className="py-3 px-4">Ref / Tiket</th>
                    <th className="py-3 px-4">Nasabah</th>
                    <th className="py-3 px-4 text-right">Berat (kg)</th>
                    <th className="py-3 px-4 text-right">Nominal</th>
                    <th className="py-3 px-4 text-center">Metode / Status</th>
                    <th className="py-3 px-4 text-center w-20">Struk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {loadingHistory ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-3.5 px-4">
                          <Skeleton className="h-4 w-12" />
                        </td>
                        <td className="py-3.5 px-4">
                          <Skeleton className="h-6 w-24 rounded-full" />
                        </td>
                        <td className="py-3.5 px-4">
                          <Skeleton className="h-4 w-20" />
                        </td>
                        <td className="py-3.5 px-4 space-y-1">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-3 w-20" />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Skeleton className="h-4 w-14 ml-auto" />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Skeleton className="h-4 w-20 ml-auto" />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Skeleton className="h-5 w-20 mx-auto rounded-md" />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Skeleton className="h-7 w-12 mx-auto rounded-lg" />
                        </td>
                      </tr>
                    ))
                  ) : historyItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-400">
                        Belum ada transaksi di loket hari ini.
                      </td>
                    </tr>
                  ) : (
                    historyItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/70 transition">
                        <td className="py-3.5 px-4 text-xs text-gray-500">
                          {new Date(item.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="py-3.5 px-4">
                          {item.type === "drop_off" ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                              <Scale size={12} /> Drop-off
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                              <Coins size={12} /> Tarik Tunai
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs font-bold text-gray-700">
                          #{item.referenceCode}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-gray-900 text-xs sm:text-sm">{item.clientName}</p>
                          <p className="font-mono text-[11px] text-gray-400">{item.clientAccountNumber || "-"}</p>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-gray-700 text-xs sm:text-sm">
                          {item.weight ? `${item.weight} kg` : "-"}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-gray-900 text-xs sm:text-sm">
                          {formatIDR.format(item.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {item.type === "drop_off" ? (
                            <span
                              className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md uppercase ${
                                item.paymentMethod === "cash"
                                  ? "bg-amber-100 text-amber-900"
                                  : "bg-blue-100 text-blue-900"
                              }`}
                            >
                              {item.paymentMethod === "cash" ? "Cash" : "Saldo"}
                            </span>
                          ) : (
                            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md uppercase bg-emerald-100 text-emerald-900">
                              Sukses
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (item.type === "cash_counter_withdrawal") {
                                setCashoutReceipt({
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
                                setDropoffResult({
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
      )}

      {/* ========================================================================= */}
      {/* MODAL STRUK DROPOFF SUKSES (UI BIASA) */}
      {/* ========================================================================= */}
      {dropoffResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-200 my-auto">
            <button
              type="button"
              onClick={() => setDropoffResult(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              title="Tutup"
            >
              <X size={20} />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={32} />
            </div>

            <h3 className="text-xl font-extrabold text-gray-900 text-center">
              Drop-off Selesai!
            </h3>
            <p className="text-xs text-gray-500 text-center mt-1 mb-5">
              Struk bukti transaksi penimbangan & drop-off sampah loket.
            </p>

            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 sm:p-5 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">No. Tiket</span>
                <span className="font-mono font-bold text-gray-900 bg-white border border-gray-200 px-2 py-0.5 rounded-md">
                  #{dropoffResult.ticketShortId || dropoffResult.ticketId.substring(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Nama Nasabah</span>
                <div className="text-right">
                  <span className="font-bold text-gray-900 block">{dropoffResult.clientName}</span>
                  {dropoffResult.clientAccountNumber && (
                    <span className="font-mono text-[10px] text-gray-400 block">
                      {dropoffResult.clientAccountNumber}
                    </span>
                  )}
                </div>
              </div>

              {/* Rincian Item Sampah jika ada */}
              {dropoffResult.items && dropoffResult.items.length > 0 && (
                <div className="pt-2 border-t border-gray-200/80">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Rincian Sampah Ditimbang
                  </span>
                  <div className="space-y-1.5 bg-white p-2.5 rounded-xl border border-gray-200 max-h-36 overflow-y-auto">
                    {dropoffResult.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[11px]">
                        <div>
                          <span className="font-semibold text-gray-800">{it.categoryName}</span>
                          <span className="text-gray-400 block text-[10px]">
                            {it.weight.toFixed(2)} kg × {formatIDR.format(it.priceApplied)}
                          </span>
                        </div>
                        <span className="font-bold text-gray-900">
                          {formatIDR.format(it.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-1 border-t border-gray-200/80">
                <span className="text-gray-500">Total Berat</span>
                <span className="font-bold text-emerald-700">{dropoffResult.totalWeight.toFixed(2)} kg</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Jejak Karbon Dikurangi</span>
                <span className="font-bold text-emerald-700">~{dropoffResult.carbonSaved.toFixed(1)} kg CO₂e</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Metode Pembayaran</span>
                <span className="font-extrabold uppercase text-gray-900 inline-flex items-center px-2 py-0.5 rounded-md bg-white border border-gray-200">
                  {dropoffResult.paymentMethod === "cash" ? "💵 Tunai / Cash Langsung" : "💳 Masuk Saldo UanginKuy"}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2.5 flex justify-between items-center text-sm font-extrabold text-gray-900">
                <span>Total Pembayaran</span>
                <span className="text-emerald-700 text-lg font-black">{formatIDR.format(dropoffResult.totalAmount)}</span>
              </div>
            </div>

            {/* Hidden thermal receipt DOM for isolated printing */}
            <div id="dropoff-thermal-receipt" className="hidden">
              <ThermalReceipt
                type="dropoff"
                data={{
                  ticketId: dropoffResult.ticketId,
                  ticketShortId: dropoffResult.ticketShortId,
                  clientName: dropoffResult.clientName,
                  clientAccountNumber: dropoffResult.clientAccountNumber,
                  paymentMethod: dropoffResult.paymentMethod,
                  totalWeight: dropoffResult.totalWeight,
                  totalAmount: dropoffResult.totalAmount,
                  carbonSaved: dropoffResult.carbonSaved,
                  completedAt: dropoffResult.completedAt,
                  cashierName: dropoffResult.cashierName,
                  items: dropoffResult.items,
                }}
                unitName={warehouseInfo?.name ? warehouseInfo.name.toUpperCase() : undefined}
                branchAddress={warehouseInfo?.address ? warehouseInfo.address.toUpperCase() : undefined}
                contactNumber={warehouseInfo?.phone || undefined}
              />
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrintDropoff}
                className="flex-1 rounded-xl font-bold border-gray-200 text-gray-700 cursor-pointer hover:bg-gray-50 h-11"
              >
                <Printer size={16} className="mr-1.5" />
                Cetak Struk (Enter)
              </Button>
              <Button
                type="button"
                onClick={() => setDropoffResult(null)}
                className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold cursor-pointer transition shadow-sm h-11"
              >
                Selesai (Esc)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL STRUK TARIK TUNAI SUKSES (UI BIASA) */}
      {/* ========================================================================= */}
      {cashoutReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-200 my-auto">
            <button
              type="button"
              onClick={() => setCashoutReceipt(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              title="Tutup"
            >
              <X size={20} />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={32} />
            </div>

            <h3 className="text-xl font-extrabold text-gray-900 text-center">
              Pencairan Tunai Berhasil!
            </h3>
            <p className="text-xs text-gray-500 text-center mt-1 mb-5">
              Struk bukti penyerahan uang fisik di loket bank sampah.
            </p>

            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 sm:p-5 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Kode Token OTP</span>
                <span className="font-mono font-black text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-md text-sm">
                  #{cashoutReceipt.tokenCode}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">No. Referensi Transaksi</span>
                <span className="font-mono font-bold text-gray-900 bg-white border border-gray-200 px-2 py-0.5 rounded-md">
                  #{cashoutReceipt.withdrawalId.substring(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Nama Nasabah</span>
                <span className="font-bold text-gray-900">{cashoutReceipt.client.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Member ID Nasabah</span>
                <span className="font-mono text-gray-700">
                  {cashoutReceipt.client.account_number || "UKN-MEMBER"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Jenis Layanan</span>
                <span className="font-bold uppercase text-gray-900">💵 Kasir Tarik Tunai</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Biaya Admin Loket</span>
                <span className="font-bold text-emerald-700">Gratis (Rp 0)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Waktu Penyerahan</span>
                <span className="font-medium text-gray-700">
                  {new Date().toLocaleString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })} WIB
                </span>
              </div>
              {cashoutReceipt.client.balance !== null && cashoutReceipt.client.balance !== undefined && (
                <div className="flex justify-between items-center pt-2 border-t border-gray-200/80">
                  <span className="text-gray-500">Sisa Saldo Nasabah</span>
                  <span className="font-bold text-gray-900">{formatIDR.format(cashoutReceipt.client.balance)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2.5 flex justify-between items-center text-sm font-extrabold text-gray-900">
                <span>Total Uang Diserahkan</span>
                <span className="text-emerald-700 text-lg font-black">{formatIDR.format(cashoutReceipt.amount)}</span>
              </div>
            </div>

            {/* Hidden thermal receipt DOM for isolated printing */}
            <div id="cashout-thermal-receipt" className="hidden">
              <ThermalReceipt
                type="cashout"
                data={{
                  withdrawalId: cashoutReceipt.withdrawalId,
                  tokenCode: cashoutReceipt.tokenCode,
                  amount: cashoutReceipt.amount,
                  clientName: cashoutReceipt.client.name,
                  clientAccountNumber: cashoutReceipt.client.account_number,
                  remainingBalance: cashoutReceipt.client.balance,
                  cashierName: "Kasir Loket",
                  completedAt: new Date().toISOString(),
                }}
                unitName={warehouseInfo?.name ? warehouseInfo.name.toUpperCase() : undefined}
                branchAddress={warehouseInfo?.address ? warehouseInfo.address.toUpperCase() : undefined}
                contactNumber={warehouseInfo?.phone || undefined}
              />
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrintCashout}
                className="flex-1 rounded-xl font-bold border-gray-200 text-gray-700 cursor-pointer hover:bg-gray-50 h-11"
              >
                <Printer size={16} className="mr-1.5" />
                Cetak Struk (Enter)
              </Button>
              <Button
                type="button"
                onClick={() => setCashoutReceipt(null)}
                className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold cursor-pointer transition shadow-sm h-11"
              >
                Selesai (Esc)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
