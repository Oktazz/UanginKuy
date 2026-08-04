# UanginKuy

Aplikasi bank sampah berbasis Next.js, Supabase, Upstash Redis, Gemini, dan
RAG langsung berbasis pgvector.

## Development

```bash
pnpm install
pnpm dev
```

Salin `.env.example` ke `.env.local` dan isi kredensial development, termasuk
`RAG_DATABASE_URL` dari Supabase Connection Pooler. Variabel ini hanya dibaca
server dan tidak boleh menggunakan awalan `NEXT_PUBLIC_`.

## Hybrid RAG

UanginBot mempertahankan autentikasi, histori, streaming, dan live tools di
Next.js. Pertanyaan knowledge diproses server-side: Gemini membuat embedding
dan Supabase pgvector mencari konteks yang relevan. Saldo, tiket, jadwal, dan
transaksi tetap dibaca melalui live tools. Jika RAG gagal, chat tetap berjalan
tanpa konteks knowledge.

Admin dapat mengunggah PDF/DOCX lewat **Admin → Knowledge AI**. Dokumen
diekstrak, disimpan privat di Supabase Storage, dan di-embed langsung oleh
Gemini tanpa layanan AI tambahan.

## Konfigurasi Direct RAG

1. Jalankan migration berikut melalui Supabase SQL Editor, berurutan:
   `20260803031411_add_rag_knowledge_base.sql`,
   `20260804090000_add_knowledge_document_uploads.sql`, dan
   `20260804100000_rename_rag_comments.sql`.
2. Pastikan role database `langflow_rag` sudah memiliki password login. Gunakan
   connection string dari **Supabase Dashboard → Connect → Session Pooler** untuk
   `RAG_DATABASE_URL`. Nama role ini dipertahankan hanya demi kompatibilitas.
3. Tambahkan `RAG_DATABASE_URL` dan `GEMINI_API_KEY` ke environment variables
   Vercel. Keduanya server-only dan tidak boleh memakai awalan `NEXT_PUBLIC_`.

Vercel terhubung ke Supabase melalui pooler dengan satu koneksi singkat per
operasi RAG; tidak ada layanan Langflow, Railway, Docker, atau ngrok di
deployment produksi.

## Quality checks

```bash
pnpm test:coverage
pnpm lint
pnpm build
```
