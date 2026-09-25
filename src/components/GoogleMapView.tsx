"use client";

import { useEffect, useRef, useState } from "react";
import type { Coordinates, Parking, WalkLeg } from "@/lib/types";

type Props = {
  apiKey: string;
  origin?: Coordinates | null;
  destination?: Coordinates | null;
  parking?: Parking[];
  selectedParkingId?: string | null;
  route?: { coordinates: Coordinates[] } | null;
  walk?: WalkLeg | null;
  onSelectParking?: (id: string) => void;
  onMapClick?: (point: Coordinates) => void;
  interactivePin?: Coordinates | null;
  pinDraggable?: boolean;
  followPin?: boolean;
};

type GoogleMaps = typeof google.maps;

export function GoogleMapView({
  apiKey,
  origin,
  destination,
  parking = [],
  selectedParkingId,
  route,
  walk,
  onSelectParking,
  onMapClick,
  interactivePin,
  pinDraggable,
  followPin = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const overlaysRef = useRef<google.maps.MVCObject[]>([]);
  const onSelectRef = useRef(onSelectParking);
  const onClickRef = useRef(onMapClick);
  const [ready, setReady] = useState(false);
  onSelectRef.current = onSelectParking;
  onClickRef.current = onMapClick;

  useEffect(() => {
    let cancelled = false;
    loadGoogle(apiKey).then((maps) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      const map = new maps.Map(containerRef.current, {
        center: { lat: 12.9716, lng: 77.5946 },
        zoom: 12,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      map.addListener("click", (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          onClickRef.current?.({ lat: event.latLng.lat(), lng: event.latLng.lng() });
        }
      });
      mapRef.current = map;
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  useEffect(() => {
    const map = mapRef.current;
    const maps = window.google?.maps;
    if (!map || !maps) return;

    overlaysRef.current.forEach((overlay) => {
      if ("setMap" in overlay) (overlay as google.maps.Marker | google.maps.Polyline).setMap(null);
    });
    overlaysRef.current = [];

    const addMarker = (
      point: Coordinates,
      color: string,
      options?: { id?: string; square?: boolean },
    ) => {
      const selected = Boolean(options?.id && options.id === selectedParkingId);
      const marker = new maps.Marker({
        map,
        position: point,
        icon: {
          path: options?.square ? "M -1,-1 L 1,-1 L 1,1 L -1,1 Z" : maps.SymbolPath.CIRCLE,
          scale: options?.square ? 8 : selected ? 9 : 7,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
      const lotId = options?.id;
      if (lotId) {
        marker.addListener("click", () => onSelectRef.current?.(lotId));
      }
      overlaysRef.current.push(marker);
    };

    if (origin) addMarker(origin, "#f97316");
    if (destination) addMarker(destination, "#1c1917", { square: true });
    for (const lot of parking) {
      addMarker(lot, lot.id === selectedParkingId ? "#f97316" : "#a8a29e", { id: lot.id });
    }
    if (interactivePin) {
      const marker = new maps.Marker({
        map,
        position: interactivePin,
        draggable: Boolean(pinDraggable),
        title: pinDraggable ? "Drag to set the lot" : undefined,
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#f97316",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
      });
      if (pinDraggable) {
        marker.addListener("dragend", () => {
          const position = marker.getPosition();
          if (position) {
            onClickRef.current?.({ lat: position.lat(), lng: position.lng() });
          }
        });
      }
      overlaysRef.current.push(marker);
    }

    if (route && route.coordinates.length > 1) {
      const line = new maps.Polyline({
        map,
        path: route.coordinates,
        strokeColor: "#f97316",
        strokeWeight: 5,
        strokeOpacity: 0.9,
      });
      overlaysRef.current.push(line);
    }
    if (walk && walk.coordinates.length > 1) {
      const line = new maps.Polyline({
        map,
        path: walk.coordinates,
        strokeColor: "#1c1917",
        strokeWeight: 3,
        strokeOpacity: 0.85,
        icons: [{ icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 3 }, offset: "0", repeat: "12px" }],
      });
      overlaysRef.current.push(line);
    }

    const focus = [
      origin,
      destination,
      interactivePin,
      ...parking.map((lot) => ({ lat: lot.lat, lng: lot.lng })),
      ...(route?.coordinates ?? []),
      ...(walk?.coordinates ?? []),
    ].filter((point): point is Coordinates => Boolean(point));

    if (followPin && focus.length === 1) {
      map.panTo(focus[0]);
      map.setZoom(16);
    } else if (followPin && focus.length > 1) {
      const bounds = new maps.LatLngBounds();
      focus.forEach((point) => bounds.extend(point));
      map.fitBounds(bounds, 56);
    }
  }, [ready, origin, destination, parking, selectedParkingId, route, walk, interactivePin, pinDraggable, followPin]);

  return <div ref={containerRef} className="h-full w-full" />;
}

function loadGoogle(apiKey: string): Promise<GoogleMaps> {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  const existing = document.querySelector<HTMLScriptElement>("script[data-yana-google]");
  if (existing) {
    return new Promise((resolve) => {
      existing.addEventListener("load", () => resolve(window.google.maps));
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.dataset.yanaGoogle = "true";
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(script);
  });
}
