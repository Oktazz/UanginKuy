import { useState } from "react";
import { CheckCircle2, Clock3, MapPin, Route, XCircle } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";
import type { CustomSelectOption } from "@/components/ui/CustomSelect";
import type { CancelledTicket, Courier, RouteTicket } from "./types";

type Tab = "active" | "cancelled";

interface TicketTableProps {
  tickets: RouteTicket[];
  cancelledTickets: CancelledTicket[];
  couriers: Courier[];
  onAssign: (ticketId: string, courierId: string) => void;
}

function formatCancelDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TicketTable({
  tickets,
  cancelledTickets,
  couriers,
  onAssign,
}: TicketTableProps) {
  const [tab, setTab] = useState<Tab>("active");

  const courierSelectOptions: CustomSelectOption[] = [
    { value: "", label: "Belum Ditugaskan" },
    ...couriers.map((courier) => ({
      value: courier.id,
      label: courier.name,
    })),
  ];

  return (
    <section className="overflow-hidden rounded-3xl border border-gray-100 bg-surface shadow-sm xl:col-span-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 p-6">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900">
            Daftar Tiket Penjemputan
          </h2>
          <p className="mt-1 text-xs font-medium text-gray-500">
            {tab === "active"
              ? "Assignment manual dipertahankan saat rute dihasilkan."
              : "Daftar penjemputan yang dibatalkan nasabah dan dikeluarkan dari rute."}
          </p>
        </div>

        <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setTab("active")}
            className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
              tab === "active"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Tiket Aktif ({tickets.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("cancelled")}
            className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
              tab === "cancelled"
                ? "bg-white text-error shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Dibatalkan ({cancelledTickets.length})
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        {tab === "active" ? (
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-gray-500">
                  Nasabah / Alamat
                </th>
                <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-gray-500">
                  Status &amp; Urutan
                </th>
                <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-gray-500">
                  Penugasan Kurir
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="transition-colors hover:bg-gray-50/50"
                >
                  <td className="px-6 py-5">
                    <p className="font-bold text-gray-900">
                      {ticket.user_addresses?.recipient_name ?? "Nasabah Anonim"}
                    </p>
                    <div className="mt-1 flex items-start gap-1 text-xs font-medium text-gray-400">
                      <MapPin size={12} className="mt-0.5 shrink-0" />
                      <span className="inline-block max-w-[240px] truncate">
                        {ticket.user_addresses?.full_address ??
                          "Alamat tidak diketahui"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-2">
                      <span
                        className={`inline-flex w-fit items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                          ticket.status === "scheduled"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-warning/10 text-warning"
                        }`}
                      >
                        <Clock3 size={12} aria-hidden="true" />
                        {ticket.status === "scheduled" ? "Terjadwal" : "Pending"}
                      </span>
                      {ticket.route_sequence ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-primary">
                          <CheckCircle2 size={14} aria-hidden="true" />
                          Urutan ke-{ticket.route_sequence}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold italic text-gray-400">
                          Belum diurutkan
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <CustomSelect
                      id={`ticket-courier-${ticket.id}`}
                      value={ticket.courier_id ?? ""}
                      onChange={(courierId) => onAssign(ticket.id, courierId)}
                      options={courierSelectOptions}
                      placeholder="Pilih Kurir..."
                      className="min-w-[190px]"
                      triggerClassName={`h-10 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                        ticket.courier_id
                          ? "border-primary/30 text-primary bg-primary/5 hover:border-primary/50"
                          : "border-gray-200 font-medium text-gray-500 bg-white hover:border-gray-300"
                      }`}
                    />
                  </td>
                </tr>
              ))}
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-16 text-center">
                    <Route size={36} className="mx-auto text-gray-200" />
                    <p className="mt-3 font-bold text-gray-500">
                      Tidak ada tiket aktif
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-gray-500">
                  Nasabah / Alamat
                </th>
                <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-gray-500">
                  ID Tiket
                </th>
                <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-gray-500">
                  Waktu Pembatalan
                </th>
                <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-gray-500">
                  Status &amp; Keterangan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cancelledTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="transition-colors hover:bg-gray-50/50"
                >
                  <td className="px-6 py-5">
                    <p className="font-bold text-gray-900">
                      {ticket.recipient_name}
                    </p>
                    <div className="mt-1 flex items-start gap-1 text-xs font-medium text-gray-400">
                      <MapPin size={12} className="mt-0.5 shrink-0" />
                      <span className="inline-block max-w-[240px] truncate">
                        {ticket.full_address}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 font-mono text-xs font-bold text-gray-600">
                    #{ticket.short_id || ticket.id.substring(0, 8).toUpperCase()}
                  </td>
                  <td className="px-6 py-5 text-xs text-gray-500">
                    {ticket.updated_at ? formatCancelDate(ticket.updated_at) : "-"}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex w-fit items-center gap-1 rounded-md bg-error/10 px-2 py-0.5 text-[10px] font-extrabold uppercase text-error">
                        <XCircle size={11} aria-hidden="true" />
                        Dibatalkan
                      </span>
                      <span className="text-[10px] font-medium text-gray-400">
                        Otomatis dilepas dari rute kurir
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {cancelledTickets.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <XCircle size={36} className="mx-auto text-gray-200" />
                    <p className="mt-3 font-bold text-gray-500">
                      Tidak ada tiket yang dibatalkan
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}