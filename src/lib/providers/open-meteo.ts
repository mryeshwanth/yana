import { CACHE_TTL, readCache, writeCache } from "../cache";
import { samplePath } from "../geo";
import type { Coordinates } from "../types";

const OPEN_METEO = process.env.OPEN_METEO_BASE_URL?.trim() || "https://api.open-meteo.com";

export type WeatherAlongRoute = {
  isDay: boolean | null;
  rainMm: number | null;
  visibilityM: number | null;
  weatherRisk: number | null;
  confidence: number;
  lowPointRain: boolean;
};

export async function fetchWeatherAlong(points: Coordinates[]): Promise<WeatherAlongRoute> {
  const samples = samplePath(points, 220).filter((_, index, all) => {
    if (all.length <= 3) return true;
    return index === 0 || index === Math.floor(all.length / 2) || index === all.length - 1;
  });
  const mid = samples[Math.floor(samples.length / 2)] ?? points[0];
  const hourKey = new Date().toISOString().slice(0, 13);
  const cacheKey = `weather:v1:${mid.lat.toFixed(2)}:${mid.lng.toFixed(2)}:${hourKey}`;
  const cached = await readCache<WeatherAlongRoute>(cacheKey);
  if (cached) return cached;

  const empty: WeatherAlongRoute = {
    isDay: null,
    rainMm: null,
    visibilityM: null,
    weatherRisk: null,
    confidence: 0,
    lowPointRain: false,
  };

  try {
    const [forecast, elevation] = await Promise.all([
      fetchForecast(mid),
      fetchElevation(samples).catch(() => null),
    ]);
    if (!forecast) return empty;
    const rainMm = forecast.rainMm;
    const visibilityM = forecast.visibilityM;
    const weatherRisk = riskFromWeather(rainMm, visibilityM);
    const lowPoint = isLocalLowPoint(elevation);
    const result: WeatherAlongRoute = {
      isDay: forecast.isDay,
      rainMm,
      visibilityM,
      weatherRisk,
      confidence: 0.85,
      lowPointRain: Boolean(lowPoint && rainMm != null && rainMm >= 0.5),
    };
    await writeCache(cacheKey, result, CACHE_TTL.weather);
    return result;
  } catch {
    return empty;
  }
}

async function fetchForecast(point: Coordinates) {
  const params = new URLSearchParams({
    latitude: String(point.lat),
    longitude: String(point.lng),
    current: "precipitation,rain,visibility,is_day,weather_code",
    timezone: "Asia/Kolkata",
  });
  const response = await fetch(`${OPEN_METEO}/v1/forecast?${params}`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as {
    current?: {
      precipitation?: number;
      rain?: number;
      visibility?: number;
      is_day?: number;
    };
  };
  const current = data.current;
  if (!current) return null;
  return {
    rainMm: numberOrNull(current.rain ?? current.precipitation),
    visibilityM: numberOrNull(current.visibility),
    isDay: current.is_day == null ? null : current.is_day === 1,
  };
}

async function fetchElevation(points: Coordinates[]) {
  if (points.length === 0) return null;
  const params = new URLSearchParams({
    latitude: points.map((point) => point.lat.toFixed(5)).join(","),
    longitude: points.map((point) => point.lng.toFixed(5)).join(","),
  });
  const response = await fetch(`${OPEN_METEO}/v1/elevation?${params}`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { elevation?: number[] };
  return data.elevation ?? null;
}

function isLocalLowPoint(elevation: number[] | null) {
  if (!elevation || elevation.length < 3) return false;
  const start = elevation[0];
  const mid = elevation[Math.floor(elevation.length / 2)];
  const end = elevation[elevation.length - 1];
  if (start == null || mid == null || end == null) return false;
  return mid < Math.min(start, end) - 8;
}

function riskFromWeather(rainMm: number | null, visibilityM: number | null) {
  let risk = 0.1;
  if (rainMm != null) {
    if (rainMm >= 8) risk = 0.7;
    else if (rainMm >= 1) risk = 0.3;
  }
  if (visibilityM != null && visibilityM < 1000) risk = Math.max(risk, 0.8);
  return risk;
}

function numberOrNull(value: number | undefined) {
  return value == null || Number.isNaN(value) ? null : value;
}
