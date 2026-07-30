import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import RouteClient from "./RouteClient";

export default async function RoutesPage() {
  const supabase = await createClient(await cookies());

  // Get active tickets (pending or scheduled)
  const { data: tickets } = await supabase
    .from("tickets")
    .select(`
      *,
      user_addresses!address_id (recipient_name, full_address, latitude, longitude)
    `)
    .in("status", ["pending", "scheduled"])
    .order("created_at", { ascending: false });

  // Get depot/warehouse location for map center
  const { data: depotSetting } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "warehouse_location")
    .single();

  // Get available couriers
  const { data: couriers } = await supabase
    .from("profiles")
    .select("id, name")
    .eq("role", "kurir");

  return (
    <div className="animate-in fade-in duration-500">
      <RouteClient 
        tickets={tickets || []} 
        couriers={couriers || []}
        depot={(depotSetting?.value as any) ?? null}
      />
    </div>
  );
}
