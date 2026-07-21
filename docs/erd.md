# Rancangan Struktur Database (ERD) - UanginKuy

**Platform:** Supabase (PostgreSQL)  
**Konteks:** Ekosistem terintegrasi dengan Next.js, IoT ESP8266, dan Payment Gateway (Midtrans).

---

## 1. Relasi Antar Tabel (Conceptual Schema)
*   **`profiles`** memiliki banyak **`tickets`** (relasi 1:N sebagai nasabah).
*   **`profiles`** memiliki banyak **`tickets`** (relasi 1:N sebagai kurir yang ditugaskan).
*   **`profiles`** memiliki banyak **`withdrawals`** (relasi 1:N untuk pencairan saldo nasabah).
*   **`schedules`** memiliki banyak **`tickets`** (relasi 1:N untuk tiket di tanggal operasional yang sama).
*   **`tickets`** memiliki banyak **`transaction_details`** (relasi 1:N untuk setiap kategori sampah yang ditimbang).
*   **`waste_categories`** memiliki banyak **`transaction_details`** (relasi 1:N sebagai acuan master harga).
*   **`profiles`** memiliki banyak **`iot_devices`** (relasi 1:N untuk alat yang dibawa kurir).
*   **`profiles`** memiliki banyak **`chat_sessions`** (relasi 1:N untuk riwayat sesi chatbot AI).
*   **`chat_sessions`** memiliki banyak **`chat_messages`** (relasi 1:N untuk isi percakapan).

---

## 2. Data Dictionary & Data Definition Language (DDL)

### A. Tabel `profiles`
Tabel ini terhubung secara kaskade dengan `auth.users` bawaan Supabase. Berfungsi menyimpan data profil, saldo utama, dan *role* pengguna.

```sql
CREATE TYPE user_role AS ENUM ('nasabah', 'kurir', 'admin');

CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT, -- Link file foto profil di Supabase Storage
    phone_number VARCHAR(20),
    address TEXT,
    role user_role NOT NULL DEFAULT 'nasabah',
    balance DECIMAL(12, 2) DEFAULT 0.00, -- Hanya digunakan jika role = 'nasabah'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### B. Tabel `waste_categories`
Tabel master untuk menyimpan jenis barang bekas dan harganya yang bersifat fluktuatif (diatur Admin).

```sql
CREATE TABLE public.waste_categories (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- Contoh: 'Plastik PET', 'Kardus', 'Besi'
    price_per_kg DECIMAL(10, 2) NOT NULL, 
    carbon_factor DECIMAL(5, 2) NOT NULL, -- Faktor konversi emisi untuk fitur Impact Tracker
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### C. Tabel `schedules`
Menyimpan hari operasional penjemputan yang dibuka oleh Admin.

```sql
CREATE TABLE public.schedules (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    operational_date DATE NOT NULL UNIQUE, 
    cut_off_time TIMESTAMP WITH TIME ZONE NOT NULL, -- Batas akhir pemesanan tiket
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### D. Tabel `tickets`
Tabel transaksi utama tempat nasabah membuat permintaan penjemputan.

```sql
CREATE TYPE ticket_status AS ENUM ('pending', 'scheduled', 'on_the_way', 'completed', 'cancelled');

CREATE TABLE public.tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY, -- ID ini dijadikan Barcode/QR
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    schedule_id BIGINT REFERENCES public.schedules(id) ON DELETE SET NULL,
    courier_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, 
    status ticket_status NOT NULL DEFAULT 'pending',
    
    -- Estimasi AI (Image Recognition)
    ai_image_url TEXT, -- Link file di Supabase Storage
    ai_predicted_category VARCHAR(100),
    ai_estimated_price DECIMAL(10, 2),
    
    -- Optimasi Rute (VRP Algorithm)
    route_sequence INT, -- Urutan titik penjemputan kurir
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### E. Tabel `transaction_details`
Menyimpan pencatatan berat spesifik untuk setiap kategori sampah yang disetor. Data berat (weight) diisi otomatis oleh sensor IoT.

```sql
CREATE TABLE public.transaction_details (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
    waste_category_id BIGINT REFERENCES public.waste_categories(id) NOT NULL,
    weight DECIMAL(6, 2) NOT NULL, -- Diterima dari endpoint API IoT ESP8266
    price_applied DECIMAL(10, 2) NOT NULL, -- Snapshot harga saat transaksi terjadi
    subtotal DECIMAL(12, 2) NOT NULL, -- Kalkulasi: weight * price_applied
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### F. Tabel `withdrawals` (Integrasi Midtrans)
Mencatat riwayat penarikan saldo nasabah dan dihubungkan dengan Webhook Sandbox Midtrans.

```sql
CREATE TYPE withdrawal_status AS ENUM ('pending', 'processing', 'success', 'failed');

CREATE TABLE public.withdrawals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY, -- Digunakan sebagai 'order_id' untuk API Midtrans
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    bank_name VARCHAR(50) NOT NULL, -- Contoh: 'bca', 'gopay', 'mandiri'
    account_number VARCHAR(50) NOT NULL, 
    
    -- Kolom Pelacakan Midtrans
    midtrans_transaction_id VARCHAR(255), -- ID Resi dari response awal Midtrans
    midtrans_status VARCHAR(50), -- Status mentah dari Midtrans (contoh: 'settlement', 'deny')
    
    status withdrawal_status NOT NULL DEFAULT 'pending', -- Status internal aplikasi
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### G. Tabel `iot_devices`
Mencatat hardware timbangan gantung (ESP8266 + Load Cell) yang terdaftar dan memantau status aktifnya secara real-time.

```sql
CREATE TABLE public.iot_devices (
    id VARCHAR(50) PRIMARY KEY, -- ID unik dari ESP8266 (Contoh: 'TMB-001')
    assigned_courier_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_online BOOLEAN DEFAULT FALSE,
    last_ping TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### H. Tabel `chat_sessions`
Menyimpan sesi percakapan antara pengguna dan Chatbot AI.

```sql
CREATE TABLE public.chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) DEFAULT 'New Chat',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### I. Tabel `chat_messages`
Menyimpan riwayat pesan (history) dalam satu sesi Chatbot.

```sql
CREATE TYPE message_role AS ENUM ('user', 'assistant');

CREATE TABLE public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE NOT NULL,
    role message_role NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 3. Catatan Implementasi Backend (Triggers & Midtrans Webhook)

Untuk mengoptimalkan kinerja aplikasi Next.js, pastikan logika otomatisasi berikut berjalan:
- **Auto-Create Profile:** Trigger pada tabel `auth.users` untuk otomatis melakukan INSERT ke tabel `public.profiles` saat ada pendaftaran nasabah baru via Supabase Auth.
- **Auto-Update Balance (Penambahan):** Trigger pada tabel `transaction_details` untuk otomatis menjumlahkan nilai `subtotal` ke kolom `balance` di tabel `profiles` ketika status tiket diubah menjadi `completed`.
- **Auto-Update Balance (Pengurangan):** Next.js API Routes (Webhook Listener) akan mengubah status `withdrawals` menjadi `success` dan mengurangi `balance` di tabel `profiles` saat menerima response `'settlement'` dari sistem Midtrans Sandbox.
