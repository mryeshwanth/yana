"use client";

import Link from "next/link";
import { CaretRight, Funnel, PlusCircle } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";
import { LotRating } from "@/components/LotRating";
import { LotTags } from "@/components/LotTags";
import { BrandMark } from "@/components/BrandMark";
import { MapView } from "@/components/MapView";
import { SearchCard } from "@/components/SearchCard";
import { UserShell } from "@/components/UserShell";
import { BANGALORE_CENTER } from "@/lib/constants";
import { formatDistance, formatMinutes } from "@/lib/format";
import { requestLocation } from "@/lib/location";
import { activeFilterCount, DEFAULT_FILTERS, readFilters, type ParkingFilters } from "@/lib/filters";
import { isOnsiteParking, priceTag } from "@/lib/lot-tags";
import { OPEN_RECENT_KEY, pushRecent } from "@/lib/recents";
import { readTrip, RESUME_TRIP_KEY, writeTrip } from "@/lib/trip-store";
import { useRoutePreview } from "@/lib/use-route-preview";
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
  const [filters, setFilters] = useState<ParkingFilters>(DEFAULT_FILTERS);
  const skipOriginReverse = useRef(false);

  useEffect(() => {
    setFilters(readFilters());
    const trip = readTrip();
    if (trip.origin) setOrigin(trip.origin);
    sessionStorage.removeItem(RESUME_TRIP_KEY);
    sessionStorage.removeItem(OPEN_RECENT_KEY);
    if (trip.destination && trip.destName) {
      setDestination(trip.destination);
      setDestName(trip.destName);
      setSelectedId(trip.selectedParking?.id ?? null);
    }
    void locate();
  }, []);

  useEffect(() => {
    if (!origin) {
      setOriginLabel("");
      return;
    }
    if (skipOriginReverse.current) {
      skipOriginReverse.current = false;
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
    fetch(
      `/api/parking/nearby?lat=${destination.lat}&lng=${destination.lng}&radius=${filters.radiusMeters}&name=${encodeURIComponent(destName)}`,
    )
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
  }, [destination, destName, filters.radiusMeters]);

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

  async function resolvePlace(suggestion?: PlaceSuggestion, query?: string, emptyMessage?: string) {
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
        setError(emptyMessage ?? "No matching place. Try a mall or area name.");
        return null;
      }
      place = first.location
        ? { name: first.label, location: first.location, id: first.id }
        : await fetchDetails(first.id, query);
    }
    if (!place && (suggestion || query)) {
      setError(emptyMessage ?? "Could not open that place.");
    }
    return place;
  }

  async function setStart(suggestion?: PlaceSuggestion, query?: string) {
    setError("");
    const place = await resolvePlace(suggestion, query, "No matching start. Try an area or landmark.");
    if (!place) return;
    skipOriginReverse.current = true;
    setOrigin(place.location);
    setOriginLabel(place.name);
    writeTrip({ origin: place.location });
  }

  async function go(suggestion?: PlaceSuggestion, query?: string) {
    setError("");
    const place = await resolvePlace(suggestion, query);
    if (!place) return;
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
    pushRecent({ name: place.name, location: place.location });
  }

  function selectParking(id: string) {
    setSelectedId(id);
    const selected = parking.find((lot) => lot.id === id) ?? null;
    writeTrip({ selectedParking: selected });
  }

  const visibleParking = parking.filter((lot, index, lots) => {
    if (lots.findIndex((item) => item.id === lot.id) !== index) return false;
    if (filters.yanaVerified && !lot.curated) return false;
    if (filters.prices.length > 0) {
      const tag = priceTag(lot.priceText);
      if (!tag || !filters.prices.includes(tag)) return false;
    }
    return true;
  });
  const selected = visibleParking.find((lot) => lot.id === selectedId) ?? visibleParking[0] ?? null;
  const filterCount = activeFilterCount(filters);
  const { drive, walk } = useRoutePreview(
    origin,
    selected ? { lat: selected.lat, lng: selected.lng } : null,
    destination,
  );

  return (
    <UserShell current="parkings">
      <header className="flex items-center justify-between px-5 pt-6">
        <BrandMark compact />
        <Link
          href="/suggest"
          className="inline-flex items-center gap-1.5 rounded-[4px] border border-line bg-white px-3 py-1.5 text-sm font-medium"
        >
          <PlusCircle size={16} />
          Suggest a parking place
        </Link>
      </header>
      <div className="space-y-4 px-5 pt-4">
        <SearchCard
          proximity={origin}
          originLabel={originLabel || (origin ? "Your current location" : "")}
          locationNote={locationNote}
          locating={locating}
          onLocate={locate}
          onSelectOrigin={setStart}
          onSelectPlace={go}
        />
        {error && <p className="text-sm text-accent-dark">{error}</p>}
      </div>

      {destination && (
        <>
          <div className="sticky top-0 z-20 bg-paper px-5 pb-3 pt-4">
            <section className="h-56 overflow-hidden rounded-[4px] border border-line bg-white shadow-sm">
              <MapView
                origin={origin}
                destination={destination}
                parking={visibleParking}
                selectedParkingId={selected?.id ?? null}
                onSelectParking={selectParking}
                route={drive}
                walk={walk}
              />
            </section>
          </div>
          <section className="px-5 pt-1">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">Going to</p>
                <h1 className="mt-1 text-xl font-semibold">{destName}</h1>
              </div>
              <div className="flex items-center gap-3">
                {loadingParking && <span className="text-xs text-ink-soft">Loading…</span>}
                <Link
                  href="/filters"
                  aria-label="Filters"
                  className="relative flex h-10 w-10 items-center justify-center rounded-[4px] border border-line bg-white"
                >
                  <Funnel size={20} />
                  {filterCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
                      {filterCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>
            {visibleParking.length === 0 && !loadingParking && (
              <p className="rounded-[4px] bg-white px-4 py-4 text-sm text-ink-soft">
                No lots within this distance. Try a wider range, or suggest one.
              </p>
            )}
            <div className="space-y-3">
              {visibleParking.map((lot) => (
                <article
                  key={lot.id}
                  className={`rounded-[4px] border bg-white p-4 ${
                    lot.id === selected?.id ? "border-accent shadow-sm" : "border-line"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button type="button" className="min-w-0 flex-1 text-left" onClick={() => selectParking(lot.id)}>
                      <h3 className="font-medium">{lot.name}</h3>
                      <p className="mt-1 text-sm text-ink-soft">
                        {formatDistance(lot.distanceMeters)} · {formatMinutes(lot.walkingTimeSeconds)} walk
                      </p>
                      <LotRating usefulCount={lot.usefulCount} reviewCount={lot.reviewCount} />
                    </button>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Link
                        href={parkingHref(lot, destination, destName, origin)}
                        className="inline-flex items-center gap-0.5 text-sm text-accent underline-offset-4 hover:underline"
                      >
                        Details
                        <CaretRight size={14} weight="bold" />
                      </Link>
                      <AvailabilityBadge state={lot.availabilityState} />
                    </div>
                  </div>
                  {(priceTag(lot.priceText) || lot.curated || isOnsiteParking(lot)) && (
                    <div className="mt-3">
                      <LotTags
                        priceText={lot.priceText}
                        verified={lot.curated}
                        onsite={isOnsiteParking(lot)}
                      />
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        </>
      )}

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

function parkingHref(
  lot: Parking,
  destination: Coordinates,
  destName: string,
  origin?: Coordinates | null,
) {
  const params = new URLSearchParams({
    destLat: String(destination.lat),
    destLng: String(destination.lng),
    destName,
    lat: String(lot.lat),
    lng: String(lot.lng),
    name: lot.name,
  });
  if (origin) {
    params.set("originLat", String(origin.lat));
    params.set("originLng", String(origin.lng));
  }
  if (lot.address) params.set("address", lot.address);
  if (lot.priceText) params.set("priceText", lot.priceText);
  if (lot.hoursText) params.set("hoursText", lot.hoursText);
  return `/parking/${encodeURIComponent(lot.id)}?${params.toString()}`;
}
