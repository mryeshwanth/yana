import type { Coordinates, GeocodingProvider, PlaceDetails, PlaceSuggestion } from "../types";

const HEADERS = {
  Accept: "application/json",
  "User-Agent": "Yana/0.1 (mobility web mvp; https://localhost)",
};

type NominatimHit = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
};

export class NominatimGeocodingProvider implements GeocodingProvider {
  async autocomplete(query: string, proximity?: Coordinates): Promise<PlaceSuggestion[]> {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "6");
    url.searchParams.set("countrycodes", "in");
    if (proximity) {
      url.searchParams.set(
        "viewbox",
        `${proximity.lng - 0.25},${proximity.lat - 0.25},${proximity.lng + 0.25},${proximity.lat + 0.25}`,
      );
    }

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
