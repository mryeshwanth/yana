"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";
import { BrandMark } from "@/components/BrandMark";
import { MapView } from "@/components/MapView";
import { formatDistance, formatMinutes } from "@/lib/format";
import { appleMapsDriveUrl, googleMapsDriveUrl } from "@/lib/maps-links";
import { PREFERENCE_COPY, readPreference } from "@/lib/preferences";
import { BANGALORE_CENTER } from "@/lib/constants";
import type { ComparedRoute, Coordinates, Parking, RoutePreference, WalkLeg } from "@/lib/types";

function TripPageInner() {
  const params = useSearchParams();
  const router = useRouter();
  const destination = useMemo<Coordinates | null>(() => {
    const lat = Number(params.get("dlat"));
    const lng = Number(params.get("dlng"));
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }, [params]);
  const destName = params.get("dname") || "Destination";
  const [origin, setOrigin] = useState<Coordinates | null>(() => {
    const lat = Number(params.get("olat"));
    const lng = Number(params.get("olng"));
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  });
  const [parking, setParking] = useState<Parking[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(params.get("pid"));
  const [routes, setRoutes] = useState<ComparedRoute[]>([]);
  const [walk, setWalk] = useState<WalkLeg | null>(null);
  const [preference, setPreference] = useState<RoutePreference>("broader_roads");
  const [chosenPreference, setChosenPreference] = useState<RoutePreference | null>(null);
  const [loadingParking, setLoadingParking] = useState(false);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setPreference(readPreference());
  }, []);

  useEffect(() => {
    if (origin) return;
    if (!navigator.geolocation) {
      setOrigin(BANGALORE_CENTER);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => setOrigin({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => setOrigin(BANGALORE_CENTER),
    );
  }, [origin]);

  useEffect(() => {
    if (!destination) return;
    let cancelled = false;
    setLoadingParking(true);
    setError("");
    fetch(`/api/parking/nearby?lat=${destination.lat}&lng=${destination.lng}`)
      .then((response) => response.json())
      .then((data: { parking?: Parking[]; error?: string }) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
          return;
        }
        const lots = data.parking ?? [];
        setParking(lots);
        setSelectedId((current) => current ?? lots[0]?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load parking.");
      })
      .finally(() => {
        if (!cancelled) setLoadingParking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [destination]);

  const selected = parking.find((lot) => lot.id === selectedId) ?? null;

  useEffect(() => {
    if (!origin || !selected || !destination) return;
    let cancelled = false;
    setLoadingRoutes(true);
    fetch("/api/routes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin,
        parking: { lat: selected.lat, lng: selected.lng },
        destination,
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
        if (!cancelled) setLoadingRoutes(false);
      });
    return () => {
      cancelled = true;
    };
  }, [origin, selected, destination, preference]);

  const chosen =
    routes.find((route) => route.preference === (chosenPreference ?? preference)) ??
    routes[0] ??
    null;

  function selectParking(id: string) {
    setSelectedId(id);
    const next = new URLSearchParams(params.toString());
    next.set("pid", id);
    router.replace(`/trip?${next.toString()}`, { scroll: false });
  }

  if (!destination) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-5">
        <p className="font-serif text-3xl">Choose a destination first.</p>
        <Link href="/" className="mt-4 text-clay">
          Back to search
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col lg:h-dvh lg:flex-row">
      <section className="relative h-[46vh] min-h-[280px] lg:h-auto lg:flex-1">
        <div className="absolute left-4 top-4 z-10 rounded-full bg-white/90 px-4 py-2 shadow-sm backdrop-blur">
          <BrandMark compact />
        </div>
        <MapView
          origin={origin}
          destination={destination}
          parking={parking}
          selectedParkingId={selectedId}
          route={chosen}
          walk={walk}
          onSelectParking={selectParking}
        />
      </section>

      <section className="flex max-h-[54vh] flex-col overflow-y-auto border-t border-line bg-paper lg:max-h-none lg:w-[420px] lg:border-l lg:border-t-0">
        <div className="sticky top-0 z-10 border-b border-line bg-paper/95 px-5 py-4 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.18em] text-ink-soft">Going to</p>
          <h1 className="mt-1 font-serif text-2xl leading-tight">{destName}</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Current location → parking → destination. Preference: {PREFERENCE_COPY[preference].title}.
          </p>
          <div className="mt-3 flex gap-3 text-sm">
            <Link href="/preferences" className="text-clay underline-offset-4 hover:underline">
              Change preference
            </Link>
            <Link href="/suggest" className="text-moss underline-offset-4 hover:underline">
              Suggest parking
            </Link>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">
          <section>
            <div className="mb-3 flex items-end justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em]">Parking</h2>
              {loadingParking && <span className="text-xs text-ink-soft">Loading…</span>}
            </div>
            {parking.length === 0 && !loadingParking && (
              <p className="rounded-2xl bg-white px-4 py-4 text-sm text-ink-soft">
                No lots nearby yet. Suggest one, or add it in Parking Finder.
              </p>
            )}
            <div className="space-y-3">
              {parking.map((lot) => (
                <article
                  key={lot.id}
                  className={`rounded-2xl border bg-white p-4 ${
                    lot.id === selectedId ? "border-clay shadow-sm" : "border-line"
                  }`}
                >
                  <button type="button" className="w-full text-left" onClick={() => selectParking(lot.id)}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium">{lot.name}</h3>
                        <p className="mt-1 text-sm text-ink-soft">
                          {formatDistance(lot.distanceMeters)} · {formatMinutes(lot.walkingTimeSeconds)} walk
                        </p>
                      </div>
                      <AvailabilityBadge state={lot.availabilityState} />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-ink-soft">
                      {lot.priceText && <span>{lot.priceText}</span>}
                      {lot.hoursText && <span>{lot.hoursText}</span>}
                      {lot.curated && <span className="text-moss">Yana catalog</span>}
                    </div>
                  </button>
                  <Link
                    href={parkingHref(lot, destination, destName)}
                    className="mt-3 inline-block text-sm text-clay underline-offset-4 hover:underline"
                  >
                    Details
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-end justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em]">Routes</h2>
              {loadingRoutes && <span className="text-xs text-ink-soft">Comparing…</span>}
            </div>
            <div className="space-y-3">
              {routes.map((route) => (
                <button
                  key={`${route.preference}-${route.id}`}
                  type="button"
                  onClick={() => setChosenPreference(route.preference)}
                  className={`w-full rounded-2xl border bg-white p-4 text-left ${
                    chosen?.preference === route.preference ? "border-clay shadow-sm" : "border-line"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium">{route.label}</span>
                    <span className="text-sm">{formatMinutes(route.durationSeconds)}</span>
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">{route.profile}</p>
                  <p className="mt-2 text-sm leading-6 text-ink">{route.explanation}</p>
                </button>
              ))}
            </div>
          </section>

          {selected && origin && (
            <section className="rounded-2xl bg-ink px-4 py-4 text-paper">
              <p className="text-sm text-paper/70">Drive + walk</p>
              <p className="mt-1 font-serif text-2xl">
                {chosen ? formatMinutes(chosen.durationSeconds) : "—"} drive
                {walk ? ` · ${formatMinutes(walk.durationSeconds)} walk` : ""}
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <a
                  className="flex-1 rounded-full bg-clay px-4 py-3 text-center text-sm font-medium text-white"
                  href={googleMapsDriveUrl(origin, { lat: selected.lat, lng: selected.lng })}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in Google Maps
                </a>
                <a
                  className="flex-1 rounded-full bg-white/10 px-4 py-3 text-center text-sm font-medium"
                  href={appleMapsDriveUrl(origin, { lat: selected.lat, lng: selected.lng })}
                  target="_blank"
                  rel="noreferrer"
                >
                  Apple Maps
                </a>
              </div>
            </section>
          )}

          {error && <p className="text-sm text-clay-dark">{error}</p>}
        </div>
      </section>
    </main>
  );
}

function parkingHref(lot: Parking, destination: Coordinates, destName: string) {
  const params = new URLSearchParams({
    destLat: String(destination.lat),
    destLng: String(destination.lng),
    destName,
    lat: String(lot.lat),
    lng: String(lot.lng),
    name: lot.name,
  });
  if (lot.address) params.set("address", lot.address);
  if (lot.priceText) params.set("priceText", lot.priceText);
  if (lot.hoursText) params.set("hoursText", lot.hoursText);
  return `/parking/${encodeURIComponent(lot.id)}?${params.toString()}`;
}

export default function TripPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-paper" />}>
      <TripPageInner />
    </Suspense>
  );
}
