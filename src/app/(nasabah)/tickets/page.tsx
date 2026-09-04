import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Ticket as TicketIcon,
  Calendar,
  ArrowRight,
  Wallet,
  Leaf,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
} from "lucide-react";

export default async function TicketsPage(props: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const tab = searchParams?.tab || "active";
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
      user_addresses!address_id(recipient_name, phone_number, full_address),
      transaction_details(
        id,
        weight,
        price_applied,
        subtotal,
        waste_categories(name, material_group, carbon_factor)
      )
    `)
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });

  if (tab === "history") {
    query = query.in("status", ["completed", "cancelled"]);
  } else {
    query = query.in("status", ["pending", "scheduled", "on_the_way"]);
  }

  const { data: tickets } = await query;

  const formatter = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  });

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tiket Penjemputan</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pantau status penjemputan aktif dan riwayat setoran sampahmu.
        </p>
      </div>

      <nav
        aria-label="Kategori tiket"
        className="flex rounded-xl bg-gray-100/70 p-1"
      >
        <Link
          href="/tickets?tab=active"
          aria-current={tab === "active" ? "page" : undefined}
          className={`flex-1 text-center py-2.5 rounded-lg text-sm font-bold transition-all ${
            tab === "active"
              ? "bg-white shadow-sm text-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Tiket Aktif
        </Link>
        <Link
          href="/tickets?tab=history"
          aria-current={tab === "history" ? "page" : undefined}
          className={`flex-1 text-center py-2.5 rounded-lg text-sm font-bold transition-all ${
            tab === "history"
              ? "bg-white shadow-sm text-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Riwayat Selesai
        </Link>
      </nav>

      <div className="space-y-6">
        {!tickets || tickets.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white/70 backdrop-blur-sm border-2 border-dashed border-gray-200 rounded-3xl">
            <div className="w-16 h-16 text-primary bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <TicketIcon size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              {tab === "history" ? "Belum Ada Riwayat Selesai" : "Belum Ada Tiket Aktif"}
            </h3>
            <p className="text-sm text-gray-500 mt-2 mb-6 max-w-sm mx-auto">
              {tab === "history"
                ? "Setoran sampah yang telah selesai ditimbang akan otomatis tercatat di sini."
                : "Kamu belum memiliki jadwal penjemputan aktif. Jadwalkan penjemputan sampah dari rumahmu sekarang."}
            </p>
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors shadow-sm"
            >
              Jadwalkan Penjemputan <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="grid gap-5">
            {tickets.map((ticket: any) => {
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
                completed: "Selesai",
                cancelled: "Dibatalkan",
              };

              const dateObj = new Date(ticket.pickup_date);
              const day = dateObj.toLocaleDateString("id-ID", { day: "2-digit" });
              const month = dateObj.toLocaleDateString("id-ID", { month: "short" });
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
                              ? "Penjemputan Selesai"
                              : ticket.status === "cancelled"
                              ? "Penjemputan Dibatalkan"
                              : "Penjemputan Sampah"}
                          </h3>
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 border ${
                              statusColors[ticket.status] || "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {statusLabel[ticket.status] || ticket.status}
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
                                  +{formatter.format(totalAmount)}
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
                                  <Leaf size={12} /> Reduksi {totalCarbon.toFixed(1)} kg CO₂
                                </span>
                              )}
                              {courierName && (
                                <span className="inline-flex items-center gap-1 text-gray-600">
                                  <Truck size={12} /> Kurir: {courierName}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : ticket.status === "cancelled" ? (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-500">
                              Jadwal penjemputan ini telah dibatalkan. Kamu dapat membuat jadwal booking baru kapan saja.
                            </p>
                          </div>
                        ) : (
                          <div>
                            {courierName ? (
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
                            ? "Lihat Bukti & Rincian Struk"
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
