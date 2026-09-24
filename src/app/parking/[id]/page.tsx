import { AvailabilityBadge } from "@/components/AvailabilityBadge";
import { BrandMark } from "@/components/BrandMark";
import { UseParkingActions } from "@/components/UseParkingActions";
import { formatDistance, formatMinutes } from "@/lib/format";
import { estimateWalk } from "@/lib/geo";
import { getCuratedLot } from "@/lib/providers/curated-parking";
import type { AvailabilityState, AvailabilitySource } from "@/lib/types";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ParkingDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const decoded = decodeURIComponent(id);
  const dest = numberPair(query.destLat, query.destLng);

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

  const walk = dest && Number.isFinite(lot.lat) ? estimateWalk(dest, { lat: lot.lat, lng: lot.lng }) : null;

  return (
    <main className="mx-auto min-h-dvh w-full max-w-xl px-5 py-8">
      <header className="flex items-center justify-between">
        <BrandMark compact />
      </header>
      <p className="mt-12 text-xs uppercase tracking-[0.18em] text-ink-soft">Parking</p>
      <h1 className="mt-2 text-3xl font-semibold">{lot.name}</h1>
      <div className="mt-4 flex items-center gap-2">
        <AvailabilityBadge state={lot.availabilityState} />
        <span className="text-xs text-ink-soft">
          Source: {lot.source}
          {lot.curated ? " · Yana catalog" : ""}
        </span>
      </div>
      <dl className="mt-8 space-y-4 rounded-[4px] border border-line bg-white p-5">
        {lot.address && (
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-ink-soft">Address</dt>
            <dd className="mt-1">{lot.address}</dd>
          </div>
        )}
        {walk && (
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-ink-soft">Walk to destination</dt>
            <dd className="mt-1">
              {formatMinutes(walk.walkingTimeSeconds)} · {formatDistance(walk.walkingDistanceMeters)}
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
      <UseParkingActions
        parking={{
          id: lot.id,
          name: lot.name,
          lat: lot.lat,
          lng: lot.lng,
          address: lot.address,
          distanceMeters: walk?.walkingDistanceMeters ?? 0,
          walkingTimeSeconds: walk?.walkingTimeSeconds ?? 0,
          walkingDistanceMeters: walk?.walkingDistanceMeters ?? 0,
          priceText: lot.priceText,
          hoursText: lot.hoursText,
          notes: lot.notes,
          availabilityState: lot.availabilityState,
          source: lot.source,
          curated: lot.curated,
        }}
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
