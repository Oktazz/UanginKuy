# Alur Sistem Website TacionFit AI

Dokumen ini menjelaskan alur interaksi pengguna (user flow), antarmuka, serta logika bisnis yang diterapkan pada aplikasi **TacionFit AI**.

---

## 1. Antarmuka Pengguna (User Interface)

### 1.1. Sistem Navigasi Utama
Aplikasi menggunakan bilah navigasi samping (*sidebar*) di sebelah kiri layar dengan elemen navigasi sebagai berikut:
- **Logo TacionFit**: Terletak di bagian paling atas bilah navigasi samping.
- **Home/Beranda**: Menampilkan ringkasan latihan hari ini, profil pet pengguna, data BMI, dan riwayat aktivitas terbaru.
- **Nutrisi**: Menampilkan rekomendasi menu makanan harian serta estimasi asupan nutrisi harian.
- **Toko**: Galeri toko virtual untuk melakukan pembelian item untuk pet (seperti efek visual dan latar belakang) menggunakan koin virtual.
- **Profil**: Menampilkan data pribadi pengguna, rekapitulasi data fisik/BMI, dan riwayat aktivitas olahraga secara menyeluruh.

### 1.2. Tampilan Halaman Beranda (Home)
Halaman pertama yang diakses pengguna setelah berhasil masuk (*login*). Tampilan halaman ini terdiri dari:
- **Bagian Atas**:
  - Sisi Kiri: Foto profil pengguna disertai nama dan ucapan salam hangat.
  - Sisi Tengah: Indikator tingkat kemajuan level pengguna dilengkapi dengan bilah kemajuan (*progress bar*) EXP (Experience Points).
  - Sisi Kanan: Jumlah saldo koin virtual yang dimiliki pengguna.
- **Bagian Tengah**:
  - **Kartu Latihan Hari Ini**: Menyajikan daftar latihan terjadwal hari ini, detail perolehan hadiah (EXP & koin), serta tombol **"Mulai Latihan"**.
  - **Kartu Pet Pengguna**: Menampilkan visualisasi karakter pet digital pengguna, info level, status EXP, Poin Keahlian (Skill Points), **status energi (bar kelaparan)**, dan tombol **"Edit Pet"** / **"Upgrade Skill"**.
  - **Kartu Riwayat Aktivitas**: Menampilkan daftar aktivitas olahraga yang telah diselesaikan beserta perolehan koin dan EXP dari masing-masing aktivitas tersebut.
- **Bagian Bawah**:
  - Catatan kaki (*footer*) resmi TacionFit AI.

### 1.3. Tampilan Halaman Nutrisi
Halaman khusus yang menampilkan rekomendasi rencana makan harian yang dihasilkan oleh modul AI:
- **Bagian Atas**: Status profil, level (bilah EXP), dan saldo koin virtual (selaras dengan halaman beranda).
- **Bagian Tengah**:
  - Kartu rekomendasi menu makanan yang dibagi menjadi tiga kategori: Sarapan, Makan Siang, dan Makan Malam.
  - Panel ringkasan estimasi nilai gizi harian dari kombinasi makanan tersebut (Total Kalori, Protein, Karbohidrat, dan Lemak).
- **Bagian Bawah**: Catatan kaki (*footer*) resmi TacionFit AI.

### 1.4. Tampilan Halaman Toko
Halaman interaktif bagi pengguna untuk menukarkan koin virtual dengan item untuk pet (seperti makanan pet, efek visual, dan latar belakang):
- **Bagian Atas**: Status profil, level (bilah EXP), dan saldo koin virtual.
- **Bagian Tengah**:
  - Sisi Kanan: Pratinjau (*preview*) visual pet pengguna saat ini, info level pet, dan tombol **"Upgrade Skill"** / **"Edit Pet"**.
  - Sisi Kiri: Katalog toko yang terbagi menjadi kategori, seperti **Makanan Pet**, **Border Avatar**, **Efek Visual** (contoh: efek petir), dan **Latar Belakang**, beserta harga pembelian dalam koin virtual.
- **Bagian Bawah**: Catatan kaki (*footer*) resmi TacionFit AI.

