import { samplePath } from "../geo";
import { postOverpass } from "./overpass";
import type { Coordinates, RoadClassProvider, RoadMix } from "../types";

const MAJOR = new Set([
  "motorway",
  "motorway_link",
  "trunk",
  "trunk_link",
  "primary",
  "primary_link",
  "secondary",
  "secondary_link",
]);

const NARROW = new Set([
  "residential",
  "service",
  "service_other",
  "living_street",
  "track",
  "path",
  "footway",
  "unclassified",
]);

type OverpassWay = {
  id: number;
  tags?: { highway?: string };
  center?: { lat: number; lon: number };
};

type ValhallaEdge = {
  road_class?: string;
  length?: number;
};

export class OsmRoadClassProvider implements RoadClassProvider {
  async annotate(coordinates: Coordinates[]): Promise<RoadMix> {
    if (coordinates.length < 2) return emptyMix();
    try {
      const mix = await annotateWithValhalla(coordinates);
      if (mix) return mix;
    } catch {
      // Fall through to Overpass.
    }
    try {
      const samples = samplePath(coordinates, 260);
      const ways = await fetchWays(samples);
      if (ways.length === 0) return emptyMix();
      return classifySamples(samples, ways);
    } catch {
      return emptyMix();
    }
  }
}

async function annotateWithValhalla(coordinates: Coordinates[]): Promise<RoadMix | null> {
  const shape = samplePath(coordinates, 220).map((point) => ({
    lat: point.lat,
    lon: point.lng,
  }));
  const response = await fetch("https://valhalla1.openstreetmap.de/trace_attributes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      shape,
      costing: "auto",
      shape_match: "map_snap",
    }),
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { edges?: ValhallaEdge[] };
  const edges = data.edges ?? [];
  if (edges.length === 0) return null;

  let major = 0;
  let narrow = 0;
  let medium = 0;
  let majorSegments = 0;
  let narrowSegments = 0;

  for (const edge of edges) {
    const meters = (edge.length ?? 0) * 1000;
    const highway = edge.road_class ?? "unknown";
    if (MAJOR.has(highway)) {
      major += meters;
      majorSegments += 1;
    } else if (NARROW.has(highway)) {
      narrow += meters;
      narrowSegments += 1;
    } else {
      medium += meters;
    }
  }

  const total = major + narrow + medium || 1;
  return {
    majorShare: major / total,
    narrowShare: narrow / total,
    mediumShare: medium / total,
    majorSegmentCount: majorSegments,
    narrowSegmentCount: narrowSegments,
  };
}

async function fetchWays(samples: Coordinates[]): Promise<OverpassWay[]> {
  const around = samples
    .filter((_, index) => index % 2 === 0)
    .slice(0, 10)
    .map((point) => `way["highway"](around:60,${point.lat},${point.lng});`)
    .join("\n");
  const query = `
    [out:json][timeout:15];
    (
      ${around}
    );
    out center tags;
  `;
  return postOverpass<OverpassWay>(query);
}

function classifySamples(samples: Coordinates[], ways: OverpassWay[]): RoadMix {
  let major = 0;
  let narrow = 0;
  let medium = 0;
  let majorSegments = 0;
  let narrowSegments = 0;

  for (let i = 1; i < samples.length; i += 1) {
    const meters = 1;
    const highway = nearestHighway(samples[i], ways);
    if (MAJOR.has(highway)) {
      major += meters;
      majorSegments += 1;
    } else if (NARROW.has(highway)) {
      narrow += meters;
      narrowSegments += 1;
    } else {
      medium += meters;
    }
  }

  const total = major + narrow + medium || 1;
  return {
    majorShare: major / total,
    narrowShare: narrow / total,
    mediumShare: medium / total,
    majorSegmentCount: majorSegments,
    narrowSegmentCount: narrowSegments,
  };
}

function nearestHighway(point: Coordinates, ways: OverpassWay[]) {
  let best = "unknown";
  let bestDistance = Infinity;
  for (const way of ways) {
    if (!way.center || !way.tags?.highway) continue;
    const dlat = point.lat - way.center.lat;
    const dlng = point.lng - way.center.lon;
    const distance = dlat * dlat + dlng * dlng;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = way.tags.highway;
    }
  }
  return best;
}

function emptyMix(): RoadMix {
  return {
    majorShare: 0,
    narrowShare: 0,
    mediumShare: 1,
    majorSegmentCount: 0,
    narrowSegmentCount: 0,
  };
}

export const roadClassProvider = new OsmRoadClassProvider();
