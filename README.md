# UanginKuy

Platform digital untuk bank sampah yang menghubungkan nasabah, kurir, dan administrator dalam satu ekosistem terintegrasi. Nasabah dapat menjadwalkan penjemputan sampah, memantau saldo tabungan sampah, melakukan penarikan saldo ke rekening bank, dan berkonsultasi dengan asisten AI mengenai pengelolaan sampah.

---

## Daftar Isi

- [Arsitektur](#arsitektur)
- [Peran Pengguna](#peran-pengguna)
- [Fitur Utama](#fitur-utama)
- [Tumpukan Teknologi](#tumpukan-teknologi)
- [Persyaratan](#persyaratan)
- [Pengaturan Lokal](#pengaturan-lokal)
- [Variabel Lingkungan](#variabel-lingkungan)
- [Struktur Proyek](#struktur-proyek)
- [Rute Halaman](#rute-halaman)
- [Rute API](#rute-api)
- [Lapisan Layanan](#lapisan-layanan)
- [Basis Data](#basis-data)
- [Pengujian](#pengujian)
- [Keamanan](#keamanan)
- [Kepatuhan Kode](#kepatuhan-kode)

---

## Arsitektur

UanginKuy dibangun di atas Next.js 16 dengan App Router. Semua halaman menggunakan Server Components secara default; interaktivitas klien dibatasi pada komponen dengan direktif `"use client"`. Supabase berfungsi sebagai basis data PostgreSQL, sistem autentikasi, dan penyedia realtime. Upstash Redis digunakan untuk pembatasan laju (rate limiting) pada endpoint AI dan IoT.

```
Browser
  |
  +-- Edge Middleware (src/proxy.ts)
        Memvalidasi sesi Supabase dan menerapkan perlindungan rute
  |
  +-- Next.js App Router
        +-- (nasabah)/    Antarmuka nasabah bank sampah
        +-- admin/        Panel kendali administrator
        +-- kurir/        Aplikasi lapangan kurir
        +-- (auth)/       Autentikasi (login, registrasi, reset kata sandi)
        +-- api/          Route Handlers (REST API internal)
  |
  +-- Supabase (PostgreSQL + Auth + Realtime)
  +-- Upstash Redis (rate limiting)
  +-- Google Gemini AI (asisten AI dan RAG)
  +-- OpenRouteService (optimasi rute kurir)
  +-- MapLibre GL (peta interaktif)
```

---

## Peran Pengguna

| Peran | Akses |
|---|---|
| `nasabah` | Dashboard, pemesanan penjemputan, riwayat tiket, penarikan saldo, profil |
| `kurir` | Daftar penjemputan, pemindaian QR, navigasi rute, profil |
| `admin` | Loket, manajemen rute, jadwal, harga sampah, data nasabah, pengetahuan AI |
| `super_admin` | Semua akses admin, ditambah manajemen staf dan pengaturan gudang |

Setiap layout Server Component mengambil profil pengguna dari Supabase dan mengarahkan ulang jika peran tidak sesuai. Middleware edge (`src/proxy.ts`) menangani perlindungan rute umum sebelum permintaan mencapai halaman.

---

## Fitur Utama

### Nasabah

**Penjemputan Sampah**
Nasabah memilih tanggal dari jadwal operasional aktif, memasukkan alamat penjemputan dengan bantuan peta interaktif atau geocoding manual, memilih jenis sampah, lalu mengonfirmasi pesanan. Sistem mencegah pemesanan ganda untuk jadwal yang sama.

**Tiket dan Riwayat**
Semua transaksi sampah tersimpan sebagai tiket. Nasabah dapat melihat status tiket secara real-time, detail berat dan nilai sampah per kategori, serta riwayat berdasarkan bulan.

**Penarikan Saldo**
Saldo dari penjualan sampah dapat ditarik ke rekening bank melalui dua saluran: transfer bank langsung (dengan verifikasi akun) atau melalui loket kasir dengan kode token satu kali yang kadaluarsa setelah 15 menit.

**UanginBot (Asisten AI)**
Chatbot berbasis Google Gemini dengan Retrieval-Augmented Generation (RAG). Bot menjawab pertanyaan tentang pengelolaan sampah, harga material, prosedur bank sampah, dan pertanyaan umum lainnya berdasarkan dokumen pengetahuan yang diunggah admin. Percakapan disimpan per sesi.

**Cek Sampah AI**
Fitur penilaian sampah berbasis gambar. Nasabah mengunggah foto sampah dan AI memberikan estimasi kategori, material, dan nilai.

### Administrator

**Loket**
Petugas kasir mencari nasabah berdasarkan nama, nomor anggota, atau nomor telepon. Dari loket, petugas dapat memproses penyetoran sampah (drop-off) langsung dengan pencatatan berat dan kategori, serta memvalidasi kode token penarikan tunai.

**Manajemen Rute**
Admin menetapkan kurir ke tiket penjemputan dan dapat menyusun urutan rute secara manual atau meminta optimasi rute otomatis dari OpenRouteService.

**Harga Sampah**
Admin mengatur harga per kilogram untuk setiap kategori dan subkategori sampah (plastik, kertas, logam, elektronik, dan lainnya).

**Pengetahuan AI**
Admin mengunggah dokumen (PDF, Word, teks) yang menjadi sumber pengetahuan UanginBot melalui pipeline RAG. Setiap dokumen dipotong menjadi segmen, dibuat embedding, dan disimpan di tabel `rag_knowledge_chunks`.

**Pengaturan Gudang**
Super admin mengonfigurasi koordinat lokasi gudang, jam operasional, dan hari kerja yang ditampilkan di halaman pemesanan nasabah.

### Kurir

**Dashboard Peta**
Kurir melihat semua tiket yang ditugaskan hari ini beserta lokasinya di peta interaktif (MapLibre GL). Tiket diurutkan berdasarkan `route_sequence`.

**Pemindaian QR**
Kurir memindai QR code di kemasan sampah nasabah untuk mengonfirmasi pengambilan. QR code berisi ID tiket yang divalidasi server.

**Konfirmasi Penjemputan**
Setelah pemindaian, kurir mengisi berat aktual dan catatan lain. Sistem menghitung nilai berdasarkan tabel harga dan memperbarui saldo nasabah secara otomatis.

### Integrasi IoT

Timbangan pintar dapat mengirim data berat secara langsung ke endpoint `/api/iot/sync` menggunakan API key khusus (`x-iot-api-key`). Data terkini timbangan tersedia di `/api/iot/latest`. Endpoint ini dilindungi dengan pembatasan laju 60 permintaan per menit per perangkat.

---

## Tumpukan Teknologi

| Kategori | Teknologi |
|---|---|
| Framework | Next.js 16.2 (App Router, Turbopack) |
| Runtime | React 19, TypeScript 5 |
| Basis data | Supabase (PostgreSQL 15) |
| Autentikasi | Supabase Auth (email + kata sandi, magic link) |
| AI | Google Gemini (`gemini-3.1-flash-lite`) |
| Cache / Rate limit | Upstash Redis |
| Peta | MapLibre GL, react-map-gl, OpenRouteService |
| Antarmuka | Tailwind CSS v4, Radix UI, shadcn/ui |
| Animasi | Framer Motion |
| Diagram / Chart | Chart.js, react-chartjs-2 |
| QR Code | html5-qrcode (pemindaian), qrcode.react (generasi) |
| Pengujian | Vitest 4, Testing Library, jsdom |
| Linter | ESLint 9 (flat config), Prettier |

---

## Persyaratan

- Node.js 20 atau lebih baru
- pnpm 9 atau lebih baru
- Akun Supabase (proyek aktif dengan pgvector diaktifkan untuk RAG)
- Akun Upstash Redis
- Kunci API Google Gemini
- Kunci API OpenRouteService (opsional, untuk optimasi rute kurir)

---

## Pengaturan Lokal

```bash
# 1. Klon repositori
git clone https://github.com/Oktazz/UanginKuy.git
cd UanginKuy

# 2. Instal dependensi
pnpm install

# 3. Salin berkas variabel lingkungan
cp .env.example .env.local

# 4. Isi semua variabel di .env.local (lihat bagian Variabel Lingkungan)

# 5. Terapkan migrasi basis data ke proyek Supabase
# Jalankan setiap file SQL di supabase/migrations/ secara berurutan
# menggunakan Supabase Studio SQL Editor atau Supabase CLI:
#   supabase db push

# 6. Jalankan server pengembangan
pnpm dev
```

Server pengembangan dapat diakses dari perangkat jaringan lokal (misalnya ponsel untuk pengujian antarmuka mobile) karena dikonfigurasi dengan `-H 0.0.0.0`. Terowongan ngrok juga didukung.

---

## Variabel Lingkungan

Salin `.env.example` menjadi `.env.local` dan isi setiap nilai:

| Variabel | Keterangan |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL proyek Supabase (publik) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Kunci anon/publik Supabase |
| `SUPABASE_CONNECTION_STRING` | Koneksi PostgreSQL langsung (untuk RAG dan migrasi) |
| `SUPABASE_SERVICE_ROLE_KEY` | Kunci service role Supabase (server-only) |
| `RAG_DATABASE_URL` | URL koneksi database khusus RAG (biasanya sama dengan `SUPABASE_CONNECTION_STRING`) |
| `GEMINI_API_KEY` | Kunci API Google Gemini |
| `GEMINI_CHAT_MODEL` | Model untuk UanginBot (default: `gemini-3.1-flash-lite`, opsional) |
| `GEMINI_LANDING_MODEL` | Model untuk EduBot di landing page (default: `gemini-3.1-flash-lite`, opsional) |
| `GEMINI_VISION_MODEL` | Model untuk Cek Sampah AI (default: `gemini-3.1-flash-lite`, opsional) |
| `UPSTASH_REDIS_REST_URL` | URL REST Upstash Redis |
| `UPSTASH_REDIS_REST_TOKEN` | Token autentikasi Upstash Redis |
| `ORS_API_KEY` | Kunci API OpenRouteService (untuk optimasi rute kurir) |
| `IOT_DEVICE_API_KEY` | Kunci API perangkat timbangan IoT |
| `SITE_URL` | URL publik aplikasi (digunakan untuk tautan reset kata sandi) |

---

## Struktur Proyek

```
src/
  app/
    (auth)/           Halaman autentikasi (login, registrasi, reset kata sandi)
    (nasabah)/        Antarmuka nasabah
      booking/        Pemesanan penjemputan sampah
      dashboard/      Ringkasan saldo, statistik, grafik
      tickets/        Daftar dan detail tiket
      withdrawal/     Penarikan saldo (bank & loket)
      cek-sampah/     Penilaian sampah berbasis AI
      profile/        Profil dan manajemen alamat
    admin/            Panel administrator
      counter/        Loket kasir (drop-off, penarikan tunai)
      dashboard/      Ringkasan operasional admin
      knowledge/      Manajemen dokumen pengetahuan AI
      nasabah/        Data dan statistik nasabah
      prices/         Tabel harga kategori sampah
      routes/         Penugasan dan optimasi rute kurir
      schedules/      Manajemen jadwal operasional
      settings/       Pengaturan gudang (super admin)
      users/          Manajemen staf (super admin)
    kurir/            Antarmuka kurir lapangan
      dashboard/      Peta tiket yang ditugaskan
      pickup/[id]/    Detail dan konfirmasi penjemputan
      scanner/        Pemindaian QR code
      profile/        Profil kurir
    api/              Route Handlers (API internal)
      addresses/      CRUD alamat nasabah
      ai/             Endpoint AI (chat, RAG, pemilahan gambar)
      counter/        Endpoint loket (drop-off, penarikan, riwayat)
      geocode/        Geocoding koordinat ke alamat
      iot/            Sinkronisasi dan pembacaan data timbangan IoT
      ors-route/      Proksi OpenRouteService untuk optimasi rute
      schedules/      Jadwal operasional aktif
      tickets/        CRUD tiket
      warehouse-location/ Lokasi dan jam operasional gudang
      withdrawals/    Penarikan saldo (validasi akun, token, daftar bank)
    page.tsx          Landing page publik
  components/
    ai-chat/          Widget chatbot UanginBot
    receipts/         Komponen struk termal
    ui/               Komponen antarmuka (tombol, input, peta, kalender, dll.)
  services/           Logika bisnis server-side
  utils/              Utilitas (format, tanggal, validasi, respon API)
  validations/        Skema validasi Zod
  types/              Definisi tipe TypeScript bersama
  config/             Konfigurasi aplikasi (peta, dll.)
  constants/          Konstanta domain (status tiket, kategori sampah)
  lib/                Pustaka utilitas inti
  proxy.ts            Edge Middleware (autentikasi dan perlindungan rute)
supabase/
  migrations/         Migrasi SQL yang berurutan
```

---

## Rute Halaman

### Publik

| Rute | Deskripsi |
|---|---|
| `/` | Landing page dengan informasi layanan dan chatbot |
| `/login` | Masuk dengan email dan kata sandi |
| `/register` | Daftar akun baru |
| `/forgot-password` | Permintaan tautan reset kata sandi |
| `/onboarding` | Pengaturan profil pertama kali setelah registrasi |

### Nasabah (memerlukan autentikasi, peran: nasabah)

| Rute | Deskripsi |
|---|---|
| `/dashboard` | Ringkasan saldo, grafik komposisi sampah, riwayat terbaru |
| `/booking` | Formulir pemesanan penjemputan sampah |
| `/tickets` | Daftar tiket difilter berdasarkan status dan bulan |
| `/tickets/[id]` | Detail tiket, termasuk rincian kategori sampah |
| `/withdrawal` | Penarikan saldo ke bank atau tunai melalui loket |
| `/cek-sampah` | Penilaian jenis dan nilai sampah dari foto |
| `/profile` | Data profil, nomor anggota, foto |
| `/profile/edit` | Ubah nama dan foto profil |
| `/profile/addresses` | Manajemen alamat penjemputan |

### Kurir (memerlukan autentikasi, peran: kurir)

| Rute | Deskripsi |
|---|---|
| `/kurir/dashboard` | Peta tiket yang ditugaskan hari ini |
| `/kurir/pickup/[id]` | Detail tiket dan formulir konfirmasi penjemputan |
| `/kurir/scanner` | Pemindaian QR code pada kemasan sampah |
| `/kurir/profile` | Profil kurir |

### Admin (memerlukan autentikasi, peran: admin atau super_admin)

| Rute | Deskripsi |
|---|---|
| `/admin/dashboard` | Ringkasan operasional dan statistik |
| `/admin/counter` | Loket kasir untuk drop-off dan penarikan tunai |
| `/admin/routes` | Penugasan kurir dan optimasi rute |
| `/admin/schedules` | Manajemen jadwal penjemputan aktif |
| `/admin/prices` | Tabel harga per kategori sampah |
| `/admin/nasabah` | Data dan statistik nasabah |
| `/admin/knowledge` | Manajemen dokumen pengetahuan RAG |
| `/admin/settings/warehouse` | Lokasi dan jam operasional gudang (super_admin) |
| `/admin/users` | Manajemen akun staf (super_admin) |

---

## Rute API

Semua API menggunakan format respons terpusat dari `src/utils/api-response.ts`:

```json
{ "success": true, "data": { ... } }
{ "success": false, "error": "pesan kesalahan" }
```

### Alamat

| Metode | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/addresses` | Daftar alamat nasabah yang terautentikasi |
| POST | `/api/addresses` | Tambah alamat baru |
| GET | `/api/addresses/[id]` | Detail satu alamat |
| PATCH | `/api/addresses/[id]` | Perbarui alamat |
| DELETE | `/api/addresses/[id]` | Hapus alamat (diblokir jika ada tiket aktif) |

### AI

| Metode | Endpoint | Deskripsi |
|---|---|---|
| POST | `/api/ai/chat` | Percakapan dengan UanginBot (dengan RAG) |
| GET | `/api/ai/chat/sessions` | Riwayat sesi percakapan |
| POST | `/api/ai/landing-chat` | Chatbot publik di landing page |
| POST | `/api/ai/sort` | Penilaian dan pemilahan sampah dari gambar |

### Loket

| Metode | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/counter/search-nasabah` | Cari nasabah berdasarkan nama, ID, atau telepon |
| POST | `/api/counter/drop-off` | Proses penyetoran sampah di loket |
| POST | `/api/counter/cash-out` | Validasi dan proses token penarikan tunai |
| GET | `/api/counter/history` | Riwayat transaksi loket |

### Tiket

| Metode | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/tickets` | Daftar tiket nasabah yang terautentikasi |
| POST | `/api/tickets` | Buat tiket penjemputan baru |
| GET | `/api/tickets/[id]` | Detail tiket beserta rincian transaksi |
| PATCH | `/api/tickets/[id]` | Perbarui status tiket |

### Penarikan

| Metode | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/withdrawals` | Riwayat penarikan nasabah |
| POST | `/api/withdrawals` | Ajukan penarikan ke bank |
| GET | `/api/withdrawals/banks` | Daftar bank yang didukung |
| POST | `/api/withdrawals/validate-account` | Validasi nomor rekening bank |
| POST | `/api/withdrawals/counter-token` | Hasilkan token penarikan tunai |

### Utilitas

| Metode | Endpoint | Deskripsi |
|---|---|---|
| POST | `/api/geocode` | Konversi koordinat ke alamat teks |
| POST | `/api/ors-route` | Optimasi rute melalui OpenRouteService |
| GET | `/api/schedules/active` | Jadwal operasional aktif |
| GET | `/api/warehouse-location` | Lokasi dan jam operasional gudang |

### IoT

| Metode | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | `/api/iot/sync` | `x-iot-api-key` header | Kirim data berat dari timbangan |
| GET | `/api/iot/latest` | Supabase session | Baca data timbangan terkini |

### Admin

| Metode | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/admin/nasabah` | Daftar semua nasabah |
| GET/DELETE | `/api/admin/nasabah/[id]` | Detail atau hapus nasabah |
| GET/POST | `/api/admin/knowledge/documents` | Daftar atau unggah dokumen pengetahuan |
| GET/DELETE | `/api/admin/knowledge/documents/[id]` | Detail atau hapus dokumen |

---

## Lapisan Layanan

Semua logika bisnis server-side dienkapsulasi di `src/services/`:

| Berkas | Tanggung Jawab |
|---|---|
| `counter.service.ts` | Pencarian nasabah, pemrosesan drop-off loket, validasi token penarikan tunai, riwayat loket |
| `ticket.service.ts` | Pembuatan tiket, konfirmasi penjemputan kurir, pembaruan status |
| `nasabah.service.ts` | Profil nasabah, ringkasan saldo, statistik komposisi sampah |
| `withdrawal.service.ts` | Pengajuan penarikan ke bank, generasi token tunai, riwayat penarikan |
| `rag.service.ts` | Pengambilan konteks dokumen (RAG), ingest dokumen ke pgvector |
| `knowledge-document.service.ts` | CRUD dokumen pengetahuan, ekstraksi teks dari PDF dan Word |
| `ai-tools.service.ts` | Definisi function calling Gemini (saldo, riwayat tiket, harga sampah) |
| `schedule.service.ts` | Jadwal operasional aktif dari Redis |
| `iot.service.ts` | Sinkronisasi dan pembacaan data timbangan IoT |
| `chat-source.service.ts` | Metadata sumber yang disertakan dalam respons AI |
| `avatar-sync.service.ts` | Sinkronisasi foto profil dari penyimpanan Supabase |
| `image.service.ts` | Unggah dan pengelolaan gambar |
| `client-image.service.ts` | Operasi gambar sisi klien |

---

## Basis Data

Basis data dikelola dengan Supabase (PostgreSQL 15). Ekstensi `pgvector` diperlukan untuk fitur RAG.

### Tabel Utama

| Tabel | Deskripsi |
|---|---|
| `profiles` | Data pengguna (nama, peran, nomor anggota, saldo, foto) |
| `user_addresses` | Alamat penjemputan nasabah |
| `tickets` | Tiket penjemputan sampah |
| `transaction_details` | Rincian per kategori sampah dalam satu tiket |
| `waste_categories` | Kategori dan subkategori sampah beserta harga |
| `schedules` | Jadwal operasional aktif |
| `withdrawals` | Riwayat pengajuan penarikan saldo |
| `app_settings` | Pengaturan aplikasi (lokasi gudang, jam operasional) |
| `knowledge_documents` | Dokumen sumber untuk RAG |
| `rag_knowledge_chunks` | Segmen dokumen dengan embedding vektor |
| `ai_sessions` | Sesi percakapan chatbot |
| `iot_measurements` | Data pengukuran terbaru dari timbangan IoT |
