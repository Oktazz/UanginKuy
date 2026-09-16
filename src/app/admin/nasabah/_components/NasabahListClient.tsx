"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  UserCheck,
  Search,
  Filter,
  ArrowUpDown,
  Phone,
  MapPin,
  Calendar,
  Eye,
  RefreshCw,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Layers,
  ShieldCheck,
  X,
} from "lucide-react";
import { formatIDR } from "@/utils/format";
import NasabahDetailModal from "./NasabahDetailModal";
import type { ApiResponse } from "@/types/api";
import type { NasabahListItem, NasabahSummaryMetrics } from "@/types/nasabah";

function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
}

export default function NasabahListClient() {
  const [nasabah, setNasabah] = useState<NasabahListItem[]>([]);
  const [metrics, setMetrics] = useState<NasabahSummaryMetrics | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [hasBalance, setHasBalance] = useState<"all" | "yes" | "no">("all");
  const [sort, setSort] = useState<"newest" | "balance_desc" | "balance_asc" | "name_asc">("newest");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Modal State
  const [selectedNasabahId, setSelectedNasabahId] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  const loadNasabah = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        hasBalance,
        sort,
      });
      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      }

      const res = await fetch(`/api/admin/nasabah?${params.toString()}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as ApiResponse<{
        nasabah: NasabahListItem[];
        total: number;
        metrics: NasabahSummaryMetrics;
      }>;

      if (!json.success) throw new Error(json.error);

      setNasabah(json.data.nasabah);
      setTotal(json.data.total);
      setMetrics(json.data.metrics);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memuat data nasabah";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [page, limit, hasBalance, sort, debouncedSearch]);

  useEffect(() => {
    void loadNasabah();
  }, [loadNasabah]);

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Data Nasabah
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold">
              {total} Terdaftar
            </span>
          </div>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Kelola data nasabah, pantau saldo aktif, dan lihat riwayat lengkap setoran sampah serta pencairan saldo.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadNasabah()}
          disabled={loading}
          aria-label="Segarkan data nasabah"
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Segarkan
        </button>
      </header>

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-3xl bg-white border border-gray-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Users size={22} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Nasabah</p>
              <p className="text-2xl font-black text-gray-900 mt-0.5">
                {metrics.totalNasabah.toLocaleString("id-ID")}
              </p>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-gray-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <UserCheck size={22} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nasabah Aktif</p>
              <p className="text-2xl font-black text-gray-900 mt-0.5">
                {metrics.activeNasabahCount.toLocaleString("id-ID")}{" "}
                <span className="text-xs font-semibold text-gray-400">
                  ({metrics.totalNasabah > 0 ? Math.round((metrics.activeNasabahCount / metrics.totalNasabah) * 100) : 0}%)
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berdasarkan nama nasabah, ID Akun (UKN-...), atau no HP..."
              className="w-full h-11 pl-10 pr-9 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-900 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Filters & Sorting */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Status Nasabah */}
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold">
              <Filter size={14} className="text-gray-400" />
              <span className="text-gray-500">Status:</span>
              <select
                value={hasBalance}
                onChange={(e) => {
                  setHasBalance(e.target.value as "all" | "yes" | "no");
                  setPage(1);
                }}
                className="bg-transparent font-bold text-gray-800 outline-none cursor-pointer"
              >
                <option value="all">Semua Nasabah</option>
                <option value="yes">Nasabah Aktif</option>
                <option value="no">Saldo Kosong (Rp0)</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold">
              <ArrowUpDown size={14} className="text-gray-400" />
              <span className="text-gray-500">Urut:</span>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as "newest" | "balance_desc" | "balance_asc" | "name_asc");
                  setPage(1);
                }}
                className="bg-transparent font-bold text-gray-800 outline-none cursor-pointer"
              >
                <option value="newest">Terbaru Mendaftar</option>
                <option value="balance_desc">Saldo Tertinggi</option>
                <option value="balance_asc">Saldo Terendah</option>
                <option value="name_asc">Nama (A-Z)</option>
              </select>
            </div>

            {/* Per-Page Selector */}
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold">
              <Layers size={14} className="text-gray-400" />
              <span className="text-gray-500">Tampilkan:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-transparent font-bold text-gray-800 outline-none cursor-pointer"
              >
                <option value={10}>10 nasabah</option>
                <option value={20}>20 nasabah</option>
                <option value={50}>50 nasabah</option>
                <option value={100}>100 nasabah</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Nasabah Table / List */}
      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xs">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <Loader2 size={36} className="mx-auto text-primary animate-spin" />
            <p className="text-sm font-semibold text-gray-500">Memuat data nasabah...</p>
          </div>
        ) : nasabah.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <Users size={40} className="mx-auto text-gray-300" />
            <p className="text-base font-bold text-gray-700">Tidak ada nasabah ditemukan</p>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              {debouncedSearch
                ? `Tidak ada nasabah yang cocok dengan pencarian "${debouncedSearch}". Coba kata kunci lain.`
                : "Belum ada nasabah terdaftar dalam sistem."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-gray-50/80 text-xs font-extrabold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Nasabah</th>
                  <th className="px-6 py-4">Kontak & Alamat</th>
                  <th className="px-6 py-4 text-right">Saldo Aktif</th>
                  <th className="px-6 py-4">Bergabung</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {nasabah.map((n) => (
                  <tr
                    key={n.id}
                    onClick={() => setSelectedNasabahId(n.id)}
                    className="hover:bg-gray-50/80 transition cursor-pointer group"
                  >
                    {/* Nasabah Column */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-black flex items-center justify-center shrink-0 border border-primary/20">
                          {n.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={n.avatar_url}
                              alt={n.name}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            <span>{n.name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-extrabold text-gray-900 group-hover:text-primary transition">
                            {n.name}
                          </p>
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-gray-500">
                            <ShieldCheck size={11} className="text-primary" />
                            {n.account_number || "Tanpa ID"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Contact & Location Column */}
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        {n.phone_number ? (
                          <p className="text-xs font-semibold text-gray-800 flex items-center gap-1">
                            <Phone size={12} className="text-gray-400 shrink-0" />
                            {n.phone_number}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 italic">No HP belum ada</p>
                        )}
                        {(n.city || n.district) ? (
                          <p className="text-[11px] text-gray-500 flex items-center gap-1">
                            <MapPin size={11} className="text-gray-400 shrink-0" />
                            {[n.district, n.city].filter(Boolean).join(", ")}
                          </p>
                        ) : null}
                      </div>
                    </td>

                    {/* Balance Column */}
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`font-mono text-base font-black ${
                          n.balance > 0 ? "text-primary" : "text-gray-400"
                        }`}
                      >
                        {formatIDR.format(n.balance)}
                      </span>
                    </td>

                    {/* Join Date Column */}
                    <td className="px-6 py-4 text-xs font-medium text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-gray-400" />
                        {new Date(n.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>

                    {/* Action Column */}
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNasabahId(n.id);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 group-hover:bg-primary group-hover:text-white text-xs font-bold text-gray-700 transition cursor-pointer"
                      >
                        <Eye size={13} />
                        <span>Detail Riwayat</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && total > 0 && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 sm:p-5 border-t border-gray-100 bg-gray-50/60">
            {/* Info Range and Per Page */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 w-full md:w-auto">
              <p className="text-xs font-semibold text-gray-500">
                Menampilkan{" "}
                <span className="font-bold text-gray-900">
                  {total === 0 ? 0 : (page - 1) * limit + 1}
                </span>{" "}
                -{" "}
                <span className="font-bold text-gray-900">
                  {Math.min(page * limit, total)}
                </span>{" "}
                dari <span className="font-bold text-gray-900">{total}</span> nasabah
              </p>

              <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-2.5 py-1 text-xs font-semibold shadow-2xs">
                <Layers size={13} className="text-gray-400" />
                <span className="text-gray-500">Baris:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-transparent font-bold text-gray-800 outline-none cursor-pointer"
                >
                  <option value={10}>10 / hal</option>
                  <option value={20}>20 / hal</option>
                  <option value={50}>50 / hal</option>
                  <option value={100}>100 / hal</option>
                </select>
              </div>
            </div>

            {/* Interactive Page Navigator */}
            <div className="flex items-center gap-1.5 w-full md:w-auto justify-center">
              {/* First Page */}
              <button
                type="button"
                title="Halaman Pertama"
                disabled={page <= 1}
                onClick={() => setPage(1)}
                className="h-8 w-8 sm:w-auto sm:px-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer text-xs font-bold flex items-center justify-center gap-1 shadow-2xs"
              >
                <ChevronsLeft size={15} />
                <span className="hidden lg:inline">Awal</span>
              </button>

              {/* Prev Page */}
              <button
                type="button"
                title="Halaman Sebelumnya"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 w-8 sm:w-auto sm:px-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer text-xs font-bold flex items-center justify-center gap-1 shadow-2xs"
              >
                <ChevronLeft size={15} />
                <span className="hidden sm:inline">Sebelumnya</span>
              </button>

              {/* Numbered Buttons */}
              <div className="flex items-center gap-1">
                {getPageNumbers(page, totalPages).map((pNum, idx) => {
                  if (pNum === "...") {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        className="w-8 h-8 flex items-center justify-center text-xs font-bold text-gray-400 select-none"
                      >
                        ...
                      </span>
                    );
                  }

                  const isCurrent = pNum === page;
                  return (
                    <button
                      key={`page-btn-${pNum}`}
                      type="button"
                      onClick={() => setPage(Number(pNum))}
                      className={`h-8 min-w-[32px] px-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                        isCurrent
                          ? "bg-primary text-white shadow-2xs font-extrabold"
                          : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 shadow-2xs"
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>

              {/* Next Page */}
              <button
                type="button"
                title="Halaman Selanjutnya"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 w-8 sm:w-auto sm:px-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer text-xs font-bold flex items-center justify-center gap-1 shadow-2xs"
              >
                <span className="hidden sm:inline">Selanjutnya</span>
                <ChevronRight size={15} />
              </button>

              {/* Last Page */}
              <button
                type="button"
                title="Halaman Terakhir"
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
                className="h-8 w-8 sm:w-auto sm:px-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer text-xs font-bold flex items-center justify-center gap-1 shadow-2xs"
              >
                <span className="hidden lg:inline">Akhir</span>
                <ChevronsRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Detail Modal */}
      <NasabahDetailModal
        nasabahId={selectedNasabahId}
        onClose={() => setSelectedNasabahId(null)}
      />
    </div>
  );
}
