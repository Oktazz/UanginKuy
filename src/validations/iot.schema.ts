import { z } from 'zod';

export const IotSyncSchema = z.object({
  id_timbangan: z.string().min(1, 'id_timbangan is required'),
  weight: z.number().min(0, 'weight cannot be negative'),
});

export type IotSyncPayload = z.infer<typeof IotSyncSchema>;
