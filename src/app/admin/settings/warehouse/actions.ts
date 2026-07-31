"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth/authorization";
import { createAdminClient } from "@/utils/supabase/admin";

const WarehouseLocationSchema = z.object({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
});

export async function saveWarehouseLocation(lat: number, lon: number) {
  const { supabase, user } = await requireSuperAdmin();
  const location = WarehouseLocationSchema.parse({
    latitude: lat,
    longitude: lon,
  });
  const payload = {
    ...location,
    address: "Gudang Utama UanginKuy",
  };
  
  const { error } = await supabase.from("app_settings").upsert({
    key: "warehouse_location",
    value: payload,
    updated_at: new Date().toISOString()
  });

  if (error) {
    console.error("Failed to save warehouse location:", error);
    throw new Error(error.message);
  }

  const admin = createAdminClient();
  const { error: auditError } = await admin.from("audit_logs").insert({
    actor_id: user.id,
    action: "warehouse.location_updated",
    target_type: "app_setting",
    target_id: "warehouse_location",
    details: location,
  });

  if (auditError) {
    console.error("Failed to record warehouse audit log:", auditError);
    throw new Error("Lokasi tersimpan, tetapi audit log gagal dicatat.");
  }
  
  revalidatePath("/admin/settings/warehouse");
  revalidatePath("/admin/routes");
}
