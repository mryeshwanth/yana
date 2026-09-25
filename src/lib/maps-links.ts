import { haversineMeters } from "./geo";
import type { Coordinates } from "./types";

const MIN_VIA_GAP_M = 1500;

export function viaPointsAlong(path: Coordinates[], count = 2): Coordinates[] {
  if (path.length < 6) return [];
  const start = path[0];
  const end = path[path.length - 1];
  if (!start || !end) return [];

  const picked: Coordinates[] = [];
  for (let i = 1; i <= count; i += 1) {
    const point = path[Math.floor((path.length * i) / (count + 1))];
    if (!point) continue;
    if (haversineMeters(point, start) < MIN_VIA_GAP_M) continue;
    if (haversineMeters(point, end) < MIN_VIA_GAP_M) continue;
    picked.push(point);
  }
  return picked;
}

export function googleMapsDriveUrl(
  origin: Coordinates,
  parking: Coordinates,
  destination: Coordinates,
  path: Coordinates[] = [],
) {
  const waypoints = [...viaPointsAlong(path), parking]
    .map((point) => `${point.lat},${point.lng}`)
    .join("|");
  const params = new URLSearchParams({
    api: "1",
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    waypoints,
    travelmode: "driving",
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function appleMapsDriveUrl(
  origin: Coordinates,
  parking: Coordinates,
  destination: Coordinates,
  path: Coordinates[] = [],
) {
  const params = new URLSearchParams({
    source: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    mode: "driving",
  });
  for (const point of [...viaPointsAlong(path), parking]) {
    params.append("waypoint", `${point.lat},${point.lng}`);
  }
  return `https://maps.apple.com/directions?${params.toString()}`;
}
