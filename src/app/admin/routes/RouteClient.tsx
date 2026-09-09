"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Cpu,
  Loader2,
  MapPin,
  Network,
  Plus,
  Route,
  Trash2,
  Truck,
  UserRound,
  Warehouse,
  Waypoints,
  Wifi,
  WifiOff,
  XCircle,
  Zap,
} from "lucide-react";
import { CustomAlertDialog } from "@/components/ui/ConfirmDialog";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Button } from "@/components/ui/button";
import {
  assignCourier,
  assignDevice,
  generateOptimalRoutes,
  registerDevice,
  unassignDevice,
  unregisterDevice,
  type DeviceActionResult,
} from "./actions";
import type { CancelledTicket, Courier, Depot, IotDevice, RouteTicket } from "./types";

const RouteMap = dynamic(() => import("./RouteMap"), { ssr: false });

type Feedback = {
  kind: "success" | "error";
  message: string;
};

const pipelineIcons = [MapPin, Network, Route, Waypoints] as const;

function formatLastPing(lastPing: string | null, referenceTime: number) {
  if (!lastPing || !Number.isFinite(referenceTime)) return "Belum pernah terhubung";

  const pingTime = new Date(lastPing).getTime();
  if (!Number.isFinite(pingTime)) return "Waktu ping tidak valid";

  const minutes = Math.max(0, Math.floor((referenceTime - pingTime) / 60_000));
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;

  return `${Math.floor(hours / 24)} hari lalu`;
}

