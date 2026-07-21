# Spesifikasi Teknologi (Tech Stack) - UanginKuy

Dokumen ini merangkum seluruh spesifikasi teknologi, arsitektur layanan, dan integrasi pihak ketiga yang digunakan dalam pengembangan platform **UanginKuy**. Referensi teknologi ini diambil dari PRD, struktur folder, dan alur sistem.

---

## 1. Core Framework & Frontend
*   **Framework Utama:** Next.js (berbasis React JS) menggunakan fitur **App Router** (`src/app/`).
*   **Arsitektur Route:** Menggunakan *Route Groups* untuk memisahkan domain antarmuka tanpa memengaruhi URL publik:
    *   `(nasabah)`: Antarmuka Client Web. (Mobile-first) 
    *   `(kurir)`: Antarmuka Courier Web App (Mobile-first).
    *   `(admin)`: Antarmuka Admin Web Desktop.
*   **Styling & UI:** Tailwind CSS untuk antarmuka yang cepat dan *mobile-responsive*.
*   **Aplikasi Web (PWA):** Mendukung *Progressive Web App* agar aplikasi dapat diinstal secara *native-like* di *smartphone* pengguna (nasabah & kurir) tanpa membutuhkan file `.apk` atau `.ipa`.
*   **State Management:** Menggunakan React Context API atau pustaka ringan seperti Zustand (diletakkan di `src/store/`).

## 2. Backend & Serverless API
*   **Arsitektur Backend:** *Serverless API Routes* terintegrasi langsung di Next.js (`src/app/api/`).
*   **Deployment & Hosting:** **Vercel** (mengelola eksekusi CI/CD secara otomatis serta menjalankan fungsi *serverless*).

## 3. Database & Storage
*   **Layanan Basis Data:** **Supabase** (berbasis PostgreSQL).
*   **Penyimpanan Objek (Storage):** **Supabase Storage** (digunakan untuk menyimpan aset statis dinamis secara aman, seperti foto profil pengguna dan foto tumpukan sampah untuk diproses AI).

## 4. Kecerdasan Buatan (AI) & Algoritma
*   **AI Image Recognition:** Pemanfaatan *Computer Vision* (seperti Teachable Machine atau TensorFlow.js) untuk menganalisis foto unggahan nasabah, mengklasifikasi kategori material (Plastik, Kertas, Besi, dll.), serta memberikan estimasi harga.
*   **Conversational AI:** Integrasi *Large Language Model* (**Gemini API**) sebagai penggerak fitur Asisten AI/Chatbot untuk melayani tanya-jawab (FAQ) secara natural.
*   **Optimasi Rute Geospasial:** Implementasi algoritma **Vehicle Routing Problem (VRP)** secara terpusat untuk membagi wilayah kerja (*clustering*) dan menentukan rute terpendek antar titik jemput bagi multi-armada kurir.

## 5. Integrasi Perangkat Keras (IoT)
*   **Mikrokontroler:** **ESP8266** (dilengkapi modul Wi-Fi untuk konektivitas).
*   **Sensor Berat:** Menggunakan sensor **Load Cell** dan modul amplifier **HX711** untuk menimbang sampah secara presisi.
*   **Protokol Komunikasi Data:** ESP8266 mengirim *payload* data berformat JSON (berisi `id_timbangan` dan `berat`) ke endpoint khusus (`/api/iot`) menggunakan protokol **HTTP POST** secara *real-time*. Data ini akan langsung disinkronkan ke layar *smartphone* kurir.

## 6. Integrasi Layanan Pihak Ketiga & API Browser
*   **Scanner Library:** **HTML5-QRCode**, pustaka yang dijalankan murni di sisi *client/browser* untuk memanfaatkan kamera HP kurir memindai *E-Tiket (Barcode/QR Code)* nasabah.
*   **Payment Gateway:** **Midtrans (Payout API)**, digunakan untuk melayani fitur pencairan saldo (tarik tunai) nasabah secara otomatis dan instan, baik menuju rekening Bank maupun Dompet Digital (E-Wallet).
*   **Geolocation:** Memanfaatkan **Web Geolocation API** (HTML5) untuk merekam titik koordinat (GPS) *smartphone* nasabah secara otomatis pada saat melakukan pemesanan jadwal penjemputan.
*   **Interactive Maps:** Pemanfaatan **OpenFreeMap** sebagai penyedia *tile* gratis dan **MapLibre GL** (melalui `react-map-gl/maplibre`) untuk merender komponen peta visualisasi rute kurir.
*   **Navigation:** Penggunaan metode **Deep Link URL** (Google Maps) untuk melemparkan titik koordinat ke aplikasi native navigasi, sehingga *turn-by-turn routing* tidak membebani performa aplikasi web.
