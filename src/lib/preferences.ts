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
  { title: string; body: string }
> = {
  fastest: {
    title: "Fastest",
    body: "Lowest drive time. May use more local or inner roads.",
  },
  broader_roads: {
    title: "Broader Roads",
    body: "Prefers major and wider roads, even if it adds a few minutes.",
  },
  family_comfort: {
    title: "Family Comfort",
    body: "Stronger preference for major roads and fewer narrow segments. Not a safety claim.",
  },
};
