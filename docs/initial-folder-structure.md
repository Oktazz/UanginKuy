# Initial Folder Structure

Berdasarkan dokumen PRD `UanginKuy`, berikut adalah usulan struktur folder awal untuk proyek Next.js (menggunakan fitur App Router). Struktur ini dirancang untuk mengakomodasi tiga modul utama (Nasabah, Kurir, Admin), integrasi API untuk perangkat IoT, layanan AI, serta penerapan *Progressive Web App* (PWA).

```text
uangin-kuy/
├── public/                 # Aset statis publik (gambar, ikon, manifest PWA)
│   ├── images/
│   └── icons/
├── src/
│   ├── app/                # Next.js App Router (Routing Pages & API)
│   │   ├── (nasabah)/      # Route Group untuk Modul Nasabah (Client Web)
│   │   │   ├── dashboard/  # Tampilan saldo, pie chart sampah, impact tracker
│   │   │   ├── schedule/   # Sistem kalender & pemesanan tiket
│   │   │   ├── estimate/   # Fitur AI Image Recognition untuk estimasi sampah
│   │   │   ├── chatbot/    # Asisten AI (Tanya jawab panduan)
│   │   │   └── layout.tsx  # Layout khusus nasabah
│   │   ├── (kurir)/        # Route Group untuk Modul Kurir (Courier Web App)
│   │   │   ├── route/      # Dashboard rute harian hasil optimasi VRP
│   │   │   ├── pickup/     # Eksekusi penjemputan (Web Scanner QR, form kategori)
│   │   │   ├── iot-sync/   # Tampilan sinkronisasi real-time berat IoT (ESP8266)
│   │   │   └── layout.tsx  # Layout khusus kurir
│   │   ├── (admin)/        # Route Group untuk Modul Admin (Admin Web)
│   │   │   ├── schedule/   # Manajemen hari operasional (kalender)
│   │   │   ├── pricing/    # Manajemen harga dinamis (CRUD harga/kg)
│   │   │   ├── vrp/        # Eksekutor algoritma VRP & pembagian rute
│   │   │   ├── analytics/  # Grafik tren, monitoring IoT status (online/offline)
│   │   │   └── layout.tsx  # Layout khusus admin
│   │   ├── api/            # API Routes (Serverless backend logic)
│   │   │   ├── iot/        # Endpoint HTTP POST untuk menerima payload dari ESP8266
│   │   │   ├── vrp/        # Endpoint eksekusi algoritma Vehicle Routing Problem
│   │   │   └── ai/         # Endpoint integrasi LLM (Gemini) & Image Recognition
│   │   ├── layout.tsx      # Root layout aplikasi (Global styles, provider)
│   │   └── page.tsx        # Landing page utama
│   ├── components/         # Reusable UI Components
│   │   ├── ui/             # Komponen UI dasar (Button, Input, Card, Modal, dll)
│   │   ├── nasabah/        # Komponen khusus Nasabah (Barcode/QR Generator)
│   │   ├── kurir/          # Komponen khusus Kurir (Scanner Camera Component)
│   │   └── admin/          # Komponen khusus Admin (Data Table, Charts)
│   ├── lib/                # Integrasi pihak ketiga & Utility
│   │   ├── supabase/       # Klien Supabase (Database & Supabase Storage)
│   │   ├── ai/             # Helper/Service AI (Integrasi Gemini, TF.js, dll)
│   │   ├── vrp/            # Helper algoritma / logic perhitungan VRP
│   │   └── utils.ts        # Fungsi utilitas (format mata uang, tanggal, cn tailwind)
│   ├── hooks/              # Custom React Hooks (misal: useScanner, useIoTData)
│   ├── store/              # Global State Management (Zustand/Context, jika perlu)
│   └── types/              # Definisi TypeScript interfaces & types (skema data)
├── .env.example            # Contoh file environment variables
├── next.config.mjs         # Konfigurasi Next.js (termasuk config PWA jika menggunakan library)
├── tailwind.config.ts      # Konfigurasi Tailwind CSS
└── package.json            # Daftar dependensi & script project
```

## Penjelasan Singkat

1. **`src/app/` (App Router)**:
   * **Route Groups (`(nasabah)`, `(kurir)`, `(admin)`)**: Digunakan untuk mengatur arsitektur berdasarkan persona pengguna tanpa memengaruhi struktur URL publik. Setiap *route group* dapat memiliki `layout.tsx` sendiri untuk navigasi spesifik (misal: sidebar khusus admin atau bottom navigation untuk kurir).
   * **`api/`**: Berfungsi sebagai *serverless API*. `api/iot` didedikasikan untuk *endpoint* yang akan menerima *HTTP POST* dari perangkat ESP8266 (ID timbangan dan berat), sedangkan `api/vrp` dan `api/ai` menangani proses logika yang lebih berat agar aman dan rahasia kodenya terjaga.

2. **`src/components/`**: Memisahkan komponen presentasional (*dumb components*) di `ui/` dengan komponen logikal/fitur spesifik ke dalam subfolder tiap persona.

3. **`src/lib/`**: Tempat berkumpulnya *wrapper* layanan eksternal. `supabase/` akan memuat klien untuk koneksi *PostgreSQL* dan *Storage*, sedangkan `ai/` akan berisi penghubung ke layanan *Computer Vision* dan LLM.

4. **`public/`**: Disiapkan untuk menampung manifest PWA dan *service worker*, mengingat sistem difokuskan pada aplikasi web yang harus bisa diinstal secara *native-like* di *smartphone* (PWA) layaknya aplikasi .apk/.ipa.
