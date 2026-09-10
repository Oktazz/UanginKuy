"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { AlertCircle, CheckCircle2, MapPin, Truck, Warehouse, Wifi, XCircle, Zap } from "lucide-react";
import { CustomAlertDialog } from "@/components/ui/ConfirmDialog";
import { assignCourier, generateOptimalRoutes } from "./actions";
import { useIoTDevice } from "./hooks/useIoTDevice";
import { IoTPanel } from "./IoTPanel";
import { PipelineStages } from "./PipelineStages";
import { RouteSummary } from "./RouteSummary";
import { TicketTable } from "./TicketTable";
import type { CancelledTicket, Courier, Depot, Feedback, IotDevice, RouteTicket } from "./types";

const RouteMap = dynamic(() => import("./RouteMap"), { ssr: false });

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDepotMissingDialogOpen, setIsDepotMissingDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [routeGenerated, setRouteGenerated] = useState(() =>
    tickets.some(
      (ticket) =>
        ticket.route_sequence !== null && ticket.route_sequence !== undefined,
    ),
  );
  const router = useRouter();

  const {
    deviceId,
    setDeviceId,
    pendingAction,
    deviceToDelete,
    setDeviceToDelete,
    handleRegister,
    handleDeviceAssignment,
    handleDeleteDevice,
  } = useIoTDevice({ router, onFeedback: setFeedback });

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

      <RouteSummary cards={summaryCards} />

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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <TicketTable
          tickets={tickets}
          cancelledTickets={cancelledTickets}
          couriers={couriers}
          onAssign={handleAssign}
        />

        <IoTPanel
          iotDevices={iotDevices}
          couriers={couriers}
          tickets={tickets}
          courierSelectOptions={courierSelectOptions}
          onlineDevices={onlineDevices}
          assignedCourierIds={assignedCourierIds}
          referenceTimestamp={referenceTimestamp}
          pendingAction={pendingAction}
          deviceId={deviceId}
          onDeviceIdChange={setDeviceId}
          onRegister={handleRegister}
          onDeviceAssignment={handleDeviceAssignment}
          onRequestDelete={setDeviceToDelete}
        />
      </div>

      <PipelineStages
        pipeline={pipeline}
        routedCount={routedTicketCount}
        totalCount={tickets.length}
      />

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