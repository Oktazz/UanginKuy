import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import WarehouseClient from "./WarehouseClient";

export default async function WarehouseSettingsPage() {
  const supabase = await createClient(await cookies());
  const { data } = await supabase.from("app_settings").select("value").eq("key", "warehouse_location").single();
  
  const lat = data?.value?.latitude || null;
  const lon = data?.value?.longitude || null;
  
  return (
    <div className="min-h-[calc(100vh-8rem)]">
      <WarehouseClient initialLat={lat} initialLon={lon} />
    </div>
  );
}
