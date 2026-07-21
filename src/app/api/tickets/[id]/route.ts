import { NextRequest } from 'next/server';
import { UpdateTicketStatusSchema } from '@/validations/ticket.schema';
import { updateTicketStatus } from '@/services/ticket.service';
import { successResponse } from '@/utils/api-response';
import { handleApiError } from '@/utils/error-handler';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ticketId = (await params).id;
    const body = await req.json();
    
    // Validate input
    const payload = UpdateTicketStatusSchema.parse(body);
    
    // Process service logic
    const ticket = await updateTicketStatus(ticketId, payload);
    
    return successResponse(ticket, 'Ticket status updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
