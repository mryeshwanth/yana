import { NextResponse } from "next/server";
import { estimateWalk } from "@/lib/geo";
import { getCuratedLot } from "@/lib/providers/curated-parking";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const decoded = decodeURIComponent(id);
  const { searchParams } = new URL(request.url);
  const destLat = Number(searchParams.get("destLat"));
  const destLng = Number(searchParams.get("destLng"));
  const dest = Number.isFinite(destLat) && Number.isFinite(destLng)
    ? { lat: destLat, lng: destLng }
    : null;

  if (decoded.startsWith("curated:")) {
    const lot = await getCuratedLot(decoded);
    if (!lot || lot.hidden) {
      return NextResponse.json({ error: "Parking not found" }, { status: 404 });
    }
    const walk = dest ? estimateWalk(dest, { lat: lot.lat, lng: lot.lng }) : null;
    return NextResponse.json({
      parking: {
        id: decoded,
        name: lot.name,
        lat: lot.lat,
        lng: lot.lng,
        address: lot.address,
        priceText: lot.priceText,
        hoursText: lot.hoursText,
        notes: lot.notes,
        availabilityState:
          lot.source === "live_feed" && lot.availabilityState === "live"
            ? "live"
            : lot.availabilityState === "live"
              ? "unknown"
              : lot.availabilityState,
        source: lot.source,
        curated: true,
        distanceMeters: walk?.walkingDistanceMeters ?? 0,
        walkingDistanceMeters: walk?.walkingDistanceMeters ?? 0,
        walkingTimeSeconds: walk?.walkingTimeSeconds ?? 0,
      },
    });
  }

  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const name = searchParams.get("name") ?? "Parking";
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Parking not found" }, { status: 404 });
  }
  const walk = dest ? estimateWalk(dest, { lat, lng }) : null;
  return NextResponse.json({
    parking: {
      id: decoded,
      name,
      lat,
      lng,
      address: searchParams.get("address"),
      priceText: searchParams.get("priceText"),
      hoursText: searchParams.get("hoursText"),
      availabilityState: "unknown",
      source: decoded.startsWith("places:") ? "places" : "osm",
      curated: false,
      distanceMeters: walk?.walkingDistanceMeters ?? 0,
      walkingDistanceMeters: walk?.walkingDistanceMeters ?? 0,
      walkingTimeSeconds: walk?.walkingTimeSeconds ?? 0,
    },
  });
}
