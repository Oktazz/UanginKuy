# Panduan Provisioning Akun Produksi

Panduan ini menjelaskan cara membuat akun-akun pertama di lingkungan produksi UanginKuy.

---

## Hierarki Role

| Role | Kewenangan |
|---|---|
| `nasabah` | Booking, tiket, saldo, profil |
| `kurir` | Rute, scanner, penyelesaian pickup |
| `admin` | Harga sampah, jadwal, pembagian rute, transaksi operasional |
| `super_admin` | Semua kewenangan admin + manajemen akun staf + lokasi gudang |

> **Catatan:** `super_admin` sebaiknya hanya dimiliki 1–2 pemilik sistem.

---

## Langkah 1 — Jalankan Migrations Database

Jalankan kedua file ini secara berurutan di **Supabase Dashboard → SQL Editor**:

1. `docs/migrations/2026-07-30-01-add-super-admin-enum.sql`
   - Menambahkan nilai `super_admin` ke enum `user_role`.
   - **Tunggu hingga sukses** sebelum menjalankan file berikutnya. PostgreSQL mengharuskan nilai enum baru di-commit dahulu.

2. `docs/migrations/2026-07-30-02-super-admin-security.sql`
   - Membuat helper `private.is_admin()` dan `private.is_super_admin()`.
   - Memperbarui semua RLS policy agar menggunakan helper tersebut.
   - Membatasi kolom yang dapat diupdate oleh user (mencegah self-role-escalation).
   - Memisahkan akses `app_settings`: admin hanya baca, super_admin bisa ubah.
   - Membuat tabel `audit_logs` dengan RLS ketat.

---

## Langkah 2 — Buat Akun `super_admin` Pertama

Akun `super_admin` pertama **tidak bisa dibuat lewat aplikasi** — harus dibuat manual.

### 2a. Buat user di Supabase Auth

1. Buka **Supabase Dashboard → Authentication → Users**
2. Klik **"Add user"** → **"Create new user"**
3. Isi email dan password pemilik sistem
4. Klik **Create user**
5. Salin `User UUID` yang muncul

### 2b. Update role di tabel profiles

Jalankan query berikut di **SQL Editor**, ganti `<UUID>` dengan UUID yang disalin:

```sql
UPDATE public.profiles
SET role = 'super_admin', updated_at = NOW()
WHERE id = '<UUID>';
```

### 2c. Verifikasi

```sql
SELECT id, name, role FROM public.profiles WHERE role = 'super_admin';
```

---

## Langkah 3 — Atur Lokasi Gudang

Setelah login sebagai `super_admin`:

1. Masuk ke **Control Panel → Pengaturan Gudang** (`/admin/settings/warehouse`)
2. Geser pin atau klik pada peta ke lokasi gudang/bank sampah utama
3. Klik **Simpan Lokasi**

> Lokasi gudang adalah titik dasar seluruh kalkulasi rute VRP. Sistem tidak akan dapat menjadwalkan rute sebelum lokasi ini diatur.

---

## Langkah 4 — Undang Akun Staf (Admin & Kurir)

Akun `admin` dan `kurir` berikutnya dibuat melalui aplikasi:

1. Login sebagai `super_admin`
2. Masuk ke **Manajemen Pengguna** (`/admin/users`)
3. Isi nama, email, dan pilih role (`Admin` atau `Kurir`)
4. Klik **Kirim Undangan** — email aktivasi akan dikirim ke staf

Staf akan menerima email undangan untuk mengaktifkan akun dan membuat password.

> **Catatan keamanan:** Undangan diproses secara server-side menggunakan `service_role` key. Admin biasa tidak dapat mengundang atau mengubah role siapapun.

---

## Catatan Keamanan

- `super_admin` berikutnya hanya dapat dibuat oleh `super_admin` yang sudah ada (melalui fitur undangan yang akan ditambahkan, atau secara manual via SQL untuk akun darurat).
- Perubahan role dan lokasi gudang tercatat otomatis di tabel `audit_logs`.
- Kolom `role` dan `balance` di tabel `profiles` di-REVOKE dari update langsung oleh `authenticated` users — tidak bisa diubah melalui client library.
- Server Actions untuk aksi sensitif selalu memverifikasi `super_admin` di server, tidak mengandalkan tampilan UI yang disembunyikan.
