import { z } from 'zod';

export const CreateTicketSchema = z
  .object({
    schedule_id: z.number().positive('schedule_id must be valid').optional().nullable(),
    pickup_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format pickup_date harus YYYY-MM-DD'),
    ai_image_url: z.string().url().optional(),
    ai_predicted_category: z.string().optional(),
    address_id: z.string().uuid().optional().nullable(),
    service_type: z.enum(['pickup', 'drop_off']).optional().default('pickup'),
  })
  .superRefine((data, ctx) => {
    if (data.service_type === 'pickup' && !data.address_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'address_id is required for pickup service',
        path: ['address_id'],
      });
    }
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
