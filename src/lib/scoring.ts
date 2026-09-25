import type { AnnotatedRoute, ComparedRoute, RawRoute, RoadMix, RouteTag } from "./types";
import { ROUTE_TAG_LABELS } from "./types";

const FAMILY_MAX_EXTRA_MIN = 8;

export function annotateRoute(route: RawRoute, mix: RoadMix): AnnotatedRoute {
  return { ...route, ...mix };
}

export function compareRoutes(routes: AnnotatedRoute[]): ComparedRoute[] {
  const unique = uniqueByPath(routes);
  if (unique.length === 0) return [];

  const fastest = [...unique].sort((a, b) => a.durationSeconds - b.durationSeconds)[0];
  const mixKnown = unique.some((route) => route.majorShare > 0 || route.narrowShare > 0);
  const broader = mixKnown ? pickBroader(unique) : null;
  const family = mixKnown ? pickFamily(unique, fastest) : null;

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
    if (Math.abs(b.majorShare - a.majorShare) > 0.08) return b.majorShare - a.majorShare;
    return a.durationSeconds - b.durationSeconds;
  })[0];
}

function familyScore(route: AnnotatedRoute) {
  return route.narrowShare * route.distanceMeters + route.narrowSegmentCount * 80;
}

function pickFamily(routes: AnnotatedRoute[], fastest: AnnotatedRoute) {
  const ranked = [...routes].sort((a, b) => {
    const delta = familyScore(a) - familyScore(b);
    if (Math.abs(delta) > 250) return delta;
    if (a.narrowShare !== b.narrowShare) return a.narrowShare - b.narrowShare;
    return a.durationSeconds - b.durationSeconds;
  });
  const candidate = ranked[0];
  if (!candidate) return null;
  if (candidate.id === fastest.id) return fastest;

  const extraMin = (candidate.durationSeconds - fastest.durationSeconds) / 60;
  const lessInner =
    fastest.narrowShare - candidate.narrowShare >= 0.08 ||
    familyScore(fastest) - familyScore(candidate) >= 400;
  if (extraMin <= FAMILY_MAX_EXTRA_MIN && lessInner) return candidate;
  return fastest;
}

function profileFor(route: AnnotatedRoute) {
  if (route.majorShare === 0 && route.narrowShare === 0) return "Road mix unavailable";
  if (route.majorShare >= 0.55) return "More major roads";
  if (route.narrowShare > 0.28) return "More local roads";
  if (route.narrowShare <= 0.2) return "Mixed, fewer inner roads";
  return "Mostly mixed roads";
}

function explanationFor(route: AnnotatedRoute, tags: RouteTag[], extraMinutes: number) {
  const mixUnknown = route.majorShare === 0 && route.narrowShare === 0;
  const majorPct = Math.round(route.majorShare * 100);

  if (tags.includes("family_comfort") && !tags.includes("fastest") && extraMinutes > 0) {
    return `Fewer inner stretches, adds ${extraMinutes} min.`;
  }

  const mix = mixUnknown
    ? ""
    : route.majorShare >= 0.55
      ? `mostly on major roads (${majorPct}%)`
      : route.narrowShare > 0.28
        ? `more local roads (${majorPct}% major)`
        : `a mixed road split (${majorPct}% major)`;

  if (tags.includes("fastest")) {
    if (tags.includes("family_comfort") && mix) {
      return `Shortest drive, fewer inner stretches, ${mix}.`;
    }
    return mix ? `Shortest drive, ${mix}.` : "Shortest drive time.";
  }
  if (extraMinutes > 0) {
    return mix
      ? `Adds ${extraMinutes} min, ${mix}.`
      : `Adds ${extraMinutes} min vs the fastest option.`;
  }
  return mix ? `Same time, ${mix}.` : "Same drive time as the fastest option.";
}
