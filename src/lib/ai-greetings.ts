/**
 * Modul deteksi sapaan & generator template sapaan cerdas untuk UanginBot
 */

const GREETING_WORDS = new Set([
  "halo",
  "hallo",
  "helo",
  "hello",
  "hai",
  "hi",
  "hey",
  "hei",
  "oy",
  "oi",
  "p",
  "ping",
  "selamat",
  "met",
  "pagi",
  "siang",
  "sore",
  "malam",
  "assalamualaikum",
  "assalamu",
  "alaikum",
  "askum",
  "waalaikumsalam",
  "sampurasun",
  "kulonuwun",
  "uanginbot",
  "bot",
  "min",
  "admin",
  "kak",
  "kakak",
  "bro",
  "sis",
  "gan",
  "kawan",
  "teman",
  "apa",
  "kabar",
  "gimana",
  "kabarnya",
  "sehat",
  "tes",
  "test",
  "ya",
  "dong",
  "nih",
]);

/**
 * Mendapatkan sapaan waktu (pagi / siang / sore / malam) dalam zona waktu WITA (Asia/Makassar)
 */
export function getTimeOfDayGreeting(date = new Date()): string {
  try {
    const hourStr = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Makassar",
      hour: "numeric",
      hour12: false,
    }).format(date);
    const hour = parseInt(hourStr, 10);

    if (hour >= 4 && hour < 11) {
      return "pagi";
    } else if (hour >= 11 && hour < 15) {
      return "siang";
    } else if (hour >= 15 && hour < 18) {
      return "sore";
    } else {
      return "malam";
    }
  } catch {
    return "pagi";
  }
}

/**
 * Mendeteksi apakah pesan dari pengguna adalah sapaan murni (pure greeting)
 * tanpa mengandung pertanyaan/perintah spesifik.
 */
export function isPureGreeting(message: string): boolean {
  if (!message || typeof message !== "string") return false;

  // Bersihkan tanda baca, simbol, emoji, dan spasi berlebih
  const normalized = message
    .toLowerCase()
    .replace(/['’]/g, "") // hapus apostrof misal assalamu'alaikum -> assalamualaikum
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return false;

  const words = normalized.split(" ");

  // Jika pesan terlalu panjang (> 7 kata), kemungkinan bukan salam murni
  if (words.length > 7) return false;

  // Pastikan setidaknya ada 1 kata sapaan utama
  const primaryGreetings = [
    "halo",
    "hallo",
    "helo",
    "hello",
    "hai",
    "hi",
    "hey",
    "hei",
    "pagi",
    "siang",
    "sore",
    "malam",
    "assalamualaikum",
    "askum",
    "waalaikumsalam",
    "sampurasun",
    "kulonuwun",
    "ping",
    "p",
  ];

  const hasPrimaryGreeting = words.some((w) => primaryGreetings.includes(w));
  if (!hasPrimaryGreeting) return false;

  // Pastikan seluruh kata dalam pesan termasuk dalam daftar kata sapaan/sebutan yang diizinkan
  const allWordsAllowed = words.every((word) => GREETING_WORDS.has(word));
  return allWordsAllowed;
}

/**
 * Membuat template balasan sapaan ramah, personal, dan terstruktur
 */
export function generateGreetingResponse(userName?: string | null, date = new Date()): string {
  const timeOfDay = getTimeOfDayGreeting(date);
  const capitalizedTime = timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1);

  const cleanName = userName?.trim();
  const nameSalutation = cleanName ? ` Kak **${cleanName}**` : "";

  return `Halo${nameSalutation}! Selamat ${capitalizedTime}! 👋

Aku **UanginBot**, asisten virtual kamu di UanginKuy. Senang bisa menyapa kamu! Ada yang bisa kubantu hari ini?

Kamu bisa menanyakan hal-hal seperti:
• 💰 **Cek Saldo**: *"Berapa saldo aktif saya?"*
• 🚚 **Status Penjemputan**: *"Cek tiket penjemputan terbaru"* atau *"Kapan kurir datang?"*
• 📅 **Jadwal Pickup**: *"Ada jadwal penjemputan apa saja minggu ini?"*
• ♻️ **Kategori Sampah**: *"Sampah apa saja yang bisa disetor?"*

Ketik pertanyaanmu langsung di bawah atau pilih menu yang tersedia ya! 🌱`;
}
