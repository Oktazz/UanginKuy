"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { ArrowLeft, User, Weight, MapPin, Loader2, Save, Wifi, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { CustomSelect, type CustomSelectGroup } from "@/components/ui/CustomSelect";
import { CourierWhatsAppButton } from "@/components/ui/CourierWhatsAppButton";
import { createClient } from "@/utils/supabase/client";
import { completePickup, getTicketDebug, PickupItem } from "./actions";
import PickupSuccessAnimation from "./PickupSuccessAnimation";

interface Category {
  id: number;
  name: string;
  material_group: string;
  price_per_kg: number;
}

const materialGroups = [
  { value: "plastic", label: "Plastik" },
  { value: "paper", label: "Kertas" },
  { value: "metal", label: "Logam" },
  { value: "glass", label: "Kaca" },
] as const;

const materialGroupOrder = Object.fromEntries(
  materialGroups.map((group, index) => [group.value, index])
) as Record<string, number>;

interface ClientAddress {
  recipient_name: string;
  full_address: string;
  phone_number?: string | null;
}

interface PickupTicket {
  id?: string;
  short_id?: string;
  status?: string;
  user_addresses: ClientAddress | ClientAddress[] | null;
}

interface LatestIotResponse {
  success: boolean;
  data?: {
    deviceId: string;
    weight: number | null;
    measuredAt: string | null;
    liveWeight: number | null;
    liveMeasuredAt: string | null;
    liveStable: boolean | null;
  };
  error?: string;
}

