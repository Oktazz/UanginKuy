import { z } from "zod";

export const MAX_CHAT_MESSAGE_LENGTH = 2_000;
export const MAX_CHAT_HISTORY_MESSAGES = 20;
export const MAX_CHAT_RESPONSE_LENGTH = 6_000;
export const MAX_TOOL_ROUNDS = 3;

const ALLOWED_TOPICS = [
  // Brand & Bot
  "uanginkuy",
  "uanginbot",

  // Penggunaan Aplikasi & Panduan
  "aplikasi",
  "app",
  "fitur",
  "cara kerja",
  "cara pakai",
  "cara guna",
  "cara menggunakan",
  "panduan",
  "tutorial",
  "alur",
  "langkah",
  "aturan",
  "daftar",

  // Keuangan & Saldo
  "saldo",
  "uang",
  "keuangan",
  "transaksi",

  // Pengelolaan Sampah & Daur Ulang
  "sampah",
  "limbah",
  "daur ulang",
  "daur-ulang",
  "recycle",
  "plastik",
  "kardus",
  "kertas",
  "logam",
  "organik",
  "berat",
  "kategori",

  // Pickup, Jadwal, & Pengiriman
  "pickup",
  "jemput",
  "kurir",
  "tiket",
  "booking",
  "jadwal",
  "alamat",

  // Lingkungan & Edukasi
  "lingkungan",
  "lingkungan hidup",
  "emisi",
  "bumi",

  // Bantuan Umum
  "help",
  "bantu",
  "bisa apa",

  // Sapaan & Salam
  "halo",
  "hallo",
  "helo",
  "hello",
  "hai",
  "hi",
  "hey",
  "pagi",
  "siang",
  "sore",
  "malam",
  "assalamualaikum",
  "assalamu'alaikum",
  "salam",
] as const;

const allowedTopicPattern = new RegExp(
  ALLOWED_TOPICS.map((topic) => {
    const escaped = topic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return topic.length <= 3 ? `\\b${escaped}\\b` : escaped;
  }).join("|"),
  "i",
);

const promptInjectionPattern =
  /ignore\s+(all|any|previous|prior)|abaikan\s+(semua|seluruh|instruksi|aturan)|system\s+prompt|system\s+instruction|reveal\s+(your|the)\s+(prompt|instruction)|tampilkan\s+(prompt|instruksi)\s+(sistem|internal)|jangan\s+ikuti\s+aturan/i;

const secretPatterns = [
  /AIza[0-9A-Za-z_-]{20,}/g,
  /(?:sk|rk)-[A-Za-z0-9_-]{16,}/g,
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
  /postgres(?:ql)?:\/\/[^\s]+/gi,
  /(?:api[_ -]?key|service[_ -]?role|access[_ -]?token|refresh[_ -]?token)\s*[:=]\s*[^\s,]+/gi,
];

export const ChatRequestSchema = z.object({
  message: z.string().trim().min(1).max(MAX_CHAT_MESSAGE_LENGTH),
});

const toolArgumentSchemas = {
  getUserBalance: z.object({}).strict(),
  getLatestTicket: z.object({}).strict(),
  getTicketHistory: z
    .object({
      limit: z.number().int().min(1).max(10).optional(),
    })
    .strict(),
  getWasteSummary: z.object({}).strict(),
  getPickupSchedule: z.object({}).strict(),
} as const;

export type GuardrailDecision =
  | { allowed: true; message: string }
  | { allowed: false; code: "OUT_OF_SCOPE" | "PROMPT_INJECTION"; message: string };

export function assessChatMessage(input: unknown): GuardrailDecision {
  const parsed = ChatRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      allowed: false,
      code: "OUT_OF_SCOPE",
      message: "Pesan tidak valid atau terlalu panjang.",
    };
  }

  const message = parsed.data.message;
  if (promptInjectionPattern.test(message)) {
    return {
      allowed: false,
      code: "PROMPT_INJECTION",
      message: "Maaf, aku hanya dapat membantu urusan UanginKuy.",
    };
  }

  if (!allowedTopicPattern.test(message)) {
    return {
      allowed: false,
      code: "OUT_OF_SCOPE",
      message:
        "Maaf, aku hanya dapat membantu soal saldo, sampah, pickup, tiket, jadwal, dan lingkungan.",
    };
  }

  return { allowed: true, message };
}

export function validateToolArguments(
  toolName: string,
  args: unknown,
): Record<string, unknown> | null {
  const schema = toolArgumentSchemas[toolName as keyof typeof toolArgumentSchemas];
  if (!schema) return null;

  const parsed = schema.safeParse(args ?? {});
  return parsed.success ? parsed.data : null;
}

export function sanitizeModelOutput(output: string): string {
  let sanitized = output.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  for (const pattern of secretPatterns) {
    sanitized = sanitized.replace(pattern, "[informasi sensitif disembunyikan]");
  }
  return sanitized.trim().slice(0, MAX_CHAT_RESPONSE_LENGTH);
}

export function trimChatHistory<T>(history: T[]): T[] {
  return history.slice(-MAX_CHAT_HISTORY_MESSAGES);
}
