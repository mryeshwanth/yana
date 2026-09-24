"use client";

import Link from "next/link";
import { Circle, RadioButton } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { MapView } from "@/components/MapView";
import { UserShell } from "@/components/UserShell";
import { formatDistance, formatMinutes } from "@/lib/format";
import { appleMapsDriveUrl, googleMapsDriveUrl } from "@/lib/maps-links";
import { readPreference } from "@/lib/preferences";
import { EMPTY_TRIP, readTrip, subscribeTrip } from "@/lib/trip-store";
import { ROUTE_TAG_LABELS } from "@/lib/types";
import type { ComparedRoute, Parking, RoutePreference, WalkLeg } from "@/lib/types";

export default function RoadsPage() {
  const [ready, setReady] = useState(false);
  const [trip, setTrip] = useState(EMPTY_TRIP);
  const [routes, setRoutes] = useState<ComparedRoute[]>([]);
  const [walk, setWalk] = useState<WalkLeg | null>(null);
  const [preference, setPreference] = useState<RoutePreference>("broader_roads");
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setPreference(readPreference());
    setTrip(readTrip());
    setReady(true);
    return subscribeTrip(() => setTrip(readTrip()));
  }, []);

  const selected = trip.selectedParking;

  useEffect(() => {
    if (!trip.origin || !selected || !trip.destination) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch("/api/routes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: trip.origin,
        parking: { lat: selected.lat, lng: selected.lng },
        destination: trip.destination,
      }),
    })
      .then((response) => response.json())
      .then((data: { routes?: ComparedRoute[]; walk?: WalkLeg; error?: string }) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
          return;
        }
        const next = data.routes ?? [];
        setRoutes(next);
        setWalk(data.walk ?? null);
        setChosenId(pickDefaultRoute(next, preference)?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setError("Could not build routes.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [trip.origin, selected, trip.destination, preference]);

  const chosen = routes.find((route) => route.id === chosenId) ?? routes[0] ?? null;
  const destination = trip.destination;
  const origin = trip.origin;

  const header = (
    <header className="flex items-center justify-between px-5 pt-6">
      <BrandMark compact />
      <Link
        href="/recents"
        className="rounded-[4px] border border-line bg-white px-3 py-1.5 text-sm font-medium"
      >
        Recent
      </Link>
    </header>
  );

  if (!ready) {
    return <UserShell current="roads">{header}</UserShell>;
  }

  if (!destination || !selected) {
    return (
      <UserShell current="roads">
        {header}
        <div className="px-5 pt-16">
          <h1 className="text-3xl font-semibold">Pick parking first</h1>
          <p className="mt-3 text-ink-soft">
            Search a destination and select a lot on Parkings. Then come here to compare roads.
          </p>
          <Link href="/" className="mt-6 inline-flex rounded-[4px] bg-accent px-5 py-3 text-sm font-semibold text-white">
            Go to Parkings
          </Link>
        </div>
      </UserShell>
    );
  }

  return (
    <UserShell current="roads">
      {header}
      <section className="mx-5 mt-4 h-52 overflow-hidden rounded-[4px] border border-line">
        <MapView
          origin={origin}
          destination={destination}
          parking={[selected as Parking]}
          selectedParkingId={selected.id}
          route={chosen}
          walk={walk}
        />
      </section>
      <section className="space-y-4 px-5 pt-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">Drive to {selected.name}</p>
          <h1 className="mt-1 text-xl font-semibold">{trip.destName}</h1>
        </div>
        {loading && <p className="text-xs text-ink-soft">Comparing…</p>}
        {routes.map((route) => {
          const selectedCard = chosen?.id === route.id;
          const parking = { lat: selected.lat, lng: selected.lng };
          return (
            <article
              key={route.id}
              className={`rounded-[4px] border bg-white p-4 ${
                selectedCard ? "border-accent" : "border-line"
              }`}
            >
              <button
                type="button"
                onClick={() => setChosenId(route.id)}
                className="flex w-full items-start gap-3 text-left"
              >
                {selectedCard ? (
                  <RadioButton size={22} weight="fill" className="mt-0.5 shrink-0 text-accent" />
                ) : (
                  <Circle size={22} className="mt-0.5 shrink-0 text-ink-soft" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-medium">
                      {formatMinutes(route.durationSeconds)} drive
                      {walk ? ` + ${formatMinutes(walk.durationSeconds)} walk` : ""}
                    </span>
                    <span className="shrink-0 text-sm text-ink-soft">
                      {formatDistance(route.distanceMeters)}
                    </span>
                  </span>
                  {route.tags.length > 0 && (
                    <span className="mt-2 flex flex-wrap gap-1.5">
                      {route.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`rounded-[4px] border bg-paper px-2 py-0.5 text-[11px] font-medium text-ink ${
                            tag === preference ? "border-accent" : "border-line"
                          }`}
                        >
                          {ROUTE_TAG_LABELS[tag]}
                        </span>
                      ))}
                    </span>
                  )}
                  {route.explanation && (
                    <span className="mt-1.5 block text-sm text-ink-soft">{route.explanation}</span>
                  )}
                </span>
              </button>
              {selectedCard && origin && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <a
                    className="rounded-[4px] border border-line bg-white px-3 py-2.5 text-center text-sm font-medium"
                    href={googleMapsDriveUrl(origin, parking, destination, route.coordinates)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Use Google Maps
                  </a>
                  <a
                    className="rounded-[4px] border border-line bg-white px-3 py-2.5 text-center text-sm font-medium"
                    href={appleMapsDriveUrl(origin, parking, destination, route.coordinates)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Use Apple Maps
                  </a>
                </div>
              )}
            </article>
          );
        })}
        {error && <p className="text-sm text-accent-dark">{error}</p>}
      </section>
    </UserShell>
  );
}

function pickDefaultRoute(routes: ComparedRoute[], preference: RoutePreference) {
  return routes.find((route) => route.tags.includes(preference)) ?? routes[0] ?? null;
}
