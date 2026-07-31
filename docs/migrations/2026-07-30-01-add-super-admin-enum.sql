-- Jalankan file ini terlebih dahulu dan tunggu hingga berhasil sebelum file 02.
-- PostgreSQL mengharuskan nilai enum baru di-commit sebelum dipakai.
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'super_admin';
