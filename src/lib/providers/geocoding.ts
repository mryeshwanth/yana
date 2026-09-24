import { BANGALORE_CENTER } from "../constants";
import { CACHE_TTL, readCache, writeCache } from "../cache";
import { hasGoogleServer } from "../env";
import { getStoredDestination, searchStoredDestinations, upsertDestination } from "../persist";
import type { Coordinates, GeocodingProvider, PlaceDetails, PlaceSuggestion } from "../types";
import { GoogleGeocodingProvider } from "./google-geocoding";
import { NominatimGeocodingProvider, reverseGeocodeNominatim } from "./nominatim-geocoding";

const google = new GoogleGeocodingProvider();
const nominatim = new NominatimGeocodingProvider();

export function getGeocodingProvider(): GeocodingProvider {
  return hasGoogleServer() ? google : nominatim;
}

function cacheKey(query: string, proximity?: Coordinates) {
  const rounded = proximity
    ? `${proximity.lat.toFixed(2)},${proximity.lng.toFixed(2)}`
    : "none";
  return `autocomplete:${query.toLowerCase()}:${rounded}`;
}

export async function autocompletePlaces(
  query: string,
  proximity?: Coordinates,
): Promise<PlaceSuggestion[]> {
  const stored = await searchStoredDestinations(query);
  const key = cacheKey(query, proximity);
  const cached = await readCache<PlaceSuggestion[]>(key);
  if (cached?.length) {
    return mergeSuggestions(stored, cached);
  }

  const bias = proximity ?? BANGALORE_CENTER;
  try {
    const remote = await getGeocodingProvider().autocomplete(query, bias);
    if (remote.length > 0) {
      await writeCache(key, remote, CACHE_TTL.autocomplete);
    }
    return mergeSuggestions(stored, remote);
  } catch (error) {
    if (stored.length > 0) return stored;
    if (hasGoogleServer()) {
      const fallback = await nominatim.autocomplete(query, bias);
      return mergeSuggestions(stored, fallback);
    }
    throw error;
  }
}

export async function getPlaceDetails(id: string, queryText?: string): Promise<PlaceDetails | null> {
  const stored = await getStoredDestination(id);
  if (stored) {
    await upsertDestination(stored, queryText);
    return stored;
  }

  let place: PlaceDetails | null = null;
  if (id.startsWith("nominatim:")) place = await nominatim.details(id);
  else if (id.startsWith("google:")) place = await google.details(id);
  else place = await getGeocodingProvider().details(id);

  if (place) {
    await upsertDestination(place, queryText);
  }
  return place;
}

export async function reverseGeocode(point: Coordinates): Promise<string | null> {
  const key = `reverse:${point.lat.toFixed(3)},${point.lng.toFixed(3)}`;
  const cached = await readCache<{ label: string }>(key);
  if (cached?.label) return cached.label;

  const label = await reverseGeocodeNominatim(point);
  if (label) await writeCache(key, { label }, CACHE_TTL.reverse);
  return label;
}

function mergeSuggestions(stored: PlaceSuggestion[], remote: PlaceSuggestion[]) {
  const seen = new Set<string>();
  const merged: PlaceSuggestion[] = [];
  for (const item of [...stored, ...remote]) {
    const key = item.location
      ? `${item.label.toLowerCase()}:${item.location.lat.toFixed(4)}:${item.location.lng.toFixed(4)}`
      : item.id;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged.slice(0, 8);
}
