import type { AnnotatedRoute, ComparedRoute, RawRoute, RoadMix, RouteTag } from "./types";
import { ROUTE_TAG_LABELS } from "./types";

export function annotateRoute(route: RawRoute, mix: RoadMix): AnnotatedRoute {
  return { ...route, ...mix };
}

export function compareRoutes(routes: AnnotatedRoute[]): ComparedRoute[] {
  const unique = uniqueByPath(routes);
  if (unique.length === 0) return [];

  const fastest = [...unique].sort((a, b) => a.durationSeconds - b.durationSeconds)[0];
  const mixKnown = unique.some((route) => route.majorShare > 0 || route.narrowShare > 0);
  const broader = mixKnown ? pickBroader(unique) : null;
  const family = mixKnown ? pickFamily(unique) : null;

  return unique
    .sort((a, b) => a.durationSeconds - b.durationSeconds)
    .map((route, index) => {
      const tags: RouteTag[] = [];
      if (route.id === fastest.id) tags.push("fastest");
      if (broader && route.id === broader.id) tags.push("broader_roads");
      if (family && route.id === family.id) tags.push("family_comfort");
      const extraMinutes = Math.max(
        0,
        Math.round((route.durationSeconds - fastest.durationSeconds) / 60),
      );
      return {
        ...route,
        tags,
        label: tags[0] ? ROUTE_TAG_LABELS[tags[0]] : `Route ${index + 1}`,
        profile: profileFor(route),
        explanation: explanationFor(route, tags, extraMinutes),
      };
    });
}

function uniqueByPath(routes: AnnotatedRoute[]) {
  const kept: AnnotatedRoute[] = [];
  for (const route of routes) {
    if (!kept.some((item) => samePath(item, route))) kept.push(route);
  }
  return kept;
}

function samePath(a: AnnotatedRoute, b: AnnotatedRoute) {
  if (a.id === b.id) return true;
  if (Math.abs(a.distanceMeters - b.distanceMeters) > 600) return false;
  const left = sample(a.coordinates);
  const right = sample(b.coordinates);
  if (left.length === 0 || right.length === 0) {
    return Math.abs(a.distanceMeters - b.distanceMeters) < 250;
  }
  return left.every((point, index) => {
    const other = right[index];
    return Boolean(
      other && Math.abs(point.lat - other.lat) < 0.008 && Math.abs(point.lng - other.lng) < 0.008,
    );
  });
}

function sample(coordinates: { lat: number; lng: number }[]) {
  if (coordinates.length === 0) return [];
  const at = (ratio: number) =>
    coordinates[Math.min(coordinates.length - 1, Math.floor(coordinates.length * ratio))];
  return [at(0.2), at(0.5), at(0.8)];
}

function pickBroader(routes: AnnotatedRoute[]) {
  return [...routes].sort((a, b) => {
    if (b.majorShare !== a.majorShare) return b.majorShare - a.majorShare;
    return a.durationSeconds - b.durationSeconds;
  })[0];
}

function pickFamily(routes: AnnotatedRoute[]) {
  return [...routes].sort((a, b) => {
    const aScore = a.narrowShare * 2 + a.narrowSegmentCount * 0.04;
    const bScore = b.narrowShare * 2 + b.narrowSegmentCount * 0.04;
    if (aScore !== bScore) return aScore - bScore;
    if (b.majorShare !== a.majorShare) return b.majorShare - a.majorShare;
    return a.durationSeconds - b.durationSeconds;
  })[0];
}

function profileFor(route: AnnotatedRoute) {
  if (route.majorShare === 0 && route.narrowShare === 0) return "Road mix unavailable";
  if (route.majorShare >= 0.55) return "More major roads";
  if (route.narrowShare > 0.28) return "More local roads";
  if (route.narrowShare <= 0.2) return "Mixed, fewer inner roads";
  return "Mostly mixed roads";
}

function explanationFor(route: AnnotatedRoute, tags: RouteTag[], extraMinutes: number) {
  const parts: string[] = [];
  if (tags.includes("fastest")) {
    parts.push("Shortest drive time.");
  } else if (extraMinutes > 0) {
    parts.push(`Adds ${extraMinutes} minute${extraMinutes === 1 ? "" : "s"} vs the fastest option.`);
  }
  const mixUnknown = route.majorShare === 0 && route.narrowShare === 0;
  if (mixUnknown) {
    parts.push("Road-width mix was unavailable for this path.");
    return parts.join(" ");
  }
  parts.push(`${Math.round(route.majorShare * 100)}% on major roads.`);
  if (route.narrowSegmentCount > 0) {
    parts.push(
      `${route.narrowSegmentCount} narrow segment${route.narrowSegmentCount === 1 ? "" : "s"}.`,
    );
  }
  return parts.join(" ");
}
