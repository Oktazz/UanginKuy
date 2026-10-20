"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Scale,
  CalendarCheck2,
  WalletCards,
  Wifi,
} from "lucide-react";

export function LandingHero() {
  return (
    <section id="hero" className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-4 md:px-8 max-w-7xl mx-auto overflow-hidden">
      {/* Subtle ambient lighting */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[680px] h-[450px] bg-primary/[0.04] rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute top-36 right-0 w-[420px] h-[420px] bg-[#E7E1B1]/25 rounded-full blur-[100px] -z-10 pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Left Column: Hero Copy */}
        <div className="lg:col-span-7 flex flex-col items-start text-left z-10">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#eae5d8] shadow-xs text-xs font-medium text-primary mb-6">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span>Bank Sampah Modern Berbasis IoT & AI di Bali</span>
          </div>

          {/* Main Title - Refined, not overly bold */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-foreground tracking-tight leading-[1.16] mb-6">
            Sampah rumahmu dijemput.{" "}
            <span className="text-primary font-semibold">
              Nilainya langsung masuk saldo.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-muted-foreground font-normal leading-relaxed mb-8 max-w-2xl">
            Pilah material daur ulang dari rumah tanpa perlu repot mengantar.
            Pantau penimbangan digital IoT secara transparan dan cairkan saldo
            kapan saja ke rekening bank atau e-wallet.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mb-10">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-7 py-3.5 rounded-full font-medium text-sm sm:text-base shadow-sm hover:shadow-md hover:bg-primary-dark transition-all duration-200 active:scale-95 group cursor-pointer"
            >
              <span>Mulai Tabung Sampah</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              href="#cara-kerja"
              className="inline-flex items-center justify-center gap-2 bg-white text-foreground px-6 py-3.5 rounded-full font-medium text-sm sm:text-base border border-[#eae5d8] hover:bg-black/[0.02] hover:border-primary/30 transition-all duration-200 active:scale-95 group cursor-pointer"
            >
              <span>Pelajari Alur Kerja</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          </div>

          {/* Trust Value Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl pt-6 border-t border-[#eae5d8]">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-foreground">
                Jadwal Jemput Fleksibel
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-foreground">
                Timbang Digital Real-Time
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-foreground">
                Pencairan Saldo Instan
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Dashboard Glass Card */}
        <div className="lg:col-span-5 relative w-full max-w-[480px] mx-auto lg:ml-auto">
          {/* Subtle floating glow behind card */}
          <div className="absolute -inset-2 bg-gradient-to-tr from-primary/10 via-[#E7E1B1]/20 to-primary/5 rounded-[32px] blur-xl -z-10" />

          <div className="bg-white/90 backdrop-blur-xl border border-[#eae5d8] rounded-[28px] p-6 sm:p-7 shadow-xl shadow-black/[0.03]">
            {/* Top Bar Card */}
            <div className="flex items-center justify-between pb-5 mb-5 border-b border-[#f0ece1]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center p-2">
                  <Image
                    src="/logo.png"
                    alt="UanginKuy Logo"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground leading-tight">
                    Dashboard Nasabah
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    ID: UK-DPS-84920
                  </p>
                </div>
              </div>

              {/* Status IoT Live Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-[11px] font-medium">
                <Wifi className="w-3 h-3 animate-pulse" />
                <span>IoT Terhubung</span>
              </div>
            </div>

            {/* Saldo Showcase Box */}
            <div className="bg-primary text-white rounded-2xl p-5 mb-4 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-medium text-white/80">
                  Saldo Daur Ulang Aktif
                </span>
                <WalletCards className="w-4 h-4 text-white/80" />
              </div>
              <div className="text-2xl sm:text-3xl font-semibold tracking-tight mb-2">
                Rp 248.500
              </div>
              <div className="flex items-center justify-between text-[11px] text-white/85 pt-2 border-t border-white/15">
                <span>+ Rp 42.000 dari penjemputan kemarin</span>
                <span className="font-medium bg-white/20 px-2 py-0.5 rounded-full">
                  Siap Tarik
                </span>
              </div>
            </div>

            {/* Micro Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-[#fdfbf7] border border-[#eae5d8] rounded-xl p-3.5">
                <span className="text-[11px] text-muted-foreground block mb-1">
                  Total Didaur Ulang
                </span>
                <span className="font-semibold text-base text-foreground">
                  38.4 kg
                </span>
                <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">
                  5 kategori terpilah
                </span>
              </div>

              <div className="bg-[#fdfbf7] border border-[#eae5d8] rounded-xl p-3.5">
                <span className="text-[11px] text-muted-foreground block mb-1">
                  Jejak Karbon Ditekan
                </span>
                <span className="font-semibold text-base text-foreground">
                  -52.6 kg CO₂
                </span>
                <span className="text-[10px] text-primary font-medium block mt-0.5">
                  Setara 3 pohon
                </span>
              </div>
            </div>

            {/* Scheduled Pickup Banner */}
            <div className="bg-[#fdfbf7] border border-[#eae5d8] rounded-2xl p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <CalendarCheck2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <h4 className="font-medium text-xs text-foreground truncate">
                    Penjemputan Besok Pagi
                  </h4>
                  <span className="text-[10px] font-medium bg-[#E7E1B1] text-primary-dark px-2 py-0.5 rounded-full shrink-0">
                    09.00 - 11.00 WITA
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  Alamat: Jl. Tukad Balian No. 42, Renon
                </p>
              </div>
            </div>

            {/* Bottom Digital Scale Status */}
            <div className="mt-3 py-2.5 px-3 rounded-xl bg-black/[0.02] border border-dashed border-[#eae5d8] flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Scale className="w-3.5 h-3.5 text-primary" />
                <span>Timbangan Kurir Kalibrasi Digital</span>
              </div>
              <span className="font-medium text-foreground text-[11px]">
                Akurasi 99.8%
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
