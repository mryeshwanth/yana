import type { AnnotatedRoute, ComparedRoute, RawRoute, RoadMix, RoutePreference } from "./types";
import { ROUTE_WEIGHTS } from "./types";

export function annotateRoute(route: RawRoute, mix: RoadMix): AnnotatedRoute {
  return { ...route, ...mix };
}

export function compareRoutes(routes: AnnotatedRoute[]): ComparedRoute[] {
  if (routes.length === 0) return [];
  const unique = uniqueAnnotated(routes);
  const fastest = [...unique].sort((a, b) => a.durationSeconds - b.durationSeconds)[0];
  const used = new Set<string>();
  const prefs: RoutePreference[] = ["fastest", "broader_roads", "family_comfort"];
  const compared: ComparedRoute[] = [];
  for (const preference of prefs) {
    const pool = unique.filter((route) => !used.has(route.id));
    if (pool.length === 0) break;
    const best =
      preference === "fastest"
        ? [...pool].sort((a, b) => a.durationSeconds - b.durationSeconds)[0]
        : pickBest(pool, preference);
    used.add(best.id);
    compared.push(withCopy(best, preference, fastest));
  }
  return compared;
}

function uniqueAnnotated(routes: AnnotatedRoute[]) {
  const kept: AnnotatedRoute[] = [];
  for (const route of routes) {
    const duplicate = kept.some(
      (item) =>
        item.id === route.id ||
        (Math.abs(item.durationSeconds - route.durationSeconds) < 30 &&
          Math.abs(item.distanceMeters - route.distanceMeters) < 250 &&
          Math.abs(item.majorShare - route.majorShare) < 0.08),
    );
    if (!duplicate) kept.push(route);
  }
  return kept;
}

function pickBest(routes: AnnotatedRoute[], preference: RoutePreference) {
  const minEta = Math.min(...routes.map((route) => route.durationSeconds)) || 1;
  return [...routes].sort((a, b) => score(b, preference, minEta) - score(a, preference, minEta))[0];
}

function score(route: AnnotatedRoute, preference: RoutePreference, minEta: number) {
  const weights = ROUTE_WEIGHTS[preference];
  const etaScore = minEta / Math.max(route.durationSeconds, 1);
  return (
    weights.eta * etaScore +
    weights.majorRoad * route.majorShare -
    weights.narrowRoadPenalty * route.narrowShare
  );
}

function withCopy(
  route: AnnotatedRoute,
  preference: RoutePreference,
  fastest: AnnotatedRoute,
): ComparedRoute {
  const extraMinutes = Math.max(
    0,
    Math.round((route.durationSeconds - fastest.durationSeconds) / 60),
  );
  const labels: Record<RoutePreference, string> = {
    fastest: "Fastest",
    broader_roads: "Broader Roads",
    family_comfort: "Family Comfort",
  };
  return {
    ...route,
    preference,
    label: labels[preference],
    profile: profileFor(route, preference),
    explanation: explanationFor(route, extraMinutes, preference),
  };
}

function profileFor(route: AnnotatedRoute, preference: RoutePreference) {
  if (preference === "fastest") {
    return route.narrowShare > 0.28 ? "More local roads" : "Mostly mixed roads";
  }
  if (route.majorShare >= 0.55) return "More major roads";
  if (route.narrowShare <= 0.2) return "Mixed, fewer inner roads";
  return "Mixed";
}

function explanationFor(route: AnnotatedRoute, extraMinutes: number, preference: RoutePreference) {
  const mixUnknown = route.majorShare === 0 && route.narrowShare === 0;
  if (preference === "fastest") {
    return extraMinutes === 0
      ? "Shortest drive time. May use more local or inner roads."
      : `Drive time is about ${extraMinutes} minutes longer than the other options.`;
  }
  if (mixUnknown) {
    return extraMinutes === 0
      ? "Same drive time as the fastest option. Road-width mix was unavailable for this path."
      : `Adds ${extraMinutes} minute${extraMinutes === 1 ? "" : "s"}. Road-width mix was unavailable, so this is ranked by time only.`;
  }
  const majorPct = Math.round(route.majorShare * 100);
  const narrow = route.narrowSegmentCount;
  if (extraMinutes === 0) {
    return `Same ETA as the fastest option, with more time on major roads (${majorPct}%).`;
  }
  const avoid =
    narrow > 0 ? ` and avoids ${narrow} narrow road segment${narrow === 1 ? "" : "s"}` : "";
  return `Adds ${extraMinutes} minute${extraMinutes === 1 ? "" : "s"} but uses more major roads${avoid}.`;
}

