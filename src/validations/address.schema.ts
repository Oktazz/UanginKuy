import { z } from 'zod';

export const CreateAddressSchema = z.object({
  label: z.string().min(1, 'Label alamat wajib diisi'),
  recipient_name: z.string().min(1, 'Nama penerima wajib diisi'),
  phone_number: z.string().min(1, 'Nomor telepon wajib diisi'),
  province: z.string().min(1, 'Provinsi wajib diisi'),
  city: z.string().min(1, 'Kota/Kabupaten wajib diisi'),
  district: z.string().min(1, 'Kecamatan wajib diisi'),
  full_address: z.string().min(1, 'Alamat lengkap wajib diisi'),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  is_primary: z.boolean().default(false),
});

export const UpdateAddressSchema = CreateAddressSchema.partial();

export type CreateAddressInput = z.infer<typeof CreateAddressSchema>;
export type UpdateAddressInput = z.infer<typeof UpdateAddressSchema>;
