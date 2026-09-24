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
  try {
    const routes = await getRoutingProvider().getRoutes(origin, destination);
    if (routes.length > 0) return routes;
  } catch (error) {
    if (hasGoogleServer()) {
      return osrm.getRoutes(origin, destination);
    }
    throw error;
  }
  return osrm.getRoutes(origin, destination);
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