### 1.5. Tampilan Halaman Profil
Halaman administrasi profil dan informasi kebugaran pribadi pengguna:
- **Bagian Atas**: Status profil, level (bilah EXP), dan saldo koin virtual.
- **Bagian Tengah**:
  - Panel data fisik (Nama, Umur, Jenis Kelamin, Tinggi Badan, Berat Badan, serta skor BMI aktual) yang dilengkapi dengan tombol **"Ubah Data"**.
  - Panel riwayat lengkap aktivitas olahraga yang diurutkan secara kronologis.
- **Bagian Bawah**: Catatan kaki (*footer*) resmi TacionFit AI.

---

## 2. Alur Kerja Sistem (System Flow)

### 2.1. Alur Masuk (Login) dan Registrasi
1. **Proses Masuk (Login)**:
   - Pengguna memasukkan email dan kata sandi pada halaman login.
   - Pilihan alternatif: masuk cepat menggunakan kredensial Google, tombol reset kata sandi ("Lupa Kata Sandi"), atau navigasi ke halaman pendaftaran ("Daftar Akun Baru").
   - Sistem memvalidasi input. Jika kredensial cocok, pengguna dialihkan ke halaman **Beranda**. Jika salah, sistem akan menampilkan pesan kesalahan (*error*).
2. **Proses Registrasi**:
   - Calon pengguna mengisi data pendaftaran berupa Nama Lengkap, Email, Kata Sandi, dan Konfirmasi Kata Sandi.
   - Sistem memverifikasi validitas format email dan kesesuaian kata sandi.
   - Jika berhasil, akun baru dibuat dan pengguna diarahkan ke langkah pengumpulan data awal.

### 2.2. Pengumpulan Data Awal Pengguna
1. Setelah berhasil melakukan registrasi pertama kali, pengguna diwajibkan melengkapi profil fisik dasar:
   - Nama, Umur, Jenis Kelamin, Tinggi Badan (cm), dan Berat Badan (kg).
2. Sistem mengalkulasi skor *Body Mass Index* (BMI) berdasarkan data tinggi dan berat badan pengguna dengan klasifikasi sebagai berikut:
   - BMI < 18,5: Kekurangan berat badan (*Underweight*)
   - BMI 18,5 – 24,9: Berat badan ideal (*Normal*)
   - BMI 25,0 – 29,9: Kelebihan berat badan (*Overweight*)
   - BMI 30,0 – 34,9: Obesitas Kelas 1
   - BMI 35,0 – 39,9: Obesitas Kelas 2
   - BMI ≥ 40,0: Obesitas Kelas 3
3. Sistem menyimpan data fisik tersebut ke database untuk personalisasi fitur AI. Pengguna dapat mengubah parameter fisik ini sewaktu-waktu melalui halaman **Profil -> Ubah Data**.
4. **Pemilihan Pet Pertama**: Setelah melengkapi data fisik, pengguna akan diminta memilih pet pertama mereka. Beberapa pilihan pet awal yang tersedia antara lain: **Kucing, Anjing, Golem Batu, Naga Kecil (Dragon), Slime, dan Phoenix**. Pet ini akan menjadi pendamping gamifikasi pengguna selama menggunakan aplikasi.

### 2.3. Alur Rekomendasi Latihan dan Gizi (AI Engine)
1. Setelah pengguna memasukkan parameter fisik, modul kecerdasan buatan (AI) akan menyusun rencana program latihan mingguan (selama 7 hari). Program ini bersifat dinamis dan disesuaikan dengan BMI, umur, jenis kelamin, serta riwayat keaktifan latihan sebelumnya. Rekomendasi ini diperbarui secara berkala setiap minggu (*continuous update*).
2. Rekomendasi gizi dan menu makanan setiap hari dalam 1 minggu disesuaikan secara dinamis dengan beban latihan terjadwal pada rekomendasi latihan
   - **Sarapan**: Contoh menu ringan kaya serat dan karbohidrat kompleks (misal: oatmeal dengan buah-buahan).
   - **Makan Siang**: Contoh menu berprotein tinggi (misal: dada ayam panggang dengan sayuran hijau).
   - **Makan Malam**: Contoh menu pemulihan otot (misal: fillet salmon panggang dengan nasi merah).
3. Rencana program latihan mingguan serta rekomendasi gizi disimpan ke database dalam format dokumen JSON terstruktur.

