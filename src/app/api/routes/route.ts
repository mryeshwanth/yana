import { NextResponse } from "next/server";
import { CACHE_TTL, readCache, writeCache } from "@/lib/cache";
import { getDriveRoutes, getWalkLeg } from "@/lib/providers/routing";
import { roadClassProvider } from "@/lib/providers/osm-road-class";
import { annotateRoute, compareRoutes } from "@/lib/scoring";
import type { ComparedRoute, WalkLeg } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    origin?: { lat: number; lng: number };
    parking?: { lat: number; lng: number };
    destination?: { lat: number; lng: number };
  };

  if (!body.origin || !body.parking || !body.destination) {
    return NextResponse.json(
      { error: "origin, parking, and destination are required" },
      { status: 400 },
    );
  }

  const cacheKey = [
    "routes:v6",
    body.origin.lat.toFixed(3),
    body.origin.lng.toFixed(3),
    body.parking.lat.toFixed(3),
    body.parking.lng.toFixed(3),
    body.destination.lat.toFixed(3),
    body.destination.lng.toFixed(3),
  ].join(":");

  const cached = await readCache<{ routes: ComparedRoute[]; walk: WalkLeg }>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const [rawRoutes, walk] = await Promise.all([
      getDriveRoutes(body.origin, body.parking),
      getWalkLeg(body.parking, body.destination),
    ]);

    const annotated = await Promise.all(
      rawRoutes.map(async (route) => {
        const mix = await roadClassProvider.annotate(route.coordinates);
        return annotateRoute(route, mix);
      }),
    );

    const payload = {
      routes: compareRoutes(annotated),
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
