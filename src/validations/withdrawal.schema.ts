import { z } from "zod";

export const BankAccountSchema = z.object({
  bankCode: z
    .string({ error: "Kode bank wajib diisi" })
    .trim()
    .min(2, "Kode bank minimal 2 karakter")
    .max(50, "Kode bank maksimal 50 karakter")
    .regex(/^[a-z0-9_]+$/i, "Kode bank tidak valid"),
  accountNumber: z
    .string({ error: "Nomor rekening wajib diisi" })
    .trim()
    .min(5, "Nomor rekening terlalu pendek")
    .max(50, "Nomor rekening maksimal 50 karakter")
    .regex(/^\d+$/, "Nomor rekening hanya boleh berisi angka"),
});

export const CreateWithdrawalSchema = BankAccountSchema.extend({
  amount: z.coerce
    .number({ error: "Nominal penarikan wajib diisi" })
    .int("Nominal harus berupa bilangan bulat")
    .min(10_000, "Minimal penarikan Rp10.000"),
  requestKey: z.string().uuid("ID permintaan penarikan tidak valid"),
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
