import { NextResponse } from "next/server";
import { CACHE_TTL, readCache, writeCache } from "@/lib/cache";
import { fetchCorridorPois } from "@/lib/providers/corridor-pois";
import { fetchWeatherAlong } from "@/lib/providers/open-meteo";
import { getDriveRoutes, getWalkLeg } from "@/lib/providers/routing";
import { emptyMix, roadClassProvider } from "@/lib/providers/osm-road-class";
import { buildInsights } from "@/lib/route-insights";
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
    "routes:v9",
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
    const [rawRoutes, walk, weather, corridor] = await Promise.all([
      getDriveRoutes(body.origin, body.parking),
      getWalkLeg(body.parking, body.destination),
      fetchWeatherAlong([body.origin, body.parking]).catch(() => ({
        isDay: null,
        rainMm: null,
        visibilityM: null,
        weatherRisk: null,
        confidence: 0,
        lowPointRain: false,
      })),
      fetchCorridorPois(body.origin, body.parking).catch(() => ({
        hospitals: [],
        police: [],
        petrol: [],
      })),
    ]);

    const annotated = await Promise.all(
      rawRoutes.map(async (route) => {
        const mix = await roadClassProvider.annotate(route.coordinates).catch(() => emptyMix());
        const insights = buildInsights(route, mix, weather, corridor);
        return annotateRoute(route, mix, insights);
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
