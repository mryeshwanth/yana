import { countSharpTurns } from "./geo";
import { emptyMix } from "./providers/osm-road-class";
import type { CorridorPois } from "./providers/corridor-pois";
import { nearestAlongRoute } from "./providers/corridor-pois";
import type { WeatherAlongRoute } from "./providers/open-meteo";
import type { Coordinates, RawRoute, RoadMix, RouteChip, RouteInsights } from "./types";

export function buildInsights(
  route: RawRoute,
  mix: RoadMix,
  weather: WeatherAlongRoute,
  corridor: CorridorPois,
): RouteInsights {
  const turns = countSharpTurns(route.coordinates);
  return {
    meanLanes: mix.meanLanes,
    meanWidthM: mix.meanWidthM,
    litShare: mix.litShare,
    surfaceScore: mix.surfaceScore,
    lanesConfidence: mix.lanesConfidence,
    widthConfidence: mix.widthConfidence,
    litConfidence: mix.litConfidence,
    surfaceConfidence: mix.surfaceConfidence,
    sharpTurnCount: turns.sharpTurnCount,
    verySharpTurnCount: turns.verySharpTurnCount,
    isDay: weather.isDay,
    rainMm: weather.rainMm,
    visibilityM: weather.visibilityM,
    weatherRisk: weather.weatherRisk,
    weatherConfidence: weather.confidence,
    lowPointRain: weather.lowPointRain,
    nearestHospitalM: nearestAlongRoute(route.coordinates, corridor.hospitals),
    nearestPoliceM: nearestAlongRoute(route.coordinates, corridor.police),
    nearestPetrolM: nearestAlongRoute(route.coordinates, corridor.petrol),
  };
}

export function emptyInsights(coordinates: Coordinates[] = []): RouteInsights {
  const mix = emptyMix();
  const turns = countSharpTurns(coordinates);
  return {
    meanLanes: mix.meanLanes,
    meanWidthM: mix.meanWidthM,
    litShare: mix.litShare,
    surfaceScore: mix.surfaceScore,
    lanesConfidence: 0,
    widthConfidence: 0,
    litConfidence: 0,
    surfaceConfidence: 0,
    sharpTurnCount: turns.sharpTurnCount,
    verySharpTurnCount: turns.verySharpTurnCount,
    isDay: null,
    rainMm: null,
    visibilityM: null,
    weatherRisk: null,
    weatherConfidence: 0,
    lowPointRain: false,
    nearestHospitalM: null,
    nearestPoliceM: null,
    nearestPetrolM: null,
  };
}

export function lightingScore(insights: RouteInsights) {
  if (insights.isDay) return { score: 100, confidence: insights.weatherConfidence || 0.7 };
  if (insights.litShare == null || insights.litConfidence < 0.2) {
    return { score: null as number | null, confidence: insights.litConfidence };
  }
  return { score: Math.round(insights.litShare * 100), confidence: insights.litConfidence };
}

export function emergencyAccessScore(insights: RouteInsights) {
  const distances = [insights.nearestHospitalM, insights.nearestPoliceM, insights.nearestPetrolM].filter(
    (value): value is number => value != null,
  );
  if (distances.length === 0) return { score: null as number | null, confidence: 0 };
  const nearest = Math.min(...distances);
  const score = nearest <= 800 ? 95 : nearest <= 1500 ? 80 : nearest <= 3000 ? 55 : 25;
  return { score, confidence: Math.min(1, distances.length / 3) };
}

export function saferIndicatorScore(route: { narrowShare: number; insights: RouteInsights }) {
  const lighting = lightingScore(route.insights);
  const emergency = emergencyAccessScore(route.insights);
  const inner = (1 - route.narrowShare) * 100;
  let weight = 0;
  let total = 0;
  if (lighting.score != null && lighting.confidence >= 0.2) {
    total += lighting.score * lighting.confidence * 0.35;
    weight += lighting.confidence * 0.35;
  }
  total += inner * 0.35;
  weight += 0.35;
  if (emergency.score != null && emergency.confidence >= 0.2) {
    total += emergency.score * emergency.confidence * 0.3;
    weight += emergency.confidence * 0.3;
  }
  if (weight < 0.25) return null;
  return total / weight;
}

