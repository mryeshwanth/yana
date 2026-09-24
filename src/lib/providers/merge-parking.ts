import { CACHE_TTL, readCache, writeCache } from "../cache";
import { estimateWalk, haversineMeters } from "../geo";
import { hasGoogleServer } from "../env";
import { upsertGoogleParking } from "../persist";
import type { Coordinates, Parking, ParkingCandidate, ParkingProvider } from "../types";
import { CuratedParkingProvider } from "./curated-parking";
import { GoogleParkingProvider } from "./google-parking";
import { OsmParkingProvider } from "./osm-parking";

const MERGE_METERS = 60;
const curated = new CuratedParkingProvider();
const places = new GoogleParkingProvider();
const osm = new OsmParkingProvider();

export async function searchNearbyParking(
  destination: Coordinates,
  radiusMeters = 1000,
): Promise<Parking[]> {
  const cacheKey = `nearby:v2:${destination.lat.toFixed(3)}:${destination.lng.toFixed(3)}:${radiusMeters}`;
  const cached = await readCache<Parking[]>(cacheKey);
  if (cached?.length) {
    return cached;
  }

  const results = await Promise.allSettled([
    curated.searchNearby(destination.lat, destination.lng, radiusMeters + 200),
    hasGoogleServer()
      ? places.searchNearby(destination.lat, destination.lng, radiusMeters)
      : Promise.resolve([] as ParkingCandidate[]),
    osm.searchNearby(destination.lat, destination.lng, radiusMeters),
  ]);

  const buckets = results.map((result) => (result.status === "fulfilled" ? result.value : []));
  const googleLots = buckets[1] ?? [];
  if (googleLots.length > 0) {
    await upsertGoogleParking(googleLots).catch(() => undefined);
  }
  const merged = mergeCandidates(buckets.flat());

  const parking = merged
    .map((candidate) => {
      const distanceMeters = Math.round(
        haversineMeters(destination, { lat: candidate.lat, lng: candidate.lng }),
      );
      if (distanceMeters > radiusMeters + 80) return null;
      const walk = estimateWalk(destination, { lat: candidate.lat, lng: candidate.lng });
      return {
        ...candidate,
        availabilityState: normalizeAvailability(candidate),
        distanceMeters,
        walkingDistanceMeters: walk.walkingDistanceMeters,
        walkingTimeSeconds: walk.walkingTimeSeconds,
      };
    })
    .filter((item): item is Parking => Boolean(item))
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, 20);

  if (parking.length > 0) {
    await writeCache(cacheKey, parking, CACHE_TTL.nearby);
  }
  return parking;
}

export function mergeCandidates(candidates: ParkingCandidate[]): ParkingCandidate[] {
  const kept: ParkingCandidate[] = [];

  for (const candidate of [...candidates].sort((a, b) => Number(b.curated) - Number(a.curated))) {
    const duplicate = kept.find(
      (item) => haversineMeters(item, candidate) <= MERGE_METERS,
    );
    if (!duplicate) {
      kept.push(candidate);
      continue;
    }
    if (duplicate.curated) {
      duplicate.priceText = duplicate.priceText ?? candidate.priceText;
      duplicate.hoursText = duplicate.hoursText ?? candidate.hoursText;
      duplicate.address = duplicate.address ?? candidate.address;
    }
  }

  return kept;
}

function normalizeAvailability(candidate: ParkingCandidate) {
  if (candidate.source === "live_feed" && candidate.availabilityState === "live") {
    return "live" as const;
  }
  if (candidate.availabilityState === "live") {
    return "unknown" as const;
  }
  return candidate.availabilityState;
}

export const parkingProviderInterface: ParkingProvider = {
  searchNearby: (lat, lng, radiusMeters) =>
    searchNearbyParking({ lat, lng }, radiusMeters).then((lots) => lots),
};
