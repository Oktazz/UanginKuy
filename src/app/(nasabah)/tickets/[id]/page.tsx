import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Truck,
  Scale,
  Wallet,
  Leaf,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Package,
  ArrowRight,
  User,
  Phone,
  XCircle,
} from "lucide-react";
import { TicketQrCode } from "./TicketQrCode";
import { CancelTicketDialog } from "./CancelTicketDialog";
import { formatIndonesianDate } from "@/utils/date";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: ticketId } = await params;
  const supabase = await createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let query = supabase
    .from("tickets")
    .select(`
      *,
      schedules(*),
      courier:profiles!courier_id(name),
      user_addresses!address_id(recipient_name, phone_number, full_address, province, city, district),
      transaction_details(
        id,
        weight,
        price_applied,
        subtotal,
        created_at,
        waste_categories(id, name, material_group, price_per_kg, carbon_factor)
      )
    `)
    .eq("client_id", user.id);

  if (ticketId.length === 8) {
    query = query.eq("short_id", ticketId.toUpperCase());
  } else {
    query = query.eq("id", ticketId);
  }

  const { data: ticket, error } = await query.maybeSingle();

  if (error || !ticket) {
    notFound();
  }

  const formatter = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  });

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
    const factor = Number(item.waste_categories?.carbon_factor) || 2.5;
    return sum + (Number(item.weight) || 0) * factor;
  }, 0);

  const courierName = Array.isArray(ticket.courier)
    ? ticket.courier[0]?.name
    : ticket.courier?.name;

  const address = Array.isArray(ticket.user_addresses)
    ? ticket.user_addresses[0]
    : ticket.user_addresses;

  const statusColors: Record<string, string> = {
    pending: "bg-warning/10 text-warning border-warning/20",
    scheduled: "bg-blue-50 text-blue-700 border-blue-200",
    on_the_way: "bg-purple-50 text-purple-700 border-purple-200",
    completed: "bg-success/10 text-success border-success/20",
    cancelled: "bg-error/10 text-error border-error/20",
  };

  const statusLabel: Record<string, string> = {
    pending: "Menunggu Penjadwalan",
    scheduled: "Terjadwal",
    on_the_way: "Kurir Menuju Lokasi",
    completed: "Selesai & Masuk Saldo",
    cancelled: "Dibatalkan",
  };

  const ticketCode = ticket.short_id || ticket.id.split("-")[0].toUpperCase();

  const formattedDate = formatIndonesianDate(ticket.pickup_date, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const isCompleted = ticket.status === "completed";
  const isCancelled = ticket.status === "cancelled";

  const getMaterialGroupName = (group?: string) => {
    switch (group) {
      case "plastic":
        return "Plastik";
      case "paper":
        return "Kertas/Kardus";
      case "metal":
        return "Logam/Besi";
      case "glass":
        return "Kaca";
      default:
        return "Lainnya";
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-12">
      {/* Back Button */}
      <Link
        href={isCompleted || isCancelled ? "/tickets?tab=history" : "/tickets?tab=active"}
        className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-primary transition-colors"
      >
        <ArrowLeft size={16} className="mr-1.5" /> Kembali ke Daftar Tiket
      </Link>

      {/* Main Container Card */}
      <div className="bg-surface rounded-3xl shadow-sm border border-gray-200/80 overflow-hidden">
        {/* Header Banner */}
        <div
          className={`${
            isCancelled ? "bg-slate-800" : "bg-primary"
          } text-white p-6 sm:p-8 relative overflow-hidden`}
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center p-2">
                <Image
                  src="/logo.png"
                  alt="UanginKuy Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  {isCompleted
                    ? "Struk Bukti Setoran"
                    : isCancelled
                    ? "Tiket Dibatalkan"
                    : "E-Tiket Penjemputan"}
                </h1>
                <p className="text-xs text-white/80 font-mono mt-0.5">
                  ID Tiket: #{ticketCode}
                </p>
              </div>
            </div>

            <div
              className={`px-3 py-1.5 rounded-full text-xs font-bold w-fit ${
                isCompleted
                  ? "bg-white text-primary shadow-sm"
                  : isCancelled
                  ? "bg-rose-500/20 text-rose-200 border border-rose-400/30"
                  : "bg-white/20 text-white backdrop-blur-sm"
              }`}
            >
              {statusLabel[ticket.status] || ticket.status}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* COMPLETED STATUS: Display Full Receipt & Breakdown */}
          {isCompleted ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-emerald-50/80 border border-emerald-200/60 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-emerald-800">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Saldo Diterima
                    </span>
                    <Wallet size={16} />
                  </div>
                  <p className="text-2xl font-black text-emerald-700 tracking-tight mt-2">
                    +{formatter.format(totalAmount)}
                  </p>
                  <span className="text-[11px] text-emerald-600 font-medium mt-1">
                    Masuk ke Saldo Akun
                  </span>
                </div>

                <div className="bg-blue-50/80 border border-blue-200/60 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-blue-800">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Berat Total
                    </span>
                    <Scale size={16} />
                  </div>
                  <p className="text-2xl font-black text-blue-900 tracking-tight mt-2">
                    {totalWeight.toFixed(2)}{" "}
                    <span className="text-base font-bold">kg</span>
                  </p>
                  <span className="text-[11px] text-blue-600 font-medium mt-1">
                    Hasil Timbang Digital
                  </span>
                </div>

                <div className="bg-amber-50/80 border border-amber-200/60 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-amber-800">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Emisi Dicegah
                    </span>
                    <Leaf size={16} />
                  </div>
                  <p className="text-2xl font-black text-amber-900 tracking-tight mt-2">
                    {totalCarbon.toFixed(1)}{" "}
                    <span className="text-base font-bold">kg CO₂</span>
                  </p>
                  <span className="text-[11px] text-amber-700 font-medium mt-1">
                    Dampak Lingkungan
                  </span>
                </div>
              </div>

              {/* Breakdown of Waste Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Package size={18} className="text-primary" />
                    <span>Rincian Sampah yang Disetorkan</span>
                  </h2>
                  <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
                    {details.length} Item
                  </span>
                </div>

                {details.length === 0 ? (
                  <div className="text-center py-6 text-sm text-gray-500 bg-gray-50 rounded-2xl border border-gray-100">
                    Tidak ada rincian item transaksi.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 border border-gray-200/80 rounded-2xl overflow-hidden bg-white">
                    {details.map((item: any, idx: number) => {
                      const cat = item.waste_categories;
                      const catName = cat?.name || "Kategori Lain";
                      const groupLabel = getMaterialGroupName(cat?.material_group);
                      const weightNum = Number(item.weight) || 0;
                      const priceNum = Number(item.price_applied) || 0;
                      const subtotalNum = Number(item.subtotal) || 0;

                      return (
                        <div
                          key={item.id || idx}
                          className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50/70 transition-colors"
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-gray-900 text-sm truncate">
                                {catName}
                              </p>
                              <span className="px-2 py-0.5 rounded-md bg-gray-100 text-[10px] font-semibold text-gray-600">
                                {groupLabel}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              {weightNum.toFixed(2)} kg × {formatter.format(priceNum)} / kg
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="font-bold text-gray-900 text-sm sm:text-base">
                              {formatter.format(subtotalNum)}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    {/* Total Row in Receipt */}
                    <div className="p-4 bg-gray-50/80 flex items-center justify-between text-sm font-bold border-t border-gray-200">
                      <span className="text-gray-700">Total Pembayaran Saldo:</span>
                      <span className="text-primary text-base font-black">
                        {formatter.format(totalAmount)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Pickup & Courier Details */}
              <div className="rounded-2xl border border-gray-200/80 p-5 bg-gray-50/50 space-y-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Informasi Penjemputan
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar size={13} className="text-primary" /> Tanggal Penjemputan
                    </span>
                    <p className="font-semibold text-gray-900">{formattedDate}</p>
                  </div>

                  {courierName && (
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Truck size={13} className="text-primary" /> Kurir Bertugas
                      </span>
                      <p className="font-semibold text-gray-900">{courierName}</p>
                    </div>
                  )}

                  {address && (
                    <div className="sm:col-span-2 space-y-1 pt-2 border-t border-gray-200/60">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin size={13} className="text-primary" /> Alamat Penjemputan
                      </span>
                      <p className="font-semibold text-gray-900">
                        {address.recipient_name} ({address.phone_number})
                      </p>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {address.full_address}
                        {address.district ? `, ${address.district}` : ""}
                        {address.city ? `, ${address.city}` : ""}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href="/dashboard"
                  className="flex-1 text-center py-3 px-4 rounded-xl font-bold bg-primary text-white hover:bg-primary-dark transition-colors shadow-sm text-sm"
                >
                  Cek Saldo di Beranda
                </Link>
                <Link
                  href="/booking"
                  className="flex-1 text-center py-3 px-4 rounded-xl font-semibold border border-primary/30 text-primary hover:bg-primary/5 transition-colors text-sm"
                >
                  Jadwalkan Setoran Baru
                </Link>
              </div>
            </>
          ) : isCancelled ? (
            /* CANCELLED STATUS: Display Friendly Notice & Rebooking Options */
            <div className="flex flex-col items-center text-center space-y-6 py-4">
              <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center">
                <XCircle size={36} />
              </div>

              <div className="space-y-2 max-w-md">
                <h2 className="text-xl font-bold text-gray-900">
                  Jadwal Penjemputan Dibatalkan
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                  Penjemputan sampah untuk tiket ini telah dibatalkan. Kurir tidak akan mendatangi lokasi ini. Anda dapat membuat jadwal penjemputan baru kapan saja.
                </p>
              </div>

              <div className="w-full text-left rounded-2xl border border-gray-200/80 p-5 bg-gray-50/50 space-y-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Detail Jadwal Sebelumnya
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Calendar size={18} className="text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Hari & Tanggal</p>
                      <p className="font-semibold text-gray-900">{formattedDate}</p>
                    </div>
                  </div>

                  {address && (
                    <div className="flex items-start gap-3">
                      <MapPin size={18} className="text-gray-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Lokasi Penjemputan</p>
                        <p className="font-semibold text-gray-900">
                          {address.recipient_name} ({address.phone_number})
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {address.full_address}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions for Cancelled Ticket */}
              <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
                <Link
                  href="/booking"
                  className="flex-1 text-center py-3 px-4 rounded-xl font-bold bg-primary text-white hover:bg-primary-dark transition-colors shadow-sm text-sm"
                >
                  Jadwalkan Penjemputan Baru
                </Link>
                <Link
                  href="/tickets?tab=history"
                  className="flex-1 text-center py-3 px-4 rounded-xl font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                >
                  Lihat Riwayat Tiket
                </Link>
              </div>
            </div>
          ) : (
            /* ACTIVE / PENDING / SCHEDULED / ON_THE_WAY STATUS: Display QR Code & Schedule Details */
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="space-y-2 max-w-md">
                <h2 className="text-lg font-bold text-gray-900">
                  Tunjukkan E-Tiket kepada Kurir
                </h2>
                <p className="text-xs text-gray-500">
                  Pindai QR code ini saat kurir tiba di lokasi untuk memulai proses penimbangan.
                </p>
              </div>

              {/* QR Code */}
              <TicketQrCode value={ticket.short_id || ticket.id} />

              {/* Status Alert for on_the_way */}
              {ticket.status === "on_the_way" && (
                <div className="w-full bg-purple-50 border border-purple-200/80 rounded-2xl p-4 flex items-start gap-3 text-left text-xs text-purple-900">
                  <Truck size={18} className="text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block text-sm">Kurir Sedang Menuju Lokasi</strong>
                    <span className="leading-relaxed mt-0.5 block">
                      Kurir sedang dalam perjalanan ke alamat Anda. Mohon pastikan sampah daur ulang sudah siap di titik jemput.
                    </span>
                  </div>
                </div>
              )}

              <div className="w-full text-left rounded-2xl border border-gray-200/80 p-5 bg-gray-50/50 space-y-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Detail Jadwal & Lokasi
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Calendar size={18} className="text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Hari & Tanggal</p>
                      <p className="font-semibold text-gray-900">{formattedDate}</p>
                    </div>
                  </div>

                  {courierName && (
                    <div className="flex items-start gap-3">
                      <Truck size={18} className="text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Kurir Ditugaskan</p>
                        <p className="font-semibold text-gray-900">{courierName}</p>
                      </div>
                    </div>
                  )}

                  {address && (
                    <div className="flex items-start gap-3">
                      <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Lokasi Penjemputan</p>
                        <p className="font-semibold text-gray-900">
                          {address.recipient_name} ({address.phone_number})
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {address.full_address}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Cancellation Option for Pending / Scheduled */}
              {(ticket.status === "pending" || ticket.status === "scheduled") && (
                <div className="w-full pt-2 flex flex-col items-center gap-2">
                  <CancelTicketDialog
                    ticketId={ticket.id}
                    shortId={ticketCode}
                    currentStatus={ticket.status}
                    courierName={courierName}
                  />
                  <p className="text-[11px] text-gray-400">
                    {ticket.status === "scheduled"
                      ? "Penjemputan ini sudah dijadwalkan ke kurir. Anda tetap dapat membatalkannya sebelum kurir berangkat."
                      : "Jadwal penjemputan belum diproses kurir. Anda dapat membatalkannya kapan saja."}
                  </p>
                </div>
              )}

              <p className="text-xs text-gray-400 max-w-sm">
                Pastikan sampah sudah dipilah sesuai kategorinya sebelum kurir tiba agar proses penimbangan berjalan cepat.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
