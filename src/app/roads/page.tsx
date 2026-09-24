"use client";

import Link from "next/link";
import { Circle, RadioButton } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { MapView } from "@/components/MapView";
import { UserShell } from "@/components/UserShell";
import { formatMinutes } from "@/lib/format";
import { appleMapsDriveUrl, googleMapsDriveUrl } from "@/lib/maps-links";
import { readPreference } from "@/lib/preferences";
import { readTrip, subscribeTrip } from "@/lib/trip-store";
import type { ComparedRoute, Parking, RoutePreference, WalkLeg } from "@/lib/types";

export default function RoadsPage() {
  const [trip, setTrip] = useState(readTrip());
  const [routes, setRoutes] = useState<ComparedRoute[]>([]);
  const [walk, setWalk] = useState<WalkLeg | null>(null);
  const [preference, setPreference] = useState<RoutePreference>("broader_roads");
  const [chosenPreference, setChosenPreference] = useState<RoutePreference | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setPreference(readPreference());
    const refresh = () => setTrip(readTrip());
    refresh();
    return subscribeTrip(refresh);
  }, []);

  const selected = trip.selectedParking;

  useEffect(() => {
    if (!trip.origin || !selected || !trip.destination) return;
    let cancelled = false;
    setLoading(true);
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
        setRoutes(data.routes ?? []);
        setWalk(data.walk ?? null);
        setChosenPreference(preference);
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

  const chosen =
    routes.find((route) => route.preference === (chosenPreference ?? preference)) ??
    routes[0] ??
    null;

  if (!trip.destination || !selected) {
    return (
      <UserShell current="roads">
        <header className="flex items-center justify-between px-5 pt-6">
          <BrandMark compact />
          <span className="text-xs uppercase tracking-[0.16em] text-ink-soft">Roads</span>
        </header>
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
      <header className="flex items-center justify-between px-5 pt-6">
        <BrandMark compact />
        <span className="text-xs uppercase tracking-[0.16em] text-ink-soft">Roads</span>
      </header>
      <section className="mx-5 mt-4 h-52 overflow-hidden rounded-[4px] border border-line">
        <MapView
          origin={trip.origin}
          destination={trip.destination}
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
          const selectedCard = chosen?.preference === route.preference;
          return (
            <article
              key={`${route.preference}-${route.id}`}
              className={`rounded-[4px] border bg-white p-4 ${
                selectedCard ? "border-accent" : "border-line"
              }`}
            >
              <button
                type="button"
                onClick={() => setChosenPreference(route.preference)}
                className="flex w-full items-start gap-3 text-left"
              >
                {selectedCard ? (
                  <RadioButton size={22} weight="fill" className="mt-0.5 shrink-0 text-accent" />
                ) : (
                  <Circle size={22} className="mt-0.5 shrink-0 text-ink-soft" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-medium">{route.label}</span>
                    <span className="shrink-0 text-right text-sm text-ink-soft">
                      {formatMinutes(route.durationSeconds)} drive
                      {walk ? ` + ${formatMinutes(walk.durationSeconds)} walk` : ""}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-sm text-ink-soft">{route.profile}</span>
                  <span className="mt-1 block text-sm leading-5 text-ink-soft">{route.explanation}</span>
                </span>
              </button>
              {selectedCard && trip.origin && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <a
                    className="rounded-[4px] bg-accent px-3 py-2.5 text-center text-sm font-semibold text-white"
                    href={googleMapsDriveUrl(trip.origin, { lat: selected.lat, lng: selected.lng })}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Use Google Maps
                  </a>
                  <a
                    className="rounded-[4px] border border-line px-3 py-2.5 text-center text-sm font-medium"
                    href={appleMapsDriveUrl(trip.origin, { lat: selected.lat, lng: selected.lng })}
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
