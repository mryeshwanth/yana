import { AvailabilityBadge } from "@/components/AvailabilityBadge";
import { LotTags } from "@/components/LotTags";
import { BrandMark } from "@/components/BrandMark";
import { ParkingMap } from "@/components/ParkingMap";
import { UseParkingActions } from "@/components/UseParkingActions";
import { formatDistance, formatMinutes } from "@/lib/format";
import { isOnsiteParking } from "@/lib/lot-tags";
import { estimateWalk } from "@/lib/geo";
import { getCuratedLot } from "@/lib/providers/curated-parking";
import type { AvailabilityState, AvailabilitySource, Parking } from "@/lib/types";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ParkingDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const decoded = decodeURIComponent(id);
  const dest = numberPair(query.destLat, query.destLng);
  const origin = numberPair(query.originLat, query.originLng);

  let lot = {
    id: decoded,
    name: first(query.name) ?? "Parking",
    lat: Number(first(query.lat)),
    lng: Number(first(query.lng)),
    address: first(query.address),
    priceText: first(query.priceText),
    hoursText: first(query.hoursText),
    notes: undefined as string | undefined,
    availabilityState: "unknown" as AvailabilityState,
    source: (decoded.startsWith("places:") ? "places" : "osm") as AvailabilitySource,
    curated: false,
  };

  const stored = await getCuratedLot(decoded);
  if (stored && !stored.hidden) {
    lot = {
      id: decoded,
      name: stored.name,
      lat: stored.lat,
      lng: stored.lng,
      address: stored.address ?? undefined,
      priceText: stored.priceText ?? undefined,
      hoursText: stored.hoursText ?? undefined,
      notes: stored.notes ?? undefined,
      availabilityState:
        stored.source === "live_feed" && stored.availabilityState === "live"
          ? "live"
          : stored.availabilityState === "live"
            ? "unknown"
            : stored.availabilityState,
      source: stored.source,
      curated: stored.source === "operator",
    };
  }

  const walkEstimate =
    dest && Number.isFinite(lot.lat) && Number.isFinite(lot.lng)
      ? estimateWalk(dest, { lat: lot.lat, lng: lot.lng })
      : null;
  const parking: Parking = {
    id: lot.id,
    name: lot.name,
    lat: lot.lat,
    lng: lot.lng,
    address: lot.address,
    distanceMeters: walkEstimate?.walkingDistanceMeters ?? 0,
    walkingTimeSeconds: walkEstimate?.walkingTimeSeconds ?? 0,
    walkingDistanceMeters: walkEstimate?.walkingDistanceMeters ?? 0,
    priceText: lot.priceText,
    hoursText: lot.hoursText,
    notes: lot.notes,
    availabilityState: lot.availabilityState,
    source: lot.source,
    curated: lot.curated,
  };
  const hasMap = Number.isFinite(lot.lat) && Number.isFinite(lot.lng);

  return (
    <main className="mx-auto min-h-dvh w-full max-w-xl px-5 py-8">
      <header className="flex items-center justify-between">
        <BrandMark compact />
      </header>
      {hasMap && (
        <section className="mt-8 h-52 overflow-hidden rounded-[4px] border border-line">
          <ParkingMap origin={origin} destination={dest} parking={parking} />
        </section>
      )}
      <section className={`${hasMap ? "mt-4" : "mt-8"} rounded-[4px] border border-line bg-white p-5`}>
        <dl className="space-y-4">
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-ink-soft">Parking</dt>
            <dd className="mt-1">
              <h1 className="text-base font-normal">{lot.name}</h1>
            </dd>
            {(lot.availabilityState !== "unknown" || lot.priceText || lot.curated || isOnsiteParking(lot)) && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <AvailabilityBadge state={lot.availabilityState} />
                <LotTags
                  priceText={lot.priceText}
                  verified={lot.curated}
                  onsite={isOnsiteParking(lot)}
                />
              </div>
            )}
          </div>
          {lot.address && (
            <div>
              <dt className="text-xs uppercase tracking-[0.16em] text-ink-soft">Address</dt>
              <dd className="mt-1">{lot.address}</dd>
            </div>
          )}
          {walkEstimate && (
            <div>
              <dt className="text-xs uppercase tracking-[0.16em] text-ink-soft">Walk to destination</dt>
              <dd className="mt-1">
                {formatMinutes(walkEstimate.walkingTimeSeconds)} · {formatDistance(walkEstimate.walkingDistanceMeters)}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-ink-soft">Price</dt>
            <dd className="mt-1">{lot.priceText || "Not listed"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-ink-soft">Hours</dt>
            <dd className="mt-1">{lot.hoursText || "Not listed"}</dd>
          </div>
          {lot.notes && (
            <div>
              <dt className="text-xs uppercase tracking-[0.16em] text-ink-soft">Notes</dt>
              <dd className="mt-1 leading-6">{lot.notes}</dd>
            </div>
          )}
        </dl>
      </section>
      <UseParkingActions
        destination={dest}
        destName={first(query.destName) ?? ""}
        parking={parking}
      />
    </main>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function numberPair(
  latValue: string | string[] | undefined,
  lngValue: string | string[] | undefined,
) {
  const lat = Number(first(latValue));
  const lng = Number(first(lngValue));
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}