export default function RouteClient({
  tickets,
  cancelledTickets = [],
  couriers,
  depot,
  iotDevices,
  referenceTime,
}: {
  tickets: RouteTicket[];
  cancelledTickets?: CancelledTicket[];
  couriers: Courier[];
  depot: Depot | null;
  iotDevices: IotDevice[];
  referenceTime: string;
}) {
  const [ticketTab, setTicketTab] = useState<"active" | "cancelled">("active");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDepotMissingDialogOpen, setIsDepotMissingDialogOpen] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [deviceToDelete, setDeviceToDelete] = useState<IotDevice | null>(null);
  const [routeGenerated, setRouteGenerated] = useState(() =>
    tickets.some(
      (ticket) =>
        ticket.route_sequence !== null && ticket.route_sequence !== undefined,
    ),
  );
  const router = useRouter();

  const referenceTimestamp = Date.parse(referenceTime);
  const coordCount = tickets.filter(
    (ticket) =>
      ticket.user_addresses?.latitude !== null &&
      ticket.user_addresses?.latitude !== undefined &&
      ticket.user_addresses?.longitude !== null &&
      ticket.user_addresses?.longitude !== undefined,
  ).length;
  const routedTicketCount = tickets.filter(
    (ticket) =>
      ticket.route_sequence !== null && ticket.route_sequence !== undefined,
  ).length;

  const assignedCourierIds = new Set(
    iotDevices.flatMap((device) =>
      device.assignedCourierId ? [device.assignedCourierId] : [],
    ),
  );
  const couriersWithoutDevices = couriers.filter(
    (courier) => !assignedCourierIds.has(courier.id),
  );
  const onlineDevices = iotDevices.filter((device) => {
    if (!device.isOnline || !device.lastPing) return false;
    const pingTime = new Date(device.lastPing).getTime();
    return (
      Number.isFinite(referenceTimestamp) &&
      Number.isFinite(pingTime) &&
      pingTime >= referenceTimestamp - 5 * 60_000
    );
  });
  const readyCouriers = onlineDevices.filter(
    (device) => device.assignedCourierId,
  ).length;

  const pipeline = [
    {
      title: "Input Spasial",
      description: `${coordCount}/${tickets.length} titik valid`,
      complete: Boolean(depot) && coordCount > 0,
    },
    {
      title: "K-Means",
      description: `${couriers.length} cluster kurir`,
      complete: routeGenerated,
    },
    {
      title: "Nearest Neighbor",
      description: `${routedTicketCount} urutan dibuat`,
      complete: routeGenerated,
    },
    {
      title: "Visualisasi ORS",
      description: routeGenerated ? "Jalur jalan dipetakan" : "Menunggu rute",
      complete: routeGenerated,
    },
  ];

  const courierSelectOptions = [
    { value: "", label: "Belum Ditugaskan" },
    ...couriers.map((courier) => ({
      value: courier.id,
      label: courier.name,
    })),
  ];

  const handleAssign = async (ticketId: string, courierId: string) => {
    await assignCourier(ticketId, courierId);
    router.refresh();
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    const result = await generateOptimalRoutes();

    if (result?.error === "DEPOT_NOT_SET") {
      setIsDepotMissingDialogOpen(true);
    } else if (result?.error) {
      setFeedback({
        kind: "error",
        message: `Gagal membuat rute: ${result.error}`,
      });
    } else {
      setRouteGenerated(true);
      setFeedback({
        kind: "success",
        message: "Rute optimal berhasil dibuat dan didistribusikan.",
      });
      router.refresh();
    }

    setIsGenerating(false);
  };

  const runDeviceAction = async (
    actionKey: string,
    action: () => Promise<DeviceActionResult>,
  ) => {
    setPendingAction(actionKey);
    setFeedback(null);

    const result = await action();
    setFeedback({
      kind: result.success ? "success" : "error",
      message: result.message,
    });
    setPendingAction(null);
    router.refresh();

    return result;
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData();
    formData.set("deviceId", deviceId);
    const result = await runDeviceAction("register", () =>
      registerDevice(formData),
    );

    if (result.success) setDeviceId("");
  };

  const handleDeviceAssignment = async (
    currentDeviceId: string,
    courierId: string,
  ) => {
    await runDeviceAction(`assign:${currentDeviceId}`, () =>
      courierId
        ? assignDevice(currentDeviceId, courierId)
        : unassignDevice(currentDeviceId),
    );
  };

  const handleDeleteDevice = async () => {
    if (!deviceToDelete) return;

    const deletingId = deviceToDelete.id;
    const result = await runDeviceAction(`delete:${deletingId}`, () =>
      unregisterDevice(deletingId),
    );

    if (result.success) setDeviceToDelete(null);
  };

  const summaryCards = [
    {
      label: "Tiket Aktif",
      value: tickets.length,
      detail: `${coordCount} memiliki koordinat`,
      icon: MapPin,
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "Kurir",
      value: couriers.length,
      detail: `${readyCouriers} siap dengan IoT`,
      icon: Truck,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "Perangkat Online",
      value: `${onlineDevices.length}/${iotDevices.length}`,
      detail: "Ping dalam 5 menit",
      icon: Wifi,
      color: "bg-success/10 text-success",
    },
    {
      label: "Kesiapan Depot",
      value: depot ? "Siap" : "Belum",
      detail: depot ? "Titik awal tersedia" : "Lokasi belum diatur",
      icon: Warehouse,
      color: depot
        ? "bg-purple-50 text-purple-700"
        : "bg-warning/10 text-warning",
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-primary">
          <Zap size={15} aria-hidden="true" />
          Route Intelligence
        </div>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
          Operasional Armada &amp; Rute
        </h1>
        <p className="mt-2 font-medium text-gray-500">
          Kelola distribusi tiket, optimasi VRP, dan perangkat timbangan dalam satu alur.
        </p>
      </header>

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-start gap-3 rounded-2xl border p-4 text-sm font-bold ${
            feedback.kind === "success"
              ? "border-success/20 bg-success/10 text-success"
              : "border-error/20 bg-error/5 text-error"
          }`}
        >
          {feedback.kind === "success" ? (
            <CheckCircle2 size={19} className="shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle size={19} className="shrink-0" aria-hidden="true" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {cancelledTickets.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200/80 bg-rose-50/80 p-4 text-xs text-rose-900 animate-in fade-in duration-200">
          <XCircle size={18} className="mt-0.5 shrink-0 text-rose-600" aria-hidden="true" />
          <div className="flex-1">
            <strong className="block text-sm font-bold text-rose-900">
              Pemberitahuan: {cancelledTickets.length} Tiket Dibatalkan oleh Nasabah
            </strong>
            <p className="mt-0.5 text-rose-700 leading-relaxed">
              Tiket yang dibatalkan otomatis dikeluarkan dari antrean optimasi rute dan tugas kurir aktif. Anda dapat meninjau daftarnya pada tab &ldquo;Dibatalkan&rdquo;.
            </p>
          </div>
        </div>
      )}

      <section
        aria-label="Ringkasan operasional"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.label}
              className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-surface p-4 shadow-sm"
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.color}`}
              >
                <Icon size={21} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
                  {card.label}
                </p>
                <p className="mt-0.5 text-xl font-black text-gray-900">
                  {card.value}
                </p>
                <p className="truncate text-xs font-medium text-gray-500">
                  {card.detail}
                </p>
              </div>
            </article>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-3xl border border-gray-100 bg-surface shadow-sm">
        <div className="flex flex-col gap-2 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-extrabold text-gray-900">Peta Rute Penjemputan</h2>
            <p className="mt-0.5 text-xs font-medium text-gray-500">
              Warna membedakan armada dan angka menunjukkan urutan kunjungan.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {routeGenerated && (
              <span className="rounded-full bg-success/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-success">
                Rute Aktif
              </span>
            )}
            <span className="text-xs font-bold text-gray-400">
              {coordCount} titik terpetakan
            </span>
          </div>
        </div>
        <div className="h-[460px]">
          <RouteMap
            tickets={tickets}
            couriers={couriers}
            depot={depot}
            routeGenerated={routeGenerated}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        </div>
      </section>

      {/* <section
        aria-labelledby="vrp-pipeline-title"
        className="overflow-hidden rounded-3xl border border-gray-100 bg-gray-900 p-6 text-white shadow-sm lg:p-8"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-secondary">
              <Cpu size={16} aria-hidden="true" />
              Mesin Optimasi
            </div>
            <h2 id="vrp-pipeline-title" className="mt-2 text-xl font-extrabold">
              Bagaimana VRP menyusun rute
            </h2>
            <p className="mt-1 max-w-2xl text-sm font-medium leading-relaxed text-gray-400">
              Sistem mengubah titik penjemputan menjadi pembagian tugas dan urutan perjalanan
              yang siap divisualisasikan di jalan nyata.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-gray-300">
            {routedTicketCount}/{tickets.length} tiket sudah memiliki urutan
          </div>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-3 md:grid-cols-4">
          {pipeline.map((stage, index) => {
            const Icon = pipelineIcons[index];
            return (
              <div key={stage.title} className="relative">
                {index < pipeline.length - 1 && (
                  <div
                    className={`absolute left-[calc(50%+2rem)] top-7 hidden h-0.5 w-[calc(100%-4rem)] md:block ${
                      stage.complete ? "bg-success/70" : "bg-white/10"
                    }`}
                    aria-hidden="true"
                  />
                )}
                <div
                  className={`relative rounded-2xl border p-4 ${
                    stage.complete
                      ? "border-success/30 bg-success/10"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                        stage.complete
                          ? "bg-success text-white"
                          : "bg-white/10 text-gray-300"
                      }`}
                    >
                      <Icon size={21} aria-hidden="true" />
                    </div>
                    <span className="text-xs font-black text-gray-500">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-sm font-extrabold">{stage.title}</h3>
                  <p className="mt-1 text-xs font-medium text-gray-400">
                    {stage.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section> */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-surface shadow-sm xl:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 p-6">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">
                Daftar Tiket Penjemputan
              </h2>
              <p className="mt-1 text-xs font-medium text-gray-500">
                {ticketTab === "active"
                  ? "Assignment manual dipertahankan saat rute dihasilkan."
                  : "Daftar penjemputan yang dibatalkan nasabah dan dikeluarkan dari rute."}
              </p>
            </div>

            <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setTicketTab("active")}
                className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                  ticketTab === "active"
                    ? "bg-white text-primary shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Tiket Aktif ({tickets.length})
              </button>
              <button
                type="button"
                onClick={() => setTicketTab("cancelled")}
                className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                  ticketTab === "cancelled"
                    ? "bg-white text-error shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Dibatalkan ({cancelledTickets.length})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {ticketTab === "active" ? (
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
                          onChange={(courierId) =>
                            handleAssign(ticket.id, courierId)
                          }
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
                        {ticket.updated_at
                          ? new Date(ticket.updated_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
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

        <aside className="h-fit overflow-hidden rounded-3xl border border-gray-100 bg-surface shadow-sm xl:sticky xl:top-8">
          <div className="border-b border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/60 text-primary-dark">
                  <Cpu size={22} aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-extrabold text-gray-900">Armada &amp; IoT</h2>
                  <p className="text-xs font-medium text-gray-500">
                    {assignedCourierIds.size}/{couriers.length} kurir terpasang
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-extrabold text-gray-600">
                {iotDevices.length}
              </span>
            </div>

            <form onSubmit={handleRegister} className="mt-5 flex gap-2">
              <label className="min-w-0 flex-1">
                <span className="sr-only">ID timbangan baru</span>
                <input
                  value={deviceId}
                  onChange={(event) => setDeviceId(event.target.value)}
                  placeholder="Contoh: SCALE-001"
                  minLength={3}
                  maxLength={50}
                  pattern="[A-Za-z0-9_-]+"
                  required
                  disabled={pendingAction === "register"}
                  className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm font-bold uppercase text-gray-800 outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:bg-gray-50"
                />
              </label>
              <Button
                type="submit"
                disabled={pendingAction === "register"}
                loading={pendingAction === "register"}
                loadingLabel="Tambah"
                className="h-11 cursor-pointer items-center justify-center rounded-xl bg-primary px-4 font-bold text-white hover:bg-primary-dark focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus size={17} />
                Tambah
              </Button>
            </form>
          </div>

          <div className="max-h-[560px] space-y-3 overflow-y-auto p-4">
            {iotDevices.map((device) => {
              const isOnline = onlineDevices.some(
                (onlineDevice) => onlineDevice.id === device.id,
              );
              const assignedCourier = couriers.find(
                (courier) => courier.id === device.assignedCourierId,
              );
              const courierTicketCount = device.assignedCourierId
                ? tickets.filter(
                    (ticket) => ticket.courier_id === device.assignedCourierId,
                  ).length
                : 0;
              const assignmentPending =
                pendingAction === `assign:${device.id}`;

              return (
                <article
                  key={device.id}
                  className="rounded-2xl border border-gray-100 p-4 transition-colors hover:border-primary/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-mono text-sm font-extrabold text-gray-900">
                          {device.id}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                            isOnline
                              ? "bg-success/10 text-success"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {isOnline ? (
                            <Wifi size={10} aria-hidden="true" />
                          ) : (
                            <WifiOff size={10} aria-hidden="true" />
                          )}
                          {isOnline ? "Online" : "Offline"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-gray-400">
                        Ping {formatLastPing(device.lastPing, referenceTimestamp)}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Hapus perangkat ${device.id}`}
                      onClick={() => setDeviceToDelete(device)}
                      disabled={pendingAction !== null}
                      className="cursor-pointer rounded-lg p-2 text-gray-300 transition-colors hover:bg-error/10 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>

                  <div className="mt-4">
                    <label
                      htmlFor={`device-courier-${device.id}`}
                      className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-gray-400"
                    >
                      Kurir pembawa
                    </label>
                    <div className="relative">
                      <CustomSelect
                        id={`device-courier-${device.id}`}
                        value={device.assignedCourierId ?? ""}
                        onChange={(courierId) =>
                          handleDeviceAssignment(device.id, courierId)
                        }
                        disabled={pendingAction !== null}
                        options={courierSelectOptions}
                        placeholder="Pilih kurir pembawa..."
                        triggerClassName="h-10 text-xs sm:text-sm font-bold rounded-xl border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300"
                      />
                      {assignmentPending && (
                        <Loader2
                          size={15}
                          className="pointer-events-none absolute right-9 top-3 animate-spin text-primary z-10"
                        />
                      )}
                    </div>
                  </div>

                  {assignedCourier && (
                    <div className="mt-3 flex items-center justify-between rounded-xl bg-primary/5 px-3 py-2">
                      <span className="flex items-center gap-2 text-xs font-bold text-primary">
                        <UserRound size={14} aria-hidden="true" />
                        {assignedCourier.name}
                      </span>
                      <span className="text-[10px] font-extrabold text-gray-400">
                        {courierTicketCount} tiket
                      </span>
                    </div>
                  )}
                </article>
              );
            })}

            {iotDevices.length === 0 && (
              <div className="py-12 text-center">
                <Cpu size={36} className="mx-auto text-gray-200" />
                <p className="mt-3 font-bold text-gray-600">
                  Belum ada perangkat
                </p>
                <p className="mt-1 text-xs font-medium text-gray-400">
                  Daftarkan ID timbangan untuk memulai.
                </p>
              </div>
            )}
          </div>

          {couriersWithoutDevices.length > 0 && (
            <div className="border-t border-warning/20 bg-warning/5 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0 text-warning"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-xs font-extrabold text-gray-800">
                    {couriersWithoutDevices.length} kurir belum memiliki timbangan
                  </p>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-gray-500">
                    {couriersWithoutDevices
                      .slice(0, 3)
                      .map((courier) => courier.name)
                      .join(", ")}
                    {couriersWithoutDevices.length > 3 ? ", dan lainnya" : ""}
                  </p>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      <section
        aria-labelledby="vrp-pipeline-title"
        className="overflow-hidden rounded-3xl border border-gray-100 bg-gray-900 p-6 text-white shadow-sm lg:p-8"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-secondary">
              <Cpu size={16} aria-hidden="true" />
              Mesin Optimasi
            </div>
            <h2 id="vrp-pipeline-title" className="mt-2 text-xl font-extrabold">
              Bagaimana VRP menyusun rute
            </h2>
            <p className="mt-1 max-w-2xl text-sm font-medium leading-relaxed text-gray-400">
              Sistem mengubah titik penjemputan menjadi pembagian tugas dan urutan perjalanan
              yang siap divisualisasikan di jalan nyata.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-gray-300">
            {routedTicketCount}/{tickets.length} tiket sudah memiliki urutan
          </div>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-3 md:grid-cols-4">
          {pipeline.map((stage, index) => {
            const Icon = pipelineIcons[index];
            return (
              <div key={stage.title} className="relative">
                {index < pipeline.length - 1 && (
                  <div
                    className={`absolute left-[4.25rem] top-[2.375rem] hidden h-0.5 w-[calc(100%-3rem)] md:block ${
                      stage.complete ? "bg-success/70" : "bg-white/10"
                    }`}
                    aria-hidden="true"
                  />
                )}
                <div
                  className={`relative rounded-2xl border p-4 ${
                    stage.complete
                      ? "border-success/30 bg-success/10"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                        stage.complete
                          ? "bg-success text-white"
                          : "bg-white/10 text-gray-300"
                      }`}
                    >
                      <Icon size={21} aria-hidden="true" />
                    </div>
                    <span className="text-xs font-black text-gray-500">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 text-sm font-extrabold">{stage.title}</h3>
                  <p className="mt-1 text-xs font-medium text-gray-400">
                    {stage.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <CustomAlertDialog
        open={deviceToDelete !== null}
        title="Hapus perangkat IoT?"
        description={
          deviceToDelete
            ? `Perangkat ${deviceToDelete.id} akan dihapus dan tidak dapat lagi mengirim data sampai didaftarkan kembali.`
            : ""
        }
        confirmLabel="Hapus Perangkat"
        isLoading={
          deviceToDelete
            ? pendingAction === `delete:${deviceToDelete.id}`
            : false
        }
        onConfirm={handleDeleteDevice}
        onCancel={() => setDeviceToDelete(null)}
      />

      <CustomAlertDialog
        open={isDepotMissingDialogOpen}
        title="Gudang Belum Diatur"
        description="Lokasi gudang belum diatur di sistem. Buka Pengaturan Gudang agar algoritma optimasi VRP dapat menghitung rute kurir?"
        confirmLabel="Buka Pengaturan Gudang"
        cancelLabel="Nanti Saja"
        onConfirm={() => {
          setIsDepotMissingDialogOpen(false);
          router.push("/admin/settings/warehouse");
        }}
        onCancel={() => setIsDepotMissingDialogOpen(false)}
      />
    </div>
  );
}
