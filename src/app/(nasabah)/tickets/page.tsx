"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Ticket as TicketIcon,
  Calendar,
  ArrowRight,
  Leaf,
  Truck,
  Scale,
  Clock,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TabsNav } from "@/components/ui/TabsNav";
import { MonthCalendarPicker } from "@/components/ui/MonthCalendarPicker";
import { cn } from "@/lib/utils";
import TicketsLoading from "./loading";
import { parseLocalDateFromYMD } from "@/utils/date";
import { formatIDR } from "@/utils/format";
import {
  TICKET_STATUS_COLORS as STATUS_COLORS,
  TICKET_STATUS_LABEL as STATUS_LABEL,
} from "@/constants/ticket";

function TicketsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentMonthKey = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }, []);

  const urlTab = searchParams.get("tab") === "history" ? "history" : "active";
  const rawType = searchParams.get("type");
  const urlType = rawType === "pickup" || rawType === "drop_off" ? rawType : "all";
  const rawMonth = searchParams.get("month");
  // Default to current month when in history tab, or "all" otherwise
  const urlMonth = rawMonth || (urlTab === "history" ? currentMonthKey : "all");

  const [tab, setTab] = useState<"active" | "history">(urlTab);
  const [prevUrlTab, setPrevUrlTab] = useState(urlTab);
  if (urlTab !== prevUrlTab) {
    setPrevUrlTab(urlTab);
    setTab(urlTab);
  }

  const [serviceFilter, setServiceFilter] = useState<"all" | "pickup" | "drop_off">(urlType);
  const [prevUrlType, setPrevUrlType] = useState(urlType);
  if (urlType !== prevUrlType) {
    setPrevUrlType(urlType);
    setServiceFilter(urlType);
  }

  const [monthFilter, setMonthFilter] = useState<string>(urlMonth);
  const [prevUrlMonth, setPrevUrlMonth] = useState(urlMonth);
  if (urlMonth !== prevUrlMonth) {
    setPrevUrlMonth(urlMonth);
    setMonthFilter(urlMonth);
  }

  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingTab, setLoadingTab] = useState(true);

  const fetchTickets = useCallback(async (selectedTab: "active" | "history") => {
    setLoadingTab(true);
    try {
      const res = await fetch(`/api/tickets?tab=${selectedTab}`);
      const data = await res.json();
      if (data.success) {
        setTickets(data.data || []);
      } else {
        setTickets([]);
      }
    } catch (err) {
      console.error("Failed to fetch tickets", err);
      setTickets([]);
    } finally {
      setLoadingTab(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets(tab);
  }, [tab, fetchTickets]);

  const handleTabChange = (newTab: "active" | "history") => {
    if (newTab === tab) return;
    setTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", newTab);
    if (newTab === "active") {
      // Drop-off tickets are direct walk-ins at counter; active tickets are always courier pickups
      params.delete("type");
      params.delete("month");
      setServiceFilter("all");
      setMonthFilter("all");
    } else {
      if (!params.has("month")) {
        params.set("month", currentMonthKey);
        setMonthFilter(currentMonthKey);
      }
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleServiceFilterChange = (newType: "all" | "pickup" | "drop_off") => {
    setServiceFilter(newType);
    const params = new URLSearchParams(searchParams.toString());
    if (newType === "all") {
      params.delete("type");
    } else {
      params.set("type", newType);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleMonthFilterChange = (newMonth: string) => {
    setMonthFilter(newMonth);
    const params = new URLSearchParams(searchParams.toString());
    if (newMonth === "all") {
      params.set("month", "all");
    } else {
      params.set("month", newMonth);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const getTicketMonthKey = (ticket: any): string => {
    if (ticket.pickup_date) {
      return ticket.pickup_date.slice(0, 7);
    }
    if (ticket.created_at) {
      return ticket.created_at.slice(0, 7);
    }
    return "";
  };

  const ticketMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    tickets.forEach((t) => {
      const ym = t.pickup_date
        ? t.pickup_date.slice(0, 7)
        : t.created_at
        ? t.created_at.slice(0, 7)
        : null;
      if (ym && /^\d{4}-\d{2}$/.test(ym)) {
        monthsSet.add(ym);
      }
    });
    return Array.from(monthsSet);
  }, [tickets]);

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

  const ticketsInSelectedMonth = useMemo(() => {
    if (tab === "active") return tickets;
    if (monthFilter === "all") return tickets;
    return tickets.filter((ticket) => getTicketMonthKey(ticket) === monthFilter);
  }, [tab, monthFilter, tickets]);

  const counts = useMemo(
    () => ({
      all: ticketsInSelectedMonth.length,
      pickup: ticketsInSelectedMonth.filter(
        (t) => (t.service_type || "pickup") === "pickup"
      ).length,
      drop_off: ticketsInSelectedMonth.filter(
        (t) => t.service_type === "drop_off"
      ).length,
    }),
    [ticketsInSelectedMonth]
  );

  const filteredTickets = useMemo(() => {
    if (tab === "active") return tickets;
    if (serviceFilter === "all") return ticketsInSelectedMonth;
    return ticketsInSelectedMonth.filter((ticket) => {
      const st = ticket.service_type || "pickup";
      return st === serviceFilter;
    });
  }, [tab, serviceFilter, tickets, ticketsInSelectedMonth]);

  const monthlyStats = useMemo(() => {
    if (tab !== "history" || tickets.length === 0) return null;
    const completedTickets = ticketsInSelectedMonth.filter((t) => t.status === "completed");
    let totalWeight = 0;
    let totalAmount = 0;
    for (const t of completedTickets) {
      if (t.transaction_details) {
        for (const td of t.transaction_details) {
          totalWeight += Number(td.weight) || 0;
          totalAmount += Number(td.subtotal) || 0;
        }
      }
    }
    return {
      totalCompleted: completedTickets.length,
      totalWeight,
      totalAmount,
    };
  }, [tab, tickets.length, ticketsInSelectedMonth]);

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tiket & Riwayat Setoran</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pantau status penjemputan aktif dan riwayat setoran sampahmu di loket maupun via kurir.
        </p>
      </div>

      <TabsNav<"active" | "history">
        ariaLabel="Kategori tiket"
        activeTab={tab}
        onChange={handleTabChange}
        tabs={[
          { value: "active", label: "Tiket Aktif" },
          { value: "history", label: "Riwayat Selesai" },
        ]}
      />

      {/* Filter Bar: Bulan & Jenis Layanan (Hanya untuk Tab Riwayat Selesai) */}
      {tab === "history" && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-surface rounded-2xl border border-gray-200/80 shadow-2xs">
            {/* Filter Kalender Bulan (Dimensi Fix) */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-gray-500 shrink-0 hidden sm:inline-block">
                Periode:
              </span>
              <MonthCalendarPicker
                value={monthFilter}
                onChange={handleMonthFilterChange}
                ticketMonths={ticketMonths}
                className="w-full sm:w-auto"
              />
            </div>

            {/* Filter Jenis Layanan (3-Kolom Grid di Mobile, Flex di Desktop) */}
            <div className="grid grid-cols-3 gap-1.5 w-full sm:flex sm:w-auto sm:items-center pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
              <button
                type="button"
                onClick={() => handleServiceFilterChange("all")}
                className={cn(
                  "inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border",
                  serviceFilter === "all"
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-surface text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <span>Semua</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0",
                    serviceFilter === "all" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                  )}
                >
                  {counts.all}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleServiceFilterChange("pickup")}
                className={cn(
                  "inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border",
                  serviceFilter === "pickup"
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-surface text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Truck size={13} className="shrink-0" />
                <span className="truncate">
                  <span className="sm:hidden">Kurir</span>
                  <span className="hidden sm:inline">Jemput Kurir</span>
                </span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0",
                    serviceFilter === "pickup" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                  )}
                >
                  {counts.pickup}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleServiceFilterChange("drop_off")}
                className={cn(
                  "inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border",
                  serviceFilter === "drop_off"
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-surface text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Scale size={13} className="shrink-0" />
                <span className="truncate">
                  <span className="sm:hidden">Loket</span>
                  <span className="hidden sm:inline">Setor di Loket</span>
                </span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0",
                    serviceFilter === "drop_off" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                  )}
                >
                  {counts.drop_off}
                </span>
              </button>
            </div>
          </div>

          {/* Ringkasan Akumulasi Bulanan */}
          {monthlyStats && (
            <div className="grid grid-cols-3 gap-3 p-3.5 bg-primary/5 border border-primary/15 rounded-2xl text-xs">
              <div>
                <span className="text-gray-500 text-[11px] block">Total Setoran</span>
                <span className="font-bold text-gray-900 text-sm">
                  {monthlyStats.totalCompleted} transaksi
                </span>
              </div>
              <div>
                <span className="text-gray-500 text-[11px] block">Total Sampah</span>
                <span className="font-bold text-gray-900 text-sm">
                  {monthlyStats.totalWeight.toFixed(1)} kg
                </span>
              </div>
              <div>
                <span className="text-gray-500 text-[11px] block">Total Saldo Masuk</span>
                <span className="font-bold text-primary text-sm">
                  {formatIDR.format(monthlyStats.totalAmount)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-6">
        {loadingTab ? (
          <div className="grid gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row bg-surface rounded-2xl border border-gray-100 overflow-hidden h-48 animate-pulse"
              >
                {/* Left Part (Date) */}
                <div className="bg-gray-50/50 sm:w-1/3 p-6 flex flex-col justify-between border-b sm:border-b-0 sm:border-r border-gray-100">
                  <Skeleton className="h-4 w-24 mb-4" />
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-12 w-16" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-3 w-10" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-24 mt-4 rounded-lg" />
                </div>

                {/* Right Part (Details) */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-64" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-5 pt-3 border-t border-gray-100">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-7 w-7 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !tickets || tickets.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white/70 backdrop-blur-sm border-2 border-dashed border-gray-200 rounded-3xl">
            <div className="w-16 h-16 text-primary bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <TicketIcon size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              {tab === "history"
                ? "Belum Ada Riwayat Selesai"
                : "Belum Ada Tiket Aktif"}
            </h3>
            <p className="text-sm text-gray-500 mt-2 mb-6 max-w-sm mx-auto">
              {tab === "history"
                ? "Setoran sampah yang telah selesai ditimbang akan otomatis tercatat di sini."
                : "Kamu belum memiliki tiket penjemputan sampah yang sedang berjalan."}
            </p>
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors shadow-sm"
            >
              Jadwalkan Penjemputan <ArrowRight size={16} />
            </Link>
          </div>
        ) : tab === "history" && ticketsInSelectedMonth.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white/70 backdrop-blur-sm border-2 border-dashed border-gray-200 rounded-3xl space-y-3">
            <div className="w-12 h-12 text-gray-400 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <Calendar size={24} />
            </div>
            <h3 className="text-base font-bold text-gray-900">
              Tidak Ada Riwayat pada {selectedMonthLabel}
            </h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">
              Belum ada riwayat setoran sampah yang selesai pada periode bulan ini.
            </p>
            <button
              type="button"
              onClick={() => handleMonthFilterChange("all")}
              className="inline-flex items-center gap-2 bg-primary text-white hover:bg-primary-dark font-semibold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              Tampilkan Semua Bulan
            </button>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white/70 backdrop-blur-sm border-2 border-dashed border-gray-200 rounded-3xl space-y-3">
            <div className="w-12 h-12 text-gray-400 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              {serviceFilter === "drop_off" ? <Scale size={24} /> : <Truck size={24} />}
            </div>
            <h3 className="text-base font-bold text-gray-900">
              Tidak Ada Tiket {serviceFilter === "drop_off" ? "Setor di Loket" : "Jemput Kurir"}
            </h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">
              Tidak ditemukan tiket dengan jenis ini pada {selectedMonthLabel}.
            </p>
            <button
              type="button"
              onClick={() => handleServiceFilterChange("all")}
              className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Tampilkan Semua Jenis Tiket
            </button>
          </div>
        ) : (
          <div className="grid gap-5">
            {filteredTickets.map((ticket: any) => {
              const isDropOff = ticket.service_type === "drop_off";

              const dateObj = parseLocalDateFromYMD(ticket.pickup_date);
              const day = dateObj.toLocaleDateString("id-ID", {
                day: "2-digit",
              });
              const month = dateObj.toLocaleDateString("id-ID", {
                month: "short",
              });
              const year = dateObj.getFullYear();
              const ticketIdShort = ticket.short_id
                ? ticket.short_id.toUpperCase()
                : ticket.id.split("-")[0].toUpperCase();

              // Calculate details for completed tickets
              const details: any[] = ticket.transaction_details || [];
              const totalAmount = details.reduce(
                (sum, item) => sum + (Number(item.subtotal) || 0),
                0
              );
              const totalWeight = details.reduce(
                (sum, item) => sum + (Number(item.weight) || 0),
                0
              );
              const totalCarbon = details.reduce((sum, item) => {
                const factor =
                  Number(item.waste_categories?.carbon_factor) || 2.5;
                return sum + (Number(item.weight) || 0) * factor;
              }, 0);

              const courierName = Array.isArray(ticket.courier)
                ? ticket.courier[0]?.name
                : ticket.courier?.name;

              return (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className="block group"
                >
                  <div className="flex flex-col sm:flex-row bg-surface rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden relative transform hover:-translate-y-1">
                    {/* Left Part: Date & ID */}
                    <div className="bg-primary/5 sm:w-1/3 p-6 flex flex-col justify-between border-b sm:border-b-0 sm:border-r border-dashed border-gray-200 relative">
                      <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                        <Calendar size={60} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-3">
                          <span className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tighter leading-none">
                            {day}
                          </span>
                          <div className="flex flex-col justify-center">
                            <span className="text-sm font-bold text-gray-700 uppercase leading-none mb-1">
                              {month}
                            </span>
                            <span className="text-xs text-gray-500 font-medium leading-none">
                              {year}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-center justify-between text-gray-500">
                        <span className="text-xs font-mono bg-gray-100/90 text-gray-600 font-bold px-2.5 py-1 rounded-lg">
                          ID: #{ticketIdShort}
                        </span>
                      </div>
                    </div>

                    {/* Right Part: Details & Summary */}
                    <div className="p-6 flex-1 flex flex-col justify-between bg-white relative">
                      <div className="space-y-4">
                        {/* Status & Title Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2.5">
                          <h3 className="font-bold text-gray-900 text-base sm:text-lg group-hover:text-primary transition-colors">
                            {ticket.status === "completed"
                              ? isDropOff
                                ? "Setor di Loket Selesai"
                                : "Penjemputan Kurir Selesai"
                              : ticket.status === "cancelled"
                              ? isDropOff
                                ? "Setor di Loket Dibatalkan"
                                : "Penjemputan Kurir Dibatalkan"
                              : isDropOff
                              ? "Setor di Loket Bank Sampah"
                              : "Penjemputan Sampah Kurir"}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Service Type Badge */}
                            {isDropOff ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                                <Scale size={12} /> Setor di Loket
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
                                <Truck size={12} /> Jemput Kurir
                              </span>
                            )}

                            {/* Status Badge */}
                            <div
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 border ${
                                STATUS_COLORS[ticket.status] ||
                                "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {STATUS_LABEL[ticket.status] || ticket.status}
                            </div>
                          </div>
                        </div>

                        {ticket.status === "completed" ? (
                          <div className="space-y-4">
                            {/* Financial & Weight Highlight */}
                            <div className="flex items-start justify-between gap-4 bg-emerald-50/50 border border-emerald-100/80 rounded-xl p-3.5">
                              <div>
                                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                                  Saldo Diterima
                                </span>
                                <span className="text-xl font-extrabold text-emerald-700">
                                  +{formatIDR.format(totalAmount)}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                                  Total Berat
                                </span>
                                <span className="text-lg font-bold text-gray-900">
                                  {totalWeight.toFixed(2)} kg
                                </span>
                              </div>
                            </div>

                            {/* Extra Impact info */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 pt-1">
                              {totalCarbon > 0 && (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                                  <Leaf size={12} /> Reduksi{" "}
                                  {totalCarbon.toFixed(1)} kg CO₂
                                </span>
                              )}
                              {isDropOff ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                  <Scale size={12} /> Disetorkan di Loket
                                </span>
                              ) : courierName ? (
                                <span className="inline-flex items-center gap-1 text-gray-600">
                                  <Truck size={12} /> Kurir: {courierName}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-gray-500">
                                  <Truck size={12} /> Layanan Kurir
                                </span>
                              )}
                            </div>
                          </div>
                        ) : ticket.status === "cancelled" ? (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-500">
                              {isDropOff
                                ? "Tiket setor di loket ini telah dibatalkan."
                                : "Jadwal penjemputan ini telah dibatalkan."}{" "}
                              Kamu dapat membuat jadwal baru kapan saja.
                            </p>
                            {ticket.cancellation_reason && (
                              <div className="rounded-lg bg-rose-50 border border-rose-100 px-3 py-1.5 text-xs text-rose-700 font-medium w-fit">
                                Alasan: <span className="font-semibold">{ticket.cancellation_reason}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            {isDropOff ? (
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit border border-emerald-100">
                                <Scale size={14} />
                                <span>Antar langsung ke Loket pada tanggal yang dipilih</span>
                              </div>
                            ) : courierName ? (
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg w-fit">
                                <Truck size={14} />
                                <span>Kurir bertugas: {courierName}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Clock size={14} />
                                <span>Menunggu penugasan kurir</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card Footer Link */}
                      <div className="flex items-center justify-between mt-5 pt-3 border-t border-gray-100">
                        <span className="text-xs font-bold text-primary group-hover:text-primary-dark transition-colors">
                          {ticket.status === "completed"
                            ? isDropOff
                              ? "Lihat Struk Setor Loket"
                              : "Lihat Bukti & Rincian Struk"
                            : isDropOff
                            ? "Buka E-Tiket Setor Loket (QR)"
                            : "Buka E-Tiket (QR)"}
                        </span>
                        <div className="w-7 h-7 rounded-full bg-gray-50 group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all duration-200">
                          <ChevronRight size={15} />
                        </div>
                      </div>
                    </div>

                    {/* Cutout circles for ticket effect */}
                    <div className="hidden sm:block absolute -top-3 left-[33.333%] w-6 h-6 bg-[var(--color-background)] rounded-full transform -translate-x-1/2"></div>
                    <div className="hidden sm:block absolute -bottom-3 left-[33.333%] w-6 h-6 bg-[var(--color-background)] rounded-full transform -translate-x-1/2"></div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TicketsPage() {
  return (
    <Suspense fallback={<TicketsLoading />}>
      <TicketsContent />
    </Suspense>
  );
}
