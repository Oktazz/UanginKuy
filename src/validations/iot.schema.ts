import { z } from 'zod';

export const IotSyncSchema = z.object({
  id_timbangan: z
    .string()
    .trim()
    .min(3, 'ID timbangan minimal terdiri dari 3 karakter')
    .max(50, 'ID timbangan maksimal 50 karakter')
    .regex(/^[A-Za-z0-9_-]+$/, 'ID timbangan hanya boleh berisi huruf, angka, tanda hubung, atau garis bawah'),
  weight: z
    .number()
    .finite('Nilai berat harus berupa angka yang valid')
    .min(0, 'Berat timbangan tidak boleh bernilai negatif')
    .max(50, 'Berat timbangan tidak boleh melebihi kapasitas 50 kg'),
  stable: z.boolean().optional().default(true),
});

export type IotSyncPayload = z.infer<typeof IotSyncSchema>;
