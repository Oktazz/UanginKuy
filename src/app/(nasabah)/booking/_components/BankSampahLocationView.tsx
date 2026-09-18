"use client";

import { useState, useEffect, useRef } from "react";
import Map, { Marker, NavigationControl, type MapRef } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_STYLE } from "@/config/map";
import {
  Store,
  MapPin,
  Clock,
  Banknote,
  Navigation,
  ExternalLink,
  CheckCircle2,
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
  const mapRef = useRef<MapRef>(null);
  const rawLat = Number(location?.latitude);
  const rawLon = Number(location?.longitude);
  const lat = Number.isFinite(rawLat) && rawLat !== 0 ? rawLat : -6.2088;
  const lon = Number.isFinite(rawLon) && rawLon !== 0 ? rawLon : 106.8456;
  const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
  const isOpen = location?.isOpen !== false;

  const [mapViewState, setMapViewState] = useState({
    latitude: lat,
    longitude: lon,
    zoom: 14,
  });

  const targetLat = Number(location?.latitude);
  const targetLon = Number(location?.longitude);
  const hasValidCoords =
    location != null &&
    Number.isFinite(targetLat) &&
    Number.isFinite(targetLon);

  const [prevCoords, setPrevCoords] = useState<{ lat: number; lon: number } | null>(
    hasValidCoords ? { lat: targetLat, lon: targetLon } : null,
  );

  if (
    hasValidCoords &&
    (!prevCoords ||
      prevCoords.lat !== targetLat ||
      prevCoords.lon !== targetLon)
  ) {
    setPrevCoords({ lat: targetLat, lon: targetLon });
    setMapViewState((prev) => ({
      ...prev,
      latitude: targetLat,
      longitude: targetLon,
    }));
  }

  // Keep map view in sync when location prop updates
  useEffect(() => {
    if (hasValidCoords) {
      mapRef.current?.flyTo({
        center: [targetLon, targetLat],
        zoom: 15,
      });
    }
  }, [hasValidCoords, targetLat, targetLon]);

  // Ensure map container calculates correct dimensions upon mounting/tab switch
  useEffect(() => {
    const timer = setTimeout(() => {
      mapRef.current?.resize();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-pulse">
        <Skeleton className="h-40 w-full rounded-2xl sm:rounded-3xl" />
        <Skeleton className="h-64 sm:h-80 w-full rounded-2xl sm:rounded-3xl" />
        <Skeleton className="h-36 sm:h-44 w-full rounded-2xl sm:rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Depo Profile Card */}
      <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
              <Store className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-tight ${
                    isOpen
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}
                >
                  <CheckCircle2 size={12} className="shrink-0" />
                  <span>{isOpen ? "Buka untuk Antar Langsung (Walk-In)" : "Loket Tutup Sementara"}</span>
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight leading-snug">
                {location?.name || "Gudang & Depo Utama UanginKuy"}
              </h3>

              <p className="text-xs sm:text-sm text-gray-600 mt-1 flex items-start gap-1.5 leading-relaxed">
                <MapPin size={15} className="text-primary shrink-0 mt-0.5" />
                <span className="break-words">{location?.address || "Gudang Utama UanginKuy, Kawasan Daur Ulang Mandiri"}</span>
              </p>

              {location?.phone && (
                <div className="mt-2">
                  <a
                    href={`tel:${location.phone}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/15 active:bg-primary/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <Phone size={13} className="shrink-0" />
                    <span>Kontak Depo: {location.phone}</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Operating Hours & Payment Method Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-4 sm:mt-5 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl sm:rounded-2xl border border-gray-100 shadow-2xs">
            <div className="w-8 h-8 rounded-lg sm:rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Clock size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Jam Operasional {location?.operatingDays ? `(${location.operatingDays})` : ""}
              </p>
              <p className="text-xs sm:text-sm font-extrabold text-gray-900 font-mono">
                {location?.operatingHours || "08.00 - 16.00 WIB"}
              </p>
              {location?.notes && (
                <p className="text-[10px] text-gray-500 font-medium truncate mt-0.5" title={location.notes}>
                  {location.notes}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl sm:rounded-2xl border border-gray-100 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Banknote size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Metode Pencairan</p>
              <p className="text-xs sm:text-sm font-extrabold text-gray-900">
                Uang Tunai (Cash) atau Masuk Saldo
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Action Button */}
        <div className="mt-4 sm:mt-5 pt-1">
          <a
            href={gmapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 sm:py-4 px-5 rounded-xl sm:rounded-2xl bg-primary hover:bg-primary-dark active:scale-[0.99] text-white font-bold text-sm sm:text-base shadow-sm shadow-primary/25 transition-all cursor-pointer"
          >
            <Navigation size={18} className="fill-white shrink-0" />
            <span>Buka Navigasi Google Maps</span>
            <ExternalLink size={15} className="opacity-80 shrink-0" />
          </a>
          <p className="text-center text-[11px] sm:text-xs text-gray-500 mt-2 font-medium">
            Membuka aplikasi Google Maps untuk rute dan petunjuk arah langsung ke bank sampah.
          </p>
        </div>
      </div>

      {/* Interactive Map Preview */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
            <MapPin size={15} className="text-primary" />
            Peta Lokasi Bank Sampah
          </h4>
          <button
            type="button"
            onClick={() => {
              setMapViewState({
                latitude: lat,
                longitude: lon,
                zoom: 15,
              });
              mapRef.current?.flyTo({
                center: [lon, lat],
                zoom: 15,
                duration: 600,
              });
            }}
            className="text-xs font-bold text-primary hover:text-primary-dark hover:underline cursor-pointer"
          >
            Pusatkan Peta
          </button>
        </div>

        <div className="relative h-[250px] sm:h-[360px] w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-gray-200 shadow-xs bg-gray-100">
          <Map
            ref={mapRef}
            mapLib={maplibregl}
            {...mapViewState}
            onMove={(evt) => setMapViewState(evt.viewState)}
            onLoad={(evt) => evt.target.resize()}
            style={{ width: "100%", height: "100%" }}
            mapStyle={MAP_STYLE}
            maxPitch={0}
            dragRotate={false}
            touchPitch={false}
          >
            <NavigationControl position="top-right" showCompass={false} />
            <Marker longitude={lon} latitude={lat} anchor="bottom">
              <div className="relative flex cursor-pointer flex-col items-center group">
                <div className="whitespace-nowrap rounded-xl bg-gray-900 text-white px-3 py-1.5 text-xs font-bold shadow-lg mb-1 flex items-center gap-1.5">
                  <Store size={14} className="text-white" />
                  <span>{location?.name || "Gudang & Depo Utama UanginKuy"}</span>
                </div>
                <MapPin
                  size={46}
                  className="fill-primary-dark text-primary drop-shadow-lg transition-transform group-hover:scale-110"
                />
              </div>
            </Marker>
          </Map>

          {/* Coordinate Overlay */}
          <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 pointer-events-none">
            <div className="bg-white/95 backdrop-blur-md px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl shadow-md border border-gray-200 max-w-sm mx-auto flex items-center justify-between pointer-events-auto">
              <div>
                <span className="block text-[9px] sm:text-[10px] uppercase font-bold text-gray-500">Titik Koordinat</span>
                <span className="font-mono text-xs font-bold text-gray-800">
                  {lat.toFixed(5)}, {lon.toFixed(5)}
                </span>
              </div>
              <a
                href={gmapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] sm:text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Arahkan</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Walk-in Guide (Alur Setor Langsung) */}
      <div className="rounded-2xl sm:rounded-3xl border border-gray-100 bg-surface p-4 sm:p-6 shadow-xs space-y-3.5">
        <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-800 flex items-center gap-2">
          <Info size={16} className="text-primary" />
          Panduan Setor Langsung (Tanpa Tiket)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex sm:flex-col items-start gap-3 p-3.5 rounded-xl sm:rounded-2xl bg-gray-50 border border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0">
              1
            </div>
            <div className="space-y-0.5 sm:space-y-1">
              <h5 className="font-bold text-xs sm:text-sm text-gray-900">Pilah Sampah</h5>
              <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed">
                Pilah sampah kering (plastik, kertas, kaleng, botol) dari rumah agar penimbangan lebih cepat.
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-start gap-3 p-3.5 rounded-xl sm:rounded-2xl bg-gray-50 border border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0">
              2
            </div>
            <div className="space-y-0.5 sm:space-y-1">
              <h5 className="font-bold text-xs sm:text-sm text-gray-900">Datang ke Depo</h5>
              <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed">
                Kunjungi depo pada jam operasional. Langsung tuju meja loket penimbangan tanpa perlu tiket.
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-start gap-3 p-3.5 rounded-xl sm:rounded-2xl bg-gray-50 border border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0">
              3
            </div>
            <div className="space-y-0.5 sm:space-y-1">
              <h5 className="font-bold text-xs sm:text-sm text-gray-900">Timbang & Cairkan</h5>
              <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed">
                Tunjukkan ID Member akun ke teller. Sampah ditimbang dan saldo/uang tunai diterima seketika.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-start sm:items-center gap-2.5 p-3 rounded-xl sm:rounded-2xl bg-[#faf6ea] border border-[#e7e1b1] text-gray-800 text-[11px] sm:text-xs font-medium">
          <QrCode size={16} className="text-primary shrink-0 mt-0.5 sm:mt-0" />
          <span>
            <strong>Tips:</strong> ID Member akun Anda dapat dilihat di menu{" "}
            <span className="font-bold text-primary">Profil Nasabah</span> untuk ditunjukkan ke petugas loket bank sampah.
          </span>
        </div>
      </div>
    </div>
  );
}
