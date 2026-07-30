"use client";

import { useState } from "react";
import Map, { Marker } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { saveWarehouseLocation } from "./actions";
import { MapPin, Save, Loader2, Info } from "lucide-react";
import { useRouter } from "next/navigation";

export default function WarehouseClient({ initialLat, initialLon }: { initialLat: number | null, initialLon: number | null }) {
  // Gunakan Monas sebagai pusat jika belum ada koordinat sebelumnya
  const [marker, setMarker] = useState({ 
    lat: initialLat || -6.2088, 
    lon: initialLon || 106.8456 
  });
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveWarehouseLocation(marker.lat, marker.lon);
      alert("Lokasi gudang berhasil disimpan!");
      router.push("/admin/routes");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui.";
      alert("Gagal menyimpan lokasi: " + message);
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Pengaturan Gudang</h2>
          <p className="text-gray-500 mt-2 font-medium">Tentukan lokasi depot utama (Gudang) untuk kalkulasi VRP.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center space-x-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-dark transition-all shadow-sm disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          <span>{isSaving ? "Menyimpan..." : "Simpan Lokasi"}</span>
        </button>
      </div>

      {!initialLat && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-2xl flex items-start space-x-3">
          <Info className="flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-bold">Lokasi Gudang Belum Diatur</h4>
            <p className="text-sm mt-1">Anda harus menyetel lokasi gudang agar sistem VRP (Penjadwalan Rute) dapat beroperasi. Geser pin di bawah ini ke lokasi asli bank sampah utama Anda.</p>
          </div>
        </div>
      )}

      <div className="relative h-[600px] w-full overflow-hidden rounded-3xl shadow-sm">
        <Map
          style={{ width: "100%", height: "100%" }}
          initialViewState={{
            longitude: marker.lon,
            latitude: marker.lat,
            zoom: 12,
            pitch: 0,
            bearing: 0,
          }}
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
          maxPitch={0}
          dragRotate={false}
          touchPitch={false}
          onClick={(e) => setMarker({ lat: e.lngLat.lat, lon: e.lngLat.lng })}
          cursor="crosshair"
        >
          <Marker 
            longitude={marker.lon} 
            latitude={marker.lat}
            anchor="bottom"
            draggable
            onDragEnd={(e) => setMarker({ lat: e.lngLat.lat, lon: e.lngLat.lng })}
          >
            <div className="relative flex cursor-pointer items-center justify-center transition-transform hover:scale-110">
              <div className="absolute bottom-full mb-1 whitespace-nowrap rounded-full bg-white px-2 py-1 text-xs font-bold shadow-md">
                Gudang UanginKuy
              </div>
              <MapPin size={48} className="fill-primary-dark text-primary drop-shadow-md" />
            </div>
          </Marker>
        </Map>
        
        <div className="absolute bottom-8 left-8 right-8 pointer-events-none">
           <div className="bg-white/90 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-lg border border-gray-100 max-w-md mx-auto pointer-events-auto flex items-center justify-between">
              <div>
                 <div className="text-xs text-gray-500 font-bold uppercase mb-1">Koordinat Saat Ini</div>
                 <div className="font-mono font-medium text-gray-900">
                    {marker.lat.toFixed(6)}, {marker.lon.toFixed(6)}
                 </div>
              </div>
              <div className="text-xs text-gray-500 max-w-[150px] text-right">
                Geser pin atau klik pada peta untuk mengubah lokasi.
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
