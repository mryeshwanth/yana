import { hasGoogleServer } from "../env";
import type { Coordinates, GeocodingProvider, PlaceDetails, PlaceSuggestion } from "../types";
import { GoogleGeocodingProvider } from "./google-geocoding";
import { NominatimGeocodingProvider } from "./nominatim-geocoding";

const google = new GoogleGeocodingProvider();
const nominatim = new NominatimGeocodingProvider();

export function getGeocodingProvider(): GeocodingProvider {
  return hasGoogleServer() ? google : nominatim;
}

export async function autocompletePlaces(query: string, proximity?: Coordinates): Promise<PlaceSuggestion[]> {
  return getGeocodingProvider().autocomplete(query, proximity);
}

export async function getPlaceDetails(id: string): Promise<PlaceDetails | null> {
  if (id.startsWith("nominatim:")) return nominatim.details(id);
  if (id.startsWith("google:")) return google.details(id);
  return getGeocodingProvider().details(id);
}
