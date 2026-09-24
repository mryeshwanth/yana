import { NextResponse } from "next/server";
import { getDriveRoutes, getWalkLeg } from "@/lib/providers/routing";
import { roadClassProvider } from "@/lib/providers/osm-road-class";
import { annotateRoute, compareRoutes } from "@/lib/scoring";

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

    return NextResponse.json({
      routes: compareRoutes(annotated),
      walk,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Routing failed" },
      { status: 502 },
    );
  }
}
