import { prisma } from "../prisma";
import type { ParkingCandidate, ParkingProvider } from "../types";

export class CuratedParkingProvider implements ParkingProvider {
  async searchNearby(lat: number, lng: number, radiusMeters: number): Promise<ParkingCandidate[]> {
    const lots = await prisma.parkingLot.findMany({
      where: { hidden: false },
    });

    const radiusDegrees = radiusMeters / 111_000;
    return lots
      .filter(
        (lot) =>
          Math.abs(lot.lat - lat) <= radiusDegrees + 0.01 &&
          Math.abs(lot.lng - lng) <= radiusDegrees + 0.01,
      )
      .map((lot) => ({
        id: `curated:${lot.id}`,
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
        curated: true,
      }));
  }
}

export async function getCuratedLot(id: string) {
  const lotId = id.replace(/^curated:/, "");
  return prisma.parkingLot.findUnique({ where: { id: lotId } });
}
