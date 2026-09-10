import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { CreateTicketPayload, UpdateTicketStatusPayload } from '@/validations/ticket.schema';
import { customAlphabet } from 'nanoid';
import { ApiError } from '@/utils/error-handler';

const generateShortId = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);
const DUPLICATE_TICKET_MESSAGE =
  'Tiket untuk tanggal dan alamat tersebut sudah ada.';

export async function createTicket(payload: CreateTicketPayload) {
  const supabase = await createClient(await cookies());

  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData?.user) {
    throw new Error('Unauthorized');
  }

  const clientId = userData.user.id;

  const { data: existingTicket, error: duplicateCheckError } = await supabase
    .from('tickets')
    .select('id')
    .eq('client_id', clientId)
    .eq('pickup_date', payload.pickup_date)
    .eq('address_id', payload.address_id)
    .neq('status', 'cancelled')
    .limit(1)
    .maybeSingle();

  if (duplicateCheckError) {
    throw new Error(`Failed to check existing ticket: ${duplicateCheckError.message}`);
  }

  if (existingTicket) {
    throw new ApiError(DUPLICATE_TICKET_MESSAGE, 409);
  }

  const { data, error } = await supabase
    .from('tickets')
    .insert([
      {
        client_id: clientId,
        schedule_id: payload.schedule_id,
        pickup_date: payload.pickup_date,
        ai_image_url: payload.ai_image_url,
        ai_predicted_category: payload.ai_predicted_category,
        ai_estimated_price: payload.ai_estimated_price,
        address_id: payload.address_id,
        short_id: generateShortId(),
        status: 'pending',
      },
    ])
    .select()
    .single();

  if (error) {
    // The database unique index is the final guard against concurrent requests.
    if (error.code === '23505') {
      throw new ApiError(DUPLICATE_TICKET_MESSAGE, 409);
    }

    throw new Error(`Failed to create ticket: ${error.message}`);
  }

  return data;
}

export async function getMyTickets(tab?: string) {
  const supabase = await createClient(await cookies());

  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData?.user) {
    throw new Error('Unauthorized');
  }

  // RLS will automatically filter tickets where client_id = user.id (for nasabah)
  // or courier_id = user.id (for kurir)
  let query = supabase
    .from('tickets')
    .select(`
      id,
      short_id,
      status,
      pickup_date,
      created_at,
      updated_at,
      client_id,
      courier_id,
      schedules(day_of_week, cut_off_time),
      profiles!client_id(name),
      courier:profiles!courier_id(name),
      user_addresses!address_id(recipient_name, phone_number, full_address),
      transaction_details(
        id,
        weight,
        price_applied,
        subtotal,
        waste_categories(id, name, material_group, carbon_factor)
      )
    `)
    .order('created_at', { ascending: false });

  if (tab === 'history') {
    query = query.in('status', ['completed', 'cancelled']);
  } else if (tab === 'active') {
    query = query.in('status', ['pending', 'scheduled', 'on_the_way']);
  }

  const { data, error } = await query;

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

  // 1. Get ticket with ownership check
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select(`
      *,
      profiles!inner(client_id, role)
    `)
    .eq('id', ticketId)
    .single();

  if (ticketError) {
    throw new Error(`Failed to fetch ticket: ${ticketError.message}`);
  }

  // 2. Authorization check
  const userRole = ticket.profiles?.role;

  if (userRole === 'nasabah') {
    // Nasabah can only modify their own tickets
    if (ticket.client_id !== userData.user.id) {
      throw new Error('Unauthorized: You can only modify your own tickets.');
    }
  } else if (userRole === 'kurir') {
    // Kurir can only modify tickets assigned to them
    if (ticket.courier_id !== userData.user.id) {
      throw new Error('Unauthorized: You can only modify tickets assigned to you.');
    }
  }
  // Admin has full access - no additional check needed

  // 3. Update ticket status
  const { data: updatedTicket, error: ticketError2 } = await supabase
    .from('tickets')
    .update({ status: payload.status, updated_at: new Date().toISOString() })
    .eq('id', ticketId)
    .select()
    .single();

  if (ticketError) {
    const errorMessage = (ticketError as Error).message || 'Failed to update ticket';
    throw new Error(errorMessage);
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
