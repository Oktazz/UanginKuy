"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  MapPin,
  Building2,
  Clock,
  Truck,
  Phone,
  Users2,
} from "lucide-react";
import type { BranchLocation } from "./BaliMapLibre";

// Dynamically import MapLibre map component to avoid SSR issues
const BaliMapLibre = dynamic(() => import("./BaliMapLibre"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[380px] sm:min-h-[440px] rounded-2xl bg-[#f5f0e3] border border-[#eae5d8] flex flex-col items-center justify-center p-6 text-center animate-pulse">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
        <MapPin className="w-6 h-6 animate-pulse" />
      </div>
      <p className="text-xs font-semibold text-foreground">Memuat Peta Interaktif Bali...</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">Menghubungkan ke OpenFreeMap Positron</p>
    </div>
  ),
});

export interface BranchInfo extends BranchLocation {
  hours: string;
  courierFleet: string;
  phone: string;
}

const BALI_BRANCHES: BranchInfo[] = [
  {
    id: "denpasar",
    name: "Hub Utama Denpasar (Panjer & Renon)",
    region: "Kota Denpasar",
    address: "Jl. Tukad Balian No. 88, Panjer, Denpasar Selatan",
    hours: "Senin - Sabtu: 08.00 - 17.00 WITA",
    courierFleet: "6 Motor Listrik & 2 Pickup Box",
    dailyCapacity: "3.500 kg / hari",
    phone: "+62 812-3456-7890",
    latitude: -8.6882,
    longitude: 115.2285,
    highlight: "Gudang Induk & Loket Drop-Off Cepat",
  },
  {
    id: "badung",
    name: "Hub Badung (Kuta Utara & Canggu)",
    region: "Kabupaten Badung",
    address: "Jl. Raya Canggu No. 124, Kuta Utara",
    hours: "Senin - Sabtu: 08.30 - 16.30 WITA",
    courierFleet: "4 Motor Listrik Penjemputan",
    dailyCapacity: "2.000 kg / hari",
    phone: "+62 812-3456-7891",
    latitude: -8.6539,
    longitude: 115.1386,
    highlight: "Spesialisasi Villa & Usaha Hospitality",
  },
  {
    id: "gianyar",
    name: "Hub Gianyar (Ubud & Sukawati)",
    region: "Kabupaten Gianyar",
    address: "Jl. Raya Pengosekan, Ubud, Gianyar",
    hours: "Senin - Sabtu: 08.30 - 16.30 WITA",
    courierFleet: "3 Motor Listrik Penjemputan",
    dailyCapacity: "1.800 kg / hari",
    phone: "+62 812-3456-7892",
    latitude: -8.5195,
    longitude: 115.2635,
    highlight: "Mitra Kafe, Resto & Seniman Lokal",
  },
  {
    id: "tabanan",
    name: "Hub Tabanan (Kediri Agro-Recycle)",
    region: "Kabupaten Tabanan",
    address: "Jl. Bypass Kediri No. 45, Tabanan",
    hours: "Senin - Jumat: 08.00 - 16.00 WITA",
    courierFleet: "2 Motor Listrik & 1 Pickup",
    dailyCapacity: "1.500 kg / hari",
    phone: "+62 812-3456-7893",
    latitude: -8.5583,
    longitude: 115.1278,
    highlight: "Sentra Kardus Pertanian & Rumah Tangga",
  },
  {
    id: "buleleng",
    name: "Hub Buleleng (Singaraja Pesisir)",
    region: "Kabupaten Buleleng",
    address: "Jl. WR Supratman No. 22, Singaraja",
    hours: "Senin - Jumat: 08.30 - 16.00 WITA",
    courierFleet: "2 Motor Listrik Penjemputan",
    dailyCapacity: "1.200 kg / hari",
    phone: "+62 812-3456-7894",
    latitude: -8.1120,
    longitude: 115.0882,
    highlight: "Pemberdayaan Nelayan & Pesisir Utara",
  },
];

interface PartnerItem {
  name: string;
  role: string;
  desc: string;
  logo: string;
}

