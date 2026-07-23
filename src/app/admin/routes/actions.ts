"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function assignCourier(ticketId: string, courierId: string) {
  const supabase = await createClient(await cookies());
  await supabase.from("tickets").update({ courier_id: courierId || null }).eq("id", ticketId);
  revalidatePath("/admin/routes");
}

export async function generateOptimalRoutes() {
  const supabase = await createClient(await cookies());
  
  // Algoritma simulasi sederhana: Mengurutkan rute berdasarkan urutan pembuatan tiket.
  // Idealnya ini akan memanggil API AI eksternal atau melakukan kalkulasi Haversine.
  
  const { data: tickets } = await supabase
    .from("tickets")
    .select("id, courier_id")
    .not("courier_id", "is", null)
    .order("created_at", { ascending: true });
    
  if (tickets) {
    const courierSequences: Record<string, number> = {};
    for (const ticket of tickets) {
       if (!ticket.courier_id) continue;
       
       if (!courierSequences[ticket.courier_id]) courierSequences[ticket.courier_id] = 1;
       
       await supabase
         .from("tickets")
         .update({ route_sequence: courierSequences[ticket.courier_id] })
         .eq("id", ticket.id);
         
       courierSequences[ticket.courier_id]++;
    }
  }
  
  revalidatePath("/admin/routes");
}
