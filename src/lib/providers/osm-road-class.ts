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
  tags?: {
    highway?: string;
    lanes?: string;
    width?: string;
    est_width?: string;
    surface?: string;
    lit?: string;
    maxspeed?: string;
  };
  center?: { lat: number; lon: number };
};

type ValhallaEdge = {
  road_class?: string;
  length?: number;
  lane_count?: number;
  surface?: string;
};

export class OsmRoadClassProvider implements RoadClassProvider {
  async annotate(coordinates: Coordinates[]): Promise<RoadMix> {
    if (coordinates.length < 2) return emptyMix();
    const [valhalla, overpass] = await Promise.allSettled([
      annotateWithValhalla(coordinates),
      annotateWithOverpass(coordinates),
    ]);
    const fromValhalla = valhalla.status === "fulfilled" ? valhalla.value : null;
    const fromOverpass = overpass.status === "fulfilled" ? overpass.value : null;
    if (!fromValhalla && !fromOverpass) return emptyMix();
    return mergeMix(fromValhalla, fromOverpass);
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
  let laneSum = 0;
  let laneWeight = 0;
  let surfaceSum = 0;
  let surfaceWeight = 0;

  for (const edge of edges) {
    const meters = Math.max(1, (edge.length ?? 0) * 1000);
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
    if (edge.lane_count && edge.lane_count > 0) {
      laneSum += edge.lane_count * meters;
      laneWeight += meters;
    }
    const surface = surfaceScoreFromValue(edge.surface);
    if (surface != null) {
      surfaceSum += surface * meters;
      surfaceWeight += meters;
    }
  }

  const total = major + narrow + medium || 1;
  return {
    ...emptyMix(),
    majorShare: major / total,
    narrowShare: narrow / total,
    mediumShare: medium / total,
    majorSegmentCount: majorSegments,
    narrowSegmentCount: narrowSegments,
    meanLanes: laneWeight > 0 ? laneSum / laneWeight : null,
    lanesConfidence: confidenceFromCoverage(laneWeight, total),
    surfaceScore: surfaceWeight > 0 ? surfaceSum / surfaceWeight : null,
    surfaceConfidence: confidenceFromCoverage(surfaceWeight, total),
  };
}

async function annotateWithOverpass(coordinates: Coordinates[]): Promise<RoadMix | null> {
  const samples = samplePath(coordinates, 260);
  const ways = await fetchWays(samples);
  if (ways.length === 0) return emptyMix();
  return classifySamples(samples, ways);
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
  let laneSum = 0;
  let laneCount = 0;
  let widthSum = 0;
  let widthCount = 0;
  let litYes = 0;
  let litKnown = 0;
  let surfaceSum = 0;
  let surfaceCount = 0;

  for (let i = 1; i < samples.length; i += 1) {
    const meters = 1;
    const way = nearestWay(samples[i], ways);
    const highway = way?.tags?.highway ?? "unknown";
    if (MAJOR.has(highway)) {
      major += meters;
      majorSegments += 1;
    } else if (NARROW.has(highway)) {
      narrow += meters;
      narrowSegments += 1;
    } else {
      medium += meters;
    }
    const lanes = parseNumberTag(way?.tags?.lanes);
    if (lanes != null) {
      laneSum += lanes;
      laneCount += 1;
    }
    const width = parseNumberTag(way?.tags?.width) ?? parseNumberTag(way?.tags?.est_width);
    if (width != null) {
      widthSum += width;
      widthCount += 1;
    }
    const lit = parseLit(way?.tags?.lit);
    if (lit != null) {
      litKnown += 1;
      if (lit) litYes += 1;
    }
    const surface = surfaceScoreFromValue(way?.tags?.surface);
    if (surface != null) {
      surfaceSum += surface;
      surfaceCount += 1;
    }
  }

  const total = major + narrow + medium || 1;
  const sampleCount = Math.max(1, samples.length - 1);
  return {
    majorShare: major / total,
    narrowShare: narrow / total,
    mediumShare: medium / total,
    majorSegmentCount: majorSegments,
    narrowSegmentCount: narrowSegments,
    meanLanes: laneCount > 0 ? laneSum / laneCount : null,
    meanWidthM: widthCount > 0 ? widthSum / widthCount : null,
    litShare: litKnown > 0 ? litYes / litKnown : null,
    surfaceScore: surfaceCount > 0 ? surfaceSum / surfaceCount : null,
    lanesConfidence: confidenceFromCoverage(laneCount, sampleCount),
    widthConfidence: confidenceFromCoverage(widthCount, sampleCount),
    litConfidence: confidenceFromCoverage(litKnown, sampleCount),
    surfaceConfidence: confidenceFromCoverage(surfaceCount, sampleCount),
  };
}

function nearestWay(point: Coordinates, ways: OverpassWay[]) {
  let best: OverpassWay | null = null;
  let bestDistance = Infinity;
  for (const way of ways) {
    if (!way.center || !way.tags?.highway) continue;
    const dlat = point.lat - way.center.lat;
    const dlng = point.lng - way.center.lon;
    const distance = dlat * dlat + dlng * dlng;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = way;
    }
  }
  return best;
}

