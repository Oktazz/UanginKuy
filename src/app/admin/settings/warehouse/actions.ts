"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth/authorization";
import { createAdminClient } from "@/utils/supabase/admin";

const WarehouseLocationSchema = z.object({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  name: z.string().min(1, "Nama gudang wajib diisi"),
  address: z.string().min(1, "Alamat gudang wajib diisi"),
  phone: z.string().optional(),
});

export type WarehouseLocationInput = z.infer<typeof WarehouseLocationSchema>;

export async function saveWarehouseLocation(data: WarehouseLocationInput) {
  const { supabase, user } = await requireSuperAdmin();
  const location = WarehouseLocationSchema.parse(data);

  const { error } = await supabase.from("app_settings").upsert({
    key: "warehouse_location",
    value: location,
    updated_at: new Date().toISOString(),
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
  }

  revalidatePath("/admin/settings/warehouse");
  revalidatePath("/admin/routes");
  revalidatePath("/booking");
  revalidatePath("/admin/counter");
  return { success: true };
}
