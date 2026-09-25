import { NextResponse } from "next/server";
import { CACHE_TTL, readCache, writeCache } from "@/lib/cache";
import { getDriveRoutes, getWalkLeg } from "@/lib/providers/routing";
import type { Coordinates, WalkLeg } from "@/lib/types";

type Preview = {
  drive: { coordinates: Coordinates[] } | null;
  walk: WalkLeg | null;
};

export async function POST(request: Request) {
  const body = (await request.json()) as {
    origin?: Coordinates;
    parking?: Coordinates;
    destination?: Coordinates;
  };

  if (!body.origin || !body.parking || !body.destination) {
    return NextResponse.json(
      { error: "origin, parking, and destination are required" },
      { status: 400 },
    );
  }

  const cacheKey = [
    "preview:v1",
    body.origin.lat.toFixed(3),
    body.origin.lng.toFixed(3),
    body.parking.lat.toFixed(3),
    body.parking.lng.toFixed(3),
    body.destination.lat.toFixed(3),
    body.destination.lng.toFixed(3),
  ].join(":");

  const cached = await readCache<Preview>(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const [routes, walk] = await Promise.all([
      getDriveRoutes(body.origin, body.parking),
      getWalkLeg(body.parking, body.destination),
    ]);
    const fastest = [...routes].sort((a, b) => a.durationSeconds - b.durationSeconds)[0];
    const payload: Preview = {
      drive: fastest ? { coordinates: fastest.coordinates } : null,
      walk,
    };
    await writeCache(cacheKey, payload, CACHE_TTL.routes);
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Routing failed" },
      { status: 502 },
    );
  }
}
