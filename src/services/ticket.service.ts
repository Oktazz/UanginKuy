import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { CreateTicketPayload, UpdateTicketStatusPayload } from '@/validations/ticket.schema';
import { customAlphabet } from 'nanoid';

const generateShortId = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

export async function createTicket(payload: CreateTicketPayload) {
  const supabase = await createClient(await cookies());

  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData?.user) {
    throw new Error('Unauthorized');
  }

  const clientId = userData.user.id;

  const { data, error } = await supabase
    .from('tickets')
    .insert([
      {
        client_id: clientId,
        schedule_id: payload.schedule_id,
        ai_image_url: payload.ai_image_url,
        ai_predicted_category: payload.ai_predicted_category,
        ai_estimated_price: payload.ai_estimated_price,
        address_id: payload.address_id,
        pickup_address: payload.pickup_address,
        latitude: payload.latitude,
        longitude: payload.longitude,
        short_id: generateShortId(),
        status: 'pending',
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create ticket: ${error.message}`);
  }

  return data;
}

export async function getMyTickets() {
  const supabase = await createClient(await cookies());

  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData?.user) {
    throw new Error('Unauthorized');
  }

  // RLS will automatically filter tickets where client_id = user.id (for nasabah)
  // or courier_id = user.id (for kurir)
  const { data, error } = await supabase
    .from('tickets')
    .select('*, schedules(operational_date), profiles!client_id(name, address)')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch tickets: ${error.message}`);
  }

  return data;
}

export async function updateTicketStatus(ticketId: string, payload: UpdateTicketStatusPayload) {
  const supabase = await createClient(await cookies());

  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData?.user) {
    throw new Error('Unauthorized');
  }

  // 1. Update ticket status
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .update({ status: payload.status, updated_at: new Date().toISOString() })
    .eq('id', ticketId)
    .select()
    .single();

  if (ticketError) {
    throw new Error(`Failed to update ticket: ${ticketError.message}`);
  }

  // 2. If status is 'completed' and there are transaction details, insert them
  if (payload.status === 'completed' && payload.transaction_details && payload.transaction_details.length > 0) {
    const detailsToInsert = payload.transaction_details.map((detail) => ({
      ticket_id: ticketId,
      waste_category_id: detail.waste_category_id,
      weight: detail.weight,
      price_applied: detail.price_applied,
      subtotal: detail.subtotal,
    }));

    const { error: txError } = await supabase
      .from('transaction_details')
      .insert(detailsToInsert);

    if (txError) {
      // NOTE: The `on_ticket_status_completed` trigger in DB will calculate balance automatically, 
      // but it relies on transaction_details being present. 
      // In a real production system, this should be a transaction/RPC to ensure atomic inserts before the trigger fires.
      throw new Error(`Failed to save transaction details: ${txError.message}`);
    }
  }

  return ticket;
}
