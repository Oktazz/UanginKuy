export type LatLng = { lat: number; lng: number };

/**
 * Client wrapper untuk geocoding server-side (fallback 3 level diproses di server).
 * Menggantikan panggilan langsung ke Nominatim dari browser.
 */
export async function geocodeAddress(fields: {
  detail: string;
  district: string;
  city: string;
  province: string;
}): Promise<LatLng | null> {
  try {
    const res = await fetch("/api/geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<LatLng> & { error?: string };
    if (
      typeof data.lat === "number" &&
      typeof data.lng === "number" &&
      Number.isFinite(data.lat) &&
      Number.isFinite(data.lng)
    ) {
      return { lat: data.lat, lng: data.lng };
    }
    return null;
  } catch {
    return null;
  }
}