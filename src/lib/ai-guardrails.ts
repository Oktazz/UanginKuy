import { z } from "zod";
import { isPureGreeting } from "@/lib/ai-greetings";

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
  "hei",
  "hy",
  "pagi",
  "siang",
  "sore",
  "malam",
  "assalamualaikum",
  "asalamwalaikum",
  "assalamu'alaikum",
  "askum",
  "waalaikumsalam",
  "swastiastu",
  "om swastiastu",
  "shalom",
  "namo buddhaya",
  "sampurasun",
  "kulonuwun",
  "sugeng",
  "salam",
] as const;

const allowedTopicPattern = new RegExp(
  ALLOWED_TOPICS.map((topic) => {
    const escaped = topic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return topic.length <= 3 ? `\\b${escaped}\\b` : escaped;
  }).join("|"),
  "i",
);

export const promptInjectionPattern =
  /ignore\s+(all|any|previous|prior)|abaikan\s+(semua|seluruh|instruksi|aturan)|system\s+prompt|system\s+instruction|reveal\s+(your|the)\s+(prompt|instruction)|tampilkan\s+(prompt|instruksi)\s+(sistem|internal)|jangan\s+ikuti\s+aturan/i;

const secretPatterns = [
  /AIza[0-9A-Za-z_-]{20,}/g,
  /(?:sk|rk)-[A-Za-z0-9_-]{16,}/g,
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
  /postgres(?:ql)?:\/\/[^\s]+/gi,
  /(?:api[_ -]?key|service[_ -]?role|access[_ -]?token|refresh[_ -]?token)\s*[:=]\s*[^\s,]+/gi,
];

export const MAX_LANDING_CHAT_MESSAGE_LENGTH = 500;

export const LandingChatRequestSchema = z.object({
  message: z.string().trim().min(1).max(MAX_LANDING_CHAT_MESSAGE_LENGTH),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "model"]),
        content: z.string().max(1000),
      })
    )
    .max(10)
    .optional(),
});

export const ChatRequestSchema = z.object({
  message: z.string().trim().min(1).max(MAX_CHAT_MESSAGE_LENGTH),
  sessionId: z.string().uuid().optional(),
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

/**
 * Membuat respons permohonan maaf sopan ketika pertanyaan pengguna di luar lingkup layanan UanginKuy,
 * dilengkapi daftar fitur utama yang dapat dibantu oleh UanginBot.
 */
export function generateOutOfScopeResponse(userName?: string | null): string {
  const cleanName = userName?.trim();
  const nameSalutation = cleanName ? ` Kak **${cleanName}**` : "";

  return `Mohon maaf${nameSalutation}, saat ini aku belum bisa menjawab pertanyaan atau topik di luar layanan **UanginKuy** (seperti resep makanan, tugas sekolah, cuaca, atau pengetahuan umum lainnya). 🙏

Sebagai asisten resmi **UanginKuy**, aku dirancang khusus untuk membantumu dalam pengelolaan dan daur ulang sampah:
• 💰 **Cek Saldo & Tabungan**: Tanya saldo akun dan riwayat tabungan sampahmu.
• 🚚 **Status Penjemputan Kurir**: Cek posisi dan jadwal kurir penjemputan sampahmu.
• 📅 **Jadwal Pickup**: Ketahui jadwal penjemputan sampah aktif di wilayahmu.
• ♻️ **Panduan Jenis Sampah**: Cari tahu kategori sampah yang diterima (plastik, kardus, logam, dll.) dan cara pemilahannya.
• 📊 **Ringkasan Setoran Sampah**: Lihat rekapitulasi berat dan nilai sampah yang sudah disetor.

Silakan tanyakan hal-hal seputar layanan UanginKuy di atas ya! Ada yang ingin kubantu? 🌱`;
}

/**
 * Respons keamanan sopan tapi tegas jika terdeteksi percobaan jailbreak atau prompt injection
 */
export function generateSecurityRefusalResponse(): string {
  return `Mohon maaf, aku tidak dapat menjalankan instruksi tersebut. Sebagai asisten resmi **UanginKuy**, aku hanya bertugas memberikan bantuan terkait pengelolaan sampah, saldo, penjemputan kurir, dan layanan UanginKuy. 🙏`;
}

export function assessChatMessage(input: unknown, userName?: string | null): GuardrailDecision {
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
      message: generateSecurityRefusalResponse(),
    };
  }

  // Jika pesan adalah sapaan murni, izinkan (akan diproses oleh fast-path sapaan)
  if (isPureGreeting(message)) {
    return { allowed: true, message };
  }

  // Jika pesan mengandung topik yang diizinkan (domain UanginKuy)
  if (allowedTopicPattern.test(message)) {
    return { allowed: true, message };
  }

  return {
    allowed: false,
    code: "OUT_OF_SCOPE",
    message: generateOutOfScopeResponse(userName),
  };
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
