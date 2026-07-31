import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import RouteClient from "./RouteClient";
import type { Courier, Depot, IotDevice, RouteTicket } from "./types";

type FleetPayload = {
  generatedAt: string;
  devices: IotDevice[];
};

function parseFleetPayload(value: unknown): FleetPayload {
  if (!value || typeof value !== "object") {
    return { generatedAt: "", devices: [] };
  }

  const payload = value as Record<string, unknown>;
  const devices = Array.isArray(payload.devices)
    ? payload.devices.map((item) => {
        const device = item as Record<string, unknown>;
        return {
          id: String(device.id ?? ""),
          assignedCourierId: device.assignedCourierId
            ? String(device.assignedCourierId)
            : null,
          isOnline: device.isOnline === true,
          lastPing: device.lastPing ? String(device.lastPing) : null,
        };
      })
    : [];

  return {
    generatedAt: String(payload.generatedAt ?? ""),
    devices,
  };
}

function parseRouteTickets(value: unknown): RouteTicket[] {
  if (!Array.isArray(value)) return [];

  return value.map((item) => {
    const ticket = item as Record<string, unknown>;
    const relation = Array.isArray(ticket.user_addresses)
      ? ticket.user_addresses[0]
      : ticket.user_addresses;
    const address =
      relation && typeof relation === "object"
        ? (relation as Record<string, unknown>)
        : null;

    return {
      id: String(ticket.id ?? ""),
      courier_id: ticket.courier_id ? String(ticket.courier_id) : null,
      route_sequence:
        typeof ticket.route_sequence === "number"
          ? ticket.route_sequence
          : null,
      status: String(ticket.status ?? "pending"),
      user_addresses: address
        ? {
            recipient_name: String(address.recipient_name ?? ""),
            full_address: String(address.full_address ?? ""),
            latitude:
              typeof address.latitude === "number" ? address.latitude : null,
            longitude:
              typeof address.longitude === "number" ? address.longitude : null,
          }
        : null,
    };
  });
}

export default async function RoutesPage() {
  const supabase = await createClient(await cookies());

  const [ticketsResult, depotResult, couriersResult, fleetResult] =
    await Promise.all([
      supabase
        .from("tickets")
        .select(`
          id,
          courier_id,
          route_sequence,
          status,
          user_addresses!address_id (
            recipient_name,
            full_address,
            latitude,
            longitude
          )
        `)
        .in("status", ["pending", "scheduled"])
        .order("created_at", { ascending: false }),
      supabase
        .from("app_settings")
        .select("value")
        .eq("key", "warehouse_location")
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("id, name")
        .eq("role", "kurir")
        .order("name"),
      supabase.rpc("get_admin_iot_fleet"),
    ]);

  if (ticketsResult.error) {
    throw new Error(`Gagal memuat tiket aktif: ${ticketsResult.error.message}`);
  }
  if (depotResult.error) {
    throw new Error(`Gagal memuat lokasi depot: ${depotResult.error.message}`);
  }
  if (couriersResult.error) {
    throw new Error(`Gagal memuat data kurir: ${couriersResult.error.message}`);
  }
  if (fleetResult.error) {
    throw new Error(
      `Gagal memuat perangkat IoT: ${fleetResult.error.message}. Pastikan migration assignment IoT sudah diterapkan.`,
    );
  }

  const fleet = parseFleetPayload(fleetResult.data);

  return (
    <div className="animate-in fade-in duration-500 motion-reduce:animate-none">
      <RouteClient
        tickets={parseRouteTickets(ticketsResult.data)}
        couriers={(couriersResult.data ?? []) as Courier[]}
        depot={(depotResult.data?.value as unknown as Depot | null) ?? null}
        iotDevices={fleet.devices}
        referenceTime={fleet.generatedAt}
      />
    </div>
  );
}
