import { googleServerKey } from "../env";
import type { ParkingCandidate, ParkingProvider } from "../types";

export class GoogleParkingProvider implements ParkingProvider {
  async searchNearby(lat: number, lng: number, radiusMeters: number): Promise<ParkingCandidate[]> {
    const response = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": googleServerKey(),
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.regularOpeningHours",
      },
      body: JSON.stringify({
        includedTypes: ["parking"],
        maxResultCount: 15,
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: Math.min(radiusMeters, 2000),
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Google nearby parking failed (${response.status})`);
    }

    const data = (await response.json()) as {
      places?: Array<{
        id?: string;
        displayName?: { text?: string };
        formattedAddress?: string;
        location?: { latitude?: number; longitude?: number };
        regularOpeningHours?: { weekdayDescriptions?: string[] };
      }>;
    };

    const lots: ParkingCandidate[] = [];
    for (const place of data.places ?? []) {
      if (place.location?.latitude == null || place.location.longitude == null) continue;
      lots.push({
        id: `places:${place.id ?? `${place.location.latitude},${place.location.longitude}`}`,
        name: place.displayName?.text ?? "Parking",
        lat: place.location.latitude,
        lng: place.location.longitude,
        address: place.formattedAddress,
        hoursText: place.regularOpeningHours?.weekdayDescriptions?.[0] ?? null,
        availabilityState: "unknown",
        source: "places",
        curated: false,
      });
    }
    return lots;
  }
}
