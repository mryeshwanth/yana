import { prisma } from "./prisma";
import type { ParkingCandidate, PlaceDetails, PlaceSuggestion } from "./types";

export async function searchStoredDestinations(query: string): Promise<PlaceSuggestion[]> {
  const rows = await prisma.destination.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { queryText: { contains: query, mode: "insensitive" } },
        { address: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 6,
    orderBy: { lastSeen: "desc" },
  });

  return rows.map((row) => ({
    id: row.googlePlaceId ? `google:${row.googlePlaceId}` : `destination:${row.id}`,
    label: row.name,
    secondary: row.address ?? undefined,
    location: { lat: row.lat, lng: row.lng },
  }));
}

export async function upsertDestination(place: PlaceDetails, queryText?: string) {
  const googlePlaceId = place.id.startsWith("google:") ? place.id.replace(/^google:/, "") : null;
  if (googlePlaceId) {
    await prisma.destination.upsert({
      where: { googlePlaceId },
      create: {
        googlePlaceId,
        name: place.name,
        address: place.address,
        lat: place.location.lat,
        lng: place.location.lng,
        queryText,
      },
      update: {
        name: place.name,
        address: place.address,
        lat: place.location.lat,
        lng: place.location.lng,
        queryText,
        lastSeen: new Date(),
      },
    });
    return;
  }

  const existing = await prisma.destination.findFirst({
    where: { name: place.name, lat: place.location.lat, lng: place.location.lng },
  });
  if (existing) {
    await prisma.destination.update({
      where: { id: existing.id },
      data: { lastSeen: new Date(), queryText: queryText ?? existing.queryText },
    });
    return;
  }
  await prisma.destination.create({
    data: {
      name: place.name,
      address: place.address,
      lat: place.location.lat,
      lng: place.location.lng,
      queryText,
    },
  });
}

export async function upsertGoogleParking(lots: ParkingCandidate[]) {
  for (const lot of lots) {
    if (lot.source !== "places") continue;
    await prisma.parkingLot.upsert({
      where: { externalId: lot.id },
      create: {
        name: lot.name,
        lat: lot.lat,
        lng: lot.lng,
        address: lot.address,
        hoursText: lot.hoursText,
        source: "places",
        availabilityState: "unknown",
        externalId: lot.id,
        city: "bangalore",
      },
      update: {
        name: lot.name,
        lat: lot.lat,
        lng: lot.lng,
        address: lot.address ?? undefined,
        hoursText: lot.hoursText ?? undefined,
      },
    });
  }
}

export async function getStoredDestination(id: string): Promise<PlaceDetails | null> {
  if (id.startsWith("destination:")) {
    const row = await prisma.destination.findUnique({ where: { id: id.replace(/^destination:/, "") } });
    if (!row) return null;
    return {
      id,
      name: row.name,
      address: row.address ?? undefined,
      location: { lat: row.lat, lng: row.lng },
    };
  }
  if (id.startsWith("google:")) {
    const row = await prisma.destination.findUnique({
      where: { googlePlaceId: id.replace(/^google:/, "") },
    });
    if (!row) return null;
    return {
      id,
      name: row.name,
      address: row.address ?? undefined,
      location: { lat: row.lat, lng: row.lng },
    };
  }
  return null;
}
