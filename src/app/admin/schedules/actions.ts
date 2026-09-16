"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { invalidateCacheAndPath } from "@/lib/redis";
import { requireAdmin } from "@/lib/auth/authorization";
import { createAdminClient } from "@/utils/supabase/admin";

export async function addSchedule(formData: FormData) {
  const { supabase } = await requireAdmin();
  const day_of_week = parseInt(formData.get("day_of_week") as string, 10);
  const cut_off_time = formData.get("cut_off_time") as string;
  const is_active = formData.get("is_active") === "true";

  const { error } = await supabase.from("schedules").insert({ day_of_week, cut_off_time, is_active });
  if (error) {
    console.error("Supabase insert error:", error);
    if (error.code === '23505') {
      throw new Error("Jadwal untuk hari tersebut sudah ada.");
    }
    throw new Error(error.message);
  }
  await invalidateCacheAndPath('schedules:active', "/admin/schedules");
}

export async function updateSchedule(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = formData.get("id") as string;
  const day_of_week = parseInt(formData.get("day_of_week") as string, 10);
  const cut_off_time = formData.get("cut_off_time") as string;
  const is_active = formData.get("is_active") === "true";

  const { error } = await supabase.from("schedules").update({ day_of_week, cut_off_time, is_active }).eq("id", id);
  if (error) {
    console.error("Supabase update error:", error);
    if (error.code === '23505') {
      throw new Error("Jadwal untuk hari tersebut sudah ada.");
    }
    throw new Error(error.message);
  }
  await invalidateCacheAndPath('schedules:active', "/admin/schedules");
}

export async function deleteSchedule(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = formData.get("id") as string;

  await supabase.from("schedules").delete().eq("id", id);
  await invalidateCacheAndPath('schedules:active', "/admin/schedules");
}

const WarehouseOperatingHoursSchema = z.object({
  openTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format jam buka harus HH:mm (contoh 08:00)"),
  closeTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format jam tutup harus HH:mm (contoh 16:00)"),
  daysLabel: z.string().min(1, "Hari operasional wajib diisi"),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type WarehouseOperatingHoursInput = z.infer<typeof WarehouseOperatingHoursSchema>;

export async function saveWarehouseOperatingHours(payload: WarehouseOperatingHoursInput) {
  const { user } = await requireAdmin();
  const validData = WarehouseOperatingHoursSchema.parse(payload);

  const admin = createAdminClient();
  const { error } = await admin.from("app_settings").upsert({
    key: "warehouse_operating_hours",
    value: validData,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Failed to save warehouse operating hours:", error);
    throw new Error(`Gagal menyimpan jam operasional: ${error.message}`);
  }

  // Audit log
  await admin.from("audit_logs").insert({
    actor_id: user.id,
    action: "warehouse.operating_hours_updated",
    target_type: "app_setting",
    target_id: "warehouse_operating_hours",
    details: validData,
  });

  revalidatePath("/admin/schedules");
  revalidatePath("/booking");
  return { success: true };
}
