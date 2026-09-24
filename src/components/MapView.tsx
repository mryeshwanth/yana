"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import type { MapMouseEvent } from "maplibre-gl";
import { GoogleMapView } from "@/components/GoogleMapView";
import type { ComparedRoute, Coordinates, Parking, WalkLeg } from "@/lib/types";

type MapViewProps = {
  origin?: Coordinates | null;
  destination?: Coordinates | null;
  parking?: Parking[];
  selectedParkingId?: string | null;
  route?: ComparedRoute | null;
  walk?: WalkLeg | null;
  onSelectParking?: (id: string) => void;
  onMapClick?: (point: Coordinates) => void;
  interactivePin?: Coordinates | null;
  pinDraggable?: boolean;
  followPin?: boolean;
};

const SOURCE_ROUTE = "yana-route";
const SOURCE_WALK = "yana-walk";

export function MapView(props: MapViewProps) {
  const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (googleKey) {
    return <GoogleMapView {...props} apiKey={googleKey} />;
  }
  return <OsmMapView {...props} />;
}

function OsmMapView({
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
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const onSelectRef = useRef(onSelectParking);
  const onClickRef = useRef(onMapClick);
  onSelectRef.current = onSelectParking;
  onClickRef.current = onMapClick;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          carto: {
            type: "raster",
            tiles: ["https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png"],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap &copy; CARTO",
          },
        },
        layers: [{ id: "carto", type: "raster", source: "carto" }],
      },
      center: [77.5946, 12.9716],
      zoom: 12,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("click", (event: MapMouseEvent) => {
      onClickRef.current?.({ lat: event.lngLat.lat, lng: event.lngLat.lng });
    });
    mapRef.current = map;
    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const addMarker = (point: Coordinates, className: string, id?: string) => {
      const el = document.createElement("div");
      el.className = `map-marker ${className}`;
      if (id) {
        el.addEventListener("click", (event) => {
          event.stopPropagation();
          onSelectRef.current?.(id);
        });
      }
      const marker = new maplibregl.Marker({ element: el }).setLngLat([point.lng, point.lat]).addTo(map);
      markersRef.current.push(marker);
    };

    if (origin) addMarker(origin, "origin");
    if (destination) addMarker(destination, "destination");
    for (const lot of parking) {
      addMarker(lot, lot.id === selectedParkingId ? "parking selected" : "parking", lot.id);
    }
    if (interactivePin) {
      const el = document.createElement("div");
      el.className = "map-marker destination";
      const marker = new maplibregl.Marker({ element: el, draggable: Boolean(pinDraggable) })
        .setLngLat([interactivePin.lng, interactivePin.lat])
        .addTo(map);
      if (pinDraggable) {
        marker.on("dragend", () => {
          const point = marker.getLngLat();
          onClickRef.current?.({ lat: point.lat, lng: point.lng });
        });
      }
      markersRef.current.push(marker);
    }

    const focus = [
      origin,
      destination,
      interactivePin,
      ...parking.map((lot) => ({ lat: lot.lat, lng: lot.lng })),
      ...(route?.coordinates ?? []),
    ].filter((point): point is Coordinates => Boolean(point));

    if (followPin && focus.length === 1) {
      map.easeTo({ center: [focus[0].lng, focus[0].lat], zoom: 16, duration: 400 });
    } else if (followPin && focus.length > 1) {
      const bounds = focus.reduce(
        (box, point) => box.extend([point.lng, point.lat]),
        new maplibregl.LngLatBounds([focus[0].lng, focus[0].lat], [focus[0].lng, focus[0].lat]),
      );
      map.fitBounds(bounds, { padding: 56, duration: 400, maxZoom: 15 });
    }
  }, [origin, destination, parking, selectedParkingId, interactivePin, route, pinDraggable, followPin]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const draw = () => {
      setLine(map, SOURCE_ROUTE, route?.coordinates ?? [], "#f97316", 5);
      setLine(map, SOURCE_WALK, walk?.coordinates ?? [], "#3f5d48", 3, true);
    };

    if (map.isStyleLoaded()) draw();
    else map.once("load", draw);
  }, [route, walk]);

  return <div ref={containerRef} className="h-full w-full" />;
}

function setLine(
  map: maplibregl.Map,
  id: string,
  coordinates: Coordinates[],
  color: string,
  width: number,
  dashed = false,
) {
  const geojson = {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "LineString" as const,
      coordinates: coordinates.map((point) => [point.lng, point.lat]),
    },
  };

  const source = map.getSource(id) as maplibregl.GeoJSONSource | undefined;
  if (source) {
    source.setData(geojson);
    return;
  }
  if (coordinates.length < 2) return;

  map.addSource(id, { type: "geojson", data: geojson });
  map.addLayer({
    id: `${id}-line`,
    type: "line",
    source: id,
    paint: {
      "line-color": color,
      "line-width": width,
      "line-opacity": 0.9,
      ...(dashed ? { "line-dasharray": [1.4, 1.4] } : {}),
    },
  });
}
