"use client";

import { useState, useEffect } from "react";
import {
  Store,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TabsNav } from "@/components/ui/TabsNav";
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
}

export default function CounterClient({ categories }: CounterClientProps) {
  const [activeTab, setActiveTab] = useState<"dropoff" | "cashout" | "history">("dropoff");

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
  const [cashoutSuccess, setCashoutSuccess] = useState(false);
  const [cashoutError, setCashoutError] = useState("");

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

  // Lookup Ticket directly if query looks like ticket
  const handleTicketLookup = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setDropoffError("");
    try {
      const res = await fetch(`/api/counter/search-nasabah?ticket=${encodeURIComponent(searchQuery.trim())}`);
      const json = await res.json();
      if (json.success && json.data) {
        const t = json.data;
        setLinkedTicketId(t.id);
        setTicketShortId(t.short_id);
        if (t.client) {
          setSelectedClient({
            id: t.client.id,
            name: t.client.name,
            account_number: t.client.account_number,
            balance: Number(t.client.balance || 0),
            avatar_url: t.client.avatar_url,
          });
        }
        setSearchResults([]);
      } else {
        setDropoffError("Tiket tidak ditemukan.");
      }
    } catch {
      setDropoffError("Gagal memeriksa tiket.");
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

      setDropoffResult(json.data);
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
    setCashoutSuccess(false);
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

      setCashoutSuccess(true);
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md shadow-primary/20">
              <Store size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
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

          {/* Section 1: Identifikasi Nasabah */}
          <section className="rounded-3xl bg-surface border border-gray-100 p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <User size={18} className="text-primary" />
              1. Identifikasi Nasabah / Tiket
            </h3>

            {!selectedClient ? (
              <div className="space-y-3 relative">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Cari Member ID (UKN-XXXXXX), No HP, Nama, atau Kode Tiket..."
                      value={searchQuery}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSearchQuery(val);
                        if (!val.trim()) {
                          setSearchResults([]);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleTicketLookup();
                      }}
                      className="w-full h-13 pl-11 pr-4 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-medium outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTicketLookup}
                    loading={isSearching}
                    className="h-13 px-5 rounded-2xl font-bold border-gray-200 text-gray-700 hover:bg-gray-100"
                  >
                    <Ticket size={16} className="mr-1.5" />
                    Cek Tiket
                  </Button>
                </div>

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
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                            {client.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{client.name}</p>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">
                              {client.account_number || "Tanpa ID"} • {client.phone_number || "Tanpa No HP"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-400 font-medium">Saldo</span>
                          <p className="text-sm font-bold text-emerald-700">{formatIDR.format(client.balance)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {selectedClient.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900 text-base">{selectedClient.name}</h4>
                      {ticketShortId && (
                        <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                          Tiket #{ticketShortId}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-emerald-800 font-mono mt-0.5">
                      {selectedClient.account_number || "UKN-MEMBER"} • {selectedClient.phone_number || "-"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto">
                  <div className="text-right">
                    <span className="text-xs text-gray-500 font-medium">Saldo Dompet Saat Ini</span>
                    <p className="text-base font-extrabold text-emerald-800">
                      {formatIDR.format(selectedClient.balance)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClient(null);
                      setLinkedTicketId(null);
                      setTicketShortId(null);
                    }}
                    className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                    title="Ganti Nasabah"
                  >
                    <X size={18} />
                  </button>
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
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Kategori Sampah
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(Number(e.target.value))}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold outline-none focus:border-primary focus:bg-white transition"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} — {formatIDR.format(cat.price_per_kg)}/kg
                    </option>
                  ))}
                </select>
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
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">
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
                      <td className="py-3 px-4 text-right text-emerald-800 text-base font-black">
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
                    ? "border-emerald-600 bg-emerald-50/60 shadow-sm"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={paymentMethod === "cash"}
                  onChange={() => setPaymentMethod("cash")}
                  className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-600"
                />
                <div className="ml-3">
                  <div className="flex items-center gap-2">
                    <Banknote size={18} className="text-emerald-700" />
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
              className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-lg shadow-md transition cursor-pointer"
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
              <div className="rounded-2xl bg-emerald-600/10 p-3 text-emerald-600">
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

            {cashoutSuccess && (
              <div className="mb-6 p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center space-y-2">
                <CheckCircle2 size={36} className="text-emerald-600 mx-auto" />
                <h4 className="font-extrabold text-lg">Pencairan Tunai Berhasil!</h4>
                <p className="text-xs text-emerald-700">
                  Saldo nasabah telah terpotong dan penarikan tercatat sebagai sukses.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCashoutSuccess(false)}
                  className="mt-2 text-xs font-bold rounded-xl"
                >
                  Layani Penarikan Lain
                </Button>
              </div>
            )}

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
                    className="flex-1 h-14 px-5 rounded-2xl border border-gray-200 bg-gray-50 text-xl font-mono font-black tracking-widest outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/20 transition"
                  />
                  <Button
                    type="submit"
                    disabled={!tokenInput.trim() || isVerifyingToken}
                    loading={isVerifyingToken}
                    className="h-14 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    Verifikasi
                  </Button>
                </div>
              </div>
            </form>

            {/* Verification Result Card */}
            {verifiedWithdrawal && (
              <div className="mt-6 rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/50 p-6 space-y-4 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <ShieldCheck size={16} /> Token Terverifikasi
                  </span>
                  <span className="font-mono text-sm font-black text-emerald-950 bg-white px-3 py-1 rounded-lg border border-emerald-200">
                    #{verifiedWithdrawal.tokenCode}
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold text-base">
                    {verifiedWithdrawal.client.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-base">{verifiedWithdrawal.client.name}</h4>
                    <p className="text-xs text-gray-500 font-mono">
                      {verifiedWithdrawal.client.account_number || "UKN-MEMBER"}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-white p-4 border border-emerald-100 space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Uang Tunai Yang Harus Diserahkan:</span>
                  </div>
                  <div className="text-3xl font-black text-emerald-700 tracking-tight">
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
                    className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base shadow-md cursor-pointer"
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {historyItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        {loadingHistory ? "Memuat riwayat transaksi..." : "Belum ada transaksi di loket hari ini."}
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
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-full">
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
      {/* MODAL STRUK DROPOFF SUKSES */}
      {/* ========================================================================= */}
      {dropoffResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setDropoffResult(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
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
              Transaksi berhasil dicatat dan diproses di loket bank sampah.
            </p>

            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">No. Tiket</span>
                <span className="font-mono font-bold text-gray-900">
                  #{dropoffResult.ticketShortId || dropoffResult.ticketId.substring(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Nama Nasabah</span>
                <span className="font-bold text-gray-900">{dropoffResult.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Berat</span>
                <span className="font-bold text-primary">{dropoffResult.totalWeight.toFixed(2)} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Jejak Karbon Dikurangi</span>
                <span className="font-bold text-emerald-700">~{dropoffResult.carbonSaved.toFixed(1)} kg CO₂e</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Metode Pembayaran</span>
                <span className="font-black uppercase text-gray-900">
                  {dropoffResult.paymentMethod === "cash" ? "💵 Tunai / Cash Langsung" : "💳 Masuk Saldo UanginKuy"}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-extrabold text-gray-900">
                <span>Total Pembayaran</span>
                <span className="text-emerald-700 text-base">{formatIDR.format(dropoffResult.totalAmount)}</span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.print()}
                className="flex-1 rounded-xl font-bold border-gray-200 text-gray-700"
              >
                <Printer size={16} className="mr-1.5" />
                Cetak Struk
              </Button>
              <Button
                type="button"
                onClick={() => setDropoffResult(null)}
                className="flex-1 rounded-xl bg-primary text-white font-bold"
              >
                Selesai
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