#### Contoh Skema JSON Rencana Latihan Mingguan
```json
{
  "jadwal_mingguan": [
    {
      "hari": "Senin",
      "fokus_latihan": "Kekuatan Tubuh Bagian Atas",
      "istirahat_penuh": false,
      "daftar_gerakan": [
        {
          "nama_gerakan": "Push-Up",
          "set": 3,
          "target_repetisi": 10,
          "durasi_detik": 0
        },
        {
          "nama_gerakan": "Plank",
          "set": 3,
          "target_repetisi": 0,
          "durasi_detik": 30
        }
      ],
      "tips_harian": "Pastikan inti tubuh (core) selalu kencang agar postur tidak melengkung."
    },
    {
      "hari": "Selasa",
      "fokus_latihan": "Pemulihan (Rest Day)",
      "istirahat_penuh": true,
      "daftar_gerakan": [],
      "tips_harian": "Gunakan hari ini untuk peregangan ringan dan minum banyak air putih."
    }
  ]
}
```

#### Contoh Skema JSON Menu Makanan & Ringkasan Gizi Harian
```json
{
  "jadwal_mingguan": [
    {
      "hari": "Senin",
      "fokus_latihan": "Kekuatan Tubuh Bagian Atas",
      "istirahat_penuh": false,
      "daftar_gerakan": [
        { "nama_gerakan": "Push-Up", "target_repetisi": 10 }
      ],
      "gizi_harian": {
        "menu": {
          "sarapan": "Roti gandum dan 2 telur rebus",
          "makan_siang": "Nasi merah dan dada ayam panggang",
          "makan_malam": "Tumis brokoli dan tahu"
        },
        "target_makro": {
          "total_kalori": 2100,
          "protein_gram": 140
        }
      }
    },
    {
      "hari": "Selasa",
      "fokus_latihan": "Pemulihan (Rest Day)",
      "istirahat_penuh": true,
      "daftar_gerakan": [],
      "gizi_harian": {
        "menu": {
          "sarapan": "Smoothie pisang dan bayam",
          "makan_siang": "Salad tuna dengan minyak zaitun",
          "makan_malam": "Sup dada ayam kuah bening"
        },
        "target_makro": {
          "total_kalori": 1800, // Kalori turun karena tidak ada latihan
          "protein_gram": 110
        }
      }
    }
    // ... Lanjut hingga hari Minggu
  ]
}
```

### 2.4. Alur Pelaksanaan Latihan (Workout Execution)
Ketika pengguna menekan tombol **"Mulai Latihan"** pada Beranda, sistem akan mengevaluasi jenis latihan dan memprosesnya sebagai berikut:

#### A. Latihan Kardiovaskular (Lari, Bersepeda, Jalan Cepat)
1. Karena keterbatasan stabilitas dan akurasi pelacakan lokasi berbasis GPS pada peramban web (*browser*), sistem mewajibkan pengguna mengunggah bukti latihan berupa tangkapan layar (*screenshot*) dari aplikasi pelacak kebugaran pihak ketiga (seperti Strava, Garmin, Nike Run Club, dll.).
2. Alur Pelaksanaan Latihan:
   - Pengguna menekan tombol "Mulai Latihan" pada Beranda.
   - Sistem membuka halaman unggah berkas (*upload page*) yang menyajikan informasi target latihan (misal: "Lari 3 KM").
   - Pengguna mengunggah gambar tangkapan layar aktivitas olahraga mereka.
   - Sistem mengirimkan berkas tersebut ke backend untuk diproses dan divalidasi.
