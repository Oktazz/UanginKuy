import {
  AlertCircle,
  Cpu,
  Loader2,
  Plus,
  Trash2,
  UserRound,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import type { CustomSelectOption } from "@/components/ui/CustomSelect";
import type { Courier, IotDevice, RouteTicket } from "./types";

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

interface IoTPanelProps {
  iotDevices: IotDevice[];
  couriers: Courier[];
  tickets: RouteTicket[];
  courierSelectOptions: CustomSelectOption[];
  onlineDevices: IotDevice[];
  assignedCourierIds: Set<string>;
  referenceTimestamp: number;
  pendingAction: string | null;
  deviceId: string;
  onDeviceIdChange: (value: string) => void;
  onRegister: (event: React.FormEvent<HTMLFormElement>) => void;
  onDeviceAssignment: (deviceId: string, courierId: string) => void;
  onRequestDelete: (device: IotDevice) => void;
}

export function IoTPanel({
  iotDevices,
  couriers,
  tickets,
  courierSelectOptions,
  onlineDevices,
  assignedCourierIds,
  referenceTimestamp,
  pendingAction,
  deviceId,
  onDeviceIdChange,
  onRegister,
  onDeviceAssignment,
  onRequestDelete,
}: IoTPanelProps) {
  const couriersWithoutDevices = couriers.filter(
    (courier) => !assignedCourierIds.has(courier.id),
  );

  return (
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

        <form onSubmit={onRegister} className="mt-5 flex gap-2">
          <label className="min-w-0 flex-1">
            <span className="sr-only">ID timbangan baru</span>
            <input
              value={deviceId}
              onChange={(event) => onDeviceIdChange(event.target.value)}
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
          const assignmentPending = pendingAction === `assign:${device.id}`;

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
                  onClick={() => onRequestDelete(device)}
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
                      onDeviceAssignment(device.id, courierId)
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
  );
}