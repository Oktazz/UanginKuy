"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/authorization";
import { createAdminClient } from "@/utils/supabase/admin";
import { kMeansClustering, solveTSPNearestNeighbor, VrpPoint } from "@/utils/vrp";

const DeviceIdSchema = z
  .string()
  .trim()
  .min(3, "ID perangkat minimal 3 karakter.")
  .max(50, "ID perangkat maksimal 50 karakter.")
  .regex(
    /^[A-Za-z0-9_-]+$/,
    "ID perangkat hanya boleh berisi huruf, angka, tanda hubung, atau underscore.",
  );

const CourierIdSchema = z.string().uuid("ID kurir tidak valid.");

export type DeviceActionResult = {
  success: boolean;
  message: string;
};

type RouteTicketRecord = {
  id: string;
  courier_id: string | null;
  status: string;
  user_addresses:
    | { latitude: number | null; longitude: number | null }
    | Array<{ latitude: number | null; longitude: number | null }>
    | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function revalidateDeviceViews() {
  revalidatePath("/admin/routes");
  revalidatePath("/admin/dashboard");
}

async function recordDeviceAudit(
  actorId: string,
  action: string,
  targetId: string,
  details: Record<string, string | null>,
) {
  const admin = createAdminClient();
  const { error } = await admin.from("audit_logs").insert({
    actor_id: actorId,
    action,
    target_type: "iot_device",
    target_id: targetId,
    details,
  });

  if (error) {
    console.error("Failed to record IoT device audit:", error);
    throw new Error("Perubahan tersimpan, tetapi audit log gagal dicatat.");
  }
}

function actionError(error: unknown, fallback: string): DeviceActionResult {
  console.error(fallback, error);

  if (error instanceof Error) {
    return { success: false, message: error.message };
  }

  return { success: false, message: fallback };
}

export async function registerDevice(
  formData: FormData,
): Promise<DeviceActionResult> {
  const parsed = DeviceIdSchema.safeParse(formData.get("deviceId"));
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "ID perangkat tidak valid.",
    };
  }

  try {
    const { supabase, user } = await requireAdmin();

    // Rate limiting for device registration
    const rateKey = `iot:device:register:${user.id}`;
    const { redis } = await import("@/lib/redis");
    const count = await redis.incr(rateKey);
    if (count === 1) await redis.expire(rateKey, 60); // 1 minute window
    if (count > 10) {
      return { success: false, message: "Terlalu banyak permintaan registrasi perangkat. Silakan coba lagi nanti." };
    }
    const deviceId = parsed.data;
    const { error } = await supabase.from("iot_devices").insert({
      id: deviceId,
      assigned_courier_id: null,
      is_online: false,
      last_ping: null,
    });

    if (error?.code === "23505") {
      return { success: false, message: "ID perangkat sudah terdaftar." };
    }
    if (error) throw error;

    await recordDeviceAudit(user.id, "iot_device.registered", deviceId, {
      deviceId,
    });
    revalidateDeviceViews();

    return {
      success: true,
      message: `Perangkat ${deviceId} berhasil didaftarkan.`,
    };
  } catch (error) {
    return actionError(error, "Gagal mendaftarkan perangkat.");
  }
}

export async function assignDevice(
  deviceIdInput: string,
  courierIdInput: string,
): Promise<DeviceActionResult> {
  const deviceId = DeviceIdSchema.safeParse(deviceIdInput);
  const courierId = CourierIdSchema.safeParse(courierIdInput);

  if (!deviceId.success || !courierId.success) {
    return { success: false, message: "Data assignment perangkat tidak valid." };
  }

  try {
    const { supabase, user } = await requireAdmin();
    const [{ data: targetDevice }, { data: replacedDevice }] =
      await Promise.all([
        supabase
          .from("iot_devices")
          .select("assigned_courier_id")
          .eq("id", deviceId.data)
          .single(),
        supabase
          .from("iot_devices")
          .select("id")
          .eq("assigned_courier_id", courierId.data)
          .neq("id", deviceId.data)
          .maybeSingle(),
      ]);

    const { error } = await supabase.rpc("assign_iot_device", {
      p_device_id: deviceId.data,
      p_courier_id: courierId.data,
    });

    if (error) throw error;

    if (replacedDevice) {
      await recordDeviceAudit(
        user.id,
        "iot_device.unassigned",
        replacedDevice.id,
        {
          previousCourierId: courierId.data,
          replacedByDeviceId: deviceId.data,
        },
      );
    }

    if (
      targetDevice?.assigned_courier_id &&
      targetDevice.assigned_courier_id !== courierId.data
    ) {
      await recordDeviceAudit(
        user.id,
        "iot_device.unassigned",
        deviceId.data,
        {
          previousCourierId: targetDevice.assigned_courier_id,
          reason: "reassigned_to_another_courier",
        },
      );
    }

    await recordDeviceAudit(
      user.id,
      "iot_device.assigned",
      deviceId.data,
      {
        courierId: courierId.data,
        previousCourierId: targetDevice?.assigned_courier_id ?? null,
        replacedDeviceId: replacedDevice?.id ?? null,
      },
    );

    revalidateDeviceViews();

    return {
      success: true,
      message: "Perangkat berhasil ditugaskan kepada kurir.",
    };
  } catch (error) {
    return actionError(error, "Gagal menugaskan perangkat.");
  }
}