3. **Teknik Verifikasi Hasil Tangkapan Layar**:
   - **Tahap 1: Ekstraksi Data oleh Gemini Vision**
     Saat pengguna mengunggah foto, backend mengirimkan gambar tersebut ke Gemini API beserta *System Prompt* khusus untuk mengekstrak informasi tekstual dan mengonversinya menjadi data JSON.
     *Contoh Prompt Evaluator:*
     ```javascript
     "Kamu adalah sistem verifikasi data olahraga. Analisis gambar tangkapan layar aplikasi olahraga (seperti Strava) ini.
     Ekstrak informasi berikut dan kembalikan HANYA dalam format JSON:
     {
       "is_valid_app_screenshot": boolean, // true jika gambar ini benar-benar terlihat seperti UI aplikasi olahraga, false jika ini gambar acak/selfie.
       "tanggal_aktivitas": "YYYY-MM-DD", // Coba cari tanggal aktivitas di layar
       "jenis_aktivitas": "Lari/Sepeda/Jalan",
       "jarak_km": float,
       "durasi_menit": float
     }"
     ```
   - **Tahap 2: Lapis Verifikasi di Logika Backend (Validasi Berlapis)**
     Setelah memperoleh respon JSON dari Gemini, backend Next.js mengeksekusi logika validasi berlapis:
     - **Verifikasi Keaslian Gambar (Anti-Gambar Palsu)**: Sistem mengecek nilai `is_valid_app_screenshot`. Jika bernilai `false`, sistem langsung menolak unggahan dengan pesan: *"Gambar tidak valid. Harap unggah tangkapan layar aplikasi olahraga Anda."*
     - **Verifikasi Tanggal (Anti-Daur Ulang)**: Sistem membandingkan `tanggal_aktivitas` dari JSON dengan tanggal hari ini di server. Jika tidak cocok (menggunakan aktivitas masa lalu), sistem menampilkan pesan penolakan: *"Aktivitas ini sudah kedaluwarsa, harus aktivitas hari ini!"*
     - **Verifikasi Target Terselesaikan (Pencocokan Target)**: Sistem mengambil target jarak dari tabel rencana latihan `ai_plans` pengguna.
       - Jika `jarak_km` ≥ target latihan: Latihan dinilai selesai penuh, pengguna mendapatkan 100% hadiah EXP dan koin virtual.
       - Jika `jarak_km` < target latihan: Latihan dinilai selesai sebagian, sistem memberikan feedback: *"Kamu belum mencapai target jarak, tapi kerja bagus sudah mencoba!"* dan memberikan hadiah 50% EXP.
     - **Verifikasi Duplikasi (Anti-Spam)**: Backend memindai tabel `workout_logs` untuk mendeteksi kesamaan parameter jarak dan durasi aktivitas pengguna pada hari yang sama. Jika terdeteksi duplikasi data, unggahan ditolak untuk mencegah spamming hadiah menggunakan berkas yang sama.
4. Setelah seluruh proses verifikasi selesai, sistem menyimpan log ke database, menampilkan ringkasan data, dan mengarahkan pengguna kembali ke halaman Beranda.

#### B. Latihan Repetitif (Push-Up, Sit-Up, Jumping Jack)
1. Sistem meminta izin akses kamera perangkat keras (Webcam).
2. Sistem mengaktifkan **Screen Wake Lock API** untuk mengunci layar agar tidak mati atau meredup (*dimming*) secara otomatis selama aktivitas latihan menggunakan kamera berlangsung.
3. Sistem membuka antarmuka latihan yang menampilkan umpan kamera aktif (*live camera feed*), target repetisi, jumlah repetisi yang telah dicapai, sisa repetisi, dan pengukur waktu.
4. Modul *Computer Vision* memantau gerakan fisik pengguna melalui deteksi pose tubuh.
5. Sistem memperbarui jumlah hitungan repetisi
6. Setelah latihan selesai diselesaikan:
   - Sistem melepaskan (*release*) kuncian layar dari **Screen Wake Lock API**.
   - Sistem menampilkan ringkasan data latihan (total repetisi, durasi, kalori terbakar, penambahan EXP, dan koin).
   - Menyimpan detail data ke database dan menambahkannya ke catatan riwayat aktivitas.
7. Pengguna diarahkan kembali ke halaman Beranda.

### 2.5. Alur Sistem Pet & Toko (Gamifikasi)

Sistem gamifikasi pada TacionFit AI berpusat pada pemeliharaan dan peningkatan **Pet** peliharaan pengguna.

1. **Sistem Upgrade Skill**:
   - Pet memiliki sistem upgrade skill yang memberikan bonus pasif bagi pengguna.
   - Setiap kali pet mencapai **level kelipatan 2** (Level 2, 4, 6, 8, dst.), pengguna akan mendapatkan **1 Poin Keahlian (Skill Point)**.
   - Pengguna dapat mengalokasikan poin ini secara manual pada antarmuka "Upgrade Skill" (dapat diakses dari Beranda atau Toko).
   - Terdapat **3 pilihan keahlian utama** yang dapat ditingkatkan (di-*upgrade*):
     1. **Bonus Koin**: Peningkatan +2% koin (Maksimal di angka 20% atau 10 kali *upgrade*).
     2. **Diskon Makanan Pet**: Peningkatan +1% diskon (Maksimal di angka 10% atau 10 kali *upgrade*).
     3. **Bonus EXP**: Peningkatan +2% EXP (Maksimal di angka 20% atau 10 kali *upgrade*).

