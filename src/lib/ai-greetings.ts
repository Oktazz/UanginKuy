/**
 * Modul deteksi sapaan & generator template sapaan cerdas untuk UanginBot
 */

export type GreetingCategory =
  | "islamic"
  | "hindu"
  | "christian"
  | "buddhist"
  | "sundanese"
  | "javanese"
  | "time"
  | "general";

const GREETING_WORDS = new Set([
  // Salam umum & variasinya
  "halo",
  "hallo",
  "helo",
  "hello",
  "hai",
  "hi",
  "hey",
  "hei",
  "hy",
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

  // Salam keagamaan & adat
  "assalamualaikum",
  "asalamualaikum",
  "asalamwalaikum",
  "assalam",
  "assalamu",
  "alaikum",
  "askum",
  "aslkm",
  "waalaikumsalam",
  "waalaikumussalam",
  "mikum",
  "wr",
  "wb",
  "swastiastu",
  "swastyastu",
  "om",
  "shalom",
  "salom",
  "namo",
  "buddhaya",
  "sampurasun",
  "rampes",
  "kulonuwun",
  "kulo",
  "nuwun",
  "sugeng",
  "monggo",

  // Sebutan & Pronoun
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
  "semua",
  "bang",
  "pak",
  "bu",
  "om",

  // Kata pengantar/basa-basi umum
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
  "deh",
  "yuk",
  "mau",
  "tanya",
]);

/**
 * Kata kunci domain UanginKuy.
 * Jika pesan mengandung salah satu kata kunci ini, pesan BUKAN salam murni
 * dan harus diproses oleh LLM (contoh: "Halo min, berapa saldo saya?").
 */
const DOMAIN_KEYWORDS = new Set([
  "saldo",
  "uang",
  "rupiah",
  "tarik",
  "withdrawal",
  "rekening",
  "bank",
  "sampah",
  "limbah",
  "kardus",
  "plastik",
  "logam",
  "kertas",
  "botol",
  "organik",
  "anorganik",
  "berat",
  "kategori",
  "jenis",
  "harga",
  "nilai",
  "jemput",
  "pickup",
  "kurir",
  "tiket",
  "booking",
  "jadwal",
  "alamat",
  "lokasi",
  "daur",
  "ulang",
  "recycle",
  "setor",
  "setoran",
  "timbang",
  "timbangan",
  "batal",
  "cancel",
  "cara",
  "panduan",
  "tutorial",
  "langkah",
]);

/**
 * Mengurangi pengulangan karakter berurutan (misal: "halooo" -> "halo", "hyyy" -> "hai")
 */
function collapseRepeatedLetters(rawWord: string): string {
  const word = rawWord.toLowerCase();

  // Pola slang umum
  if (/^h+y+$/i.test(word)) return "hai";
  if (/^h+i+$/i.test(word)) return "hi";
  if (/^h+e+y+$/i.test(word)) return "hey";
  if (/^h+e+l+o+$/i.test(word)) return "halo";
  if (/^h+a+l+o+$/i.test(word)) return "halo";
  if (/^h+a+i+$/i.test(word)) return "hai";
  if (/^p+a+g+i+$/i.test(word)) return "pagi";
  if (/^s+i+a+n+g+$/i.test(word)) return "siang";
  if (/^s+o+r+e+$/i.test(word)) return "sore";
  if (/^m+a+l+a+m+$/i.test(word)) return "malam";

  // Kompresi huruf berulang >= 3 kali menjadi 1 kali (contoh: "assssalam" -> "asalam")
  return word.replace(/([a-z])\1{2,}/gi, "$1");
}

/**
 * Normalisasi teks sapaan: huruf kecil, hapus tanda baca, kompresi huruf berulang
 */
