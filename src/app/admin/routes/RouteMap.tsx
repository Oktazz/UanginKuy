"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/* ---------- types ---------- */
interface Ticket {
  id: string;
  courier_id: string | null;
  route_sequence: number | null;
  user_addresses?: {
    recipient_name: string;
    full_address: string;
    latitude: number | null;
    longitude: number | null;
  } | null;
}

interface Courier {
  id: string;
  name: string;
}

interface Depot {
  latitude: number;
  longitude: number;
}

interface Props {
  tickets: Ticket[];
  couriers: Courier[];
  depot: Depot | null;
  routeGenerated: boolean;
  onGenerate: () => void;
  isGenerating: boolean;
}

type GeoLineString = { type: "LineString"; coordinates: number[][] };
type GeoMultiLineString = { type: "MultiLineString"; coordinates: number[][][] };
type GeoRouteGeometry = GeoLineString | GeoMultiLineString;

/* ---------- colour palette ---------- */
const COURIER_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444",
  "#8b5cf6", "#06b6d4", "#f97316", "#ec4899",
];

function courierColor(courierId: string | null, couriers: Courier[]): string {
  if (!courierId) return "#94a3b8";
  const idx = couriers.findIndex((c) => c.id === courierId);
  return COURIER_COLORS[idx % COURIER_COLORS.length];
}