2. **Sistem Energi & Bertahan Hidup (Survival)**:
   - Setiap harinya, **energi pet akan berkurang sebanyak 20%**.
   - Pengguna wajib memberi makan petnya setiap hari agar energi tidak habis (mencapai 0%) yang dapat mengakibatkan **pet mati**.
   - **Mekanisme Kebangkitan (Revive)**: Pet yang mati masih dapat dihidupkan kembali, namun membutuhkan biaya sangat besar yaitu **500 koin virtual**. Sebagai penalti tambahan, **level pet dan seluruh progres Pohon Keahlian akan di-reset kembali ke 0**.
   - Makanan pet dapat dibeli menggunakan koin virtual di halaman Toko.
   - Mekanisme ini ditujukan untuk memotivasi pengguna agar rutin berolahraga setiap hari demi mendapatkan koin virtual yang cukup untuk memberi makan petnya.

3. **Pembelian Efek Visual (Shop)**:
   - Pengguna dapat membeli kosmetik berupa **Efek Visual** untuk pet (contoh: efek petir, efek aura api).
   - Efek visual ini akan aktif dan muncul secara berkala (misal: setiap 5 detik) saat pengguna melihat pet di halaman Beranda (Dashboard).
   - Efek visual ini juga akan memicu animasi *reward* ketika pengguna berhasil menyelesaikan **1 set gerakan** di depan kamera saat berlatih, memberikan dorongan motivasi seketika.

4. **Pembelian Aksesori & Latar Belakang (Shop)**:
   - Pengguna dapat membeli **Latar Belakang (Background)** untuk memodifikasi lingkungan ruang penempatan pet mereka, agar tampilan lebih personal dan menarik.
   - Pengguna juga dapat membeli **Border Avatar** (bingkai foto) untuk menghias foto profil utama pengguna.

5. **Alur Transaksi Toko**:
   - Pengguna memilih makanan pet, efek visual, latar belakang, atau border avatar dari katalog Toko.
   - Sistem memverifikasi ketersediaan saldo koin.
   - Jika berhasil: Konfirmasi pembelian ditampilkan -> Saldo koin dikurangi -> Item diterapkan langsung pada pet pengguna.
   - Jika gagal: Sistem menampilkan notifikasi kegagalan transaksi karena saldo koin tidak mencukupi.

6. **Alur Peningkatan Keahlian (Skill Upgrade)**:
   - Pengguna menekan tombol "Upgrade Skill".
   - Sistem menampilkan sisa Poin Keahlian (Skill Points) dan tingkat level dari 3 keahlian utama.
   - Pengguna mengonfirmasi alokasi poin ke salah satu keahlian.
   - Sistem memvalidasi ketersediaan poin dan batas maksimal keahlian. Jika valid, level keahlian bertambah dan bonus persentase akan aktif secara permanen.

---

## 3. Spesifikasi Algoritma Computer Vision (Deteksi & Perhitungan Repetisi)

Aplikasi menggunakan framework **MediaPipe Pose (33 Landmarks)** yang berjalan sepenuhnya di sisi klien (*client-side*) via peramban web (*browser*). Algoritma memanfaatkan teknologi WebGL/WASM untuk mencapai waktu pemrosesan sangat cepat (latensi < 30ms) tanpa mengirimkan data video ke server, demi menjamin privasi pengguna.

### 3.1. Landmark Tubuh Utama yang Digunakan
Untuk memantau gerakan dan menghitung sudut sendi, algoritma memetakan indeks landmark tubuh berikut:
- **Bahu Kiri & Kanan (Left/Right Shoulder)**: Indeks 11, 12
- **Siku Kiri & Kanan (Left/Right Elbow)**: Indeks 13, 14
- **Pergelangan Tangan Kiri & Kanan (Left/Right Wrist)**: Indeks 15, 16
- **Pinggul Kiri & Kanan (Left/Right Hip)**: Indeks 23, 24
- **Lutut Kiri & Kanan (Left/Right Knee)**: Indeks 25, 26
- **Pergelangan Kaki Kiri & Kanan (Left/Right Ankle)**: Indeks 27, 28

