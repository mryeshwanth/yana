import { CACHE_TTL, readCache, writeCache } from "../cache";
import { isCarParkingPlace } from "../car-parking";
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
  destName = "",
): Promise<Parking[]> {
  const cacheKey = `nearby:v6:${destination.lat.toFixed(3)}:${destination.lng.toFixed(3)}:${radiusMeters}:${destName.toLowerCase().slice(0, 24)}`;
  const cached = await readCache<Parking[]>(cacheKey);
  const catalog = await curated.searchNearby(destination.lat, destination.lng, radiusMeters + 200);
  const onsite = destName ? [onsiteLot(destination, destName)] : [];

  if (cached?.length) {
    const remote = cached.filter((lot) => !lot.curated && !lot.id.startsWith("curated:"));
    return rankParking(destination, radiusMeters, [...catalog, ...onsite, ...remote]);
  }

  const results = await Promise.allSettled([
    hasGoogleServer()
      ? places.searchNearby(destination.lat, destination.lng, radiusMeters)
      : Promise.resolve([] as ParkingCandidate[]),
    destName && hasGoogleServer()
      ? places.searchByQuery(`${destName} parking`, destination.lat, destination.lng, radiusMeters)
      : Promise.resolve([] as ParkingCandidate[]),
    osm.searchNearby(destination.lat, destination.lng, radiusMeters),
  ]);

  const buckets = results.map((result) => (result.status === "fulfilled" ? result.value : []));
  const googleLots = [...(buckets[0] ?? []), ...(buckets[1] ?? [])];
  if (googleLots.length > 0) {
    await upsertGoogleParking(googleLots).catch(() => undefined);
  }
  const parking = rankParking(destination, radiusMeters, [
    ...catalog,
    ...onsite,
    ...buckets.flat(),
  ]);

  if (parking.length > 0) {
    await writeCache(cacheKey, parking, CACHE_TTL.nearby);
  }
  return parking;
}

function rankParking(
  destination: Coordinates,
  radiusMeters: number,
  candidates: ParkingCandidate[],
): Parking[] {
  return mergeCandidates(candidates)
    .filter((candidate) => keepCarParking(candidate))
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
    .sort((a, b) => {
      const aOnsite = a.id.startsWith("onsite:") ? 0 : 1;
      const bOnsite = b.id.startsWith("onsite:") ? 0 : 1;
      if (aOnsite !== bOnsite) return aOnsite - bOnsite;
      return a.distanceMeters - b.distanceMeters;
    })
    .slice(0, 20);
}

function keepCarParking(candidate: ParkingCandidate) {
  if (candidate.curated || candidate.id.startsWith("onsite:") || candidate.id.startsWith("curated:")) {
    return true;
  }
  return isCarParkingPlace(candidate.name);
}

function onsiteLot(destination: Coordinates, destName: string): ParkingCandidate {
  return {
    id: `onsite:${destination.lat.toFixed(5)},${destination.lng.toFixed(5)}`,
    name: `${destName} parking`,
    lat: destination.lat,
    lng: destination.lng,
    notes: "On-site at the destination",
    availabilityState: "unknown",
    source: "places",
    curated: false,
  };
}

export function mergeCandidates(candidates: ParkingCandidate[]): ParkingCandidate[] {
  const kept: ParkingCandidate[] = [];

  for (const candidate of [...candidates].sort((a, b) => Number(b.curated) - Number(a.curated))) {
    const sameId = kept.find((item) => item.id === candidate.id);
    if (sameId) {
      fillMissing(sameId, candidate);
      continue;
    }
    const nearby = kept.find((item) => haversineMeters(item, candidate) <= MERGE_METERS);
    if (!nearby) {
      kept.push(candidate);
      continue;
    }
    fillMissing(nearby, candidate);
  }

  return kept;
}

function fillMissing(target: ParkingCandidate, source: ParkingCandidate) {
  target.priceText = target.priceText ?? source.priceText;
  target.hoursText = target.hoursText ?? source.hoursText;
  target.address = target.address ?? source.address;
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
