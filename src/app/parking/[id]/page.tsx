import Link from "next/link";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";
import { BrandMark } from "@/components/BrandMark";
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
  const destName = first(query.destName) ?? "Destination";

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

  if (decoded.startsWith("curated:")) {
    const curated = await getCuratedLot(decoded);
    if (curated && !curated.hidden) {
      lot = {
        id: decoded,
        name: curated.name,
        lat: curated.lat,
        lng: curated.lng,
        address: curated.address ?? undefined,
        priceText: curated.priceText ?? undefined,
        hoursText: curated.hoursText ?? undefined,
        notes: curated.notes ?? undefined,
        availabilityState:
          curated.source === "live_feed" && curated.availabilityState === "live"
            ? "live"
            : curated.availabilityState === "live"
              ? "unknown"
              : curated.availabilityState,
        source: curated.source,
        curated: true,
      };
    }
  }

  const walk = dest && Number.isFinite(lot.lat) ? estimateWalk(dest, { lat: lot.lat, lng: lot.lng }) : null;
  const tripHref = dest
    ? `/trip?dlat=${dest.lat}&dlng=${dest.lng}&dname=${encodeURIComponent(destName)}&pid=${encodeURIComponent(decoded)}`
    : "/";

  return (
    <main className="mx-auto min-h-dvh w-full max-w-xl px-5 py-8">
      <header className="flex items-center justify-between">
        <BrandMark />
        <Link href={tripHref} className="text-sm text-ink-soft underline-offset-4 hover:underline">
          Back to trip
        </Link>
      </header>
      <p className="mt-12 text-xs uppercase tracking-[0.18em] text-ink-soft">Parking</p>
      <h1 className="mt-2 font-serif text-4xl">{lot.name}</h1>
      <div className="mt-4 flex items-center gap-2">
        <AvailabilityBadge state={lot.availabilityState} />
        <span className="text-xs text-ink-soft">
          Source: {lot.source}
          {lot.curated ? " · Yana catalog" : ""}
        </span>
      </div>
      <dl className="mt-8 space-y-4 rounded-[28px] border border-line bg-white p-5">
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
      <Link
        href={tripHref}
        className="mt-8 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper"
      >
        Use this parking
      </Link>
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
