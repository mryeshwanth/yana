import { NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/providers/geocoding";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const lat = Number(params.get("lat"));
  const lng = Number(params.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
  }

  try {
    const label = await reverseGeocode({ lat, lng });
    return NextResponse.json({ label });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Reverse geocode failed" },
      { status: 502 },
    );
  }
}
