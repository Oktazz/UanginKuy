"use client";

import {
  CalendarCheck2,
  Sparkles,
  Scale,
  Route,
  CheckCircle2,
  ArrowUpRight,
  Cpu,
} from "lucide-react";
import Link from "next/link";

export function LandingInnovations() {
  const innovations = [
    {
      icon: CalendarCheck2,
      badge: "Smart Capacity Scheduling",
      badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
      title: "Jadwal yang Selektif Dinamis",
      description:
        "Sistem cerdas membatasi kuota harian per banjar dan wilayah secara real-time berdasarkan kapasitas armada kurir dan jam operasional gudang cabang. Menghindari penumpukan sampah dan memastikan jadwal selalu tepat waktu.",
      highlights: [
        "Pembatasan kuota otomatis per area",
        "Penyesuaian jam operasional gudang",
        "Pengingat status penjemputan real-time",
      ],
      metric: { label: "Ketepatan Jadwal", value: "98.7%" },
    },
    {
      icon: Sparkles,
      badge: "AI Waste Vision & Guide",
      badgeColor: "bg-amber-50 text-amber-800 border-amber-200/80",
      title: "Asisten Pilah Sampah Cerdas",
      description:
        "Bingung membedakan jenis plastik dan kertas bernilai? Asisten AI edukasi mengenali kategori material (PET, HDPE, Kardus, Logam), memberi petunjuk pembersihan yang benar, serta estimasi rupiah per kilogram.",
      highlights: [
        "Deteksi kategori material daur ulang",
        "Katalog harga per kg selalu transparan",
        "Edukasi pemilahan mudah dipahami",
      ],
      metric: { label: "Material Dikenali", value: "24+ Kategori" },
    },
    {
      icon: Scale,
      badge: "Cloud IoT Microcontroller",
      badgeColor: "bg-blue-50 text-blue-800 border-blue-200/80",
      title: "Timbangan IoT Terintegrasi",
      description:
        "Armada kurir dibekali timbangan digital bersensor presisi yang terkoneksi langsung via jaringan nirkabel ke sistem database cloud UanginKuy. Angka bobot terkunci otomatis saat penimbangan di depan pintu rumah.",
      highlights: [
        "Akurasi sensor digital hingga ±5 gram",
        "Kunci bobot otomatis tanpa input manual",
        "Bukti timbang langsung terbit di aplikasi",
      ],
      metric: { label: "Transparansi Data", value: "100% Real-Time" },
    },
    {
      icon: Route,
      badge: "Vehicle Routing Optimization",
      badgeColor: "bg-teal-50 text-teal-800 border-teal-200/80",
      title: "Optimasi Rute Kurir Cerdas",
      description:
        "Algoritma Vehicle Routing Problem (VRP) memetakan urutan penjemputan paling efisien setiap pagi berdasarkan titik lokasi nasabah yang terdaftar. Menghindari macet, menghemat waktu tempuh, dan meminimalkan jejak karbon.",
      highlights: [
        "Algoritma perutean multi-titik cerdas",
        "Pengurangan emisi armada kurir di Bali",
        "Perkiraan waktu tiba (ETA) akurat",
      ],
      metric: { label: "Efisiensi Waktu", value: "-35% Waktu Tempuh" },
    },
  ];

  return (
    <section id="inovasi" className="py-20 md:py-28 px-4 md:px-8 max-w-7xl mx-auto scroll-mt-24">
      {/* Section Header */}
      <div className="max-w-3xl mx-auto text-center mb-16">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#eae5d8] text-xs font-medium text-primary mb-4">
          <Cpu className="w-3.5 h-3.5" />
          <span>Inovasi Ekosistem UanginKuy</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight leading-snug mb-4">
          Teknologi modern untuk daur ulang yang transparan dan tertib
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Menggabungkan algoritma penjadwalan dinamis, kecerdasan buatan, perangkat keras IoT terkalibrasi,
          dan perutean armada kurir terbaik untuk kenyamanan masyarakat Bali.
        </p>
      </div>

      {/* 4 Inovasi Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {innovations.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-3xl p-7 sm:p-8 border border-[#eae5d8] shadow-xs hover:shadow-xl hover:border-primary/30 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Card Top: Icon & Badge */}
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div className="w-13 h-13 rounded-2xl bg-[#fdfbf7] border border-[#eae5d8] text-primary flex items-center justify-center p-3 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-xs">
                    <Icon className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <span
                    className={`text-[11px] font-medium px-3 py-1 rounded-full border ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                </div>

                {/* Card Title & Desc - Refined font weight */}
                <h3 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight mb-3 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6 font-normal">
                  {item.description}
                </p>

                {/* Highlights List */}
                <ul className="space-y-2.5 mb-6 pt-4 border-t border-[#f4f0e6]">
                  {item.highlights.map((h, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-xs sm:text-sm text-foreground/80">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bottom Card Stat Banner */}
              <div className="pt-4 border-t border-[#f4f0e6] flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-muted-foreground block">{item.metric.label}</span>
                  <span className="text-base font-semibold text-foreground tracking-tight">{item.metric.value}</span>
                </div>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark group-hover:translate-x-0.5 transition-all"
                >
                  <span>Coba Fitur</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