export function yanaScoreFor(
  route: { majorShare: number; insights: RouteInsights },
  mixKnown: boolean,
): number | null {
  const insights = route.insights;
  let weight = 0;
  let total = 0;

  const add = (score: number | null, confidence: number, factor: number) => {
    if (score == null || confidence < 0.2) return;
    total += score * confidence * factor;
    weight += confidence * factor;
  };

  if (mixKnown) add(route.majorShare * 100, 1, 0.2);

  const lighting = lightingScore(insights);
  add(lighting.score, lighting.confidence, 0.15);

  const widthScore = lanesOrWidthScore(insights);
  add(widthScore.score, widthScore.confidence, 0.1);

  add(insights.surfaceScore, insights.surfaceConfidence, 0.15);

  const remainingSharp = Math.max(0, insights.sharpTurnCount);
  const turns = Math.max(0, 100 - insights.verySharpTurnCount * 8 - remainingSharp * 3);
  add(turns, 1, 0.15);

  if (insights.weatherRisk != null) {
    let weather = (1 - insights.weatherRisk) * 100;
    if (insights.lowPointRain) weather = Math.max(0, weather - 20);
    add(weather, insights.weatherConfidence, 0.1);
  }

  const emergency = emergencyAccessScore(insights);
  add(emergency.score, emergency.confidence, 0.15);

  if (weight < 0.25) return null;
  return Math.round(total / weight);
}

function lanesOrWidthScore(insights: RouteInsights) {
  if (insights.meanWidthM != null && insights.widthConfidence >= 0.2) {
    const scaled = ((insights.meanWidthM - 3) / 9) * 100;
    return { score: clampScore(scaled), confidence: insights.widthConfidence };
  }
  if (insights.meanLanes != null && insights.lanesConfidence >= 0.2) {
    const scaled = ((insights.meanLanes - 1) / 3) * 100;
    return { score: clampScore(scaled), confidence: insights.lanesConfidence };
  }
  return { score: null as number | null, confidence: 0 };
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function insightChips(insights: RouteInsights, majorShare: number, mixKnown: boolean): RouteChip[] {
  const chips: RouteChip[] = [];
  if (mixKnown) {
    chips.push({
      id: "mix",
      label: "Road mix",
      detail: `${Math.round(majorShare * 100)}% major`,
    });
  }
  const lighting = lightingScore(insights);
  chips.push({
    id: "lighting",
    label: "Lighting",
    detail: insights.isDay
      ? "Daylight"
      : lighting.score == null
        ? "Unknown"
        : `${lighting.score}% OSM lit`,
  });
  if (insights.meanWidthM != null && insights.widthConfidence >= 0.2) {
    chips.push({
      id: "width",
      label: "Width",
      detail: `${insights.meanWidthM.toFixed(1)} m mapped`,
    });
  } else if (insights.meanLanes != null && insights.lanesConfidence >= 0.2) {
    chips.push({
      id: "lanes",
      label: "Lanes",
      detail: `${insights.meanLanes.toFixed(1)} avg`,
    });
  }
  if (insights.surfaceScore != null && insights.surfaceConfidence >= 0.2) {
    chips.push({
      id: "surface",
      label: "Surface",
      detail: insights.surfaceScore >= 80 ? "Mostly paved" : insights.surfaceScore >= 50 ? "Mixed" : "Rougher mapped",
    });
  }
  chips.push({
    id: "turns",
    label: "Turns",
    detail:
      insights.verySharpTurnCount > 0
        ? `${insights.verySharpTurnCount} very sharp`
        : `${insights.sharpTurnCount} sharp`,
  });
  if (insights.weatherConfidence >= 0.2) {
    const rain = insights.rainMm ?? 0;
    chips.push({
      id: "weather",
      label: "Weather",
      detail: insights.lowPointRain
        ? "Low point + rain (prototype)"
        : rain >= 1
          ? `Rain ${rain.toFixed(1)} mm`
          : "No rain now",
    });
  }
  const emergency = closestEmergency(insights);
  if (emergency) {
    chips.push({
      id: "emergency",
      label: emergency.label,
      detail: formatKm(emergency.meters),
    });
  }
  return chips;
}

function closestEmergency(insights: RouteInsights) {
  const options = [
    { label: "Hospital", meters: insights.nearestHospitalM },
    { label: "Police", meters: insights.nearestPoliceM },
    { label: "Petrol", meters: insights.nearestPetrolM },
  ].filter((item): item is { label: string; meters: number } => item.meters != null);
  if (options.length === 0) return null;
  return options.sort((a, b) => a.meters - b.meters)[0];
}

function formatKm(meters: number) {
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
