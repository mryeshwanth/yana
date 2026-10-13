import type { RoutePreference } from "./types";

const KEY = "yana.preference";
const ONBOARDED = "yana.onboarded";

export function readPreference(): RoutePreference {
  if (typeof window === "undefined") return "broader_roads";
  const value = window.localStorage.getItem(KEY);
  if (
    value === "fastest" ||
    value === "broader_roads" ||
    value === "family_comfort" ||
    value === "safer_indicators"
  ) {
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
    body: "Fewer inner stretches and no long detour. Can be the same path as Fastest or Broader roads.",
    for: "Suits trips with kids, elders, or luggage — less weaving, not a long extra drive.",
  },
  safer_indicators: {
    title: "Safer indicators",
    body: "Prefers stronger mapped lighting and closer hospital, police, or petrol POIs. Not a safety guarantee.",
    for: "Suits night drives when you want more lighting and emergency-access indicators, not a claim the road is safe.",
  },
};
