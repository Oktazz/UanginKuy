"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function LandingCta() {
  return (
    <section className="py-16 md:py-24 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Modern Horizontal Card with Large Rounded Corners */}
      <div className="bg-white rounded-[32px] sm:rounded-[44px] border border-[#eae5d8] p-8 sm:p-12 lg:p-16 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Left Column: Heading & Social Proof Avatars */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-semibold text-foreground tracking-tight leading-[1.2] mb-8">
              Siap Mengubah Sampah Menjadi Saldo Tabungan?
            </h2>

            {/* Avatar Group & Count */}
            <div className="flex items-center gap-3.5">
              <div className="flex -space-x-2.5 overflow-hidden">
                <div className="inline-flex h-11 w-11 rounded-full ring-3 ring-white bg-[#e0f2fe] text-[#0369a1] items-center justify-center text-xs font-semibold">
                  WS
                </div>
                <div className="inline-flex h-11 w-11 rounded-full ring-3 ring-white bg-[#fef3c7] text-[#92400e] items-center justify-center text-xs font-semibold">
                  MA
                </div>
                <div className="inline-flex h-11 w-11 rounded-full ring-3 ring-white bg-[#dcfce7] text-[#166534] items-center justify-center text-xs font-semibold">
                  KD
                </div>
                <div className="inline-flex h-11 w-11 rounded-full ring-3 ring-white bg-[#c2410c] text-white items-center justify-center text-xs font-semibold">
                  +
                </div>
              </div>

              <div>
                <p className="text-xs sm:text-sm font-semibold text-foreground leading-tight">
                  +1.800 Nasabah & Mitra Usaha
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Telah aktif mendaur ulang bersama UanginKuy di Bali
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Description Text & Action Button */}
          <div className="lg:col-span-5 flex flex-col items-start lg:pl-4">
            <p className="text-sm sm:text-base text-muted-foreground font-normal leading-relaxed mb-6">
              Daftar akun gratis dalam 1 menit, pilih jadwal penjemputan pertamamu di Bali,
              dan nikmati kemudahan penimbangan digital yang transparan langsung di depan pintu rumah.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-primary text-white font-medium text-sm sm:text-base px-7 py-3.5 rounded-full shadow-xs hover:shadow-md hover:bg-primary-dark transition-all duration-200 active:scale-95 group cursor-pointer"
              >
                <span>Mulai Sekarang</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground font-medium text-sm sm:text-base px-5 py-3.5 rounded-full hover:bg-black/[0.03] transition-colors cursor-pointer"
              >
                <span>Masuk ke Akun</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
