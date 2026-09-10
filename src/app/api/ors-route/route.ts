import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { incrWindow } from "@/lib/redis";

const RATE_WINDOW_SECONDS = 60;
const MAX_REQUESTS = 30;
const CACHE_TTL_SECONDS = 1800;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient(await cookies());
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const count = await incrWindow(`ors:ratelimit:${user.id}`, RATE_WINDOW_SECONDS);
    if (count > MAX_REQUESTS) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const { coordinates } = await req.json();

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    const apiKey = process.env.ORS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ORS_API_KEY not configured" }, { status: 500 });
    }

    const hash = createHash("sha256")
      .update(JSON.stringify(coordinates))
      .digest("hex")
      .slice(0, 16);
    const cacheKey = `ors:route:${hash}`;
    const { redis } = await import("@/lib/redis");

    const cached = await redis.get<unknown>(cacheKey).catch(() => null);
    if (cached) {
      return NextResponse.json(cached);
    }

    const response = await fetch(
      "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: apiKey,
        },
        body: JSON.stringify({ coordinates }),
      },
    );

    if (!response.ok) {
      console.error("ORS error:", response.status);
      return NextResponse.json(
        { error: `Route service request failed (${response.status}).` },
        { status: response.status },
      );
    }

    const data = await response.json();

    // Extract the route geometry from ORS response
    const geometry = data?.features?.[0]?.geometry;
    if (!geometry) {
      return NextResponse.json({ error: "No route geometry returned" }, { status: 502 });
    }

    const payload = { geometry };
    await redis.setex(cacheKey, CACHE_TTL_SECONDS, payload).catch(() => null);

    return NextResponse.json(payload);
  } catch {
    console.error("ORS route error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}