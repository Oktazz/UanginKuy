import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Semua fungsi di sini dieksekusi SERVER-SIDE.
 * userId selalu diambil dari session Supabase yang telah diverifikasi di route handler.
 * Nasabah tidak dapat memalsukan userId karena tidak ada input userId dari client.
 *
 * Setiap fungsi membatasi jumlah data yang dikembalikan (token optimization).
 */

// ─── 1. getUserBalance ────────────────────────────────────────────────────────

export async function getUserBalance(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("name, balance")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return { error: "Gagal mengambil data saldo." };
  }

  return {
    name: data.name,
    balance: data.balance,
    balance_formatted: new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(data.balance ?? 0),
  };
}

// ─── 2. getLatestTicket ───────────────────────────────────────────────────────

export async function getLatestTicket(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("tickets")
    .select(
      `
      id,
      short_id,
      status,
      pickup_date,
      pickup_address,
      created_at,
      schedules ( day_of_week, cut_off_time ),
      profiles!courier_id ( name )
    `
    )
    .eq("client_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { error: "Gagal mengambil tiket terbaru." };
  }

  if (!data) {
    return { message: "Nasabah belum memiliki tiket pickup." };
  }

  const statusLabel: Record<string, string> = {
    pending: "Menunggu konfirmasi",
    confirmed: "Dikonfirmasi, kurir akan datang",
    in_progress: "Kurir sedang dalam perjalanan",
    completed: "Selesai",
    cancelled: "Dibatalkan",
  };

  return {
    short_id: data.short_id,
    status: data.status,
    status_label: statusLabel[data.status] ?? data.status,
    pickup_date: data.pickup_date,
    pickup_address: data.pickup_address,
    schedule: (data.schedules as any)
      ? {
          day_of_week: (data.schedules as any).day_of_week,
          cut_off_time: (data.schedules as any).cut_off_time,
        }
      : null,
    courier_name: (data as any).profiles?.name ?? "Belum ditugaskan",
  };
}

// ─── 3. getTicketHistory ──────────────────────────────────────────────────────

export async function getTicketHistory(
  supabase: SupabaseClient,
  userId: string,
  limit = 5
) {
  // Clamp limit: minimal 1, maksimal 10 (token optimization)
  const safeLimit = Math.min(Math.max(limit, 1), 10);

  const { data, error } = await supabase
    .from("tickets")
    .select(
      `
      short_id,
      status,
      pickup_date,
      created_at
    `
    )
    .eq("client_id", userId)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    return { error: "Gagal mengambil riwayat tiket." };
  }

  const total = data?.length ?? 0;
  const completed = data?.filter((t) => t.status === "completed").length ?? 0;

  return {
    total_fetched: total,
    completed_count: completed,
    tickets: data?.map((t) => ({
      short_id: t.short_id,
      status: t.status,
      pickup_date: t.pickup_date,
    })),
  };
}

// ─── 4. getWasteSummary ───────────────────────────────────────────────────────

export async function getWasteSummary(supabase: SupabaseClient, userId: string) {
  // Batasi ke 50 transaksi terbaru dari tiket yang completed (token optimization)
  const { data, error } = await supabase
    .from("transaction_details")
    .select(
      `
      weight,
      subtotal,
      waste_categories ( name ),
      tickets!inner ( client_id, status )
    `
    )
    .eq("tickets.client_id", userId)
    .eq("tickets.status", "completed")
    .limit(50);

  if (error) {
    return { error: "Gagal mengambil ringkasan sampah." };
  }

  if (!data || data.length === 0) {
    return { message: "Belum ada data transaksi sampah yang selesai." };
  }

  // Agregasi per kategori
  const categoryMap: Record<string, { weight: number; subtotal: number }> = {};
  let totalWeight = 0;
  let totalValue = 0;

  for (const tx of data) {
    const catName = (tx.waste_categories as any)?.name ?? "Lainnya";
    if (!categoryMap[catName]) {
      categoryMap[catName] = { weight: 0, subtotal: 0 };
    }
    const w = Number(tx.weight) || 0;
    const s = Number(tx.subtotal) || 0;
    categoryMap[catName].weight += w;
    categoryMap[catName].subtotal += s;
    totalWeight += w;
    totalValue += s;
  }

  const categories = Object.entries(categoryMap).map(([name, data]) => ({
    category: name,
    total_weight_kg: parseFloat(data.weight.toFixed(2)),
    total_value_idr: data.subtotal,
  }));

  return {
    total_weight_kg: parseFloat(totalWeight.toFixed(2)),
    total_value_idr: totalValue,
    total_value_formatted: new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(totalValue),
    categories,
  };
}

// ─── 5. getPickupSchedule ─────────────────────────────────────────────────────

export async function getPickupSchedule(supabase: SupabaseClient) {
  // Ambil jadwal aktif (berdasarkan hari dalam seminggu)
  const { data, error } = await supabase
    .from("schedules")
    .select("id, day_of_week, cut_off_time, is_active")
    .eq("is_active", true)
    .order("day_of_week", { ascending: true })
    .limit(10);

  if (error) {
    return { error: "Gagal mengambil jadwal pickup." };
  }

  if (!data || data.length === 0) {
    return { message: "Tidak ada jadwal pickup tersedia dalam 7 hari ke depan." };
  }

  const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

  return {
    total_schedules: data.length,
    schedules: data.map((s) => ({
      hari: hari[s.day_of_week as number] ?? "Tidak diketahui",
      batas_waktu_booking: s.cut_off_time,
    })),
  };
}
