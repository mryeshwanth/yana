"use client";

import { useEffect, useState } from "react";
import { MapView } from "@/components/MapView";
import { readTrip } from "@/lib/trip-store";
import { useRoutePreview } from "@/lib/use-route-preview";
import type { Coordinates, Parking, WalkLeg } from "@/lib/types";

export function ParkingMap({
  origin,
  destination,
  parking,
}: {
  origin?: Coordinates | null;
  destination?: Coordinates | null;
  parking: Parking;
  walk?: WalkLeg | null;
}) {
  const [source, setSource] = useState<Coordinates | null>(origin ?? null);
  const lot = { lat: parking.lat, lng: parking.lng };
  const { drive, walk } = useRoutePreview(source, lot, destination);

  useEffect(() => {
    if (origin) {
      setSource(origin);
      return;
    }
    const trip = readTrip();
    if (trip.origin) setSource(trip.origin);
  }, [origin]);

  return (
    <MapView
      origin={source}
      destination={destination}
      parking={[parking]}
      selectedParkingId={parking.id}
      route={drive}
      walk={walk}
    />
  );
}
