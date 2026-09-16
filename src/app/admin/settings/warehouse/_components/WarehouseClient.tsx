"use client";

import { useState } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  saveWarehouseLocation,
  type WarehouseLocationInput,
} from "../actions";
import {
  MapPin,
  Save,
  Info,
  CheckCircle,
  AlertCircle,
  Store,
  Phone,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface WarehouseClientProps {
  initialData: {
    latitude: number | null;
    longitude: number | null;
    name: string;
    address: string;
    phone: string;
  };
}

export default function WarehouseClient({ initialData }: WarehouseClientProps) {
  const [name, setName] = useState(
    initialData.name || "Gudang & Depo Utama UanginKuy"
  );
  const [address, setAddress] = useState(
    initialData.address || "Gudang Utama UanginKuy, Kawasan Daur Ulang Mandiri"
  );
  const [phone, setPhone] = useState(initialData.phone || "");

  const [marker, setMarker] = useState({
    lat: initialData.latitude || -6.2088,
    lon: initialData.longitude || 106.8456,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setFeedback(null);
    try {
      const payload: WarehouseLocationInput = {
        latitude: marker.lat,
        longitude: marker.lon,
        name: name.trim() || "Gudang & Depo Utama UanginKuy",
        address: address.trim() || "Gudang Utama UanginKuy, Kawasan Daur Ulang Mandiri",
        phone: phone.trim() || undefined,
      };

      await saveWarehouseLocation(payload);
      setFeedback({
        kind: "success",
        message: "Profil dan titik lokasi gudang berhasil disimpan!",
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan yang tidak diketahui.";
      setFeedback({
        kind: "error",
        message: `Gagal menyimpan: ${message}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Pengaturan Gudang & Depo
          </h2>
          <p className="text-gray-500 mt-2 font-medium max-w-2xl">
            Kelola identitas bank sampah utama (nama, alamat, kontak) serta titik koordinat depot untuk rute kurir (VRP) dan panduan navigasi nasabah.
          </p>
        </div>
        <Button
          onClick={() => handleSave()}
          loading={isSaving}
          loadingLabel="Menyimpan..."
          className="flex items-center space-x-2 rounded-xl bg-primary px-6 py-3 font-bold text-white shadow-sm hover:bg-primary-dark cursor-pointer shrink-0"
        >
          <Save size={18} />
          <span>Simpan Perubahan</span>
        </Button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="status"
          className={`p-4 rounded-2xl flex items-start space-x-3 text-sm font-semibold border animate-in fade-in duration-200 ${
            feedback.kind === "success"
              ? "bg-success/10 border-success/20 text-success"
              : "bg-error/10 border-error/20 text-error"
          }`}
        >
          {feedback.kind === "success" ? (
            <CheckCircle className="shrink-0 mt-0.5" size={18} />
          ) : (
            <AlertCircle className="shrink-0 mt-0.5" size={18} />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {!initialData.latitude && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-2xl flex items-start space-x-3">
          <Info className="shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-bold">Lokasi Gudang Belum Diatur</h4>
            <p className="text-sm mt-1">
              Anda harus menyetel lokasi gudang agar sistem VRP (Penjadwalan Rute) dan fitur navigasi nasabah dapat beroperasi. Geser pin di bawah ini ke lokasi asli bank sampah Anda.
            </p>
          </div>
        </div>
      )}

      {/* Main Form & Map Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Live Preview */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface border border-gray-100 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Store size={20} className="text-primary" />
              Profil Bank Sampah Utama
            </h3>

            {/* Nama Gudang */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                Nama Bank Sampah / Depo
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Gudang & Depo Utama UanginKuy"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>

            {/* Alamat Fisik */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                Alamat Lengkap Depo
              </label>
              <textarea
                required
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Contoh: Jl. Daur Ulang No. 12, Kelurahan Sejahtera, Jakarta Pusat"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
              />
            </div>

            {/* Nomor Telepon */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                Nomor Kontak / WhatsApp Depo (Opsional)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contoh: 0812-3456-7890"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
            </div>

            {/* Koordinat Display */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={marker.lat}
                  onChange={(e) =>
                    setMarker((prev) => ({
                      ...prev,
                      lat: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-gray-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={marker.lon}
                  onChange={(e) =>
                    setMarker((prev) => ({
                      ...prev,
                      lon: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-gray-800"
                />
              </div>
            </div>
          </div>

          {/* Live Preview Card for Nasabah */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
              <Eye size={14} />
              <span>Preview di Aplikasi Nasabah (/booking)</span>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Store size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-gray-900 text-sm">{name}</h4>
                  <p className="text-xs text-gray-600 mt-0.5 flex items-start gap-1">
                    <MapPin size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>{address}</span>
                  </p>
                  {phone && (
                    <p className="text-xs text-emerald-800 font-semibold mt-1 flex items-center gap-1">
                      <Phone size={12} />
                      <span>{phone}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Map */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
              <MapPin size={16} className="text-primary" />
              Titik Koordinat Peta
            </h4>
            <span className="text-xs text-gray-500">
              Klik atau geser pin pada peta untuk memilih lokasi
            </span>
          </div>

          <div className="relative h-[550px] w-full overflow-hidden rounded-3xl border border-gray-200 shadow-sm bg-gray-100">
            <Map
              mapLib={maplibregl}
              style={{ width: "100%", height: "100%" }}
              initialViewState={{
                longitude: marker.lon,
                latitude: marker.lat,
                zoom: 13,
                pitch: 0,
                bearing: 0,
              }}
              mapStyle="https://tiles.openfreemap.org/styles/positron"
              maxPitch={0}
              dragRotate={false}
              touchPitch={false}
              onClick={(e) => setMarker({ lat: e.lngLat.lat, lon: e.lngLat.lng })}
              cursor="crosshair"
            >
              <NavigationControl position="top-right" showCompass={false} />
              <Marker
                longitude={marker.lon}
                latitude={marker.lat}
                anchor="bottom"
                draggable
                onDragEnd={(e) =>
                  setMarker({ lat: e.lngLat.lat, lon: e.lngLat.lng })
                }
              >
                <div className="relative flex cursor-pointer flex-col items-center group">
                  <div className="whitespace-nowrap rounded-xl bg-gray-900 text-white px-3 py-1.5 text-xs font-bold shadow-lg mb-1 flex items-center gap-1.5">
                    <Store size={14} className="text-white" />
                    <span>{name}</span>
                  </div>
                  <MapPin
                    size={46}
                    className="fill-primary-dark text-primary drop-shadow-lg transition-transform group-hover:scale-110"
                  />
                </div>
              </Marker>
            </Map>

            {/* Coordinates Badge on Bottom of Map */}
            <div className="absolute bottom-5 left-5 right-5 pointer-events-none">
              <div className="bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-lg border border-gray-100 max-w-sm mx-auto pointer-events-auto flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                    Koordinat Pin Terpilih
                  </div>
                  <div className="font-mono font-bold text-sm text-gray-900">
                    {marker.lat.toFixed(6)}, {marker.lon.toFixed(6)}
                  </div>
                </div>
                <span className="text-[11px] text-gray-400 font-medium text-right">
                  Dapat digeser bebas
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
