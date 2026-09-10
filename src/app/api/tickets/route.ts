import { NextRequest } from 'next/server';
import { CreateTicketSchema } from '@/validations/ticket.schema';
import { createTicket, getMyTickets } from '@/services/ticket.service';
import { successResponse, errorResponse } from '@/utils/api-response';
import { handleApiError } from '@/utils/error-handler';
import { checkRateLimit, requestClientIp } from '@/utils/rate-limit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tab = searchParams.get('tab') || undefined;
    const tickets = await getMyTickets(tab);
    return successResponse(tickets, 'Tickets fetched successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const rateLimit = await checkRateLimit(
      `tickets:create:${requestClientIp(req)}`,
      20,
    );
    if (!rateLimit.allowed) {
      return errorResponse('Too many requests', 429);
    }

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
