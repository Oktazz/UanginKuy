"use client";

import { useEffect, useState, useCallback } from "react";
import {
  X,
  Wallet,
  Scale,
  Coins,
  ArrowDownRight,
  Store,
  Truck,
  Building2,
  MapPin,
  Phone,
  Calendar,
  Clock3,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Landmark,
  ShieldCheck,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatIDR } from "@/utils/format";
import { TabsNav } from "@/components/ui/TabsNav";
import { CustomSelect } from "@/components/ui/CustomSelect";
import type { ApiResponse } from "@/types/api";
import type { NasabahDetailData } from "@/types/nasabah";

interface NasabahDetailModalProps {
  nasabahId: string | null;
  onClose: () => void;
}

interface ModalPaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  itemLabel: string;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
}

function ModalPagination({
  page,
  totalPages,
  totalItems,
  limit,
  itemLabel,
  onPageChange,
  onLimitChange,
}: ModalPaginationProps) {
  if (totalItems <= 0) return null;

  const fromItem = (page - 1) * limit + 1;
  const toItem = Math.min(page * limit, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 mt-1 border-t border-gray-100 text-xs">
      {/* Counter & Per Page */}
      <div className="flex items-center gap-3">
        <span className="text-gray-500 font-medium">
          Menampilkan <strong className="text-gray-900">{fromItem}</strong> -{" "}
          <strong className="text-gray-900">{toItem}</strong> dari{" "}
          <strong className="text-gray-900">{totalItems}</strong> {itemLabel}
        </span>

        <div className="w-24">
          <CustomSelect
            id="modal-pagination-limit"
            value={String(limit)}
            onChange={(val) => {
              onLimitChange(Number(val));
              onPageChange(1);
            }}
            options={[
              { value: "5", label: "5 / hal" },
              { value: "10", label: "10 / hal" },
              { value: "20", label: "20 / hal" },
            ]}
            placeholder="Baris"
            triggerClassName="h-7 text-xs font-bold rounded-lg border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300"
          />
        </div>
      </div>

      {/* Page Navigation */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer font-bold flex items-center gap-1"
          >
            <ChevronLeft size={14} />
            <span>Sebelumnya</span>
          </button>

          <span className="px-2 font-bold text-gray-700">
            {page} / {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer font-bold flex items-center gap-1"
          >
            <span>Selanjutnya</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function NasabahDetailModal({
  nasabahId,
  onClose,
}: NasabahDetailModalProps) {
  const [data, setData] = useState<NasabahDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"deposits" | "withdrawals" | "addresses">("deposits");

  // Pagination State for Deposits
  const [depositPage, setDepositPage] = useState(1);
  const [depositLimit, setDepositLimit] = useState(5);

  // Pagination State for Withdrawals
  const [withdrawalPage, setWithdrawalPage] = useState(1);
  const [withdrawalLimit, setWithdrawalLimit] = useState(5);

  const loadDetail = useCallback(async (id: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/nasabah/${id}`, { cache: "no-store" });
      const json = (await res.json()) as ApiResponse<NasabahDetailData>;
      if (!json.success) throw new Error(json.error);
      setData(json.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memuat detail nasabah";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (nasabahId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- load detail on modal open
      void loadDetail(nasabahId);
      setActiveTab("deposits");
      setDepositPage(1);
      setWithdrawalPage(1);
    } else {
      setData(null);
    }
  }, [nasabahId, loadDetail]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Computed pagination for deposits
  const totalDeposits = data?.wasteDeposits.length || 0;
  const totalDepositPages = Math.ceil(totalDeposits / depositLimit) || 1;
  const currentDeposits = (data?.wasteDeposits || []).slice(
    (depositPage - 1) * depositLimit,
    depositPage * depositLimit,
  );

  // Computed pagination for withdrawals
  const totalWithdrawals = data?.withdrawals.length || 0;
  const totalWithdrawalPages = Math.ceil(totalWithdrawals / withdrawalLimit) || 1;
  const currentWithdrawals = (data?.withdrawals || []).slice(
    (withdrawalPage - 1) * withdrawalLimit,
    withdrawalPage * withdrawalLimit,
  );

  if (!nasabahId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-6 sm:p-7 border-b border-gray-100 bg-gray-50/70">
          {loading && !data ? (
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gray-200 animate-pulse" />
              <div className="space-y-2">
                <div className="w-48 h-5 bg-gray-200 rounded animate-pulse" />
                <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ) : data ? (
            <div className="flex items-start gap-4">
              <div className="relative w-14 h-14 shrink-0 rounded-2xl bg-primary/10 border border-primary/20 text-primary font-black text-2xl flex items-center justify-center">
                {data.profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.profile.avatarUrl}
                    alt={data.profile.name}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <span>{data.profile.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                    {data.profile.name}
                  </h2>
                  <span className="inline-flex items-center gap-1 font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-gray-100 border border-gray-200 text-gray-700">
                    <ShieldCheck size={13} className="text-primary" />
                    {data.profile.accountNumber || "Tanpa ID"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar size={13} />
                    Bergabung {new Date(data.profile.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  {data.addresses[0]?.phoneNumber && (
                    <span className="flex items-center gap-1">
                      <Phone size={13} />
                      {data.addresses[0].phoneNumber}
                    </span>
                  )}
                  {data.addresses[0]?.city && (
                    <span className="flex items-center gap-1">
                      <MapPin size={13} />
                      {data.addresses[0].city}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-red-600 font-bold">Gagal memuat profil</div>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail nasabah"
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-6">
          {loading && !data ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 size={32} className="mx-auto text-primary animate-spin" />
              <p className="text-sm font-semibold text-gray-500">Memuat riwayat transaksi nasabah...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          ) : data ? (
            <>
              {/* 4 Financial Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-2xl bg-[#faf6ea] border border-[#e7e1b1] space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-600">
                    <span>Saldo Saat Ini</span>
                    <Wallet size={15} className="text-primary" />
                  </div>
                  <p className="text-lg sm:text-xl font-black text-primary">
                    {formatIDR.format(data.profile.balance)}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-600">
                    <span>Sampah Disetor</span>
                    <Scale size={15} className="text-gray-500" />
                  </div>
                  <p className="text-lg sm:text-xl font-black text-gray-900">
                    {data.statistics.totalWasteWeight.toFixed(1)}{" "}
                    <span className="text-xs font-semibold text-gray-500">kg</span>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-600">
                    <span>Total Hasil Setor</span>
                    <Coins size={15} className="text-gray-500" />
                  </div>
                  <p className="text-lg sm:text-xl font-black text-gray-900">
                    {formatIDR.format(data.statistics.totalWasteEarnings)}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-600">
                    <span>Total Ditarik</span>
                    <ArrowDownRight size={15} className="text-gray-500" />
                  </div>
                  <p className="text-lg sm:text-xl font-black text-gray-900">
                    {formatIDR.format(data.statistics.totalWithdrawn)}
                  </p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <TabsNav<"deposits" | "withdrawals" | "addresses">
                ariaLabel="Kategori Riwayat Nasabah"
                activeTab={activeTab}
                onChange={setActiveTab}
                tabs={[
                  {
                    value: "deposits",
                    label: `Setoran Sampah (${data.wasteDeposits.length})`,
                    icon: <Trash2 size={16} />,
                  },
                  {
                    value: "withdrawals",
                    label: `Penarikan Saldo (${data.withdrawals.length})`,
                    icon: <Landmark size={16} />,
                  },
                  {
                    value: "addresses",
                    label: `Alamat & Kontak (${data.addresses.length})`,
                    icon: <MapPin size={16} />,
                  },
                ]}
              />

              {/* Tab 1: Penyetoran Sampah */}
              {activeTab === "deposits" && (
                <div className="space-y-3.5">
                  {data.wasteDeposits.length === 0 ? (
                    <div className="py-12 text-center rounded-2xl border border-dashed border-gray-200 space-y-2">
                      <Package size={32} className="mx-auto text-gray-300" />
                      <p className="text-sm font-semibold text-gray-500">
                        Nasabah ini belum pernah menyetorkan sampah.
                      </p>
                    </div>
                  ) : (
                    <>
                      {currentDeposits.map((deposit) => {
                        const isDropoff = deposit.serviceType === "drop_off";
                        const isSuccess = deposit.status === "completed";

                        return (
                          <div
                            key={deposit.id}
                            className="p-4 sm:p-5 rounded-2xl border border-gray-200 bg-white space-y-3 hover:border-primary/30 transition"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                    isDropoff
                                      ? "bg-primary/10 text-primary border border-primary/20"
                                      : "bg-blue-50 text-blue-700 border border-blue-200"
                                  }`}
                                >
                                  {isDropoff ? <Store size={12} /> : <Truck size={12} />}
                                  {isDropoff ? "Drop-Off di Loket" : "Penjemputan Kurir"}
                                </span>

                                <span className="font-mono text-xs font-extrabold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                                  {deposit.shortId || deposit.id.substring(0, 8).toUpperCase()}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                                    isSuccess
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : deposit.status === "cancelled"
                                      ? "bg-red-50 text-red-700 border-red-200"
                                      : "bg-amber-50 text-amber-700 border-amber-200"
                                  }`}
                                >
                                  {isSuccess ? (
                                    <CheckCircle2 size={12} />
                                  ) : deposit.status === "cancelled" ? (
                                    <XCircle size={12} />
                                  ) : (
                                    <Clock3 size={12} />
                                  )}
                                  {deposit.status === "completed"
                                    ? "Selesai"
                                    : deposit.status === "cancelled"
                                    ? "Dibatalkan"
                                    : "Sedang Diproses"}
                                </span>

                                <span className="text-xs text-gray-400">
                                  {new Date(deposit.createdAt).toLocaleString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </div>

                            {/* Detail Jenis Sampah */}
                            {deposit.items.length > 0 ? (
                              <div className="overflow-x-auto rounded-xl border border-gray-100 bg-gray-50/50">
                                <table className="w-full text-left text-xs">
                                  <thead>
                                    <tr className="border-b border-gray-100 text-gray-500 uppercase tracking-wider font-extrabold text-[10px]">
                                      <th className="px-3 py-2">Kategori Sampah</th>
                                      <th className="px-3 py-2 text-right">Berat (kg)</th>
                                      <th className="px-3 py-2 text-right">Tarif / kg</th>
                                      <th className="px-3 py-2 text-right">Subtotal</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {deposit.items.map((item, idx) => (
                                      <tr key={idx} className="text-gray-700 font-medium">
                                        <td className="px-3 py-2 font-bold text-gray-900">
                                          {item.categoryName}
                                        </td>
                                        <td className="px-3 py-2 text-right font-mono">
                                          {item.weight.toFixed(2)} kg
                                        </td>
                                        <td className="px-3 py-2 text-right font-mono text-gray-500">
                                          {formatIDR.format(item.priceApplied)}
                                        </td>
                                        <td className="px-3 py-2 text-right font-mono font-bold text-gray-900">
                                          {formatIDR.format(item.subtotal)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 italic">Rincian sampah belum dicatat.</p>
                            )}

                            {/* Footer Total */}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs font-bold">
                              <span className="text-gray-500">
                                Total Sampah:{" "}
                                <strong className="text-gray-800">
                                  {deposit.totalWeight.toFixed(2)} kg
                                </strong>{" "}
                                · Metode: {deposit.paymentMethod === "cash" ? "Tunai Langsung" : "Saldo Akun"}
                              </span>
                              <span className="text-primary font-black text-sm">
                                +{formatIDR.format(deposit.totalAmount)}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      <ModalPagination
                        page={depositPage}
                        totalPages={totalDepositPages}
                        totalItems={totalDeposits}
                        limit={depositLimit}
                        itemLabel="setoran"
                        onPageChange={setDepositPage}
                        onLimitChange={setDepositLimit}
                      />
                    </>
                  )}
                </div>
              )}

              {/* Tab 2: Penarikan Saldo */}
              {activeTab === "withdrawals" && (
                <div className="space-y-3.5">
                  {data.withdrawals.length === 0 ? (
                    <div className="py-12 text-center rounded-2xl border border-dashed border-gray-200 space-y-2">
                      <Wallet size={32} className="mx-auto text-gray-300" />
                      <p className="text-sm font-semibold text-gray-500">
                        Nasabah ini belum pernah melakukan penarikan saldo.
                      </p>
                    </div>
                  ) : (
                    <>
                      {currentWithdrawals.map((wd) => {
                        const isCounter =
                          wd.withdrawalType === "cash_counter" ||
                          wd.bankName === "TUNAI_LOKET";
                        const isSuccess = wd.status === "success";
                        const isFailed = wd.status === "failed";

                        return (
                          <div
                            key={wd.id}
                            className="p-4 sm:p-5 rounded-2xl border border-gray-200 bg-white space-y-2.5 hover:border-primary/30 transition"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                    isCounter
                                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                                      : "bg-blue-50 text-blue-700 border border-blue-200"
                                  }`}
                                >
                                  {isCounter ? <Store size={12} /> : <Building2 size={12} />}
                                  {isCounter ? "Tarik Tunai Loket" : "Transfer Bank"}
                                </span>

                                <span className="text-base font-extrabold text-gray-900">
                                  {formatIDR.format(wd.amount)}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                                    isSuccess
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : isFailed
                                      ? "bg-red-50 text-red-700 border-red-200"
                                      : "bg-amber-50 text-amber-700 border-amber-200"
                                  }`}
                                >
                                  {isSuccess ? (
                                    <CheckCircle2 size={12} />
                                  ) : isFailed ? (
                                    <XCircle size={12} />
                                  ) : (
                                    <Clock3 size={12} />
                                  )}
                                  {isSuccess
                                    ? "Berhasil"
                                    : isFailed
                                    ? "Dibatalkan / Refund"
                                    : "Menunggu"}
                                </span>

                                <span className="text-xs text-gray-400">
                                  {new Date(wd.createdAt).toLocaleString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 pt-1">
                              <div>
                                {isCounter ? (
                                  <span>
                                    Kode OTP:{" "}
                                    <strong className="font-mono text-gray-800">
                                      {wd.tokenCode || wd.accountNumber}
                                    </strong>
                                  </span>
                                ) : (
                                  <span>
                                    Tujuan:{" "}
                                    <strong className="text-gray-800 font-semibold">
                                      {wd.bankName.toUpperCase()} · ••••{wd.accountNumber.slice(-4)}
                                    </strong>
                                  </span>
                                )}
                                <span className="text-gray-300 mx-2">|</span>
                                <span>Diterima bersih: {formatIDR.format(wd.netAmount)}</span>
                              </div>

                              {wd.failureReason && (
                                <span className="text-red-600 font-semibold">
                                  {wd.failureReason}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      <ModalPagination
                        page={withdrawalPage}
                        totalPages={totalWithdrawalPages}
                        totalItems={totalWithdrawals}
                        limit={withdrawalLimit}
                        itemLabel="penarikan"
                        onPageChange={setWithdrawalPage}
                        onLimitChange={setWithdrawalLimit}
                      />
                    </>
                  )}
                </div>
              )}

              {/* Tab 3: Alamat & Kontak */}
              {activeTab === "addresses" && (
                <div className="space-y-3">
                  {data.addresses.length === 0 ? (
                    <div className="py-12 text-center rounded-2xl border border-dashed border-gray-200 space-y-2">
                      <MapPin size={32} className="mx-auto text-gray-300" />
                      <p className="text-sm font-semibold text-gray-500">
                        Nasabah belum mendaftarkan alamat.
                      </p>
                    </div>
                  ) : (
                    data.addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="p-4 rounded-2xl border border-gray-200 bg-white space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-sm">{addr.label}</span>
                            {addr.isPrimary && (
                              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold">
                                Utama
                              </span>
                            )}
                          </div>
                          {addr.phoneNumber && (
                            <span className="text-xs font-mono font-semibold text-gray-700 flex items-center gap-1">
                              <Phone size={12} /> {addr.phoneNumber}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-600 leading-relaxed">
                          {addr.fullAddress}
                        </p>

                        {(addr.district || addr.city) && (
                          <p className="text-[11px] font-medium text-gray-400">
                            {[addr.district, addr.city].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
