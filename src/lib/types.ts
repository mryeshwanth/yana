export type Coordinates = {
  lat: number;
  lng: number;
};

export type RoutePreference = "fastest" | "broader_roads" | "family_comfort";
export type RouteTag = RoutePreference;

export const ROUTE_TAG_LABELS: Record<RouteTag, string> = {
  fastest: "Fastest",
  broader_roads: "Broader roads",
  family_comfort: "Family comfort",
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
};

export type RawRoute = {
  id: string;
  coordinates: Coordinates[];
  durationSeconds: number;
  distanceMeters: number;
};

export type AnnotatedRoute = RawRoute & {
  majorShare: number;
  narrowShare: number;
  mediumShare: number;
  narrowSegmentCount: number;
  majorSegmentCount: number;
};

export type ComparedRoute = AnnotatedRoute & {
  tags: RouteTag[];
  label: string;
  profile: string;
  explanation: string;
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

export type RoadMix = {
  majorShare: number;
  narrowShare: number;
  mediumShare: number;
  narrowSegmentCount: number;
  majorSegmentCount: number;
};

export interface RoadClassProvider {
  annotate(coordinates: Coordinates[]): Promise<RoadMix>;
}

export interface GeocodingProvider {
  autocomplete(query: string, proximity?: Coordinates): Promise<PlaceSuggestion[]>;
  details(id: string): Promise<PlaceDetails | null>;
}
