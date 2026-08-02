import { z } from 'zod';

export const IotSyncSchema = z.object({
  id_timbangan: z
    .string()
    .trim()
    .min(3, 'id_timbangan must contain at least 3 characters')
    .max(50, 'id_timbangan cannot exceed 50 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'id_timbangan contains invalid characters'),
  weight: z
    .number()
    .finite('weight must be finite')
    .min(0, 'weight cannot be negative')
    .max(50, 'weight cannot exceed the 50 kg scale capacity'),
  stable: z.boolean().optional().default(true),
});

export type IotSyncPayload = z.infer<typeof IotSyncSchema>;