const PARTNERS_ROW_1: PartnerItem[] = [
  {
    name: "Sungai Watch",
    role: "Pembersihan Sungai & Pesisir",
    desc: "Pencegahan kebocoran sampah plastik ke laut dan pemulihan sungai Bali.",
    logo: "/partners/sungai-watch.png",
  },
  {
    name: "Malu Dong Bali",
    role: "Aksi Bersih Sampah Mandiri",
    desc: "Gerakan edukasi pemilahan sampah langsung dari rumah warga banjar.",
    logo: "/partners/malu-dong.png",
  },
  {
    name: "ecoBali Recycling",
    role: "Pengolahan Material Berkelanjutan",
    desc: "Sirkularitas pengelolaan material daur ulang bernilai tinggi se-Bali.",
    logo: "/partners/ecobali.png",
  },
  {
    name: "Kopernik",
    role: "Riset Solusi Berkelanjutan",
    desc: "Pengembangan teknologi tepat guna untuk konservasi lingkungan.",
    logo: "/partners/kopernik.png",
  },
];

const PARTNERS_ROW_2: PartnerItem[] = [
  {
    name: "Trash Hero World",
    role: "Gerakan Bebas Sampah",
    desc: "Aksi bersih pantai berkala dan edukasi anak sekolah cinta lingkungan.",
    logo: "/partners/trash-hero.png",
  },
  {
    name: "Bye Bye Plastic Bags",
    role: "Gerakan Pemuda Anti-Plastik",
    desc: "Inisiatif generasi muda Bali menuju pulau bebas kantong plastik sekali pakai.",
    logo: "/partners/byebyeplasticbags.png",
  },
  {
    name: "Bali Waste Cycle",
    role: "Pusat Daur Ulang Terpadu",
    desc: "Pemberdayaan jaringan bank sampah unit dan pengelolaan sirkular.",
    logo: "/partners/bali-waste-cycle.png",
  },
  {
    name: "ASOBSI Bali",
    role: "Asosiasi Bank Sampah",
    desc: "Standardisasi harga perolehan dan sistem operasional bank sampah Bali.",
    logo: "/partners/asobsi.png",
  },
  {
    name: "DLHK Prov. Bali",
    role: "Mitra Sinergi Pemerintah",
    desc: "Penyelarasan data timbulan sampah untuk target Bali Bersih Bebas Sampah.",
    logo: "/partners/dlhk-bali.png",
  },
];

function PartnerLogo({ partner }: { partner: PartnerItem }) {
  return (
    <div
      className="h-16 sm:h-20 w-[170px] sm:w-[230px] shrink-0 flex items-center justify-center mx-4 sm:mx-8 group select-none"
      title={`${partner.name} — ${partner.role}`}
    >
      <Image
        src={partner.logo}
        alt={`Logo ${partner.name}`}
        width={240}
        height={80}
        className="max-h-12 sm:max-h-16 w-auto max-w-[85%] sm:max-w-[90%] object-contain opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300 pointer-events-none"
      />
    </div>
  );
}

