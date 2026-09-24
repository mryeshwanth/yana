import { decodePolyline } from "../geo";
import { googleServerKey } from "../env";
import type { Coordinates, RawRoute, RoutingProvider, WalkLeg } from "../types";

type GoogleRoute = {
  duration?: string;
  distanceMeters?: number;
  polyline?: { encodedPolyline?: string };
};

type RoutingPreference = "TRAFFIC_AWARE" | "TRAFFIC_AWARE_OPTIMAL" | "TRAFFIC_UNAWARE";

export class GoogleRoutingProvider implements RoutingProvider {
  async getRoutes(origin: Coordinates, destination: Coordinates): Promise<RawRoute[]> {
    const batches = await Promise.allSettled([
      computeRoutes(origin, destination, "DRIVE", true, "TRAFFIC_AWARE"),
      computeRoutes(origin, destination, "DRIVE", true, "TRAFFIC_AWARE_OPTIMAL"),
      computeRoutes(origin, destination, "DRIVE", true, "TRAFFIC_UNAWARE"),
    ]);
    const routes: RawRoute[] = [];
    batches.forEach((batch, batchIndex) => {
      if (batch.status !== "fulfilled") return;
      batch.value.forEach((route, index) => {
        routes.push(toRawRoute(route, `google-drive-${batchIndex}-${index}`));
      });
    });
    return routes;
  }

  async getWalk(origin: Coordinates, destination: Coordinates): Promise<WalkLeg> {
    const [route] = await computeRoutes(origin, destination, "WALK", false);
    if (!route) {
      throw new Error("Google walking route unavailable");
    }
    const raw = toRawRoute(route, "google-walk");
    return {
      durationSeconds: raw.durationSeconds,
      distanceMeters: raw.distanceMeters,
      coordinates: raw.coordinates,
    };
  }
}

async function computeRoutes(
  origin: Coordinates,
  destination: Coordinates,
  travelMode: "DRIVE" | "WALK",
  alternatives: boolean,
  routingPreference: RoutingPreference = "TRAFFIC_AWARE",
): Promise<GoogleRoute[]> {
  const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": googleServerKey(),
      "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
    },
    body: JSON.stringify({
      origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
      destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
      travelMode,
      routingPreference: travelMode === "DRIVE" ? routingPreference : undefined,
      computeAlternativeRoutes: alternatives && travelMode === "DRIVE",
      languageCode: "en-IN",
      units: "METRIC",
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Routes failed (${response.status})`);
  }

  const data = (await response.json()) as { routes?: GoogleRoute[] };
  return data.routes ?? [];
}

function toRawRoute(route: GoogleRoute, id: string): RawRoute {
  const encoded = route.polyline?.encodedPolyline ?? "";
  return {
    id,
    coordinates: encoded ? decodePolyline(encoded) : [],
    durationSeconds: parseDuration(route.duration),
    distanceMeters: route.distanceMeters ?? 0,
  };
}

function parseDuration(value?: string) {
  if (!value) return 0;
  if (value.endsWith("s")) return Math.round(Number(value.slice(0, -1)));
  return Math.round(Number(value));
}