export async function unassignDevice(
  deviceIdInput: string,
): Promise<DeviceActionResult> {
  const deviceId = DeviceIdSchema.safeParse(deviceIdInput);
  if (!deviceId.success) {
    return { success: false, message: "ID perangkat tidak valid." };
  }

  try {
    const { supabase, user } = await requireAdmin();
    const { data: device, error: deviceError } = await supabase
      .from("iot_devices")
      .select("assigned_courier_id")
      .eq("id", deviceId.data)
      .single();

    if (deviceError || !device) throw new Error("Perangkat tidak ditemukan.");

    const { error } = await supabase
      .from("iot_devices")
      .update({ assigned_courier_id: null })
      .eq("id", deviceId.data);

    if (error) throw error;

    await recordDeviceAudit(
      user.id,
      "iot_device.unassigned",
      deviceId.data,
      {
        previousCourierId: device.assigned_courier_id,
      },
    );
    revalidateDeviceViews();

    return { success: true, message: "Assignment perangkat berhasil dilepas." };
  } catch (error) {
    return actionError(error, "Gagal melepas assignment perangkat.");
  }
}

export async function unregisterDevice(
  deviceIdInput: string,
): Promise<DeviceActionResult> {
  const deviceId = DeviceIdSchema.safeParse(deviceIdInput);
  if (!deviceId.success) {
    return { success: false, message: "ID perangkat tidak valid." };
  }

  try {
    const { supabase, user } = await requireAdmin();
    const { data: device, error: deviceError } = await supabase
      .from("iot_devices")
      .select("assigned_courier_id")
      .eq("id", deviceId.data)
      .single();

    if (deviceError || !device) throw new Error("Perangkat tidak ditemukan.");

    const { error } = await supabase
      .from("iot_devices")
      .delete()
      .eq("id", deviceId.data);

    if (error) throw error;

    await recordDeviceAudit(
      user.id,
      "iot_device.unregistered",
      deviceId.data,
      {
        previousCourierId: device.assigned_courier_id,
      },
    );
    revalidateDeviceViews();

    return {
      success: true,
      message: `Perangkat ${deviceId.data} berhasil dihapus.`,
    };
  } catch (error) {
    return actionError(error, "Gagal menghapus perangkat.");
  }
}

export async function assignCourier(ticketId: string, courierId: string) {
  const supabase = await createClient(await cookies());
  await supabase.from("tickets").update({ courier_id: courierId || null }).eq("id", ticketId);
  revalidatePath("/admin/routes");
}