export function LandingBaliBranches() {
  const [selectedBranch, setSelectedBranch] = useState<BranchInfo>(BALI_BRANCHES[0]);

  return (
    <section id="cabang" className="py-20 md:py-28 px-4 md:px-8 max-w-7xl mx-auto scroll-mt-24">
      {/* Section Header */}
      <div className="max-w-3xl mx-auto text-center mb-16">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white border border-[#eae5d8] text-xs font-medium text-primary mb-4 shadow-xs">
          <MapPin className="w-3.5 h-3.5" />
          <span>Jangkauan Layanan Pulau Bali</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight leading-snug mb-4">
          Sebaran cabang dan gudang hub di seluruh Bali
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Dari perkotaan Denpasar, kawasan pesisir Canggu, hingga pegunungan Ubud. Armada kurir kami
          siap menjemput sampah daur ulang langsung ke alamat rumah atau usahamu.
        </p>
      </div>

      {/* Map & Detail Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-20">
        {/* Left: Interactive MapLibre Tile Map (Same library as VRP & Booking) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#eae5d8] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg text-foreground tracking-tight">
              Peta Interaktif Lokasi Hub
            </h3>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60">
              5 Wilayah Aktif
            </span>
          </div>

          <p className="text-xs text-muted-foreground mb-5">
            Jelajahi peta interaktif berbasis OpenFreeMap. Klik marker cabang untuk melihat rincian lokasi gudang dan armada.
          </p>

          {/* Interactive Map Canvas Container */}
          <div className="relative w-full h-[380px] sm:h-[440px]">
            <BaliMapLibre
              branches={BALI_BRANCHES}
              selectedBranch={selectedBranch}
              onSelectBranch={(b) => setSelectedBranch(b as BranchInfo)}
            />
          </div>

          {/* Region Tabs Navigation (Below map) */}
          <div className="mt-5 pt-5 border-t border-[#f4f0e6]">
            <p className="text-[11px] font-medium text-muted-foreground mb-2.5">
              Pilih Wilayah Operasional:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {BALI_BRANCHES.map((b) => {
                const isSelected = selectedBranch.id === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBranch(b)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium text-center transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary text-white shadow-xs font-semibold"
                        : "bg-[#fdfbf7] text-foreground border border-[#eae5d8] hover:border-primary/40 hover:bg-black/[0.02]"
                    }`}
                  >
                    {b.region.replace("Kabupaten ", "").replace("Kota ", "")}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Selected Branch Card Details */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#eae5d8] shadow-xs">
            {/* Header info */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-[#fdfbf7] border border-[#eae5d8] text-primary">
                {selectedBranch.region}
              </span>
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Operasional Normal
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight mb-2">
              {selectedBranch.name}
            </h3>
            <p className="text-xs sm:text-sm text-primary font-medium mb-6">
              {selectedBranch.highlight}
            </p>

            {/* Branch Detailed Attributes */}
            <div className="space-y-4 pt-4 border-t border-[#f4f0e6] text-xs sm:text-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">Alamat Gudang & Loket:</span>
                  <p className="font-medium text-foreground">{selectedBranch.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">Jam Layanan Penjemputan:</span>
                  <p className="font-medium text-foreground">{selectedBranch.hours}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">Dukungan Armada Kurir:</span>
                  <p className="font-medium text-foreground">{selectedBranch.courierFleet}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">Kapasitas Pengelolaan Harian:</span>
                  <p className="font-medium text-foreground">{selectedBranch.dailyCapacity}</p>
                </div>
              </div>
            </div>

            {/* Contact Support CTA Button */}
            <div className="mt-8 pt-5 border-t border-[#f4f0e6] flex flex-col sm:flex-row gap-3">
              <a
                href={`https://wa.me/6281234567890?text=Halo%20UanginKuy%20${encodeURIComponent(selectedBranch.name)}%2C%20saya%20ingin%20tanya%20jadwal%20penjemputan`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[#fdfbf7] text-foreground border border-[#eae5d8] hover:border-primary/40 px-4 py-2.5 rounded-full text-xs font-medium hover:bg-black/[0.02] transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-primary" />
                <span>Hubungi Loket Cabang</span>
              </a>
              <a
                href="/register"
                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-primary text-white px-4 py-2.5 rounded-full text-xs font-medium hover:bg-primary-dark transition-colors shadow-xs"
              >
                <span>Jadwalkan di Cabang Ini</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Part 2: Kolaborasi Komunitas & Mitra Lingkungan - 2-Row Moving Marquee */}
      <div className="pt-16 border-t border-[#eae5d8] overflow-hidden">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#eae5d8] text-xs font-medium text-primary mb-3 shadow-xs">
            <Users2 className="w-3.5 h-3.5" />
            <span>Ekosistem Bali Berkelanjutan</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mb-3">
            Kolaborasi Komunitas & Mitra Lingkungan
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Bersama organisasi konservasi, aktivis banjar, dan mitra industri daur ulang terkemuka di Bali.
          </p>
        </div>

        {/* 2-Row Infinite Marquee (Open Layout without Cards) */}
        <div className="relative w-full space-y-6 sm:space-y-8">
          {/* Edge fade gradients */}
          <div className="absolute left-0 inset-y-0 w-20 sm:w-36 bg-gradient-to-r from-[#fdfbf7] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 inset-y-0 w-20 sm:w-36 bg-gradient-to-l from-[#fdfbf7] to-transparent z-10 pointer-events-none" />

          {/* Row 1: Moves Left to Right */}
          <div className="flex overflow-hidden group">
            <div className="animate-marquee-left flex items-center">
              {[...PARTNERS_ROW_1, ...PARTNERS_ROW_1].map((p, i) => (
                <PartnerLogo key={`p1-a-${i}`} partner={p} />
              ))}
              {[...PARTNERS_ROW_1, ...PARTNERS_ROW_1].map((p, i) => (
                <PartnerLogo key={`p1-b-${i}`} partner={p} />
              ))}
            </div>
          </div>

          {/* Row 2: Moves Right to Left (Reverse Direction) */}
          <div className="flex overflow-hidden group">
            <div className="animate-marquee-right flex items-center">
              {[...PARTNERS_ROW_2, ...PARTNERS_ROW_2].map((p, i) => (
                <PartnerLogo key={`p2-a-${i}`} partner={p} />
              ))}
              {[...PARTNERS_ROW_2, ...PARTNERS_ROW_2].map((p, i) => (
                <PartnerLogo key={`p2-b-${i}`} partner={p} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
