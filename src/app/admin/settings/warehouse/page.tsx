import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import WarehouseClient from "./WarehouseClient";

export default async function WarehouseSettingsPage() {
  const supabase = await createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") redirect("/admin/dashboard");

  const { data } = await supabase.from("app_settings").select("value").eq("key", "warehouse_location").single();
  
  const lat = data?.value?.latitude || null;
  const lon = data?.value?.longitude || null;
  
  return (
    <div className="min-h-[calc(100vh-8rem)]">
      <WarehouseClient initialLat={lat} initialLon={lon} />
    </div>
  );
}
