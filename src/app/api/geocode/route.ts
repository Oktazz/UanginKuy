import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { incrWindow, redis } from "@/lib/redis";
import { requestClientIp } from "@/utils/rate-limit";
import { normalizeQuery, nominatimSearchCoords, type LatLng } from "@/utils/geocode";

const RATE_WINDOW_SECONDS = 60;
const MAX_REQUESTS_PER_MINUTE = 30;
const CACHE_TTL_SECONDS = 86_400; // 24 jam
const LOCK_TTL_SECONDS = 5;
const LOCK_RETRY_ATTEMPTS = 3;
const LOCK_RETRY_DELAY_MS = 150;

type GeocodeResponse = LatLng | { error: string };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function hashQuery(query: string): string {
  return createHash("sha256").update(query).digest("hex").slice(0, 16);
}

/**
 * Check cache → miss: acquire lock, fetch, store.
 * Bila lock dipegang request lain: retry baca cache pendek, lalu fail-safe fetch.
 * Cache hanya berisi hasil sukses (null/error tak pernah disimpan).
 */
async function searchWithCacheAndLock(query: string): Promise<LatLng | null> {
  const normalized = normalizeQuery(query);
  const hash = hashQuery(normalized);
  const cacheKey = `geocode:${hash}`;
  const lockKey = `lock:geocode:${hash}`;

  const hit = await redis.get<LatLng>(cacheKey).catch(() => null);
  if (hit !== null) return hit;

  const lock = await redis.set(lockKey, "1", { nx: true, ex: LOCK_TTL_SECONDS });

  if (lock) {
    try {
      const result = await nominatimSearchCoords(query);
      if (result) {
        await redis.setex(cacheKey, CACHE_TTL_SECONDS, result).catch(() => null);
      }
      return result;
    } finally {
      await redis.del(lockKey).catch(() => null);
    }
  }

  // Kunci dipegang request lain — tunggu sebentar, coba baca cache berulang.
  for (let attempt = 0; attempt < LOCK_RETRY_ATTEMPTS; attempt++) {
    await sleep(LOCK_RETRY_DELAY_MS);
    const retry = await redis.get<LatLng>(cacheKey).catch(() => null);
    if (retry !== null) return retry;
  }

  // Fail-safe: masih belum ada cache → fetch langsung (jangan blok selamanya).
  return nominatimSearchCoords(query);
}

/**
 * Fallback 3 level dipertahankan: iterasi queries sampai menemukan hasil valid.
 * Tiap query dicache terpisah dengan key hasil normalisasi.
 */
async function firstCachedResult(queries: string[]): Promise<LatLng | null> {
  for (const query of queries) {
    const result = await searchWithCacheAndLock(query);
    if (result) return result;
  }
  return null;
}

function tooManyRequests(): NextResponse<GeocodeResponse> {
  return NextResponse.json({ error: "Too many requests" }, { status: 429 });
}

export async function GET(req: NextRequest): Promise<NextResponse<GeocodeResponse>> {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  return handle(req, [q]);
}

export async function POST(req: NextRequest): Promise<NextResponse<GeocodeResponse>> {
  let body: { detail?: unknown; district?: unknown; city?: unknown; province?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { detail, district, city, province } = body;
  if (
    typeof detail !== "string" ||
    typeof district !== "string" ||
    typeof city !== "string" ||
    typeof province !== "string"
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const queries = [
    `${detail}, ${district}, ${city}, ${province}`,
    `${district}, ${city}, ${province}`,
    `${city}, ${province}`,
  ];

  return handle(req, queries);
}

async function handle(
  req: NextRequest,
  queries: string[],
): Promise<NextResponse<GeocodeResponse>> {
  try {
    const key = `ratelimit:geocode:${requestClientIp(req)}`;
    const count = await incrWindow(key, RATE_WINDOW_SECONDS);
    if (count > MAX_REQUESTS_PER_MINUTE) {
      return tooManyRequests();
    }

    const coords = await firstCachedResult(queries);
    if (!coords) {
      return NextResponse.json({ error: "Location not found" });
    }

    return NextResponse.json(coords);
  } catch {
    // Jangan bocorkan detail internal (nama fungsi, URL, dsb)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}