export function normalizeGreetingText(message: string): string {
  if (!message || typeof message !== "string") return "";

  return message
    .toLowerCase()
    .replace(/['’]/g, "") // hapus apostrof misal assalamu'alaikum -> assalamualaikum
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map(collapseRepeatedLetters)
    .join(" ")
    .trim();
}

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
 * Mendeteksi kategori salam dari pesan pengguna
 */
export function detectGreetingCategory(message: string): GreetingCategory {
  const normalized = normalizeGreetingText(message);
  const words = normalized.split(" ");

  if (
    words.some((w) => ["swastiastu", "swastyastu"].includes(w)) ||
    normalized.includes("om swastiastu") ||
    normalized.includes("om swastyastu")
  ) {
    return "hindu";
  }

  if (
    words.some((w) =>
      [
        "assalamualaikum",
        "asalamualaikum",
        "asalamwalaikum",
        "askum",
        "aslkm",
        "waalaikumsalam",
        "mikum",
      ].includes(w)
    ) ||
    normalized.includes("assalamu alaikum") ||
    normalized.includes("asalamu alaikum")
  ) {
    return "islamic";
  }

  if (words.some((w) => ["shalom", "salom"].includes(w))) {
    return "christian";
  }

  if (words.some((w) => ["buddhaya"].includes(w)) || normalized.includes("namo buddhaya")) {
    return "buddhist";
  }

  if (words.some((w) => ["sampurasun", "rampes"].includes(w))) {
    return "sundanese";
  }

  if (words.some((w) => ["kulonuwun", "sugeng", "monggo"].includes(w))) {
    return "javanese";
  }

  if (words.some((w) => ["pagi", "siang", "sore", "malam"].includes(w))) {
    return "time";
  }

  return "general";
}

/**
 * Mendeteksi apakah pesan dari pengguna adalah sapaan murni (pure greeting)
 * tanpa mengandung pertanyaan atau kata kunci domain UanginKuy.
 */
export function isPureGreeting(message: string): boolean {
  if (!message || typeof message !== "string") return false;

  const normalized = normalizeGreetingText(message);
  if (!normalized) return false;

  const words = normalized.split(" ");

  // Jika pesan terlalu panjang (> 8 kata), kemungkinan bukan salam murni
  if (words.length > 8) return false;

  // Jika mengandung kata kunci domain (saldo, sampah, tiket, dll.), BUKAN salam murni
  const hasDomainKeyword = words.some((w) => DOMAIN_KEYWORDS.has(w));
  if (hasDomainKeyword) return false;

  // Daftar sapaan utama yang harus ada minimal salah satu
  const primaryGreetings = [
    "halo",
    "hallo",
    "helo",
    "hello",
    "hai",
    "hi",
    "hey",
    "hei",
    "hy",
    "oy",
    "oi",
    "pagi",
    "siang",
    "sore",
    "malam",
    "assalamualaikum",
    "asalamualaikum",
    "asalamwalaikum",
    "askum",
    "aslkm",
    "waalaikumsalam",
    "swastiastu",
    "swastyastu",
    "shalom",
    "salom",
    "sampurasun",
    "rampes",
    "kulonuwun",
    "sugeng",
    "monggo",
    "namo",
    "buddhaya",
    "ping",
    "p",
  ];

  const hasPrimaryGreeting = words.some((w) => primaryGreetings.includes(w));
  if (!hasPrimaryGreeting) return false;

  // Pastikan seluruh kata dalam pesan termasuk dalam daftar kata sapaan/sebutan yang diizinkan
  return words.every((word) => GREETING_WORDS.has(word));
}

/**
 * Membuat template balasan sapaan ramah, personal, kontekstual sesuai jenis salam,
 * dan memaparkan fitur-fitur yang dapat dibantu oleh UanginBot.
 */
export function generateGreetingResponse(
  categoryOrName?: GreetingCategory | string | null,
  userNameOrDate?: string | null | Date,
  date: Date = new Date(),
): string {
  const validCategories: GreetingCategory[] = [
    "islamic",
    "hindu",
    "christian",
    "buddhist",
    "sundanese",
    "javanese",
    "time",
    "general",
  ];

  let category: GreetingCategory = "general";
  let userName: string | null = null;
  let targetDate: Date = date;

  if (categoryOrName && validCategories.includes(categoryOrName as GreetingCategory)) {
    category = categoryOrName as GreetingCategory;
    if (typeof userNameOrDate === "string") {
      userName = userNameOrDate;
    } else if (userNameOrDate instanceof Date) {
      targetDate = userNameOrDate;
    }
  } else if (typeof categoryOrName === "string") {
    userName = categoryOrName;
    if (userNameOrDate instanceof Date) {
      targetDate = userNameOrDate;
    }
  }

  const timeOfDay = getTimeOfDayGreeting(targetDate);
  const capitalizedTime = timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1);

  const cleanName = userName?.trim();
  const nameSalutation = cleanName ? ` Kak **${cleanName}**` : "";

  let opening = "";
  switch (category) {
    case "islamic":
      opening = `Waalaikumsalam${nameSalutation}! Selamat ${capitalizedTime}! 🤲`;
      break;
    case "hindu":
      opening = `Om Swastiastu${nameSalutation}! Selamat ${capitalizedTime}! 🙏`;
      break;
    case "christian":
      opening = `Shalom${nameSalutation}! Salam sejahtera dan selamat ${capitalizedTime}! 👋`;
      break;
    case "buddhist":
      opening = `Namo Buddhaya${nameSalutation}! Selamat ${capitalizedTime}! 🙏`;
      break;
    case "sundanese":
      opening = `Sampurasun${nameSalutation}! Rampes, selamat ${capitalizedTime}! 👋`;
      break;
    case "javanese":
      opening = `Sugeng ${timeOfDay}${nameSalutation}! Monggo, selamat datang di UanginKuy! 👋`;
      break;
    case "time":
      opening = `Selamat ${capitalizedTime}${nameSalutation}! 👋`;
      break;
    case "general":
    default:
      opening = `Halo${nameSalutation}! Selamat ${capitalizedTime}! 👋`;
      break;
  }

  return `${opening}

Aku **UanginBot**, asisten virtual kamu di **UanginKuy**. Senang bisa menyapa kamu! Ada yang bisa kubantu hari ini?

Berikut beberapa hal yang bisa kubantu langsung:
• 💰 **Cek Saldo & Tabungan**: *"Berapa saldo saya saat ini?"*
• 🚚 **Status Penjemputan / Tiket**: *"Cek tiket penjemputan terbaru"* atau *"Kapan kurir datang?"*
• 📅 **Jadwal Pickup**: *"Ada jadwal penjemputan sampah apa saja minggu ini?"*
• ♻️ **Panduan & Kategori Sampah**: *"Sampah apa saja yang diterima?"* atau *"Bagaimana cara pilah kardus?"*
• 📊 **Ringkasan Setoran**: *"Berapa total sampah yang sudah saya setor?"*

Ketik pertanyaanmu langsung di bawah ya! 🌱`;
}
