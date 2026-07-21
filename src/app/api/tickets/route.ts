import { NextRequest } from 'next/server';
import { CreateTicketSchema } from '@/validations/ticket.schema';
import { createTicket, getMyTickets } from '@/services/ticket.service';
import { successResponse } from '@/utils/api-response';
import { handleApiError } from '@/utils/error-handler';

export async function GET(req: NextRequest) {
  try {
    const tickets = await getMyTickets();
    return successResponse(tickets, 'Tickets fetched successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate input
    const payload = CreateTicketSchema.parse(body);
    
    // Process service logic
    const ticket = await createTicket(payload);
    
    return successResponse(ticket, 'Ticket created successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