export default function PickupPage() {
  const params = useParams();
  const ticketId = params.id as string;
  const supabase = useMemo(() => createClient(), []);
  const syncAbortRef = useRef<AbortController | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ticket, setTicket] = useState<PickupTicket | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [weight, setWeight] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isIotWeightStable, setIsIotWeightStable] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<PickupItem[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // Run the debug fetch on the server to see what it gets
        await getTicketDebug(ticketId);

        let ticketQuery = supabase
          .from("tickets")
          .select("*, user_addresses!address_id(recipient_name, full_address, phone_number)");
        if (ticketId.length === 8) {
          ticketQuery = ticketQuery.eq("short_id", ticketId.toUpperCase());
        } else {
          ticketQuery = ticketQuery.eq("id", ticketId);
        }

        const [ticketRes, catRes] = await Promise.all([
          ticketQuery.single(),
          supabase
            .from("waste_categories")
            .select("id, name, material_group, price_per_kg")
            .order("name")
        ]);
        
        if (ticketRes.error) {
          console.error("Supabase ticket error:", ticketRes.error);
        }

        if (ticketRes.data) {
          setTicket(ticketRes.data);
        } else {
          setError("Tiket tidak ditemukan.");
        }

        if (catRes.data) {
          const sortedCategories = [...catRes.data].sort((a, b) => {
            const groupDifference =
              (materialGroupOrder[a.material_group] ?? materialGroups.length) -
              (materialGroupOrder[b.material_group] ?? materialGroups.length);

            return groupDifference || a.name.localeCompare(b.name, "id");
          });

          setCategories(sortedCategories);
          
          if (sortedCategories.length > 0) {
            setCategoryId(sortedCategories[0].id.toString());
          }
        }
      } catch (err) {
        console.error(err);
        setError("Terjadi kesalahan saat memuat data.");
      } finally {
        setLoading(false);
      }
    }
    
    if (ticketId) {
      fetchData();
    }
  }, [ticketId, supabase]);

  useEffect(() => {
    return () => {
      const controller = syncAbortRef.current;
      syncAbortRef.current = null;
      controller?.abort();
    };
  }, []);

  const fetchLatestIot = async (signal: AbortSignal) => {
    const response = await fetch("/api/iot/latest", {
      cache: "no-store",
      signal,
    });
    const payload = (await response.json()) as LatestIotResponse;

    if (!response.ok || !payload.success || !payload.data) {
      throw new Error(
        payload.error ?? "Gagal mengambil data timbangan IoT.",
      );
    }

    return payload.data;
  };

  const handleSyncIoT = async () => {
    syncAbortRef.current?.abort();
    const controller = new AbortController();
    syncAbortRef.current = controller;
    setIsSyncing(true);
    setIsIotWeightStable(false);
    setSyncError(null);
    setSyncMessage(
      "Tekan reset timbangan saat kosong, lalu letakkan sampah di atasnya.",
    );

    try {
      const initial = await fetchLatestIot(controller.signal);
      const baselineMeasurement = initial.measuredAt;
      let latestLiveMeasurement = initial.liveMeasuredAt;
      const pollingDeadline = Date.now() + 90_000;

      while (Date.now() < pollingDeadline) {
        await new Promise((resolve) => setTimeout(resolve, 750));
        if (controller.signal.aborted) return;

        const latest = await fetchLatestIot(controller.signal);
        if (
          latest.measuredAt &&
          latest.measuredAt !== baselineMeasurement &&
          latest.weight !== null &&
          latest.weight >= 0.1
        ) {
          setWeight(latest.weight.toFixed(2));
          setIsIotWeightStable(true);
          setSyncMessage(
            `Berat stabil dari ${latest.deviceId}: ${latest.weight.toFixed(2)} kg.`,
          );
          return;
        }

        if (
          latest.liveMeasuredAt &&
          latest.liveMeasuredAt !== latestLiveMeasurement &&
          latest.liveWeight !== null
        ) {
          latestLiveMeasurement = latest.liveMeasuredAt;
          setWeight(latest.liveWeight.toFixed(2));
          setIsIotWeightStable(latest.liveStable === true);
          setSyncMessage(
            latest.liveStable
              ? `Berat stabil: ${latest.liveWeight.toFixed(2)} kg.`
              : `Berat sementara: ${latest.liveWeight.toFixed(2)} kg...`,
          );
        }
      }

      throw new Error(
        "Timbangan belum mengirim data baru dalam 90 detik. Coba ulangi.",
      );
    } catch (syncFailure) {
      if (syncFailure instanceof DOMException && syncFailure.name === "AbortError") {
        return;
      }
      setSyncMessage(null);
      setSyncError(
        syncFailure instanceof Error
          ? syncFailure.message
          : "Sinkronisasi timbangan gagal.",
      );
    } finally {
      if (syncAbortRef.current === controller) {
        syncAbortRef.current = null;
        setIsSyncing(false);
      }
    }
  };

  const handleManualWeightChange = (value: string) => {
    syncAbortRef.current?.abort();
    syncAbortRef.current = null;
    setIsSyncing(false);
    setIsIotWeightStable(false);
    setSyncMessage(null);
    setSyncError(null);
    setWeight(value);
  };

  const selectedCategory = categories.find(c => c.id.toString() === categoryId);
  const numWeight = parseFloat(weight) || 0;
  const categoryGroups: CustomSelectGroup[] = materialGroups
    .map((group) => ({
      label: group.label,
      options: categories
        .filter((category) => category.material_group === group.value)
        .map((category) => ({
          value: category.id.toString(),
          label: category.name,
          description: `Rp ${category.price_per_kg.toLocaleString("id-ID")} / kg`,
        })),
    }))
    .filter((group) => group.options.length > 0);
  
  const handleAddItem = () => {
    if (!selectedCategory || numWeight <= 0) return;
    const subtotal = numWeight * selectedCategory.price_per_kg;
    const newItem: PickupItem = {
      categoryId: selectedCategory.id,
      weight: numWeight,
      subtotal: subtotal,
      priceApplied: selectedCategory.price_per_kg
    };
    setItems(prev => [...prev, newItem]);
    setWeight("");
    setIsIotWeightStable(false);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert("Tambahkan setidaknya satu item sampah terlebih dahulu.");
      return;
    }
    setSubmitting(true);
    
    try {
      await completePickup(
        ticketId, 
        items,
        totalAmount
      );
      setShowSuccess(true);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Gagal menyelesaikan penjemputan.";
      alert(message);
      setSubmitting(false);
    }
  };

  if (showSuccess) {
    return <PickupSuccessAnimation />;
  }

  if (loading) {
    return <div className="flex justify-center items-center h-[50vh]"><Loader2 size={32} className="animate-spin text-primary" /></div>;
  }
  
  if (error || !ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <p className="text-gray-500 font-bold">{error || "Data tidak tersedia."}</p>
        <Link href="/kurir/scanner" className="text-primary font-bold hover:underline">Kembali</Link>
      </div>
    );
  }

  if (ticket.status === 'completed') {
    return (
      <div className="max-w-md mx-auto pb-8">
        <header className="mb-6 flex items-center space-x-3">
          <Link href="/kurir/dashboard" className="w-10 h-10 bg-surface rounded-full flex items-center justify-center shadow-sm text-gray-700 hover:bg-gray-50 transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Penjemputan Selesai</h2>
            <p className="text-xs text-gray-500 font-medium">Ticket ID: {ticket.short_id || ticketId.substring(0, 8)}</p>
          </div>
        </header>

        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-gray-100 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={36} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">Penjemputan Sudah Selesai</h3>
            <p className="text-sm text-gray-500 mt-1">
              Tiket ini telah berhasil diselesaikan sebelumnya dan saldo telah tercatat.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Link
              href="/kurir/dashboard"
              className="w-full bg-primary text-white font-semibold py-3 rounded-2xl flex items-center justify-center shadow-md hover:bg-primary-dark transition"
            >
              Kembali ke Dashboard Rute
            </Link>
            <Link
              href="/kurir/scanner"
              className="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-2xl flex items-center justify-center hover:bg-gray-200 transition"
            >
              Scan Tiket Lain
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const clientAddress = Array.isArray(ticket.user_addresses)
    ? ticket.user_addresses[0]
    : ticket.user_addresses;

  return (
    <div className="max-w-md mx-auto pb-8">
      <header className="mb-6 flex items-center space-x-3">
        <Link href="/kurir/scanner" className="w-10 h-10 bg-surface rounded-full flex items-center justify-center shadow-sm text-gray-700 hover:bg-gray-50 transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Selesaikan Penjemputan</h2>
          <p className="text-xs text-gray-500 font-medium">Ticket ID: {ticketId.substring(0,8)}...</p>
        </div>
      </header>

      {/* Client Info Card */}
      <div className="bg-surface rounded-3xl p-5 shadow-sm border border-gray-100 mb-6 flex items-center justify-between">
        <div className="flex items-start space-x-4 min-w-0">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
            <User size={24} className="text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 truncate">{clientAddress?.recipient_name || 'Nasabah Anonim'}</h3>
            <div className="flex items-start space-x-1 text-xs text-gray-500 mt-1">
              <MapPin size={14} className="mt-0.5 shrink-0" />
              <span className="line-clamp-2">{clientAddress?.full_address || 'Alamat tidak tersedia'}</span>
            </div>
            {clientAddress?.phone_number && (
              <p className="text-xs text-gray-400 mt-1 font-mono">{clientAddress.phone_number}</p>
            )}
          </div>
        </div>

        {clientAddress?.phone_number && (
          <div className="shrink-0 ml-3">
            <CourierWhatsAppButton
              phoneNumber={clientAddress.phone_number}
              recipientName={clientAddress.recipient_name}
              ticketId={ticketId.substring(0, 8).toUpperCase()}
              address={clientAddress.full_address}
              status="on_the_way"
              variant="icon"
            />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Waste Category Selection */}
        <div className="space-y-2">
          <label htmlFor="waste-category" className="text-sm font-bold text-gray-900 ml-1">Kategori Sampah (Aktual)</label>
          <CustomSelect
            id="waste-category"
            groups={categoryGroups}
            value={categoryId}
            onChange={setCategoryId}
            placeholder="Pilih kategori..."
            triggerClassName="h-14 rounded-2xl border-gray-200 bg-surface px-4 font-medium"
          />
        </div>

        {/* Weight Input */}
        <div className="space-y-2">
          <div className="flex justify-between items-end mb-1 ml-1">
            <label className="text-sm font-bold text-gray-900">Berat Sampah (kg)</label>
          </div>
          
          <div className="flex space-x-3">
            <div className="relative flex-1">
              <input
                type="number"
                step="0.01"
                min="0.1"
                placeholder="0.00"
                value={weight}
                onChange={(e) => handleManualWeightChange(e.target.value)}
                className={`w-full rounded-2xl border pl-12 pr-4 py-3.5 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                  isIotWeightStable
                    ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                    : "border-gray-200 bg-surface text-gray-800"
                }`}
              />
              <Weight size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            
            <button
              type="button"
              onClick={handleSyncIoT}
              disabled={isSyncing}
              className={`shrink-0 flex items-center justify-center px-4 rounded-2xl font-bold text-xs transition-all shadow-sm
                ${isSyncing ? 'bg-gray-100 text-gray-400' : 'bg-[#E7E1B1] text-primary-dark hover:bg-[#d9d3a1]'}`}
            >
              {isSyncing ? <Loader2 size={18} className="animate-spin" /> : (
                <>
                  <Wifi size={16} className="mr-2" /> IoT Sync
                </>
              )}
            </button>
          </div>
          {syncMessage && (
            <p className="ml-1 text-xs font-medium text-primary" role="status">
              {syncMessage}
            </p>
          )}
          {syncError && (
            <p className="ml-1 text-xs font-medium text-red-600" role="alert">
              {syncError}
            </p>
          )}
          <button
            type="button"
            onClick={handleAddItem}
            disabled={!weight || numWeight <= 0 || !selectedCategory}
            className="w-full mt-4 bg-secondary text-primary-dark py-3 rounded-2xl font-bold flex justify-center items-center hover:bg-[#d9d3a1] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Tambah ke Daftar
          </button>
        </div>

        {/* Added Items List */}
        {items.length > 0 && (
          <div className="space-y-3 mt-6">
            <h4 className="text-sm font-bold text-gray-900 ml-1">Daftar Sampah</h4>
            {items.map((item, index) => {
              const cat = categories.find(c => c.id === item.categoryId);
              return (
                <div key={index} className="bg-surface rounded-2xl p-4 border border-gray-100 flex justify-between items-center shadow-sm">
                  <div>
                    <p className="font-bold text-gray-900">{cat?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{item.weight} kg x Rp {item.priceApplied.toLocaleString('id-ID')} / kg</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <p className="font-bold text-primary">Rp {item.subtotal.toLocaleString('id-ID')}</p>
                    <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700 text-sm font-medium p-2">
                      Hapus
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Total Calculation */}
        <div className="bg-primary text-white rounded-3xl p-6 mt-8 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <p className="text-primary-100 text-sm font-medium">Total Pembayaran Nasabah</p>
          <div className="text-3xl font-extrabold mt-1 tracking-tight">
            Rp {totalAmount.toLocaleString('id-ID')}
          </div>
          
          <button
            type="submit"
            disabled={submitting || items.length === 0}
            className="w-full bg-white text-primary mt-6 py-3.5 rounded-xl font-bold flex justify-center items-center hover:bg-gray-50 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 size={20} className="animate-spin" /> : (
              <>
                <Save size={18} className="mr-2" /> Selesaikan & Bayar
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