### 3.2. Metode Perhitungan Sudut Sendi (Joint Angle Calculation)
Sudut sendi dihitung pada koordinat 2D (sumbu X dan Y) menggunakan tiga titik landmark berurutan: $A$ (pangkal), $B$ (titik pusat/sendi), dan $C$ (ujung).
Rumus perhitungan menggunakan konsep vektor sebagai berikut:

$$\vec{BA} = (A.x - B.x, A.y - B.y)$$
$$\vec{BC} = (C.x - B.x, C.y - B.y)$$

$$\theta = \arccos\left(\frac{\vec{BA} \cdot \vec{BC}}{|\vec{BA}| \times |\vec{BC}|}\right) \times \frac{180}{\pi}$$

*Keterangan:* `.` melambangkan perkalian titik (*dot product*) dan `|V|` melambangkan nilai magnitudo (panjang) dari vektor.

### 3.3. Logika Perhitungan Repetisi Berdasarkan Olahraga

#### A. Push-Up
- **Sudut Pengambilan Gambar**: Tampak Samping (*Lateral View*) untuk menangkap profil kelurusan tubuh dan sudut fleksi lengan secara optimal.
- **Sudut Kunci**:
  - **Sudut Siku (Elbow Angle)**: Sudut yang dibentuk oleh Bahu -> Siku -> Pergelangan Tangan.
  - **Sudut Kelurusan Tubuh (Alignment Angle)**: Sudut yang dibentuk oleh Bahu -> Pinggul -> Pergelangan Kaki.
- **Mesin Status (Finite State Machine)**:
  - **State "CALIBRATING / IDLE"**: Pengguna harus berada pada posisi awal/siaga (lengan lurus, Sudut Siku $> 165^\circ$, dan punggung lurus, Sudut Kelurusan Tubuh $160^\circ - 180^\circ$) secara stabil selama **2-3 detik**. Setelah sistem mendeteksi kestabilan posisi awal (ditandai dengan bunyi *beep*), sistem berpindah ke state **UP** dan hitungan repetisi diaktifkan.
  - **State "UP" (Posisi Lengan Lurus)**: Terpicu setelah fase kalibrasi awal sukses dan lengan dalam keadaan lurus (Sudut Siku $> 165^\circ$).
  - **State "DOWN" (Posisi Dada Rendah)**: Terpicu saat dada diturunkan hingga siku menekuk (Sudut Siku $< 90^\circ$).
- **Aturan Repetisi & Validasi Form**:
  - Repetisi dinyatakan sah (+1) jika pengguna melakukan transisi penuh dari state **UP $\rightarrow$ DOWN $\rightarrow$ UP**.
  - **Analisis Kualitas Gerakan (Form Validation)**: Sudut Kelurusan Tubuh harus berada pada rentang $160^\circ - 180^\circ$. Apabila pinggul terlalu naik (membentuk gunung) atau terlalu turun (melorot) sehingga sudut keluar dari batas toleransi tersebut, sistem akan menampilkan peringatan teks secara langsung di layar: *"Jaga punggung tetap lurus!"*.

#### B. Sit-Up
- **Sudut Pengambilan Gambar**: Tampak Samping (*Lateral View*).
- **Sudut Kunci**:
  - **Sudut Pinggul (Hip Angle)**: Sudut yang dibentuk oleh Bahu -> Pinggul -> Lutut.
- **Mesin Status (Finite State Machine)**:
  - **State "CALIBRATING / IDLE"**: Pengguna harus berbaring telentang di lantai dalam posisi awal (Sudut Pinggul $> 130^\circ$) secara stabil selama **2-3 detik**. Setelah sistem mendeteksi posisi awal yang stabil (ditandai dengan bunyi *beep*), sistem berpindah ke state **DOWN** dan hitungan repetisi diaktifkan.
  - **State "DOWN" (Posisi Berbaring)**: Terpicu setelah fase kalibrasi awal sukses dan tubuh dalam posisi terlentang (Sudut Pinggul $> 130^\circ$).
  - **State "UP" (Posisi Duduk Tegak)**: Terpicu saat tubuh naik ke posisi duduk (Sudut Pinggul $< 45^\circ$).
