"use client";

import { MessageSquareHeart } from "lucide-react";
import { CircularTestimonials, type Testimonial } from "@/components/ui/circular-testimonials";

const BALI_TESTIMONIALS: Testimonial[] = [
  {
    name: "Ni Wayan Sri Rejeki",
    designation: "Ibu Rumah Tangga • Denpasar Selatan",
    quote:
      "Dulu botol minyak dan kardus belanjaan numpuk di samping dapur bikin kotor. Sekarang tiap 2 minggu dijemput kurir ramah, timbangan digital langsung bunyi beep dan saldonya langsung cair ke Gopay.",
    src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Made Aditya Pratama",
    designation: "Owner Artisan Coffee • Ubud, Gianyar",
    quote:
      "Kafe kami menghasilkan karton susu UHT dan botol sirup kaca tiap hari. Fitur jadwal selektif dinamis UanginKuy sangat tertib, kurir selalu datang pagi sebelum operasional kafe buka.",
    src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Kadek Dwi Lestari",
    designation: "Property Manager Villa • Canggu, Badung",
    quote:
      "Sangat transparan! Timbangan IoT-nya langsung update di aplikasi saat penimbangan di villa, jadi laporan audit sampah bulanan untuk tamu internasional kami tercatat sangat rapi dan akurat.",
    src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Ketut Budiarta",
    designation: "Penggiat Lingkungan Banjar • Sanur, Denpasar",
    quote:
      "Warga satu banjar jadi kompak memilah sampah plastik dari rumah sejak ada UanginKuy. Aplikasi mudah dimengerti bahkan untuk tetangga yang sudah sepuh.",
    src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Luh Anik Pratiwi",
    designation: "Pengelola Resto Organik • Seminyak, Badung",
    quote:
      "Fitur asisten pilah sampah AI sangat membantu staf dapur kami membedakan jenis plastik food grade. Harganya transparan dan armada kurirnya ramah lingkungan.",
    src: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80",
  },
];

export function LandingReviews() {
  return (
    <section id="ulasan" className="py-20 md:py-28 overflow-hidden scroll-mt-24">
      {/* Section Header */}
      <div className="max-w-3xl mx-auto text-center px-4 md:px-8 mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white border border-[#eae5d8] text-xs font-medium text-primary mb-4 shadow-xs">
          <MessageSquareHeart className="w-3.5 h-3.5" />
          <span>Suara Komunitas Nasabah</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight leading-snug mb-4">
          Dipercaya oleh ribuan keluarga dan pelaku usaha di Bali
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Lihat bagaimana UanginKuy memudahkan kebiasaan memilah sampah sehari-hari dengan penimbangan jujur dan pencairan tanpa hambatan.
        </p>
      </div>

      {/* 3D Circular Testimonial Carousel - Open Layout (No Card Wrap, Wider Width) */}
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <CircularTestimonials
          testimonials={BALI_TESTIMONIALS}
          autoplay={true}
          colors={{
            name: "#1f2937",
            designation: "#306D29",
            testimony: "#4b5563",
            arrowBackground: "#ede6d4",
            arrowForeground: "#1f2937",
            arrowHoverBackground: "#306D29",
          }}
          fontSizes={{
            name: "1.85rem",
            designation: "0.95rem",
            quote: "1.2rem",
          }}
        />
      </div>
    </section>
  );
}
