import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requestClientIp } from "@/utils/rate-limit";
import { checkLandingAiRateLimit } from "@/lib/ai-rate-limit";
import {
  LandingChatRequestSchema,
  promptInjectionPattern,
} from "@/lib/ai-guardrails";

export const dynamic = "force-dynamic";

const LANDING_EDU_SYSTEM_PROMPT = `Kamu adalah EduBot, asisten AI edukasi resmi dari UanginKuy 🌱.
Tugas utamamu adalah memberikan edukasi yang ramah, ringkas, dan jelas kepada pengunjung landing page seputar bank sampah dan layanan UanginKuy.

## Topik yang Dikuasai
1. **Apa itu Bank Sampah**: Sistem pengumpulan sampah terpilah berbasis komunitas/rumah tangga yang mengonversi nilai barang bekas menjadi tabungan/saldo uang.
2. **Kategori Sampah Bernilai**:
   - Plastik: Botol plastik bening (PET), gelas plastik (PP), jerigen/tutup botol (HDPE).
   - Kertas & Kardus: Dus kardus cokelat, kertas HVS/buku bekas, koran, majalah.
   - Logam: Kaleng minuman aluminium, besi bekas, tembaga, seng.
   - Minyak Jelantah (UCO): Minyak goreng bekas pakai.
3. **Tips Pemilahan di Rumah**:
   - Pisahkan sampah organik (sisa makanan) dan sampah anorganik kering.
   - Pastikan botol/wadah plastik kosong dan dibilas/dikeringkan agar tidak berbau dan bernilai lebih tinggi.
   - Lipat/pipihkan kardus untuk menghemat ruang.
4. **Cara Kerja UanginKuy**:
   - Nasabah memilah sampah di rumah.
   - Buka aplikasi UanginKuy & pesan penjemputan gratis.
   - Kurir mitra datang ke rumah menimbang langsung menggunakan timbangan digital terhubung IoT.
   - Saldo rupiah otomatis masuk ke dompet aplikasi secara real-time dan bisa dicairkan ke bank atau e-wallet.

## Batasan & Aturan Ketat
- Selalu gunakan Bahasa Indonesia yang hangat, bersahabat, ringkas, dan memotivasi untuk menjaga lingkungan.
- Berikan jawaban yang padat (maksimal 2–3 paragraf per pesan) agar nyaman dibaca di tampilan web/mobile.
- JANGAN mengarang data saldo akun, tiket jemput kurir, atau informasi pribadi pengguna. Kamu adalah asisten publik pra-login tanpa akses database nasabah.
- Jika pengguna menanyakan data pribadinya (misal: "berapa saldo saya?", "kapan kurir ke rumah saya?"), jelaskan dengan ramah bahwa informasi tersebut hanya bisa diakses setelah login ke akun UanginKuy.
- Ajak pengguna untuk membuat akun gratis di UanginKuy untuk mulai menikmati layanan penjemputan sampah.
- Tolak dengan santun pertanyaan yang tidak ada hubungannya dengan bank sampah, pengelolaan sampah, lingkungan, atau UanginKuy.`;

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
          error:
            "Pesan tidak valid atau melebihi batas panjang maksimum (500 karakter).",
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

    // 5. Inisialisasi model Gemini 3.1 Flash Lite
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      systemInstruction: LANDING_EDU_SYSTEM_PROMPT,
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.6,
      },
    });

    // Format riwayat chat (maksimal 6 pesan sebelumnya)
    const formattedHistory = history.slice(-6).map((item) => ({
      role: item.role === "user" ? "user" : "model",
      parts: [{ text: item.content }],
    }));

    const chat = model.startChat({ history: formattedHistory });
    const result = await chat.sendMessageStream(message);

    // 6. Streaming SSE response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const rawText = chunk.text();
            if (rawText) {
              const cleanText = rawText.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: cleanText })}\n\n`),
              );
            }
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
