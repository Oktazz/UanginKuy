import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requestClientIp } from "@/utils/rate-limit";
import { checkLandingAiRateLimit } from "@/lib/ai-rate-limit";
import { createAdminClient } from "@/utils/supabase/admin";
import { cached } from "@/lib/redis";
import {
  retrieveKnowledge,
  shouldRetrieveKnowledge,
  type RagRetrievalResult,
} from "@/services/rag.service";
import type { ChatSource } from "@/services/chat-source.service";
import {
  LandingChatRequestSchema,
  promptInjectionPattern,
} from "@/lib/ai-guardrails";

export const dynamic = "force-dynamic";

interface WasteCategoryRow {
  name: string;
  material_group: string | null;
  price_per_kg: number;
}

function escapePromptData(value: string): string {
  return value.replaceAll("<", "‹").replaceAll(">", "›");
}

function chatSourcesFromRetrieval(
  retrieval: RagRetrievalResult | null,
): ChatSource[] {
  return (retrieval?.sources ?? []).map(({ title, filename, similarity }) => ({
    title,
    filename,
    ...(similarity === undefined ? {} : { similarity }),
  }));
}

/**
 * Mengambil daftar kategori sampah dan harga per kg dari tabel waste_categories,
 * di-cache di Redis selama 5 menit agar cepat dan hemat kuota DB.
 */
async function getWastePriceContext(): Promise<string> {
  return cached("ai:landing-waste-prices", 300, async () => {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("waste_categories")
        .select("name, material_group, price_per_kg")
        .order("material_group", { ascending: true })
        .order("name", { ascending: true });

      if (error || !data || data.length === 0) {
        return "";
      }

      const rows = data as WasteCategoryRow[];
      const lines = rows.map((cat) => {
        const group = cat.material_group ? `[${cat.material_group}] ` : "";
        const formattedPrice = new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          minimumFractionDigits: 0,
        }).format(cat.price_per_kg);
        return `- ${group}${cat.name}: ${formattedPrice} / kg`;
      });

      return `\n\n## Daftar Resmi Kategori Sampah yang Diterima & Harga per Kg di UanginKuy (DATA REAL-TIME DATABASE):\n${lines.join("\n")}\n\n*Catatan Penting*: Gunakan daftar harga resmi di atas saat pengunjung menanyakan sampah apa saja yang diterima atau berapa harga per kg dari suatu jenis sampah. Jangan mengarang harga di luar daftar tersebut.`;
    } catch (e) {
      console.warn("[LandingChat] Failed to fetch waste categories:", e);
      return "";
    }
  });
}

function buildKnowledgeContext(retrieval: RagRetrievalResult | null): string {
  if (!retrieval || !retrieval.context) return "";

  const sources = retrieval.sources
    .map(
      (source, index) =>
        `${index + 1}. ${escapePromptData(source.title)} (${escapePromptData(source.filename)})`,
    )
    .join("\n");

  return `\n\n## Konteks Knowledge Base Dokumen UanginKuy (DATA REFERENSI RESMI)\n- Gunakan konteks berikut sebagai referensi utama yang akurat untuk menjawab pertanyaan pengguna.\n- Jangan mengarang fakta di luar konteks ini.\n- Jangan menuliskan daftar sumber secara manual; sistem akan menampilkannya dalam dropdown referensi terpisah.\n\n<knowledge_context>\n${escapePromptData(retrieval.context)}\n</knowledge_context>\n${sources ? `<knowledge_sources>\n${sources}\n</knowledge_sources>` : ""}`;
}

