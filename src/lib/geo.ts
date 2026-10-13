import type { Coordinates } from "./types";

const EARTH_RADIUS_M = 6371000;

export function haversineMeters(a: Coordinates, b: Coordinates): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function estimateWalk(from: Coordinates, to: Coordinates) {
  const straight = haversineMeters(from, to);
  const walkingDistanceMeters = Math.round(straight * 1.25);
  const walkingTimeSeconds = Math.round(walkingDistanceMeters / 1.25);
  return { walkingDistanceMeters, walkingTimeSeconds };
}

export function pathLengthMeters(points: Coordinates[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += haversineMeters(points[i - 1], points[i]);
  }
  return total;
}

export function samplePath(points: Coordinates[], everyMeters = 180): Coordinates[] {
  if (points.length < 2) return points;
  const samples: Coordinates[] = [points[0]];
  let leftover = 0;
  for (let i = 1; i < points.length; i += 1) {
    const segment = haversineMeters(points[i - 1], points[i]);
    leftover += segment;
    while (leftover >= everyMeters) {
      const ratio = 1 - (leftover - everyMeters) / segment;
      samples.push(interpolate(points[i - 1], points[i], clamp(ratio, 0, 1)));
      leftover -= everyMeters;
    }
  }
  samples.push(points[points.length - 1]);
  return samples.slice(0, 36);
}

export function countSharpTurns(points: Coordinates[]) {
  const cleaned = thinByDistance(points, 35);
  let sharpTurnCount = 0;
  let verySharpTurnCount = 0;
  for (let i = 1; i < cleaned.length - 1; i += 1) {
    const angle = turnAngleDegrees(cleaned[i - 1], cleaned[i], cleaned[i + 1]);
    if (angle > 75) verySharpTurnCount += 1;
    else if (angle > 45) sharpTurnCount += 1;
  }
  return { sharpTurnCount, verySharpTurnCount };
}

function thinByDistance(points: Coordinates[], minMeters: number) {
  if (points.length < 3) return points;
  const kept: Coordinates[] = [points[0]];
  for (let i = 1; i < points.length - 1; i += 1) {
    const last = kept[kept.length - 1];
    if (haversineMeters(last, points[i]) >= minMeters) kept.push(points[i]);
  }
  kept.push(points[points.length - 1]);
  return kept;
}

function turnAngleDegrees(a: Coordinates, b: Coordinates, c: Coordinates) {
  const delta = Math.abs(bearingDegrees(a, b) - bearingDegrees(b, c));
  return delta > 180 ? 360 - delta : delta;
}

function bearingDegrees(from: Coordinates, to: Coordinates) {
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const dLng = toRad(to.lng - from.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function decodePolyline(encoded: string): Coordinates[] {
  const points: Coordinates[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    lat += nextDelta();
    lng += nextDelta();
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  function nextDelta() {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);
    return result & 1 ? ~(result >> 1) : result >> 1;
  }

  return points;
}

export function encodePolyline(points: Coordinates[]): string {
  let lastLat = 0;
  let lastLng = 0;
  let result = "";

  for (const point of points) {
    const lat = Math.round(point.lat * 1e5);
    const lng = Math.round(point.lng * 1e5);
    result += encodeDelta(lat - lastLat);
    result += encodeDelta(lng - lastLng);
    lastLat = lat;
    lastLng = lng;
  }

  return result;
}

function encodeDelta(value: number) {
  let num = value < 0 ? ~(value << 1) : value << 1;
  let output = "";
  while (num >= 0x20) {
    output += String.fromCharCode((0x20 | (num & 0x1f)) + 63);
    num >>= 5;
  }
  output += String.fromCharCode(num + 63);
  return output;
}

function interpolate(a: Coordinates, b: Coordinates, t: number): Coordinates {
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
  };
}

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
