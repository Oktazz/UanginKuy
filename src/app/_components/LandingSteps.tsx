"use client";

import Image from "next/image";
import {
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export function LandingSteps() {
  const steps = [
    {
      stepNumber: "01",
      badge: "Langkah Pertama",
      title: "Pilah Sampah Daur Ulang dari Rumah",
      shortDesc:
        "Kumpulkan material kering seperti botol plastik, kardus, kertas arsip, kaleng, dan minyak jelantah.",
      details: [
        "Cukup pastikan material kering dan bebas sisa makanan basah",
        "Gunakan bantuan Asisten AI jika kamu ragu jenis materialnya",
        "Kumpulkan dalam kantong atau kardus terpisah per kategori",
      ],
      image: "/steps/step-1-pilah.png",
      imageAlt: "Ilustrasi memilah sampah daur ulang di rumah modern",
      tag: "Mudah & Praktis",
      isLeftText: true,
    },
    {
      stepNumber: "02",
      badge: "Langkah Kedua",
      title: "Pilih Jadwal Penjemputan di Aplikasi",
      shortDesc:
        "Tentukan hari dan jam penjemputan yang sesuai dengan ketersediaan kuota wilayah banjarmu.",
      details: [
        "Jadwal operasional diselaraskan dengan gudang cabang terdekat",
        "Tiket penjemputan digital langsung diterbitkan bersama kode QR",
        "Pemberitahuan estimasi kedatangan kurir via aplikasi & WhatsApp",
      ],
      image: "/steps/step-2-jadwal.png",
      imageAlt: "Ilustrasi memilih jadwal penjemputan di smartphone",
      tag: "Jadwal Selektif Dinamis",
      isLeftText: false,
    },
    {
      stepNumber: "03",
      badge: "Langkah Ketiga",
      title: "Kurir Timbang Digital IoT di Depan Pintu",
      shortDesc:
        "Kurir ramah datang langsung ke rumahmu membawa timbangan pintar terkalibrasi presisi tinggi.",
      details: [
        "Penimbangan per kategori material menggunakan sensor digital presisi",
        "Data bobot tersinkronisasi otomatis via microcontroller IoT ke cloud",
        "Transparan 100% tanpa risiko manipulasi atau salah catat kertas manual",
      ],
      image: "/steps/step-3-timbang.png",
      imageAlt: "Ilustrasi kurir menimbang sampah dengan timbangan digital IoT",
      tag: "Sensor Presisi ±5 gram",
      isLeftText: true,
    },
    {
      stepNumber: "04",
      badge: "Langkah Keempat",
      title: "Terima Saldo Daur Ulang Seketika",
      shortDesc:
        "Total timbangan dikalikan harga aktif resmi dan otomatis masuk ke saldo akun UanginKuy kamu.",
      details: [
        "Struk transaksi digital langsung terbit di riwayat akun",
        "Tarik dana instan ke rekening bank nasional (BCA, Mandiri, BRI, BNI)",
        "Bisa dicairkan ke dompet digital (GoPay, OVO, ShopeePay, DANA)",
      ],
      image: "/steps/step-4-saldo.png",
      imageAlt: "Ilustrasi saldo daur ulang masuk ke dompet digital aplikasi",
      tag: "Pencairan Tanpa Ribet",
      isLeftText: false,
    },
  ];

  return (
    <section id="cara-kerja" className="py-20 md:py-28 px-4 md:px-8 max-w-7xl mx-auto scroll-mt-24">
      {/* Section Header */}
      <div className="max-w-3xl mx-auto text-center mb-16 md:mb-24">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-[#eae5d8] text-xs font-medium text-primary mb-4 shadow-xs">
          <Clock className="w-3.5 h-3.5" />
          <span>Alur Penjemputan Tanpa Repot</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight leading-snug mb-4">
          Tahapan memesan penjemputan dari rumah
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Semua proses dirancang transparan dan mudah diikuti. Sampahmu dijemput di depan gerbang,
          ditimbang digital, dan nilainya langsung dapat kamu manfaatkan.
        </p>
      </div>

      {/* Vertical Steps with Central Horizontal Connector Lines */}
      <div className="space-y-16 md:space-y-24 relative">
        {steps.map((step, idx) => {
          return (
            <div key={idx} className="relative">
              {/* Horizontal Connecting Guide Bar on Desktop */}
              <div className="hidden lg:flex items-center justify-center w-full mb-8 relative">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#e0dbcd] to-[#e0dbcd]" />
                <div className="mx-4 flex items-center gap-2 px-4 py-1 rounded-full bg-white border border-[#e0dbcd] shadow-xs text-xs font-medium text-primary">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span>Tahap {step.stepNumber}</span>
                </div>
                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-[#e0dbcd] to-[#e0dbcd]" />
              </div>

              {/* Step Row Grid */}
              <div
                className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center ${
                  step.isLeftText ? "" : "lg:grid-flow-dense"
                }`}
              >
                {/* Text Content Column */}
                <div
                  className={`lg:col-span-6 flex flex-col justify-center ${
                    step.isLeftText ? "lg:order-1" : "lg:order-2 lg:col-start-7"
                  }`}
                >
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#eae5d8] shadow-xs hover:shadow-lg transition-all duration-300">
                    {/* Top Step Meta */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold">
                          {step.stepNumber}
                        </span>
                        <span className="text-xs font-medium text-primary uppercase tracking-wider">
                          {step.badge}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#fdfbf7] border border-[#eae5d8] text-muted-foreground">
                        {step.tag}
                      </span>
                    </div>

                    {/* Step Title - Refined font weight */}
                    <h3 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight mb-3">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6 font-normal">
                      {step.shortDesc}
                    </p>

                    {/* Details Bullet Points */}
                    <div className="space-y-2.5 pt-4 border-t border-[#f4f0e6]">
                      {step.details.map((detail, dIdx) => (
                        <div key={dIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/85">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span className="leading-snug">{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Image Column */}
                <div
                  className={`lg:col-span-6 ${
                    step.isLeftText ? "lg:order-2" : "lg:order-1 lg:col-start-1"
                  }`}
                >
                  <div className="relative group overflow-hidden rounded-3xl border border-[#eae5d8] bg-white p-3 shadow-xs hover:shadow-xl transition-all duration-300">
                    <div className="relative w-full aspect-square sm:aspect-[4/3] rounded-2xl overflow-hidden bg-[#f7f4ec]">
                      <Image
                        src={step.image}
                        alt={step.imageAlt}
                        fill
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                        sizes="(max-width: 768px) 100vw, 550px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Summary Callout */}
      <div className="mt-16 sm:mt-20 p-6 sm:p-8 rounded-3xl bg-white border border-[#eae5d8] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div className="max-w-xl">
          <h4 className="text-lg font-semibold text-foreground tracking-tight mb-1">
            Mulai dari satu kantong sampah hari ini
          </h4>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Bergabung bersama ribuan keluarga dan pelaku usaha di Bali yang telah mengubah sampah menjadi pundi tabungan.
          </p>
        </div>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 bg-primary text-white text-sm font-medium px-6 py-3 rounded-full hover:bg-primary-dark transition-all duration-200 active:scale-95 shrink-0 shadow-xs"
        >
          <span>Daftar Sekarang</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
