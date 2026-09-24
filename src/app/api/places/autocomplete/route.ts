import { NextResponse } from "next/server";
import { autocompletePlaces } from "@/lib/providers/geocoding";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const proximity = Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : undefined;

  try {
    const suggestions = await autocompletePlaces(q, proximity);
    return NextResponse.json({ suggestions, provider: process.env.GOOGLE_MAPS_API_KEY ? "google" : "osm" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 502 },
    );
  }
}
