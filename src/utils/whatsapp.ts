export interface WhatsAppMessageContext {
  recipientName?: string;
  courierName?: string;
  ticketId?: string;
  address?: string;
  status?: string;
}

export interface WhatsAppTemplate {
  id: string;
  label: string;
  emoji: string;
  description: string;
  getMessage: (ctx: WhatsAppMessageContext) => string;
}

/**
 * Normalizes Indonesian phone numbers into international format for WhatsApp (628xxxxxxxx).
 */
export function formatToWhatsAppPhone(phone: string): string {
  if (!phone) return "";
  
  // Remove non-digit characters
  const digits = phone.replace(/\D/g, "");
  
  if (digits.startsWith("0")) {
    return "62" + digits.slice(1);
  }
  
  if (digits.startsWith("8")) {
    return "62" + digits;
  }
  
  return digits;
}

export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: "on_the_way",
    label: "Sedang Menuju Lokasi",
    emoji: "🛵",
    description: "Beri tahu nasabah bahwa kurir sedang dalam perjalanan ke lokasi.",
    getMessage: (ctx) => {
      const recipient = ctx.recipientName?.trim() || "Nasabah";
      const courier = ctx.courierName?.trim() || "Kurir UanginKuy";
      const ticket = ctx.ticketId ? ` (Tiket #${ctx.ticketId})` : "";
      const address = ctx.address?.trim() ? `\n\n📍 Alamat tujuan:\n${ctx.address.trim()}` : "";

      return `Halo Kak ${recipient}, saya ${courier} dari UanginKuy.\n\nSaya sedang dalam perjalanan menuju lokasi Anda untuk penjemputan sampah daur ulang${ticket}.${address}\n\nMohon bantu siapkan sampah yang akan diangkut ya Kak. Jika ada patokan arah khusus, silakan kabari saya. Terima kasih! 🙏`;
    },
  },
  {
    id: "arrived",
    label: "Sudah Tiba di Lokasi",
    emoji: "📍",
    description: "Beri tahu nasabah bahwa kurir telah tiba di titik jemput.",
    getMessage: (ctx) => {
      const recipient = ctx.recipientName?.trim() || "Nasabah";
      const courier = ctx.courierName?.trim() || "Kurir UanginKuy";
      const ticket = ctx.ticketId ? ` untuk Tiket #${ctx.ticketId}` : "";
      const address = ctx.address?.trim() ? ` (${ctx.address.trim()})` : "";

      return `Halo Kak ${recipient}, saya ${courier} dari UanginKuy.\n\nSaya sudah tiba di lokasi penjemputan${address}${ticket}.\n\nBoleh tolong keluar menemui kurir di titik jemput ya Kak? Terima kasih! 🙏`;
    },
  },
  {
    id: "directions",
    label: "Tanya Patokan Alamat",
    emoji: "🧭",
    description: "Minta panduan atau ancer-ancer lokasi penjemputan.",
    getMessage: (ctx) => {
      const recipient = ctx.recipientName?.trim() || "Nasabah";
      const courier = ctx.courierName?.trim() || "Kurir UanginKuy";
      const ticket = ctx.ticketId ? ` (Tiket #${ctx.ticketId})` : "";
      const address = ctx.address?.trim() ? `\n\nAlamat yang tertera:\n${ctx.address.trim()}` : "";

      return `Halo Kak ${recipient}, saya ${courier} dari UanginKuy terkait penjemputan sampah daur ulang${ticket}.${address}\n\nBoleh dibantu patokan rumah, warna pagar, atau ancer-ancer menuju lokasinya Kak? Terima kasih! 🙏`;
    },
  },
  {
    id: "confirmation",
    label: "Konfirmasi Kesiapan",
    emoji: "📦",
    description: "Konfirmasi apakah nasabah di rumah dan sampah sudah siap.",
    getMessage: (ctx) => {
      const recipient = ctx.recipientName?.trim() || "Nasabah";
      const courier = ctx.courierName?.trim() || "Kurir UanginKuy";
      const ticket = ctx.ticketId ? ` (Tiket #${ctx.ticketId})` : "";
      const address = ctx.address?.trim() ? ` di ${ctx.address.trim()}` : "";

      return `Halo Kak ${recipient}, saya ${courier} dari UanginKuy.\n\nSaya bertugas untuk menjemput sampah daur ulang Anda hari ini${ticket}${address}.\n\nApakah Anda sedang di lokasi dan sampah sudah siap untuk dijemput? Mohon konfirmasinya ya Kak. Terima kasih! 🙏`;
    },
  },
];

/**
 * Returns default template according to ticket status.
 */
export function getDefaultTemplate(status?: string): WhatsAppTemplate {
  if (status === "on_the_way") {
    return WHATSAPP_TEMPLATES[0]; // on_the_way
  }
  if (status === "scheduled") {
    return WHATSAPP_TEMPLATES[0];
  }
  return WHATSAPP_TEMPLATES[0];
}

/**
 * Generates direct WhatsApp URL with formatted phone and URL-encoded text.
 */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const formattedPhone = formatToWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedText}`;
}
