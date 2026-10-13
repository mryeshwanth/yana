import { CACHE_TTL, readCache, writeCache } from "../cache";
import { googleServerKey, hasGoogleServer } from "../env";
import { haversineMeters, samplePath } from "../geo";
import type { Coordinates } from "../types";

export type CorridorPois = {
  hospitals: Coordinates[];
  police: Coordinates[];
  petrol: Coordinates[];
};

const EMPTY: CorridorPois = { hospitals: [], police: [], petrol: [] };

export async function fetchCorridorPois(origin: Coordinates, parking: Coordinates): Promise<CorridorPois> {
  const mid = {
    lat: (origin.lat + parking.lat) / 2,
    lng: (origin.lng + parking.lng) / 2,
  };
  const cacheKey = `poi:v1:${mid.lat.toFixed(2)}:${mid.lng.toFixed(2)}`;
  const cached = await readCache<CorridorPois>(cacheKey);
  if (cached) return cached;
  if (!hasGoogleServer()) return EMPTY;

  const [hospitals, police, petrol] = await Promise.all([
    nearbyType(mid, "hospital"),
    nearbyType(mid, "police"),
    nearbyType(mid, "gas_station"),
  ]);
  const result = { hospitals, police, petrol };
  await writeCache(cacheKey, result, CACHE_TTL.pois);
  return result;
}

export function nearestAlongRoute(points: Coordinates[], places: Coordinates[]) {
  if (points.length === 0 || places.length === 0) return null;
  const samples = samplePath(points, 400);
  let best = Infinity;
  for (const sample of samples) {
    for (const place of places) {
      const distance = haversineMeters(sample, place);
      if (distance < best) best = distance;
    }
  }
  return Number.isFinite(best) ? Math.round(best) : null;
}

async function nearbyType(center: Coordinates, includedType: string): Promise<Coordinates[]> {
  const response = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": googleServerKey(),
      "X-Goog-FieldMask": "places.location",
    },
    body: JSON.stringify({
      includedTypes: [includedType],
      maxResultCount: 8,
      locationRestriction: {
        circle: {
          center: { latitude: center.lat, longitude: center.lng },
          radius: 4000,
        },
      },
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return [];
  const data = (await response.json()) as {
    places?: Array<{ location?: { latitude?: number; longitude?: number } }>;
  };
  const points: Coordinates[] = [];
  for (const place of data.places ?? []) {
    if (place.location?.latitude == null || place.location.longitude == null) continue;
    points.push({ lat: place.location.latitude, lng: place.location.longitude });
  }
  return points;
}
