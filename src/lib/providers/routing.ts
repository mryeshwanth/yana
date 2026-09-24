import { estimateWalk } from "../geo";
import { hasGoogleServer } from "../env";
import type { Coordinates, RawRoute, RoutingProvider, WalkLeg } from "../types";
import { GoogleRoutingProvider } from "./google-routing";
import { OsrmRoutingProvider } from "./osrm-routing";

const google = new GoogleRoutingProvider();
const osrm = new OsrmRoutingProvider();

export function getRoutingProvider(): RoutingProvider {
  return hasGoogleServer() ? google : osrm;
}

export async function getDriveRoutes(origin: Coordinates, destination: Coordinates): Promise<RawRoute[]> {
  const collected: RawRoute[] = [];
  try {
    collected.push(...(await getRoutingProvider().getRoutes(origin, destination)));
  } catch {
    /* try OSRM next */
  }
  if (collected.length === 0) {
    try {
      collected.push(...(await osrm.getRoutes(origin, destination)));
    } catch {
      if (!hasGoogleServer()) {
        throw new Error("Routing unavailable");
      }
    }
  }
  return uniqueRoutes(collected);
}

function uniqueRoutes(routes: RawRoute[]): RawRoute[] {
  const kept: RawRoute[] = [];
  for (const route of routes) {
    if (!kept.some((item) => samePath(item, route))) kept.push(route);
  }
  return kept
    .sort((a, b) => a.durationSeconds - b.durationSeconds)
    .slice(0, 4);
}

function samePath(a: RawRoute, b: RawRoute) {
  if (a.id === b.id) return true;
  if (Math.abs(a.distanceMeters - b.distanceMeters) > 600) return false;
  const left = sample(a.coordinates);
  const right = sample(b.coordinates);
  if (left.length === 0 || right.length === 0) {
    return Math.abs(a.distanceMeters - b.distanceMeters) < 250;
  }
  return left.every((point, index) => {
    const other = right[index];
    return Boolean(
      other && Math.abs(point.lat - other.lat) < 0.008 && Math.abs(point.lng - other.lng) < 0.008,
    );
  });
}

function sample(coordinates: Coordinates[]) {
  if (coordinates.length === 0) return [];
  const at = (ratio: number) =>
    coordinates[Math.min(coordinates.length - 1, Math.floor(coordinates.length * ratio))];
  return [at(0.2), at(0.5), at(0.8)];
}

export async function getWalkLeg(origin: Coordinates, destination: Coordinates): Promise<WalkLeg> {
  try {
    return await getRoutingProvider().getWalk(origin, destination);
  } catch {
    const estimate = estimateWalk(origin, destination);
    return {
      durationSeconds: estimate.walkingTimeSeconds,
      distanceMeters: estimate.walkingDistanceMeters,
      coordinates: [origin, destination],
    };
  }
}
