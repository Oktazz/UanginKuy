"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { kMeansClustering, solveTSPNearestNeighbor, VrpPoint } from "@/utils/vrp";

export async function assignCourier(ticketId: string, courierId: string) {
  const supabase = await createClient(await cookies());
  await supabase.from("tickets").update({ courier_id: courierId || null }).eq("id", ticketId);
  revalidatePath("/admin/routes");
}

export async function generateOptimalRoutes() {
  const supabase = await createClient(await cookies());
  
  // 1. Ambil pengaturan depot (gudang) dari tabel app_settings
  const { data: depotSetting } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "warehouse_location")
    .single();

  if (!depotSetting || !depotSetting.value || typeof (depotSetting.value as any).latitude !== "number") {
    // Kembalikan error code khusus jika gudang belum diatur
    return { error: "DEPOT_NOT_SET" };
  }

  const depotCoordinate: VrpPoint = {
    id: "DEPOT",
    latitude: (depotSetting.value as any).latitude,
    longitude: (depotSetting.value as any).longitude,
  };

  // 2. Ambil semua tiket yang berstatus 'pending' atau 'scheduled' (yang sedang aktif)
  const { data: rawTickets, error: ticketError } = await supabase
    .from("tickets")
    .select("id, courier_id, latitude, longitude, status")
    .in("status", ["pending", "scheduled"]);
    
  if (ticketError || !rawTickets) {
    console.error("Gagal mengambil tiket:", ticketError);
    return { error: "DB_ERROR" };
  }

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
