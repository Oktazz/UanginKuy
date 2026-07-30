import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { coordinates } = await req.json();

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    const apiKey = process.env.ORS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ORS_API_KEY not configured" }, { status: 500 });
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
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("ORS error:", response.status, errText);
      return NextResponse.json(
        { error: `ORS request failed: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract the route geometry from ORS response
    const geometry = data?.features?.[0]?.geometry;
    if (!geometry) {
      return NextResponse.json({ error: "No route geometry returned" }, { status: 502 });
    }

    return NextResponse.json({ geometry });
  } catch (err: any) {
    console.error("ORS route error:", err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}
