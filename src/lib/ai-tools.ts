import { FunctionDeclaration, SchemaType } from "@google/generative-ai";

/**
 * Deklarasi semua tools yang dapat dipanggil oleh Gemini.
 * Ini adalah "menu" yang dikirim ke Gemini API — hanya schema, bukan implementasi.
 * Implementasi aktual ada di src/services/ai-tools.service.ts
 */
export const AI_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "getUserBalance",
    description:
      "Mengambil saldo (balance) terkini milik nasabah yang sedang login. " +
      "Gunakan tool ini ketika pengguna bertanya tentang saldo, uang, atau kekayaan yang dimiliki.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
      required: [],
    },
  },
  {
    name: "getLatestTicket",
    description:
      "Mengambil tiket/booking pickup sampah terbaru milik nasabah, " +
      "termasuk status (pending/confirmed/in_progress/completed/cancelled), " +
      "nama kurir yang ditugaskan, dan jadwal kedatangan. " +
      "Gunakan ketika pengguna bertanya 'kapan kurir datang', 'status tiket saya', " +
      "atau seputar pickup terbaru.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
      required: [],
    },
  },
  {
    name: "getTicketHistory",
    description:
      "Mengambil riwayat semua tiket pickup milik nasabah (maksimal 10 terakhir). " +
      "Gunakan ketika pengguna bertanya tentang total pickup, riwayat, atau statistik pengumpulan.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        limit: {
          type: SchemaType.NUMBER,
          description: "Jumlah tiket yang ingin diambil. Default 5, maksimal 10.",
        },
      },
      required: [],
    },
  },
  {
    name: "getWasteSummary",
    description:
      "Mengambil ringkasan sampah yang telah dikumpulkan nasabah, dikelompokkan per kategori sampah " +
      "(misalnya: Plastik, Kardus, Logam). Mencakup total berat (kg) dan total nilai (Rupiah) per kategori. " +
      "Gunakan ketika pengguna bertanya tentang jenis sampah, dampak lingkungan, atau kontribusi daur ulang.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
      required: [],
    },
  },
  {
    name: "getPickupSchedule",
    description:
      "Mengambil jadwal pickup sampah yang tersedia dalam 7 hari ke depan. " +
      "Gunakan ketika pengguna bertanya tentang jadwal pickup mendatang atau kapan bisa melakukan booking.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
      required: [],
    },
  },
];

/** Nama-nama tool yang valid — digunakan untuk type-safe dispatch di route handler */
export type AiToolName = (typeof AI_TOOL_DECLARATIONS)[number]["name"];
