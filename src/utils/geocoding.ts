type LatLng = { lat: number; lng: number };

type NominatimResult = {
  lat: string;
  lon: string;
};

async function nominatimSearch(query: string): Promise<NominatimResult | null> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
  );
  const data = (await res.json()) as NominatimResult[];
  return data?.[0] ?? null;
}

/**
 * Cari koordinat dengan urutan query dari paling spesifik ke broad.
 * Mengembalikan null bila semuanya gagal.
 */
export async function geocodeWithFallbacks(
  queries: string[],
): Promise<LatLng | null> {
  for (const query of queries) {
    const result = await nominatimSearch(query);
    if (result) {
      return { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
    }
  }
  return null;
}