- **Aturan Repetisi & Validasi Form**:
  - Repetisi dinyatakan sah (+1) jika pengguna berhasil melakukan transisi penuh dari state **DOWN $\rightarrow$ UP $\rightarrow$ DOWN**.
  - **Analisis Kualitas Gerakan (Form Validation)**: Punggung harus diturunkan hingga menyentuh lantai (atau Sudut Pinggul $> 130^\circ$) sebelum melakukan gerakan naik berikutnya. Gerakan setengah-setengah (*half-reps*) tidak akan dihitung, dan sistem akan memberikan peringatan visual/suara: *"Turunkan tubuh Anda sepenuhnya!"*.

#### C. Jumping Jack
- **Sudut Pengambilan Gambar**: Tampak Depan (*Frontal View*).
- **Variabel Kunci**:
  - **Tinggi Tangan (Hand Level)**: Posisi vertikal sumbu Y dari pergelangan tangan (15, 16) dibandingkan dengan posisi bahu (11, 12). Posisi di atas kepala didefinisikan sebagai $y_{\text{wrist}} < y_{\text{shoulder}}$ (dalam sistem koordinat kanvas layar, koordinat Y = 0 berada di bagian paling atas).
  - **Lebar Kaki (Leg Spread Ratio)**: Jarak horizontal sumbu X antara kedua pergelangan kaki (27, 28) dibagi dengan lebar bahu (jarak horizontal X antara bahu 11 dan 12).
- **Mesin Status (Finite State Machine)**:
  - **State "CALIBRATING / IDLE"**: Pengguna harus berdiri tegak secara diam/stabil (kedua tangan berada di bawah bahu dan kaki rapat dengan Leg Spread Ratio $< 1.2$) selama **2-3 detik**. Setelah terdeteksi stabil (ditandai dengan bunyi *beep*), sistem berpindah ke state **REST** dan hitungan repetisi diaktifkan.
  - **State "REST" (Berdiri Tegak / Rapat)**:
    - Kedua pergelangan tangan berada di bawah bahu: $y_{\text{wrist}} > y_{\text{shoulder}}$.
    - Lebar Kaki (Leg Spread Ratio) $< 1.2$ (kedua kaki dalam keadaan rapat/berdekatan).
  - **State "OPEN" (Melompat Terbuka)**:
    - Kedua pergelangan tangan berada di atas bahu/kepala: $y_{\text{wrist}} < y_{\text{shoulder}}$.
    - Lebar Kaki (Leg Spread Ratio) $> 1.8$ (kedua kaki dalam keadaan terbuka lebar).
- **Aturan Repetisi & Validasi Form**:
  - Repetisi dinyatakan sah (+1) jika pengguna berhasil melakukan transisi penuh dari state **REST $\rightarrow$ OPEN $\rightarrow$ REST**.
  - **Analisis Kualitas Gerakan (Form Validation)**: Jika pengguna melebarkan kaki tetapi tidak mengangkat tangan di atas tingkat bahu dengan benar, repetisi tidak bertambah dan sistem akan memberi peringatan: *"Angkat tangan Anda lebih tinggi!"*.

#### D. Squat
- **Sudut Pengambilan Gambar**: Tampak Samping (*Lateral View*).
- **Sudut Kunci**:
  - **Sudut Pinggul (Hip Angle)**: Sudut yang dibentuk oleh Bahu -> Pinggul -> Lutut.
  - **Sudut Lutut (Knee Angle)**: Sudut yang dibentuk oleh Pinggul -> Lutut -> Pergelangan Kaki.
- **Mesin Status (Finite State Machine)**:
  - **State "CALIBRATING / IDLE"**: Pengguna harus berdiri tegak di posisi awal (Sudut Pinggul $> 160^\circ$ dan Sudut Lutut $> 160^\circ$) secara stabil selama **2-3 detik**. Setelah sistem mendeteksi kestabilan (ditandai dengan bunyi *beep*), sistem berpindah ke state **UP** dan hitungan repetisi diaktifkan.
  - **State "UP" (Posisi Berdiri Tegak)**: Terpicu setelah fase kalibrasi awal sukses dan posisi tubuh berdiri lurus (Sudut Lutut $> 160^\circ$).
  - **State "DOWN" (Posisi Jongkok)**: Terpicu saat pengguna melakukan jongkok hingga paha sejajar dengan lantai (Sudut Lutut $< 90^\circ$).
