"use client";

import { useState } from 'react';
import Map, { Marker } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin } from 'lucide-react';

interface Ticket {
  id: string;
  client_id: string;
  status: string;
  route_sequence: number;
  user_addresses?: {
    latitude?: number;
    longitude?: number;
    recipient_name?: string;
    full_address?: string;
  };
  profiles?: {
    name: string;
  };
}

export function CourierMap({ tickets }: { tickets: Ticket[] }) {
  // Gunakan lokasi tiket pertama sebagai pusat, atau fallback ke default jika kosong
  const defaultLat = tickets[0]?.user_addresses?.latitude || -6.2088;
  const defaultLng = tickets[0]?.user_addresses?.longitude || 106.8456;
  
  const [viewState, setViewState] = useState({
    longitude: defaultLng, 
    latitude: defaultLat,
    zoom: 13,
  });

  return (
    <div className="relative h-[40vh] min-h-[300px] w-full bg-gray-100 rounded-3xl overflow-hidden shadow-inner border border-gray-200">
      <Map
        mapLib={maplibregl}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="https://tiles.openfreemap.org/styles/positron"
      >
        {tickets.map((ticket, index) => {
          const lat = ticket.user_addresses?.latitude;
          const lng = ticket.user_addresses?.longitude;
          if (!lat || !lng) return null;
          return (
            <Marker key={ticket.id} longitude={lng} latitude={lat} anchor="bottom">
              <div className="relative flex flex-col items-center group cursor-pointer">
                <div className="bg-primary text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center absolute -top-8 shadow-md">
                  {index + 1}
                </div>
                <MapPin size={36} className="text-primary fill-primary-dark drop-shadow-md" />
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-1.5 bg-black/20 rounded-full blur-[1px]"></div>
              </div>
            </Marker>
          );
        })}
      </Map>
      
      {/* Overlay info */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-2">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
        <span className="text-xs font-bold text-gray-700">{tickets.length} Titik Penjemputan</span>
      </div>
    </div>
  );
}
