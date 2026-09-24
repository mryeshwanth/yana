import type { Coordinates } from "./types";

export function googleMapsDriveUrl(origin: Coordinates, parking: Coordinates, destination: Coordinates) {
  const params = new URLSearchParams({
    api: "1",
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    waypoints: `${parking.lat},${parking.lng}`,
    travelmode: "driving",
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function appleMapsDriveUrl(origin: Coordinates, parking: Coordinates, destination: Coordinates) {
  const params = new URLSearchParams({
    saddr: `${origin.lat},${origin.lng}`,
    daddr: `${parking.lat},${parking.lng} to:${destination.lat},${destination.lng}`,
    dirflg: "d",
  });
  return `https://maps.apple.com/?${params.toString()}`;
}
