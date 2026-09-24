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
  if (collected.length < 3) {
    try {
      collected.push(...(await osrm.getRoutes(origin, destination)));
    } catch {
      if (collected.length === 0 && !hasGoogleServer()) {
        throw new Error("Routing unavailable");
      }
    }
  }
  return uniqueRoutes(collected);
}

function uniqueRoutes(routes: RawRoute[]): RawRoute[] {
  const kept: RawRoute[] = [];
  for (const route of [...routes].sort((a, b) => a.durationSeconds - b.durationSeconds)) {
    const duplicate = kept.some((item) => samePath(item, route));
    if (!duplicate) kept.push(route);
  }
  return kept.slice(0, 4);
}

function samePath(a: RawRoute, b: RawRoute) {
  if (Math.abs(a.durationSeconds - b.durationSeconds) > 45) return false;
  if (Math.abs(a.distanceMeters - b.distanceMeters) > 400) return false;
  const left = sample(a.coordinates);
  const right = sample(b.coordinates);
  return left.every((point, index) => {
    const other = right[index];
    if (!other) return false;
    return Math.abs(point.lat - other.lat) < 0.004 && Math.abs(point.lng - other.lng) < 0.004;
  });
}

function sample(coordinates: Coordinates[]) {
  if (coordinates.length === 0) return [];
  const at = (ratio: number) => coordinates[Math.min(coordinates.length - 1, Math.floor(coordinates.length * ratio))];
  return [at(0.25), at(0.5), at(0.75)];
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
