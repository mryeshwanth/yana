import type { Coordinates, GeocodingProvider, PlaceDetails, PlaceSuggestion } from "../types";

const HEADERS = {
  Accept: "application/json",
  "User-Agent": "yana/0.1 (mobility web mvp; https://localhost)",
};

type NominatimHit = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
};

export async function reverseGeocodeNominatim(point: Coordinates): Promise<string | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(point.lat));
  url.searchParams.set("lon", String(point.lng));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("zoom", "16");
  url.searchParams.set("addressdetails", "1");

  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) return null;
  const hit = (await response.json()) as NominatimHit & {
    address?: { suburb?: string; neighbourhood?: string; city?: string; town?: string };
  };
  const short =
    hit.name ||
    hit.address?.neighbourhood ||
    hit.address?.suburb ||
    hit.display_name.split(",")[0];
  return short?.trim() || null;
}

export class NominatimGeocodingProvider implements GeocodingProvider {
  async autocomplete(query: string, proximity?: Coordinates): Promise<PlaceSuggestion[]> {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    const biasedQuery = /bengaluru|bangalore/i.test(query) ? query : `${query} Bengaluru`;
    url.searchParams.set("q", biasedQuery);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "6");
    url.searchParams.set("countrycodes", "in");

    const response = await fetch(url, { headers: HEADERS });
    if (!response.ok) {
      throw new Error(`Nominatim search failed (${response.status})`);
    }
    const hits = (await response.json()) as NominatimHit[];
    return hits.map((hit) => ({
      id: `nominatim:${hit.place_id}|${hit.lat}|${hit.lon}|${hit.name || hit.display_name.split(",")[0]}`,
      label: hit.name || hit.display_name.split(",")[0],
      secondary: hit.display_name,
      location: { lat: Number(hit.lat), lng: Number(hit.lon) },
    }));
  }

  async details(id: string): Promise<PlaceDetails | null> {
    const encoded = parseNominatimId(id);
    if (encoded) return encoded;
    return null;
  }
}

function parseNominatimId(id: string): PlaceDetails | null {
  const raw = id.replace(/^nominatim:/, "");
  const [placeId, latRaw, lngRaw, ...nameParts] = raw.split("|");
  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return {
      id: `nominatim:${placeId}`,
      name: nameParts.join("|") || "Destination",
      location: { lat, lng },
    };
  }
  return null;
}