/* ---------- ORS fetch (client → Next.js API proxy) ---------- */
async function fetchRoadRoute(coords: [number, number][]): Promise<GeoRouteGeometry | null> {
  try {
    const res = await fetch("/api/ors-route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coordinates: coords }),
    });
    if (!res.ok) {
      console.error("[RouteMap] ORS proxy error:", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    console.log("[RouteMap] ORS geometry type:", data.geometry?.type, "coords:", data.geometry?.coordinates?.length);
    return data.geometry ?? null;
  } catch (e) {
    console.error("[RouteMap] fetchRoadRoute failed:", e);
    return null;
  }
}

/* ---------- map helpers (plain functions, no useCallback) ---------- */
function clearRouteLayers(map: maplibregl.Map) {
  const style = map.getStyle();
  // Remove layers first, then sources
  (style?.layers ?? [])
    .filter((l) => l.id.startsWith("ors-"))
    .forEach((l) => { if (map.getLayer(l.id)) map.removeLayer(l.id); });
  Object.keys(style?.sources ?? {})
    .filter((s) => s.startsWith("ors-"))
    .forEach((s) => { if (map.getSource(s)) map.removeSource(s); });
}

function addRouteLayer(
  map: maplibregl.Map,
  courierId: string,
  geometry: GeoRouteGeometry,
  color: string
) {
  const srcId = `ors-${courierId}`;
  map.addSource(srcId, {
    type: "geojson",
    data: { type: "Feature", properties: {}, geometry } as any,
  });
  // Glow
  map.addLayer({
    id: `ors-glow-${courierId}`,
    type: "line",
    source: srcId,
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": color, "line-width": 10, "line-opacity": 0.12 },
  });
  // Main
  map.addLayer({
    id: `ors-line-${courierId}`,
    type: "line",
    source: srcId,
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": color, "line-width": 3.5, "line-opacity": 0.9 },
  });
}

/* ---------- component ---------- */
export default function RouteMap({ tickets, couriers, depot, routeGenerated, onGenerate, isGenerating }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [routesFailed, setRoutesFailed] = useState(false);

  const points = useMemo(
    () => tickets.filter(
      (t) =>
        typeof t.user_addresses?.latitude === "number" &&
        typeof t.user_addresses?.longitude === "number"
    ),
    [tickets]
  );

  const center = useMemo<[number, number]>(() => {
    if (depot) return [depot.longitude, depot.latitude];
    if (points.length > 0)
      return [points[0].user_addresses!.longitude!, points[0].user_addresses!.latitude!];
    return [106.827, -6.1754];
  }, [depot, points]);

  /* ---- init map once ---- */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center,
      zoom: 12,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- markers + routes (reactive) ---- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Cancellation flag to prevent stale async writes
    let cancelled = false;

    const run = async () => {
      if (!map.isStyleLoaded()) {
        await new Promise<void>((resolve) => map.once("load", resolve));
      }
      if (cancelled) return;

      /* -- clear old markers -- */
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      /* -- clear old route layers -- */
      clearRouteLayers(map);

      /* -- depot marker -- */
      if (depot) {
        const el = document.createElement("div");
        el.innerHTML = `<div style="background:#1e293b;color:#fff;border-radius:50%;width:38px;height:38px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 14px rgba(0,0,0,0.35);border:3px solid #fff;">🏭</div>`;
        const m = new maplibregl.Marker({ element: el })
          .setLngLat([depot.longitude, depot.latitude])
          .setPopup(new maplibregl.Popup({ offset: 22 }).setHTML(`<strong style="font-family:system-ui;">Gudang / Depot</strong>`))
          .addTo(map);
        markersRef.current.push(m);
      }

      /* -- pickup markers -- */
      points.forEach((ticket) => {
        const lng = ticket.user_addresses!.longitude!;
        const lat = ticket.user_addresses!.latitude!;
        const color = courierColor(ticket.courier_id, couriers);
        const seq = ticket.route_sequence;
        const name = ticket.user_addresses?.recipient_name ?? "?";
        const address = ticket.user_addresses?.full_address ?? "";

        const el = document.createElement("div");
        el.innerHTML = `<div style="background:${color};color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;box-shadow:0 3px 10px rgba(0,0,0,0.25);border:2.5px solid #fff;cursor:pointer;">${seq ?? "•"}</div>`;

        const popup = new maplibregl.Popup({ offset: 18 }).setHTML(`
          <div style="font-family:system-ui;padding:4px 2px;min-width:160px;">
            <div style="font-weight:700;font-size:14px;margin-bottom:4px;">${name}</div>
            <div style="font-size:11px;color:#64748b;">${address}</div>
            ${seq
              ? `<div style="margin-top:6px;font-size:11px;font-weight:700;color:${color};">Urutan ke-${seq}</div>`
              : `<div style="margin-top:6px;font-size:11px;color:#94a3b8;font-style:italic;">Belum diurutkan</div>`}
          </div>`);

        const m = new maplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map);
        markersRef.current.push(m);
      });

      /* -- route lines -- */
      if (!routeGenerated || !depot) return;

      // Group tickets by courier, only those with route_sequence
      const groups: Record<string, typeof points> = {};
      points.forEach((t) => {
        if (!t.courier_id || !t.route_sequence) return;
        if (!groups[t.courier_id]) groups[t.courier_id] = [];
        groups[t.courier_id].push(t);
      });

      if (Object.keys(groups).length === 0) return;

      if (!cancelled) { setLoadingRoutes(true); setRoutesFailed(false); }

      let anyFailed = false;

      // Fetch ORS sequentially to avoid parallel-add race on same map style
      for (const [courierId, pts] of Object.entries(groups)) {
        if (cancelled) return;

        const sorted = [...pts].sort((a, b) => (a.route_sequence ?? 0) - (b.route_sequence ?? 0));
        const color = courierColor(courierId, couriers);

        const coords: [number, number][] = [
          [depot.longitude, depot.latitude],
          ...sorted.map((t) => [t.user_addresses!.longitude!, t.user_addresses!.latitude!] as [number, number]),
          // no return to depot — route ends at last stop
        ];

        console.log(`[RouteMap] Fetching ORS for courier ${courierId}, ${coords.length} waypoints`);
        const geometry = await fetchRoadRoute(coords);
        if (cancelled) return;

        if (geometry) {
          addRouteLayer(map, courierId, geometry, color);
        } else {
          anyFailed = true;
          // Fallback: straight line
          addRouteLayer(map, courierId, { type: "LineString", coordinates: coords }, color);
        }
      }

      if (!cancelled) {
        setLoadingRoutes(false);
        if (anyFailed) setRoutesFailed(true);
      }
    };

    run();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickets, couriers, depot, points, routeGenerated]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />

      {/* Loading overlay */}
      {loadingRoutes && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center rounded-2xl pointer-events-none">
          <div className="bg-white rounded-xl px-4 py-2.5 shadow-lg flex items-center gap-2.5 text-sm font-semibold text-gray-700">
            <svg className="animate-spin h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Memuat rute jalan nyata...
          </div>
        </div>
      )}

      {/* Fallback warning */}
      {routesFailed && !loadingRoutes && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-lg shadow pointer-events-none">
          ⚠️ Sebagian rute tampil sebagai garis lurus (ORS gagal)
        </div>
      )}

      {/* Floating generate button — bottom right */}
      <div className="absolute bottom-4 right-4">
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all disabled:opacity-60 active:scale-95"
          style={{ backdropFilter: "blur(4px)" }}
        >
          <svg
            className={`w-4 h-4 flex-shrink-0 ${isGenerating ? "animate-pulse" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {isGenerating ? "Menghitung Rute..." : "Generate Rute Optimal"}
        </button>
      </div>
      {couriers.length > 0 && (
        <div className="absolute bottom-3 left-3 bg-white/92 backdrop-blur rounded-xl p-3 shadow text-xs space-y-1.5 max-w-[180px]">
          <div className="font-bold text-gray-700 mb-1">Legenda Kurir</div>
          {couriers.map((c, i) => (
            <div key={c.id} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: COURIER_COLORS[i % COURIER_COLORS.length] }}
              />
              <span className="text-gray-600 truncate">{c.name}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1 border-t border-gray-200 mt-1">
            <div className="w-3 h-3 rounded-full flex-shrink-0 bg-slate-400" />
            <span className="text-gray-400">Belum ditugaskan</span>
          </div>
        </div>
      )}
    </div>
  );
}
