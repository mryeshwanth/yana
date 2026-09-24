import type { RoutePreference } from "./types";

const KEY = "yana.preference";
const ONBOARDED = "yana.onboarded";

export function readPreference(): RoutePreference {
  if (typeof window === "undefined") return "broader_roads";
  const value = window.localStorage.getItem(KEY);
  if (value === "fastest" || value === "broader_roads" || value === "family_comfort") {
    return value;
  }
  return "broader_roads";
}

export function writePreference(value: RoutePreference) {
  window.localStorage.setItem(KEY, value);
}

export function isOnboarded() {
  return window.localStorage.getItem(ONBOARDED) === "1";
}

export function markOnboarded() {
  window.localStorage.setItem(ONBOARDED, "1");
}

export const PREFERENCE_COPY: Record<
  RoutePreference,
  { title: string; body: string; for: string }
> = {
  fastest: {
    title: "Fastest",
    body: "Lowest drive time. May use more local or inner roads.",
    for: "Suits regular commuters who know the area and want to save time.",
  },
  broader_roads: {
    title: "Broader Roads",
    body: "Prefers major and wider roads, even if it adds a few minutes.",
    for: "Suits new drivers, and women or others who prefer extra caution on main roads.",
  },
  family_comfort: {
    title: "Family Comfort",
    body: "Leans hardest toward major roads and fewer tight stretches.",
    for: "Suits family trips, night drives, and anyone traveling with kids or elders.",
  },
};
