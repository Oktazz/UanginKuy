"use client";

import { useState } from 'react';
import Map, { Marker } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, Navigation2 } from 'lucide-react';

interface Ticket {
  id: string;
  client_id: string;
  status: string;
  route_sequence: number;
  profiles: {
    name: string;
    address: string;
    phone_number: string;
  };
}

export function CourierMap({ tickets }: { tickets: Ticket[] }) {
  // Using Jakarta center if no tickets
  const [viewState, setViewState] = useState({
    longitude: 106.827153, 
    latitude: -6.17511,
    zoom: 13,
  });

  // Mock coordinates for tickets since DB doesn't have lat/lng yet
  const getMockCoordinates = (index: number) => {
    const baseLng = 106.827153;
    const baseLat = -6.17511;
    return {
      lng: baseLng + ((index + 1) * 0.005),
      lat: baseLat + ((index + 1) * 0.005)
    };
  };

  return (
    <div className="relative h-[40vh] min-h-[300px] w-full bg-gray-100 rounded-3xl overflow-hidden shadow-inner border border-gray-200">
      <Map
        mapLib={maplibregl}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="https://tiles.openfreemap.org/styles/positron"
      >
        {tickets.map((ticket, index) => {
          const coords = getMockCoordinates(index);
          return (
            <Marker key={ticket.id} longitude={coords.lng} latitude={coords.lat} anchor="bottom">
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
      
      <button className="absolute bottom-4 right-4 bg-white w-12 h-12 rounded-full shadow-md flex items-center justify-center text-primary hover:bg-gray-50 transition">
        <Navigation2 size={24} />
      </button>
    </div>
  );
}
