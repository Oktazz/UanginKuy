import { z } from "zod";

export const BankAccountSchema = z.object({
  bankCode: z
    .string()
    .trim()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9_]+$/i, "Kode bank tidak valid"),
  accountNumber: z
    .string()
    .trim()
    .min(5, "Nomor rekening terlalu pendek")
    .max(50)
    .regex(/^\d+$/, "Nomor rekening hanya boleh berisi angka"),
});

export const CreateWithdrawalSchema = BankAccountSchema.extend({
  amount: z.coerce
    .number()
    .int("Nominal harus berupa bilangan bulat")
    .min(10_000, "Minimal penarikan Rp10.000"),
  requestKey: z.string().uuid(),
});

export const RejectWithdrawalSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(500, "Alasan penolakan maksimal 500 karakter")
    .optional(),
});

export type BankAccountPayload = z.infer<typeof BankAccountSchema>;
export type CreateWithdrawalPayload = z.infer<typeof CreateWithdrawalSchema>;
