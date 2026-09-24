import { postOverpass } from "./overpass";
import type { ParkingCandidate, ParkingProvider } from "../types";

type OverpassElement = {
  id: number;
  type: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: {
    name?: string;
    operator?: string;
    opening_hours?: string;
    fee?: string;
    charge?: string;
  };
};

export class OsmParkingProvider implements ParkingProvider {
  async searchNearby(lat: number, lng: number, radiusMeters: number): Promise<ParkingCandidate[]> {
    const query = `
      [out:json][timeout:20];
      (
        node["amenity"="parking"](around:${Math.round(radiusMeters)},${lat},${lng});
        way["amenity"="parking"](around:${Math.round(radiusMeters)},${lat},${lng});
      );
      out center tags;
    `;

    const elements = await postOverpass<OverpassElement>(query);
    const lots: ParkingCandidate[] = [];
    for (const element of elements) {
      const pointLat = element.lat ?? element.center?.lat;
      const pointLng = element.lon ?? element.center?.lon;
      if (pointLat == null || pointLng == null) continue;
      const name = element.tags?.name || element.tags?.operator || "Parking";
      const price =
        element.tags?.charge ||
        (element.tags?.fee === "yes" ? "Paid" : element.tags?.fee === "no" ? "Free" : null);
      lots.push({
        id: `osm:${element.type}/${element.id}`,
        name,
        lat: pointLat,
        lng: pointLng,
        priceText: price,
        hoursText: element.tags?.opening_hours ?? null,
        availabilityState: "unknown",
        source: "osm",
        curated: false,
      });
    }
    return lots;
  }
}
