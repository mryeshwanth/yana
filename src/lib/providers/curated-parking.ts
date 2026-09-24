import { haversineMeters } from "../geo";
import { prisma } from "../prisma";
import type { ParkingCandidate, ParkingProvider } from "../types";

export class CuratedParkingProvider implements ParkingProvider {
  async searchNearby(lat: number, lng: number, radiusMeters: number): Promise<ParkingCandidate[]> {
    const lots = await prisma.parkingLot.findMany({
      where: { hidden: false },
    });

    return lots
      .filter(
        (lot) =>
          haversineMeters({ lat, lng }, { lat: lot.lat, lng: lot.lng }) <= radiusMeters + 80,
      )
      .map((lot) => ({
        id: lot.source === "operator" ? `curated:${lot.id}` : (lot.externalId ?? `curated:${lot.id}`),
        name: lot.name,
        lat: lot.lat,
        lng: lot.lng,
        address: lot.address,
        priceText: lot.priceText,
        hoursText: lot.hoursText,
        notes: lot.notes,
        availabilityState:
          lot.source === "live_feed" && lot.availabilityState === "live"
            ? "live"
            : lot.availabilityState === "live"
              ? "unknown"
              : lot.availabilityState,
        source: lot.source,
        curated: lot.source === "operator",
      }));
  }
}

export async function getCuratedLot(id: string) {
  if (id.startsWith("places:") || id.startsWith("osm:")) {
    return prisma.parkingLot.findUnique({ where: { externalId: id } });
  }
  const lotId = id.replace(/^curated:/, "").replace(/^lot:/, "");
  return prisma.parkingLot.findUnique({ where: { id: lotId } });
}
