import { z } from 'zod';

export const CreateTicketSchema = z.object({
  schedule_id: z.number().positive('schedule_id must be valid'),
  ai_image_url: z.string().url().optional(),
  ai_predicted_category: z.string().optional(),
  ai_estimated_price: z.number().nonnegative().optional(),
});

export const UpdateTicketStatusSchema = z.object({
  status: z.enum(['pending', 'scheduled', 'on_the_way', 'completed', 'cancelled']),
  transaction_details: z.array(
    z.object({
      waste_category_id: z.number().positive(),
      weight: z.number().positive(),
      price_applied: z.number().positive(),
      subtotal: z.number().positive(),
    })
  ).optional(), // Required if status is 'completed'
}).refine(
  (data) => {
    if (data.status === 'completed' && (!data.transaction_details || data.transaction_details.length === 0)) {
      return false;
    }
    return true;
  },
  {
    message: "transaction_details are required when completing a ticket",
    path: ["transaction_details"]
  }
);

export type CreateTicketPayload = z.infer<typeof CreateTicketSchema>;
export type UpdateTicketStatusPayload = z.infer<typeof UpdateTicketStatusSchema>;
