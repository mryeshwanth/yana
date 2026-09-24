"use client";

import Link from "next/link";
import { ClockCounterClockwise, PlusCircle } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";
import { BrandMark } from "@/components/BrandMark";
import { MapView } from "@/components/MapView";
import { SearchCard } from "@/components/SearchCard";
import { UserShell } from "@/components/UserShell";
import { BANGALORE_CENTER } from "@/lib/constants";
import { formatDistance, formatMinutes } from "@/lib/format";
import { requestLocation } from "@/lib/location";
import { pushRecent, readRecents, type RecentPlace } from "@/lib/recents";
import { readTrip, writeTrip } from "@/lib/trip-store";
import type { Coordinates, Parking, PlaceSuggestion } from "@/lib/types";

export default function ParkingsPage() {
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [destination, setDestination] = useState<Coordinates | null>(null);
  const [destName, setDestName] = useState("");
  const [parking, setParking] = useState<Parking[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [originLabel, setOriginLabel] = useState("");
  const [locationNote, setLocationNote] = useState("");
  const [locating, setLocating] = useState(false);
  const [loadingParking, setLoadingParking] = useState(false);
  const [error, setError] = useState("");
  const [radiusMeters, setRadiusMeters] = useState(1000);
  const [recents, setRecents] = useState<RecentPlace[]>([]);

  useEffect(() => {
    const trip = readTrip();
    if (trip.origin) setOrigin(trip.origin);
    if (trip.destination && trip.destName) {
      setRecents(pushRecent({ name: trip.destName, location: trip.destination }));
    } else {
      setRecents(readRecents());
    }
    void locate();
  }, []);

  useEffect(() => {
    if (!origin) {
      setOriginLabel("");
      return;
    }
    let cancelled = false;
    fetch(`/api/places/reverse?lat=${origin.lat}&lng=${origin.lng}`)
      .then((response) => response.json())
      .then((data: { label?: string }) => {
        if (!cancelled) setOriginLabel(data.label ?? "");
      })
      .catch(() => {
        if (!cancelled) setOriginLabel("");
      });
    return () => {
      cancelled = true;
    };
  }, [origin]);

  useEffect(() => {
    if (!destination) return;
    let cancelled = false;
    setLoadingParking(true);
    setError("");
    fetch(`/api/parking/nearby?lat=${destination.lat}&lng=${destination.lng}&radius=${radiusMeters}`)
      .then((response) => response.json())
      .then((data: { parking?: Parking[]; error?: string }) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
          return;
        }
        const lots = data.parking ?? [];
        setParking(lots);
        setSelectedId((current) => {
          const stillThere = lots.some((lot) => lot.id === current);
          const next = stillThere ? current : lots[0]?.id ?? null;
          const selected = lots.find((lot) => lot.id === next) ?? null;
          writeTrip({ selectedParking: selected });
          return next;
        });
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
  }, [destination, radiusMeters]);

  async function locate() {
    setLocating(true);
    const result = await requestLocation();
    setLocating(false);
    if (!result.ok) {
      setLocationNote(result.message);
      if (!origin && !readTrip().origin) {
        setOrigin(BANGALORE_CENTER);
        writeTrip({ origin: BANGALORE_CENTER });
      }
      return;
    }
    const point = { lat: result.lat, lng: result.lng };
    setOrigin(point);
    writeTrip({ origin: point });
    setLocationNote("");
  }

  async function go(suggestion?: PlaceSuggestion, query?: string) {
    setError("");
    let place = suggestion?.location
      ? { name: suggestion.label, location: suggestion.location, id: suggestion.id }
      : null;
    if (!place && suggestion) {
      place = await fetchDetails(suggestion.id, query);
    }
    if (!place && query) {
      const params = new URLSearchParams({ q: query });
      if (origin) {
        params.set("lat", String(origin.lat));
        params.set("lng", String(origin.lng));
      }
      const response = await fetch(`/api/places/autocomplete?${params}`);
      const data = (await response.json()) as { suggestions?: PlaceSuggestion[] };
      const first = data.suggestions?.[0];
      if (!first) {
        setError("No matching place. Try a mall or area name.");
        return;
      }
      place = first.location
        ? { name: first.label, location: first.location, id: first.id }
        : await fetchDetails(first.id, query);
    }
    if (!place) {
      setError("Could not open that place.");
      return;
    }
    const start = origin ?? BANGALORE_CENTER;
    setDestination(place.location);
    setDestName(place.name);
    setSelectedId(null);
    setParking([]);
    writeTrip({
      origin: start,
      destination: place.location,
      destName: place.name,
      selectedParking: null,
    });
    setRecents(pushRecent({ name: place.name, location: place.location }));
  }

  function selectParking(id: string) {
    setSelectedId(id);
    const selected = parking.find((lot) => lot.id === id) ?? null;
    writeTrip({ selectedParking: selected });
  }

  const selected = parking.find((lot) => lot.id === selectedId) ?? null;

  return (
    <UserShell current="parkings">
      <header className="flex items-center justify-between px-5 pt-6">
        <BrandMark compact />
        <span className="text-xs uppercase tracking-[0.16em] text-ink-soft">Parkings</span>
      </header>
      <div className="space-y-4 px-5 pt-4">
        <SearchCard
          proximity={origin}
          originLabel={originLabel || (origin ? "Your current location" : "")}
          locationNote={locationNote}
          locating={locating}
          onLocate={locate}
          onSelectPlace={go}
        />
        {error && <p className="text-sm text-accent-dark">{error}</p>}
        {recents.length > 0 && !destination && (
          <section>
            <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">Recents</p>
            <div className="mt-2 space-y-2">
              {recents.map((place) => (
                <button
                  key={`${place.name}-${place.location.lat}-${place.location.lng}`}
                  type="button"
                  onClick={() =>
                    go({
                      id: `recent:${place.location.lat},${place.location.lng}`,
                      label: place.name,
                      location: place.location,
                    })
                  }
                  className="flex w-full items-center gap-3 rounded-[4px] border border-line bg-white px-4 py-3 text-left"
                >
                  <ClockCounterClockwise size={18} className="shrink-0 text-ink-soft" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{place.name}</span>
                    <span className="text-xs text-ink-soft">Recent parking search</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {destination && (
        <>
          <section className="mx-5 mt-4 h-56 overflow-hidden rounded-[4px] border border-line">
            <MapView
              origin={origin}
              destination={destination}
              parking={parking}
              selectedParkingId={selectedId}
              onSelectParking={selectParking}
            />
          </section>
          <section className="px-5 pt-4">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">Going to</p>
                <h1 className="mt-1 text-xl font-semibold">{destName}</h1>
              </div>
              {loadingParking && <span className="text-xs text-ink-soft">Loading…</span>}
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-ink-soft">Within</span>
              {(
                [
                  { meters: 500, label: "500 m" },
                  { meters: 1000, label: "1 km" },
                  { meters: 2000, label: "2 km" },
                ] as const
              ).map((option) => (
                <button
                  key={option.meters}
                  type="button"
                  onClick={() => setRadiusMeters(option.meters)}
                  className={`rounded-[4px] border px-3 py-1.5 text-xs font-medium ${
                    radiusMeters === option.meters
                      ? "border-accent bg-accent text-white"
                      : "border-line bg-white text-ink"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {parking.length === 0 && !loadingParking && (
              <p className="rounded-[4px] bg-white px-4 py-4 text-sm text-ink-soft">
                No lots within this distance. Try a wider range, or suggest one.
              </p>
            )}
            <div className="space-y-3">
              {parking.map((lot) => (
                <article
                  key={lot.id}
                  className={`rounded-[4px] border bg-white p-4 ${
                    lot.id === selected?.id ? "border-accent shadow-sm" : "border-line"
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
                    className="mt-3 inline-block text-sm text-accent underline-offset-4 hover:underline"
                  >
                    Details
                  </Link>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      <div className="px-5 pt-6">
        <Link
          href="/suggest"
          className="flex items-center justify-center gap-2 rounded-[4px] border border-line bg-white px-4 py-3 text-sm font-medium"
        >
          <PlusCircle size={18} />
          Suggest a parking place
        </Link>
      </div>
    </UserShell>
  );
}

async function fetchDetails(id: string, query?: string) {
  const params = new URLSearchParams({ id });
  if (query) params.set("q", query);
  const response = await fetch(`/api/places/details?${params}`);
  const data = (await response.json()) as {
    place?: { name: string; location: Coordinates; id: string };
  };
  return data.place ?? null;
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
