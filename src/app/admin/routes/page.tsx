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
      profiles:client_id (name, address)
    `)
    .in("status", ["pending", "scheduled"])
    .order("created_at", { ascending: false });

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
      />
    </div>
  );
}
