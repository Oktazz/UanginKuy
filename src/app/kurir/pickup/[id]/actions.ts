"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export interface PickupItem {
  categoryId: number;
  weight: number;
  subtotal: number;
  priceApplied: number;
}

export async function completePickup(
  ticketId: string, 
  items: PickupItem[],
  totalAmount: number
) {
  const supabase = await createClient(await cookies());

  // Check if ticket exists
  let query = supabase.from("tickets").select("id, client_id, status");
  if (ticketId.length === 8) {
    query = query.eq("short_id", ticketId.toUpperCase());
  } else {
    query = query.eq("id", ticketId);
  }
  const { data: ticket, error: tErr } = await query.single();
    
  if (tErr || !ticket) throw new Error("Ticket not found");
  if (ticket.status === 'completed') throw new Error("Ticket is already completed");

  // Format data for bulk insert
  const transactionDetailsData = items.map(item => ({
    ticket_id: ticket.id,
    waste_category_id: item.categoryId,
    weight: item.weight,
    subtotal: item.subtotal,
    price_applied: item.priceApplied
  }));

  // Insert transaction_details (bulk)
  const { error: tdErr } = await supabase.from("transaction_details").insert(transactionDetailsData);
  if (tdErr) throw tdErr;

  // Update ticket status
  const { error: tsErr } = await supabase.from("tickets").update({ status: "completed" }).eq("id", ticket.id);
  if (tsErr) throw tsErr;

  // Add balance to profile using the totalAmount from all items
  const { data: profile } = await supabase.from("profiles").select("balance").eq("id", ticket.client_id).single();
  const newBalance = (profile?.balance || 0) + totalAmount;
  const { error: pbErr } = await supabase.from("profiles").update({ balance: newBalance }).eq("id", ticket.client_id);
  if (pbErr) throw pbErr;
  
  revalidatePath("/kurir/dashboard");
  revalidatePath("/(nasabah)/dashboard");
}

export async function getTicketDebug(ticketId: string) {
  const supabase = await createClient(await cookies());
  let query = supabase
    .from("tickets")
    .select("*, user_addresses!address_id(recipient_name, full_address)");
  if (ticketId.length === 8) {
    query = query.eq("short_id", ticketId.toUpperCase());
  } else {
    query = query.eq("id", ticketId);
  }
  const res = await query.single();
  console.log("=== SERVER SIDE TICKET FETCH ===");
  console.dir(res, { depth: null });
  return res.data;
}
