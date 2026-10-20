"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail, ArrowUpRight } from "lucide-react";

export function LandingFooter() {

  return (
    <footer className="w-full border-t border-[#dcd3bd] bg-[#ede6d4] py-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-14 border-b border-[#dcd3bd]">
          {/* Brand Info (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-start">
            <Link href="/" className="flex items-center gap-2.5 mb-4 group cursor-pointer">
              <Image
                src="/logo.png"
                alt="UanginKuy Logo"
                width={36}
                height={36}
                className="w-9 h-9 object-contain group-hover:scale-105 transition-transform"
              />
              <span className="text-xl font-semibold text-primary tracking-tight">
                UanginKuy
              </span>
            </Link>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mb-6">
              Platform bank sampah modern di Bali yang menghubungkan rumah tangga, villa, dan pelaku usaha
              dengan penjemputan sampah terpilah terjadwal, penimbangan digital IoT transparan, dan konversi saldo seketika.
            </p>

            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span>Hub Utama: Jl. Tukad Balian No. 88, Panjer, Denpasar Selatan, Bali</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <span>WhatsApp Layanan: +62 812-3456-7890</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <span>Email Dukungan: halo@uanginkuy.com</span>
              </div>
            </div>
          </div>

          {/* Quick Nav (2 cols) */}
          <div className="lg:col-span-2 flex flex-col space-y-3">
            <h4 className="font-semibold text-sm text-foreground tracking-tight mb-1">
              Navigasi Cepat
            </h4>
            <a href="#inovasi" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Inovasi Teknologi
            </a>
            <a href="#cara-kerja" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Cara Kerja
            </a>
            <a href="#ulasan" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Ulasan Nasabah
            </a>
            <a href="#cabang" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Cabang Bali
            </a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              FAQ & Tanya AI
            </a>
          </div>

          {/* Wilayah Layanan Bali (3 cols) */}
          <div className="lg:col-span-3 flex flex-col space-y-2.5">
            <h4 className="font-semibold text-sm text-foreground tracking-tight mb-1">
              Wilayah Operasional Bali
            </h4>
            <span className="text-xs text-muted-foreground">Kota Denpasar (Panjer, Renon, Sanur)</span>
            <span className="text-xs text-muted-foreground">Kabupaten Badung (Canggu, Seminyak, Kuta)</span>
            <span className="text-xs text-muted-foreground">Kabupaten Gianyar (Ubud, Sukawati)</span>
            <span className="text-xs text-muted-foreground">Kabupaten Tabanan (Kediri, Kota Tabanan)</span>
            <span className="text-xs text-muted-foreground">Kabupaten Buleleng (Singaraja Pesisir)</span>
          </div>

          {/* Akun & Akses (2 cols) */}
          <div className="lg:col-span-2 flex flex-col space-y-3">
            <h4 className="font-semibold text-sm text-foreground tracking-tight mb-1">
              Portal Akun
            </h4>
            <Link href="/register" className="text-sm text-primary font-medium hover:text-primary-dark transition-colors inline-flex items-center gap-1">
              <span>Daftar Nasabah</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Masuk ke Akun
            </Link>
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Dashboard Nasabah
            </Link>
            <Link href="/kurir/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Portal Kurir
            </Link>
            <Link href="/admin/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Portal Admin
            </Link>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Tagline */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© 2026 UanginKuy. Turning waste into value for a greener Bali.</p>
          <div className="flex items-center gap-1">
            <span>Dibuat dengan kepedulian lingkungan untuk Pulau Dewata</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
