import type { Coordinates } from "./types";

const KEY = "yana.recents";
const MAX = 8;

export type RecentPlace = {
  name: string;
  location: Coordinates;
};

export function readRecents(): RecentPlace[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentPlace[];
    return Array.isArray(parsed) ? parsed.filter(isRecentPlace) : [];
  } catch {
    return [];
  }
}

export function pushRecent(place: RecentPlace): RecentPlace[] {
  const next = [
    place,
    ...readRecents().filter((item) => !samePlace(item, place)),
  ].slice(0, MAX);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

function samePlace(a: RecentPlace, b: RecentPlace) {
  return (
    a.name.toLowerCase() === b.name.toLowerCase() &&
    Math.abs(a.location.lat - b.location.lat) < 0.0005 &&
    Math.abs(a.location.lng - b.location.lng) < 0.0005
  );
}

function isRecentPlace(value: unknown): value is RecentPlace {
  if (!value || typeof value !== "object") return false;
  const item = value as RecentPlace;
  return (
    typeof item.name === "string" &&
    Number.isFinite(item.location?.lat) &&
    Number.isFinite(item.location?.lng)
  );
}
