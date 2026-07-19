# Product Requirements Document (PRD)

**Nama Produk:** UanginKuy  
**Konteks:** Lomba Young Coder World Cup (YCWC)  
**Status:** Perencanaan Final  

## 1. Ringkasan Proyek (Project Overview)
**UanginKuy** adalah platform aplikasi web pintar yang mendigitalisasi proses penyetoran sampah daur ulang dari rumah nasabah ke pengepul (bank sampah). Menggunakan arsitektur *serverless*, platform ini memaksimalkan efisiensi logistik melalui sistem penjadwalan dinamis dan algoritma *Vehicle Routing Problem* (VRP). UanginKuy memastikan transparansi penuh melalui integrasi timbangan digital IoT (ESP8266) dan memberikan pengalaman pengguna yang modern melalui fitur estimasi cerdas berbasis AI.

## 2. Pengguna Sasaran (User Personas)
*   **Nasabah (Client):** Pengguna akhir yang ingin menyetor barang bekas sesuai hari operasional yang dibuka oleh pengepul.
*   **Kurir (Petugas Penjemput):** Staf lapangan yang bertugas menjemput barang bekas mengikuti rute harian yang telah dioptimasi oleh sistem, menggunakan *smartphone* sebagai alat kerja utama.
*   **Admin (Pengepul):** Pengelola sistem yang memiliki otoritas mengatur jadwal operasional, menentukan harga beli sampah, dan mengeksekusi pembagian rute kurir.

## 3. Kebutuhan Fitur Inti (Core Features)

### A. Modul Nasabah (Client Web)
*   **Dashboard Interaktif:**
    *   Tampilan total saldo berjalan (Rp).
    *   Visualisasi proporsi jenis sampah yang pernah disetor (*Pie Chart*).
    *   *Environmental Impact Tracker* (Kalkulasi penghematan emisi karbon atau setara pohon dari total berat sampah).
*   **Sistem Penjadwalan & Pemesanan Tiket:**
    *   **Kalender Selektif Dinamis:** Menampilkan dan hanya mengizinkan pemilihan tanggal penjemputan pada hari-hari operasional yang telah ditetapkan oleh Admin.
    *   **Estimasi AI:** Fitur unggah foto barang bekas yang akan dianalisis oleh AI untuk mendeteksi kategori (Plastik/Logam/Kertas) dan memberikan estimasi harga.
    *   **Tiket Elektronik:** *Barcode/QR Code* yang berisi ID Transaksi untuk dipindai oleh kurir saat penjemputan.
*   **Asisten AI (Chatbot):**
    *   Layanan tanya-jawab otomatis seputar panduan penggunaan, jenis sampah yang diterima, dan FAQ aplikasi.

### B. Modul Kurir (Courier Web App)
*   **Dashboard Rute Harian:**
    *   Menampilkan daftar titik penjemputan (*waypoints*) yang sudah diurutkan berdasarkan optimasi rute dari sistem AI, memastikan efisiensi perjalanan dari titik ke titik.
*   **Eksekusi Penjemputan Terintegrasi:**
    *   *Scanner Web* terintegrasi yang memanfaatkan kamera *smartphone* bawaan kurir untuk memindai tiket/QR Code nasabah.
    *   *Dropdown* pemilihan kategori material secara spesifik (Plastik PET, Kardus, Besi, dll).
    *   **IoT Sync:** Sinkronisasi *real-time* data berat (kg) yang dikirim langsung dari timbangan ESP8266 ke layar *smartphone* kurir, menghilangkan proses input manual.
    *   Tombol "Selesaikan Penjemputan" yang akan otomatis mengakumulasi saldo nasabah sesuai harga per kategori.

### C. Modul Admin (Admin Web)
*   **Manajemen Jadwal Operasional (SaaS Approach):**
    *   Panel kalender khusus untuk membuka, mengubah, atau menghapus hari ketersediaan penjemputan secara bebas.
*   **Manajemen Harga Dinamis:**
    *   Fitur CRUD untuk memperbarui harga beli per kilogram (Rp/kg) pada setiap jenis material sampah mengikuti fluktuasi pasar.
*   **Manajemen Rute Kurir (VRP Executor):**
    *   Pengaturan batas waktu pemesanan (*cut-off time*) untuk setiap hari operasional.
    *   Tombol **"Generate Rute AI"** untuk menjalankan algoritma pembagian dan pengurutan titik penjemputan secara adil kepada seluruh armada kurir yang bertugas di hari tersebut.
*   **Monitoring IoT & Analitik:**
    *   Indikator status *online/offline* perangkat timbangan IoT.
    *   Grafik analitik mengenai tren volume sampah dan metrik operasional harian/bulanan.

## 4. Kebutuhan Integrasi Perangkat Keras (IoT)
*   **Hardware Utama:** Mikrokontroler ESP8266 terhubung dengan sensor *Load Cell* dan modul *amplifier* HX711.
*   **Komunikasi Data:** Menggunakan protokol HTTP POST. ESP8266 terhubung via koneksi Wi-Fi/Tethering kurir, membaca berat dari *load cell*, dan mengirim *payload* berformat JSON (berisi `id_timbangan` dan `berat`) langsung ke *endpoint* API Next.js.

## 5. Kebutuhan Kecerdasan Buatan (AI Integrations)
1.  **AI Image Recognition:** Menggunakan *Computer Vision* (seperti Teachable Machine atau TensorFlow.js) untuk memproses foto unggahan nasabah guna memprediksi jenis tumpukan sampah dan estimasi biayanya.
2.  **Vehicle Routing Problem (VRP) Algorithm:** Algoritma spasial untuk melakukan *clustering* (pembagian wilayah kerja) dan optimasi rute terpendek untuk skenario *multi-courier*.
3.  **Conversational AI:** Integrasi dengan *Large Language Model* (seperti Gemini API) untuk menjalankan *chatbot* layanan pelanggan yang natural.

## 6. Spesifikasi Teknologi (Tech Stack)
*   **Framework Utama (Frontend & API):** Next.js (berbasis React JS).
*   **Styling / UI:** Tailwind CSS untuk tampilan yang *mobile-responsive*.
*   **Database:** PostgreSQL (dikelola melalui layanan **Supabase**).
*   **Penyimpanan Objek (Storage):** Supabase Storage (untuk penyimpanan aman foto profil dan foto sampah nasabah).
*   **Deployment & Hosting:** Vercel (untuk eksekusi CI/CD dan fungsi *serverless*).
*   **Scanner Library:** HTML5-QRCode (dijalankan di sisi *client/browser* kurir).

## 7. Batasan Sistem (Out of Scope)
*   Pengembangan aplikasi *native* (.apk/.ipa) tidak dilakukan. Seluruh akses difasilitasi melalui aplikasi berbasis web (*Progressive Web App* / PWA).
*   Tidak ada sistem *live tracking* GPS pergerakan kurir secara *real-time* layaknya aplikasi ojek *online*. Visibilitas nasabah dibatasi pada pembaruan status sistem (Menunggu Hari-H -> Sedang Dijemput -> Selesai).