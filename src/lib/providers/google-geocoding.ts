import { googleServerKey } from "../env";
import type { Coordinates, GeocodingProvider, PlaceDetails, PlaceSuggestion } from "../types";

export class GoogleGeocodingProvider implements GeocodingProvider {
  async autocomplete(query: string, proximity?: Coordinates): Promise<PlaceSuggestion[]> {
    const body: Record<string, unknown> = {
      input: query,
      includedRegionCodes: ["in"],
      languageCode: "en",
    };
    if (proximity) {
      body.locationBias = {
        circle: {
          center: { latitude: proximity.lat, longitude: proximity.lng },
          radius: 40000,
        },
      };
    }

    const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": googleServerKey(),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Google autocomplete failed (${response.status})`);
    }

    const data = (await response.json()) as {
      suggestions?: Array<{
        placePrediction?: {
          placeId?: string;
          structuredFormat?: {
            mainText?: { text?: string };
            secondaryText?: { text?: string };
          };
          text?: { text?: string };
        };
      }>;
    };

    const suggestions: PlaceSuggestion[] = [];
    for (const item of data.suggestions ?? []) {
      const prediction = item.placePrediction;
      if (!prediction?.placeId) continue;
      suggestions.push({
        id: `google:${prediction.placeId}`,
        label: prediction.structuredFormat?.mainText?.text ?? prediction.text?.text ?? "Place",
        secondary: prediction.structuredFormat?.secondaryText?.text,
      });
    }
    return suggestions;
  }

  async details(id: string): Promise<PlaceDetails | null> {
    const placeId = id.replace(/^google:/, "");
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        headers: {
          "X-Goog-Api-Key": googleServerKey(),
          "X-Goog-FieldMask": "id,displayName,formattedAddress,location",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Google place details failed (${response.status})`);
    }

    const data = (await response.json()) as {
      id?: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      location?: { latitude?: number; longitude?: number };
    };

    if (data.location?.latitude == null || data.location.longitude == null) {
      return null;
    }

    return {
      id: `google:${data.id ?? placeId}`,
      name: data.displayName?.text ?? "Destination",
      address: data.formattedAddress,
      location: { lat: data.location.latitude, lng: data.location.longitude },
    };
  }
}