function mergeMix(valhalla: RoadMix | null, overpass: RoadMix | null): RoadMix {
  const base = overpass ?? valhalla ?? emptyMix();
  if (!valhalla) return base;
  if (!overpass) return valhalla;
  return {
    majorShare: valhalla.majorShare,
    narrowShare: valhalla.narrowShare,
    mediumShare: valhalla.mediumShare,
    majorSegmentCount: valhalla.majorSegmentCount,
    narrowSegmentCount: valhalla.narrowSegmentCount,
    meanLanes: pickMeasured(overpass.meanLanes, overpass.lanesConfidence, valhalla.meanLanes, valhalla.lanesConfidence),
    meanWidthM: overpass.meanWidthM,
    litShare: overpass.litShare,
    surfaceScore: pickMeasured(
      overpass.surfaceScore,
      overpass.surfaceConfidence,
      valhalla.surfaceScore,
      valhalla.surfaceConfidence,
    ),
    lanesConfidence: Math.max(overpass.lanesConfidence, valhalla.lanesConfidence),
    widthConfidence: overpass.widthConfidence,
    litConfidence: overpass.litConfidence,
    surfaceConfidence: Math.max(overpass.surfaceConfidence, valhalla.surfaceConfidence),
  };
}

function pickMeasured(
  primary: number | null,
  primaryConfidence: number,
  fallback: number | null,
  fallbackConfidence: number,
) {
  if (primary != null && primaryConfidence >= fallbackConfidence) return primary;
  return fallback ?? primary;
}

function parseNumberTag(value?: string) {
  if (!value) return null;
  const match = value.replace(",", ".").match(/[\d.]+/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseLit(value?: string) {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized === "yes" || normalized === "24/7" || normalized === "sunset-sunrise") return true;
  if (normalized === "no") return false;
  return null;
}

function surfaceScoreFromValue(value?: string) {
  if (!value) return null;
  const surface = value.toLowerCase();
  if (/(asphalt|concrete|paved|paving_stones|sett)/.test(surface)) return 90;
  if (/(compacted|gravel|fine_gravel|pebblestone|chipseal)/.test(surface)) return 55;
  if (/(dirt|ground|unpaved|sand|mud|grass|earth)/.test(surface)) return 30;
  return 70;
}

function confidenceFromCoverage(known: number, total: number) {
  if (total <= 0 || known <= 0) return 0;
  return Math.min(1, known / total);
}

function emptyMix(): RoadMix {
  return {
    majorShare: 0,
    narrowShare: 0,
    mediumShare: 1,
    majorSegmentCount: 0,
    narrowSegmentCount: 0,
    meanLanes: null,
    meanWidthM: null,
    litShare: null,
    surfaceScore: null,
    lanesConfidence: 0,
    widthConfidence: 0,
    litConfidence: 0,
    surfaceConfidence: 0,
  };
}

export const roadClassProvider = new OsmRoadClassProvider();
export { emptyMix };
