"use client";

import { useEffect, useRef } from "react";
import Map, { Marker, NavigationControl, Popup, type MapRef } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_STYLE } from "@/config/map";
import { MapPin, Navigation } from "lucide-react";

export interface BranchLocation {
  id: string;
  name: string;
  region: string;
  address: string;
  latitude: number;
  longitude: number;
  highlight: string;
  dailyCapacity: string;
}

interface BaliMapLibreProps {
  branches: BranchLocation[];
  selectedBranch: BranchLocation;
  onSelectBranch: (branch: BranchLocation) => void;
}

const BALI_CENTER = {
  latitude: -8.4500,
  longitude: 115.1889,
  zoom: 9.15,
};

// Coordinate bounding box strictly constraining view & pan to Bali island
// [Southwest: [lng, lat], Northeast: [lng, lat]]
const BALI_BOUNDS: [[number, number], [number, number]] = [
  [114.30, -9.05], // Barat Daya (Southwest)
  [115.80, -7.95], // Timur Laut (Northeast)
];

export default function BaliMapLibre({
  branches,
  selectedBranch,
  onSelectBranch,
}: BaliMapLibreProps) {
  const mapRef = useRef<MapRef>(null);

  // Smoothly fly to selected branch when it changes
  useEffect(() => {
    if (mapRef.current && selectedBranch) {
      mapRef.current.flyTo({
        center: [selectedBranch.longitude, selectedBranch.latitude],
        zoom: 12.5,
        duration: 1200,
        essential: true,
      });
    }
  }, [selectedBranch]);

  const handleResetView = () => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [BALI_CENTER.longitude, BALI_CENTER.latitude],
        zoom: BALI_CENTER.zoom,
        duration: 1000,
      });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[380px] sm:min-h-[440px] rounded-2xl overflow-hidden border border-[#eae5d8] shadow-xs">
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        initialViewState={BALI_CENTER}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLE}
        attributionControl={false}
        maxBounds={BALI_BOUNDS}
        minZoom={8.6}
        maxZoom={16}
      >
        <NavigationControl position="top-right" showCompass={false} />

        {/* Branch Markers */}
        {branches.map((b) => {
          const isSelected = selectedBranch.id === b.id;
          return (
            <Marker
              key={b.id}
              latitude={b.latitude}
              longitude={b.longitude}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                onSelectBranch(b);
              }}
            >
              <div className="group relative flex flex-col items-center cursor-pointer select-none">
                {/* Marker Pin Pinhead */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 ${
                    isSelected
                      ? "bg-primary text-white scale-110 ring-4 ring-primary/20"
                      : "bg-white text-primary border border-[#eae5d8] hover:bg-primary hover:text-white hover:scale-105"
                  }`}
                >
                  <MapPin className="w-4 h-4 fill-current" />
                </div>

                {/* Marker Arrow / Stem */}
                <div
                  className={`w-2 h-2 rotate-45 -mt-1 shadow-xs transition-colors duration-300 ${
                    isSelected ? "bg-primary" : "bg-white border-r border-b border-[#eae5d8]"
                  }`}
                />

                {/* Branch Region Name Badge */}
                <div
                  className={`mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap shadow-md transition-all ${
                    isSelected
                      ? "bg-primary text-white scale-105"
                      : "bg-white text-foreground border border-[#eae5d8] opacity-90 group-hover:opacity-100"
                  }`}
                >
                  {b.region.replace("Kabupaten ", "").replace("Kota ", "")}
                </div>
              </div>
            </Marker>
          );
        })}

        {/* Selected Branch Mini Popup */}
        {selectedBranch && (
          <Popup
            latitude={selectedBranch.latitude}
            longitude={selectedBranch.longitude}
            offset={42}
            closeButton={false}
            closeOnClick={false}
            anchor="bottom"
            className="uangin-map-popup"
          >
            <div className="p-2 text-left max-w-[200px]">
              <p className="font-semibold text-xs text-foreground leading-tight">
                {selectedBranch.name}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                {selectedBranch.address}
              </p>
              <span className="inline-block mt-1 text-[9px] font-medium px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                Kapasitas: {selectedBranch.dailyCapacity}
              </span>
            </div>
          </Popup>
        )}
      </Map>

      {/* Floating Reset to Entire Bali View Button */}
      <button
        type="button"
        onClick={handleResetView}
        className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-1.5 bg-white/95 hover:bg-white text-foreground text-xs font-medium px-3 py-1.5 rounded-full border border-[#eae5d8] shadow-md backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
        aria-label="Tampilkan seluruh Pulau Bali"
      >
        <Navigation className="w-3 h-3 text-primary" />
        <span>Lihat Semua Bali</span>
      </button>
    </div>
  );
}
