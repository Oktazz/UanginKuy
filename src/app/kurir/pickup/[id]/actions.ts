"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function completePickup(
  ticketId: string, 
  categoryId: number, 
  weight: number, 
  subtotal: number, 
  priceApplied: number
) {
  const supabase = await createClient(await cookies());

  // Check if ticket exists
  const { data: ticket, error: tErr } = await supabase
    .from("tickets")
    .select("id, client_id, status")
    .eq("id", ticketId)
    .single();
    
  if (tErr || !ticket) throw new Error("Ticket not found");
  if (ticket.status === 'completed') throw new Error("Ticket is already completed");

  // Insert transaction_details
  const { error: tdErr } = await supabase.from("transaction_details").insert({
    ticket_id: ticketId,
    waste_category_id: categoryId,
    weight,
    subtotal,
    price_applied: priceApplied
  });
  if (tdErr) throw tdErr;

  // Update ticket status
  const { error: tsErr } = await supabase.from("tickets").update({ status: "completed" }).eq("id", ticketId);
  if (tsErr) throw tsErr;

  // Add balance to profile
  const { data: profile } = await supabase.from("profiles").select("balance").eq("id", ticket.client_id).single();
  const newBalance = (profile?.balance || 0) + subtotal;
  const { error: pbErr } = await supabase.from("profiles").update({ balance: newBalance }).eq("id", ticket.client_id);
  if (pbErr) throw pbErr;
  
  revalidatePath("/kurir/dashboard");
  revalidatePath("/(nasabah)/dashboard");
}

export async function getTicketDebug(ticketId: string) {
  const supabase = await createClient(await cookies());
  const res = await supabase.from("tickets").select("*, profiles!client_id(name, address)").eq("id", ticketId).single();
  console.log("=== SERVER SIDE TICKET FETCH ===");
  console.dir(res, { depth: null });
  return res.data;
}
