/**
 * Konfigurasi terpusat untuk model-model Google Gemini AI.
 *
 * Atur model yang digunakan melalui variabel lingkungan di .env.local:
 *   GEMINI_CHAT_MODEL        → Model untuk UanginBot (chatbot nasabah)
 *   GEMINI_LANDING_MODEL     → Model untuk EduBot (chatbot landing page publik)
 *   GEMINI_VISION_MODEL      → Model untuk Cek Sampah AI (analisis gambar)
 *
 * Jika tidak diatur, nilai default adalah "gemini-3.1-flash-lite".
 *
 * Contoh penggantian ke model yang lebih besar:
 *   GEMINI_CHAT_MODEL=gemini-2.5-flash
 *   GEMINI_VISION_MODEL=gemini-2.5-flash
 */

const DEFAULT_MODEL = "gemini-3.1-flash-lite";

/** Model untuk UanginBot — chatbot asisten nasabah di dalam aplikasi */
export const GEMINI_CHAT_MODEL =
  process.env.GEMINI_CHAT_MODEL?.trim() || DEFAULT_MODEL;

/** Model untuk EduBot — chatbot publik di landing page */
export const GEMINI_LANDING_MODEL =
  process.env.GEMINI_LANDING_MODEL?.trim() || DEFAULT_MODEL;

/** Model untuk Cek Sampah AI — analisis gambar sampah berbasis visi */
export const GEMINI_VISION_MODEL =
  process.env.GEMINI_VISION_MODEL?.trim() || DEFAULT_MODEL;
