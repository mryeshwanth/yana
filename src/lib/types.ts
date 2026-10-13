export type Coordinates = {
  lat: number;
  lng: number;
};

export type RoutePreference = "fastest" | "broader_roads" | "family_comfort" | "safer_indicators";
export type RouteTag = RoutePreference;

export const ROUTE_TAG_LABELS: Record<RouteTag, string> = {
  fastest: "Fastest",
  broader_roads: "Broader roads",
  family_comfort: "Family comfort",
  safer_indicators: "Safer indicators",
};

export type AvailabilityState = "live" | "estimated" | "unknown";
export type AvailabilitySource = "operator" | "places" | "osm" | "live_feed";

export type PlaceSuggestion = {
  id: string;
  label: string;
  secondary?: string;
  location?: Coordinates;
};

export type PlaceDetails = {
  id: string;
  name: string;
  address?: string;
  location: Coordinates;
};

export type Parking = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string | null;
  distanceMeters: number;
  walkingTimeSeconds: number;
  walkingDistanceMeters: number;
  priceText?: string | null;
  hoursText?: string | null;
  notes?: string | null;
  availabilityState: AvailabilityState;
  source: AvailabilitySource;
  curated: boolean;
  usefulCount?: number;
  reviewCount?: number;
};

export type RawRoute = {
  id: string;
  coordinates: Coordinates[];
  durationSeconds: number;
  distanceMeters: number;
};

export type RoadMix = {
  majorShare: number;
  narrowShare: number;
  mediumShare: number;
  narrowSegmentCount: number;
  majorSegmentCount: number;
  meanLanes: number | null;
  meanWidthM: number | null;
  litShare: number | null;
  surfaceScore: number | null;
  lanesConfidence: number;
  widthConfidence: number;
  litConfidence: number;
  surfaceConfidence: number;
};

export type RouteInsights = {
  meanLanes: number | null;
  meanWidthM: number | null;
  litShare: number | null;
  surfaceScore: number | null;
  lanesConfidence: number;
  widthConfidence: number;
  litConfidence: number;
  surfaceConfidence: number;
  sharpTurnCount: number;
  verySharpTurnCount: number;
  isDay: boolean | null;
  rainMm: number | null;
  visibilityM: number | null;
  weatherRisk: number | null;
  weatherConfidence: number;
  lowPointRain: boolean;
  nearestHospitalM: number | null;
  nearestPoliceM: number | null;
  nearestPetrolM: number | null;
};

export type RouteChip = {
  id: string;
  label: string;
  detail: string;
};

export type AnnotatedRoute = RawRoute &
  RoadMix & {
    insights: RouteInsights;
  };

export type ComparedRoute = AnnotatedRoute & {
  tags: RouteTag[];
  label: string;
  profile: string;
  explanation: string;
  chips: RouteChip[];
  yanaScore: number | null;
};

export type WalkLeg = {
  durationSeconds: number;
  distanceMeters: number;
  coordinates: Coordinates[];
};

export interface RoutingProvider {
  getRoutes(origin: Coordinates, destination: Coordinates): Promise<RawRoute[]>;
  getWalk(origin: Coordinates, destination: Coordinates): Promise<WalkLeg>;
}

export interface ParkingProvider {
  searchNearby(lat: number, lng: number, radiusMeters: number): Promise<ParkingCandidate[]>;
}

export type ParkingCandidate = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string | null;
  priceText?: string | null;
  hoursText?: string | null;
  notes?: string | null;
  availabilityState: AvailabilityState;
  source: AvailabilitySource;
  curated: boolean;
};

export interface RoadClassProvider {
  annotate(coordinates: Coordinates[]): Promise<RoadMix>;
}

export interface GeocodingProvider {
  autocomplete(query: string, proximity?: Coordinates): Promise<PlaceSuggestion[]>;
  details(id: string): Promise<PlaceDetails | null>;
};
