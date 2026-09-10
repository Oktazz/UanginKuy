import { fetchWithTimeout } from "@/utils/fetch";

export type LatLng = { lat: number; lng: number; label?: string };

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_USER_AGENT =
  process.env.NOMINATIM_USER_AGENT ?? "UanginKuy/1.0 (admin@uanginkuy.id)";

/**
 * Normalisasi query HANYA untuk cache key:
 * - lowercase + trim
 * - koma → spasi
 * - spasi berlebih → satu spasi
 *
 * "Denpasar Bali" / "denpasar bali" / "Denpasar, Bali" → key sama.
 * Query asli yang dikirim ke Nominatim TIDAK mengikuti normalisasi ini.
 */
export function normalizeQuery(q: string): string {
  return q
    .toLowerCase()
    .trim()
    .replace(/,/g, " ")
    .replace(/\s+/g, " ");
}

/**
 * Server-side single-query Nominatim search.
 * Hanya dipanggil dari route handler — tidak pernah dari browser
 * (patuhi Nomination Usage Policy: User-Agent wajib).
 *
 * Kegagalan apa pun (timeout / non-2xx / parse) → return null (fail-safe),
 * sehingga fallback di route berlanjut dan route tidak crash.
 */
export async function nominatimSearchCoords(query: string): Promise<LatLng | null> {
  const url = `${NOMINATIM_ENDPOINT}?format=json&limit=1&q=${encodeURIComponent(query)}`;

  try {
    const res = await fetchWithTimeout(url, {
      headers: {
        "User-Agent": NOMINATIM_USER_AGENT,
        Accept: "application/json",
      },
    }, 5_000);
    if (!res.ok) {
      console.warn(`[geocode] Nominatim responded with status ${res.status}`);
      return null;
    }

    const data = (await res.json()) as Array<{ lat: string; lon: string; display_name?: string }>;
    const hit = data[0];
    if (!hit) return null;

    const lat = Number.parseFloat(hit.lat);
    const lng = Number.parseFloat(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return { lat, lng, label: hit.display_name };
  } catch {
    // timeout (AbortError) atau network error → failure, lanjut fallback
    return null;
  }
}