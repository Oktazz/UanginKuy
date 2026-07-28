"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function saveWarehouseLocation(lat: number, lon: number) {
  const supabase = await createClient(await cookies());
  const payload = { latitude: lat, longitude: lon, address: "Gudang Utama UanginKuy" };
  
  const { error } = await supabase.from("app_settings").upsert({
    key: "warehouse_location",
    value: payload,
    updated_at: new Date().toISOString()
  });

  if (error) {
    console.error("Failed to save warehouse location:", error);
    throw new Error(error.message);
  }
  
  revalidatePath("/admin/settings/warehouse");
  revalidatePath("/admin/routes");
}