function buildLandingSystemPrompt(
  priceContext: string,
  knowledgeContext: string,
): string {
  return `Kamu adalah EduBot, asisten AI edukasi dan perwakilan resmi dari platform UanginKuy 🌱.
Tugas utamamu adalah memberikan informasi yang akurat, ramah, dan memotivasi kepada pengunjung landing page mengenai apa itu UanginKuy, fitur-fitur aplikasi, kategori sampah beserta harganya, dan tips daur ulang.

## Tentang UanginKuy
UanginKuy adalah platform bank sampah digital modern yang menghubungkan nasabah rumah tangga dengan kurir mitra penjemput sampah terpilah. Nasabah tidak perlu repot mengantar sampah ke lokasi bank sampah fisik; kurir UanginKuy yang akan datang langsung menjemput ke alamat rumah, menimbang dengan timbangan digital pintar terhubung IoT, dan mengonversi nilainya langsung menjadi saldo uang digital di aplikasi secara transparan dan instan.

## 7 Fitur Utama di Aplikasi UanginKuy
1. **Jadwal Penjemputan (Pickup Booking)**: Pengguna dapat memesan jadwal penjemputan sampah terpilah langsung dari rumah dengan memilih tanggal & slot waktu yang fleksibel.
2. **Timbangan Digital IoT Terhubung**: Kurir menimbang di tempat menggunakan timbangan pintar IoT, berat sampah tersinkronisasi otomatis ke aplikasi secara real-time di depan nasabah (transparan tanpa kecurangan).
3. **Scan Barcode & QR Tiket**: Setiap penjemputan diverifikasi menggunakan sistem QR code / barcode pada tiket untuk keamanan dan validasi kurir resmi.
4. **Konversi Saldo Otomatis & Instan**: Nilai rupiah sampah otomatis masuk ke saldo akun dompet aplikasi UanginKuy saat proses penimbangan kurir selesai.
5. **Penarikan Saldo (Withdrawal)**: Saldo tabungan daur ulang bisa dicairkan langsung ke rekening bank atau e-wallet (DANA, Gopay, OVO, dll.) dengan verifikasi akun yang aman.
6. **AI Scanner Sampah (Cek Sampah dengan Kamera)**: Fitur AI Vision cerdas di mana pengguna cukup memfoto sampah lewat kamera ponsel untuk mengenali jenis kategori sampah secara instan, estimasi nilai, dan cara pemilahannya.
7. **UanginBot Personal Assistant**: Chatbot asisten AI di dalam aplikasi yang siap membantu mengecek saldo, memantau posisi kurir/jadwal penjemputan, melihat riwayat tiket, dan ringkasan tabungan sampah.
${priceContext}
${knowledgeContext}

## Batasan & Aturan Ketat
- Gunakan Bahasa Indonesia yang ramah, sopan, antusias, dan jelas (maksimal 2–3 paragraf per respons agar nyaman dibaca).
- Jika pengunjung menanyakan jenis sampah yang diterima atau rincian harganya, jawablah dengan detail mengacu pada "Daftar Resmi Kategori Sampah yang Diterima & Harga per Kg di UanginKuy" di atas.
- Jika ada konteks knowledge base dokumen resmi, jadikan referensi utama agar jawaban tidak berhalusinasi.
- Kamu TIDAK memiliki akses ke data akun pribadi pengguna (saldo pribadi, nomor tiket spesifik, riwayat penjemputan pengguna) karena ini adalah chat publik pra-login.
- Jika pengguna menanyakan data pribadinya (misal: "berapa saldo saya?", "kapan kurir ke rumah saya?"), jelaskan dengan ramah bahwa informasi tersebut hanya bisa diakses setelah login ke akun UanginKuy.
- Ajak pengguna untuk menekan tombol "Daftar Sekarang" di halaman ini untuk membuat akun gratis dan mulai menikmati layanan penjemputan sampah.
- Tolak dengan santun pertanyaan yang tidak ada hubungannya dengan bank sampah, daur ulang, lingkungan, atau layanan UanginKuy.`;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting berdasarkan IP pengunjung
    const clientIp = requestClientIp(req);
    const rateLimit = await checkLandingAiRateLimit(clientIp);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error:
            "Terlalu banyak pesan dalam waktu singkat. Silakan tunggu 1 menit sebelum bertanya kembali.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfter),
          },
        },
      );
    }

    // 2. Validasi payload body
    const body = await req.json().catch(() => null);
    const parsed = LandingChatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Pesan tidak valid atau melebihi batas panjang maksimum.",
        },
        { status: 400 },
      );
    }

    const { message, history = [] } = parsed.data;

    // 3. Pengecekan guardrails / prompt injection
    if (promptInjectionPattern.test(message)) {
      const refusalText =
        "Mohon maaf, aku adalah EduBot yang bertugas memberikan edukasi seputar bank sampah dan layanan UanginKuy. Aku hanya dapat menjawab pertanyaan seputar daur ulang dan lingkungan hidup ya! 🌱";
      return new Response(
        `data: ${JSON.stringify({ text: refusalText })}\n\ndata: [DONE]\n\n`,
        {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
          },
        },
      );
    }

    // 4. Periksa API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Layanan AI edukasi sedang tidak tersedia." },
        { status: 503 },
      );
    }

    // 5. Ambil data harga sampah real-time & knowledge retrieval secara paralel
    const retrievalPromise = shouldRetrieveKnowledge(message)
      ? retrieveKnowledge({ query: message, sessionId: "landing" }).catch(
          (err) => {
            console.warn("[LandingChat] Knowledge retrieval error:", err);
            return null;
          },
        )
      : Promise.resolve(null);

    const [priceContext, retrieval] = await Promise.all([
      getWastePriceContext(),
      retrievalPromise,
    ]);

    const knowledgeContext = buildKnowledgeContext(retrieval);
    const chatSources = chatSourcesFromRetrieval(retrieval);

    // 6. Inisialisasi model Gemini 3.1 Flash Lite dengan context lengkap
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      systemInstruction: buildLandingSystemPrompt(priceContext, knowledgeContext),
      generationConfig: {
        maxOutputTokens: 600,
        temperature: 0.5,
      },
    });

    // Format riwayat chat (maksimal 6 pesan sebelumnya)
    const formattedHistory = history.slice(-6).map((item) => ({
      role: item.role === "user" ? "user" : "model",
      parts: [{ text: item.content }],
    }));

    const chat = model.startChat({ history: formattedHistory });
    const result = await chat.sendMessageStream(message);

    // 7. Streaming SSE response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const rawText = chunk.text();
            if (rawText) {
              const cleanText = rawText.replace(
                /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
                "",
              );
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: cleanText })}\n\n`),
              );
            }
          }

          // Kirim metadata sumber dokumen jika knowledge base terpakai
          if (chatSources.length > 0) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ sources: chatSources })}\n\n`),
            );
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (streamError) {
          console.error("[LandingChat] Stream error:", streamError);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ text: "\n\n(Koneksi terputus. Silakan coba kirim ulang pertanyaanmu.)" })}\n\ndata: [DONE]\n\n`,
            ),
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-RateLimit-Remaining": String(rateLimit.remaining),
      },
    });
  } catch (error) {
    console.error("[LandingChat] Error handling request:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses pertanyaan edukasi." },
      { status: 500 },
    );
  }
}
