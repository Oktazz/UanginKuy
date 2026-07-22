"use client";

import { useState, useEffect } from 'react';
import Map from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, LocateFixed, Loader2 } from 'lucide-react';

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
}

export function LocationPicker({ onLocationSelect }: LocationPickerProps) {
  const [viewState, setViewState] = useState({
    longitude: 106.827153, // Default to Jakarta
    latitude: -6.17511,
    zoom: 15,
  });
  
  const [loading, setLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = (isInit = false) => {
    if (!isInit) setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setViewState((prev) => ({ ...prev, longitude, latitude }));
          onLocationSelect(latitude, longitude);
          if (isInit) setLoading(false);
          setIsLocating(false);
          setError(null);
        },
        (err) => {
          setError("Gagal mendapatkan lokasi. Silakan geser peta secara manual.");
          if (isInit) setLoading(false);
          setIsLocating(false);
        }
      );
    } else {
      setError("Geolocation tidak didukung oleh browser Anda.");
      if (isInit) setLoading(false);
      setIsLocating(false);
    }
  };

  // Initialize with user's geolocation
  useEffect(() => {
    getCurrentLocation(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMove = (evt: any) => {
    setViewState(evt.viewState);
  };

  const handleMoveEnd = (evt: any) => {
    const lat = evt.viewState.latitude;
    const lng = evt.viewState.longitude;
    onLocationSelect(lat, lng);
  };

  if (loading) {
    return <div className="h-48 w-full bg-gray-100 animate-pulse rounded-2xl flex items-center justify-center text-gray-500 font-medium">Mencari lokasi Anda...</div>;
  }

  return (
    <div className="w-full flex flex-col space-y-2">
      {error && <p className="text-xs text-error font-medium">{error}</p>}
      <div className="relative h-64 w-full rounded-2xl overflow-hidden border border-gray-200 shadow-inner group">
        <Map
          mapLib={maplibregl}
          {...viewState}
          onMove={handleMove}
          onMoveEnd={handleMoveEnd}
          mapStyle="https://tiles.openfreemap.org/styles/positron"
          interactive={true}
        />
        
        {/* Fixed Center Marker for Gojek-like UX */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full pointer-events-none pb-1 group-active:-translate-y-[calc(100%+8px)] transition-transform duration-200 ease-out z-10">
          <div className="relative">
            <MapPin size={40} className="text-primary fill-primary-dark drop-shadow-md" />
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-1 bg-black/20 rounded-full blur-[1px]"></div>
          </div>
        </div>
        
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-bold text-gray-600 shadow-sm pointer-events-none">
          Geser Peta
        </div>

        {/* Locate Me Button */}
        <button 
          type="button"
          onClick={() => getCurrentLocation(false)}
          disabled={isLocating}
          className="absolute bottom-12 right-3 w-10 h-10 z-10 bg-white rounded-full shadow-md flex items-center justify-center text-primary hover:bg-gray-50 transition-colors disabled:opacity-50"
          title="Gunakan lokasi saya saat ini"
        >
          {isLocating ? <Loader2 size={20} className="animate-spin" /> : <LocateFixed size={20} />}
        </button>
      </div>
      <p className="text-xs text-gray-500 text-center font-medium">Geser peta untuk memosisikan pin tepat di lokasi penjemputan Anda</p>
    </div>
  );
}
