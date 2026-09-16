"use client";

import { useState } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Store,
  MapPin,
  Clock,
  Banknote,
  Navigation,
  ExternalLink,
  CheckCircle2,
  Scale,
  QrCode,
  Info,
  Phone,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export interface WarehouseLocationData {
  latitude: number;
  longitude: number;
  address: string;
  name: string;
  phone?: string;
  operatingHours: string;
  operatingDays?: string;
  notes?: string;
  isOpen?: boolean;
  isDefault?: boolean;
}

interface BankSampahLocationViewProps {
  location: WarehouseLocationData | null;
  loading?: boolean;
}

export function BankSampahLocationView({
  location,
  loading = false,
}: BankSampahLocationViewProps) {
  const lat = location?.latitude ?? -6.2088;
  const lon = location?.longitude ?? 106.8456;
  const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
  const isOpen = location?.isOpen !== false;

  const [mapViewState, setMapViewState] = useState({
    latitude: lat,
    longitude: lon,
    zoom: 14,
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Depo Identity Card */}
      <div className="rounded-3xl border border-emerald-200/80 bg-linear-to-br from-emerald-50/90 to-teal-50/50 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-700/20">
              <Store size={28} />
            </div>
            <div>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold mb-1.5 ${
                isOpen
                  ? "bg-emerald-100/80 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}>
                <CheckCircle2 size={12} />
                <span>{isOpen ? "Buka untuk Antar Langsung (Walk-In)" : "Loket Tutup Sementara"}</span>
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">
                {location?.name || "Gudang & Depo Utama UanginKuy"}
              </h3>
              <p className="text-sm text-gray-600 mt-1 flex items-start gap-1.5">
                <MapPin size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>{location?.address || "Gudang Utama UanginKuy, Kawasan Daur Ulang Mandiri"}</span>
              </p>
              {location?.phone && (
                <a
                  href={`tel:${location.phone}`}
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-800 font-semibold mt-1.5 hover:underline"
                >
                  <Phone size={13} className="text-emerald-600" />
                  <span>Kontak Depo: {location.phone}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Operating Hours & Payment Options Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-5 pt-5 border-t border-emerald-200/60">
          <div className="flex items-center gap-2.5 bg-white/90 p-3 rounded-2xl border border-emerald-100 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Clock size={16} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Jam Operasional {location?.operatingDays ? `(${location.operatingDays})` : ""}
              </p>
              <p className="text-xs font-extrabold text-gray-800">
                {location?.operatingHours || "08.00 - 16.00 WIB"}
              </p>
              {location?.notes && (
                <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                  {location.notes}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-white/90 p-3 rounded-2xl border border-emerald-100 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Banknote size={16} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Metode Pencairan</p>
              <p className="text-xs font-extrabold text-gray-800">Uang Tunai (Cash) atau Masuk Saldo</p>
            </div>
          </div>
        </div>

        {/* Prominent Navigation Button */}
        <div className="mt-5 pt-2">
          <a
            href={gmapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-base shadow-md shadow-emerald-700/25 transition-all duration-200"
          >
            <Navigation size={20} className="fill-white" />
            <span>Buka Navigasi Google Maps</span>
            <ExternalLink size={16} className="opacity-80" />
          </a>
          <p className="text-center text-xs text-emerald-800/80 mt-2 font-medium">
            Membuka aplikasi Google Maps untuk rute dan petunjuk arah langsung ke bank sampah.
          </p>
        </div>
      </div>

      {/* Interactive Map Preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
            <MapPin size={16} className="text-emerald-600" />
            Peta Lokasi Bank Sampah
          </h4>
          <button
            type="button"
            onClick={() =>
              setMapViewState({
                latitude: lat,
                longitude: lon,
                zoom: 15,
              })
            }
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
          >
            Pusatkan Peta
          </button>
        </div>

        <div className="relative h-[340px] sm:h-[400px] w-full overflow-hidden rounded-3xl border border-gray-200 shadow-xs">
          <Map
            {...mapViewState}
            onMove={(evt) => setMapViewState(evt.viewState)}
            style={{ width: "100%", height: "100%" }}
            mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
            maxPitch={0}
            dragRotate={false}
            touchPitch={false}
          >
            <NavigationControl position="top-right" showCompass={false} />
            <Marker longitude={lon} latitude={lat} anchor="bottom">
              <div className="relative flex flex-col items-center group cursor-pointer">
                <div className="whitespace-nowrap rounded-xl bg-gray-900 text-white px-3 py-1.5 text-xs font-bold shadow-lg mb-1 flex items-center gap-1.5 animate-bounce">
                  <Store size={14} className="text-emerald-400" />
                  <span>{location?.name || "Bank Sampah UanginKuy"}</span>
                </div>
                <div className="relative">
                  <div className="w-5 h-5 bg-emerald-500/40 rounded-full animate-ping absolute inset-0 -translate-x-0.5 -translate-y-0.5" />
                  <MapPin size={38} className="fill-emerald-600 text-white drop-shadow-lg relative z-10" />
                </div>
              </div>
            </Marker>
          </Map>

          {/* Coordinate Overlay */}
          <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
            <div className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-md border border-gray-200/80 max-w-sm mx-auto flex items-center justify-between pointer-events-auto">
              <div>
                <span className="block text-[10px] uppercase font-bold text-gray-500">Koordinat Titik Depo</span>
                <span className="font-mono text-xs font-bold text-gray-800">
                  {lat.toFixed(5)}, {lon.toFixed(5)}
                </span>
              </div>
              <a
                href={gmapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors flex items-center gap-1"
              >
                <span>Arahkan</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Walk-in Guide (Alur Setor Langsung) */}
      <div className="rounded-3xl border border-gray-200/80 bg-surface p-6 shadow-xs space-y-4">
        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-800 flex items-center gap-2">
          <Info size={16} className="text-primary" />
          Panduan Setor Langsung (Tanpa Tiket)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50/90 rounded-2xl p-4 border border-gray-100 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-black text-sm flex items-center justify-center">
              1
            </div>
            <h5 className="font-bold text-sm text-gray-900">Pilah Sampah</h5>
            <p className="text-xs text-gray-600 leading-relaxed">
              Pilah sampah kering Anda (plastik, kertas, kaleng, botol) dari rumah agar proses timbang lebih cepat.
            </p>
          </div>

          <div className="bg-gray-50/90 rounded-2xl p-4 border border-gray-100 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-black text-sm flex items-center justify-center">
              2
            </div>
            <h5 className="font-bold text-sm text-gray-900">Datang ke Depo</h5>
            <p className="text-xs text-gray-600 leading-relaxed">
              Kunjungi depo bank sampah pada jam operasional kami. Anda bisa langsung menuju ke meja loket penimbangan.
            </p>
          </div>

          <div className="bg-gray-50/90 rounded-2xl p-4 border border-gray-100 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-black text-sm flex items-center justify-center">
              3
            </div>
            <h5 className="font-bold text-sm text-gray-900">Timbang & Cairkan</h5>
            <p className="text-xs text-gray-600 leading-relaxed">
              Tunjukkan ID Member akun Anda ke teller. Sampah akan ditimbang dan saldo/uang tunai langsung dicatat ke akun.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-50 border border-amber-200/70 text-amber-900 text-xs font-medium">
          <QrCode size={18} className="text-amber-700 shrink-0" />
          <span>
            <strong>Tips:</strong> Anda dapat melihat ID Member akun Anda di menu{" "}
            <strong>Profil Nasabah</strong> untuk ditunjukkan kepada petugas loket bank sampah.
          </span>
        </div>
      </div>
    </div>
  );
}