export async function generateOptimalRoutes() {
  const supabase = await createClient(await cookies());
  
  // Early return if no tickets need routing
  const { count: totalTickets } = await supabase
    .from("tickets")
    .select("*", { count: "exact", head: true })
    .in("status", ["pending", "scheduled"]);
  
  if (totalTickets === 0) {
    revalidatePath("/admin/routes");
    return { success: true, message: "Tidak ada tiket aktif untuk dioptimalkan." };
  }
  
  // 1. Ambil pengaturan depot (gudang) dari tabel app_settings
  const { data: depotSetting } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "warehouse_location")
    .single();

  if (
    !depotSetting ||
    !isRecord(depotSetting.value) ||
    typeof depotSetting.value.latitude !== "number" ||
    typeof depotSetting.value.longitude !== "number"
  ) {
    // Kembalikan error code khusus jika gudang belum diatur
    return { error: "DEPOT_NOT_SET" };
  }

  const depotCoordinate: VrpPoint = {
    id: "DEPOT",
    latitude: depotSetting.value.latitude,
    longitude: depotSetting.value.longitude,
  };

  // 2. Ambil semua tiket yang berstatus 'pending' atau 'scheduled' (yang sedang aktif)
  const { data: rawTicketsData, error: ticketError } = await supabase
    .from("tickets")
    .select(`
      id, 
      courier_id, 
      status,
      user_addresses!address_id (latitude, longitude)
    `)
    .in("status", ["pending", "scheduled"]);
    
  if (ticketError || !rawTicketsData) {
    console.error("Gagal mengambil tiket:", ticketError);
    return { error: "DB_ERROR" };
  }

  const rawTickets = rawTicketsData.map((ticketData) => {
    const ticket = ticketData as unknown as RouteTicketRecord;
    const address = Array.isArray(ticket.user_addresses)
      ? ticket.user_addresses[0]
      : ticket.user_addresses;

    return {
      id: ticket.id,
      courier_id: ticket.courier_id,
      status: ticket.status,
      latitude: address?.latitude,
      longitude: address?.longitude,
    };
  });

  // 3. Filter tiket yang tidak memiliki koordinat (Edge Case)
  const validTickets = rawTickets.filter(
    (t) => typeof t.latitude === "number" && typeof t.longitude === "number"
  ) as VrpPoint[];

  // 4. Ambil daftar kurir aktif
  const { data: couriers, error: courierError } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "kurir");

  if (courierError || !couriers || couriers.length === 0) {
    console.error("Kurir tidak ditemukan atau terjadi error:", courierError);
    return { error: "NO_COURIERS" };
  }

  const courierIds = couriers.map((c) => c.id);

  // 5. Pisahkan tiket yang sudah di-assign secara manual vs yang masih kosong
  const assignedTickets = validTickets.filter((t) => t.courier_id !== null && t.courier_id !== undefined);
  const unassignedTickets = validTickets.filter((t) => !t.courier_id);

  // 6. Jalankan K-Means Clustering HANYA untuk tiket yang unassigned
  let newlyAssignedClusters: Record<string, VrpPoint[]> = {};
  if (unassignedTickets.length > 0) {
    newlyAssignedClusters = kMeansClustering(unassignedTickets, courierIds, depotCoordinate);
  }

  // 6. Gabungkan kembali tiket berdasarkan kurir
  const courierTicketGroups: Record<string, VrpPoint[]> = {};
  for (const cid of courierIds) {
    courierTicketGroups[cid] = [];
    
    // Masukkan tiket yang sudah manual di-assign ke kurir ini
    const manualAssigned = assignedTickets.filter(t => t.courier_id === cid);
    courierTicketGroups[cid].push(...manualAssigned);
    
    // Masukkan tiket hasil clustering
    if (newlyAssignedClusters[cid]) {
      // Pastikan di-update property courier_id nya
      const clustered = newlyAssignedClusters[cid].map(t => ({ ...t, courier_id: cid }));
      courierTicketGroups[cid].push(...clustered);
    }
  }

  // 7. Jalankan TSP per Kurir dimulai dari DEPOT
  const updates: { id: string; courier_id: string; route_sequence: number; status: string }[] = [];

  for (const cid of courierIds) {
    const pointsToRoute = courierTicketGroups[cid];
    if (pointsToRoute.length === 0) continue;

    // Hitung rute terpendek dengan Nearest Neighbor
    const optimalRoute = solveTSPNearestNeighbor(depotCoordinate, pointsToRoute);

    // Simpan urutan hasil optimasi
    optimalRoute.forEach((point, index) => {
      updates.push({
        id: point.id,
        courier_id: cid,
        route_sequence: index + 1, // urutan mulai dari 1
        status: "scheduled",       // ubah status menjadi scheduled
      });
    });
  }

  // 8. Bulk Update ke database
  // Supabase saat ini tidak mendukung bulk update via API dengan mudah selain loop atau rpc.
  // Karena ini Node.js, kita bisa gunakan Promise.all (dengan asumsi jumlah wajar < 100).
  if (updates.length > 0) {
    await Promise.all(
      updates.map((upd) =>
        supabase
          .from("tickets")
          .update({
            courier_id: upd.courier_id,
            route_sequence: upd.route_sequence,
            status: upd.status,
          })
          .eq("id", upd.id)
      )
    );
  }

  revalidatePath("/admin/routes");
}