- **Aturan Repetisi & Validasi Form**:
  - Repetisi dinyatakan sah (+1) jika pengguna berhasil melakukan transisi penuh dari state **UP $\rightarrow$ DOWN $\rightarrow$ UP**.
  - **Analisis Kualitas Gerakan (Form Validation)**: Saat posisi jongkok, paha harus setidaknya sejajar dengan lantai (Sudut Lutut $< 90^\circ$). Jika sudut lutut tidak mencapai batas tersebut, repetisi tidak bertambah dan sistem akan memberikan peringatan: *"Turun lebih rendah!"*.

#### E. Plank
- **Sudut Pengambilan Gambar**: Tampak Samping (*Lateral View*).
- **Sudut Kunci**:
  - **Sudut Kelurusan Tubuh (Alignment Angle)**: Sudut yang dibentuk oleh Bahu -> Pinggul -> Pergelangan Kaki.
- **Mesin Status (Finite State Machine)**:
  - **State "CALIBRATING / IDLE"**: Pengguna harus mengambil posisi plank dasar (menopang tubuh dengan lengan bawah/siku, ujung kaki menyentuh lantai, dan punggung lurus dengan Sudut Kelurusan Tubuh berada pada rentang $160^\circ - 180^\circ$) secara stabil selama **2-3 detik**.
  - **State "READY" (Hitung Mundur)**: Setelah sistem mendeteksi posisi awal yang stabil, sistem memberikan hitung mundur: *"3... 2... 1... Mulai!"*. Jika postur rusak sebelum hitung mundur selesai, proses dibatalkan dan kembali ke state **CALIBRATING**.
  - **State "HOLDING" (Sedang Menahan Plank)**: Terpicu setelah hitung mundur selesai. Pengatur waktu (timer) plank akan mulai berjalan selama pengguna berhasil mempertahankan Sudut Kelurusan Tubuh pada rentang $160^\circ - 180^\circ$.
  - **State "REST" (Postur Jatuh / Istirahat)**: Terpicu jika postur tubuh melengkung atau rusak (Sudut Kelurusan Tubuh $< 150^\circ$ atau $> 190^\circ$). Timer akan berhenti (jeda) sementara hingga pengguna kembali ke posisi yang benar.
- **Aturan Durasi & Validasi Form**:
  - Latihan Plank tidak dihitung berdasarkan repetisi, melainkan dihitung berdasarkan **total durasi waktu (dalam detik) bertahannya postur tubuh dalam state HOLDING**.
  - **Analisis Kualitas Gerakan (Form Validation)**: Punggung harus tetap lurus sejajar. Jika pinggul melorot turun (Sudut Kelurusan Tubuh $< 150^\circ$), sistem memberikan peringatan: *"Angkat pinggul Anda!"*. Jika pinggul naik terlalu tinggi menyerupai gunung (Sudut Kelurusan Tubuh $> 190^\circ$), peringatan: *"Turunkan pinggul Anda!"*.

### 3.4. Penanganan Derau dan Peningkatan Akurasi (Noise Filtering & Robustness)
- **Histeresis (Hysteresis Buffer)**: Untuk mencegah pembacaan ganda (*flickering*) akibat getaran kecil tubuh pengguna pada ambang batas (threshold), diberikan rentang toleransi sebesar $\pm 5^\circ$ sebelum mesin status berpindah keadaan.
- **Filter Exponential Moving Average (EMA)**: Koordinat landmarks yang dihasilkan oleh MediaPipe disaring menggunakan rumus EMA dengan bobot penghalusan ($\alpha = 0.5$) untuk menstabilkan pembacaan dari sensor kamera yang bergetar (*jittering*).
- **Kalibrasi Awal & Cek Visibilitas (Pose Visibility Check)**: Sebelum latihan dimulai, sistem akan mengevaluasi tingkat keyakinan (*visibility score*) dari landmark penting. Latihan hanya dapat dimulai apabila seluruh landmark kunci terdeteksi oleh kamera dengan nilai kepercayaan $> 75\%$.