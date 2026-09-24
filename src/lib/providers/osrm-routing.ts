import type { Coordinates, RawRoute, RoutingProvider, WalkLeg } from "../types";

export class OsrmRoutingProvider implements RoutingProvider {
  async getRoutes(origin: Coordinates, destination: Coordinates): Promise<RawRoute[]> {
    const data = await fetchOsrm("driving", origin, destination, true);
    return (data.routes ?? []).map((route, index) => ({
      id: `osrm-drive-${index}`,
      coordinates: toCoords(route.geometry),
      durationSeconds: Math.round(route.duration),
      distanceMeters: Math.round(route.distance),
    }));
  }

  async getWalk(origin: Coordinates, destination: Coordinates): Promise<WalkLeg> {
    const data = await fetchOsrm("foot", origin, destination, false);
    const route = data.routes?.[0];
    if (!route) {
      throw new Error("OSRM walking route unavailable");
    }
    return {
      durationSeconds: Math.round(route.duration),
      distanceMeters: Math.round(route.distance),
      coordinates: toCoords(route.geometry),
    };
  }
}

type OsrmResponse = {
  routes?: Array<{
    duration: number;
    distance: number;
    geometry: { coordinates: [number, number][] };
  }>;
};

async function fetchOsrm(
  profile: "driving" | "foot",
  origin: Coordinates,
  destination: Coordinates,
  alternatives: boolean,
) {
  const path = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const url = new URL(`https://router.project-osrm.org/route/v1/${profile}/${path}`);
  url.searchParams.set("overview", "full");
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("alternatives", alternatives ? "3" : "false");

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`OSRM failed (${response.status})`);
  }
  return (await response.json()) as OsrmResponse;
}

function toCoords(geometry?: { coordinates: [number, number][] }): Coordinates[] {
  return (geometry?.coordinates ?? []).map(([lng, lat]) => ({ lat, lng }));
}
