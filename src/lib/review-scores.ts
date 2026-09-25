import { prisma } from "./prisma";
import type { Parking } from "./types";

export type LotReviewScore = {
  usefulCount: number;
  reviewCount: number;
};

export async function getLotReviewScores(lotIds: string[]) {
  const scores = new Map<string, LotReviewScore>();
  const ids = [...new Set(lotIds.filter(Boolean))];
  if (ids.length === 0) return scores;

  const grouped = await prisma.parkingReview.groupBy({
    by: ["lotId", "thumb"],
    where: { lotId: { in: ids } },
    _count: { _all: true },
  });

  for (const row of grouped) {
    const current = scores.get(row.lotId) ?? { usefulCount: 0, reviewCount: 0 };
    current.reviewCount += row._count._all;
    if (row.thumb === "up") current.usefulCount += row._count._all;
    scores.set(row.lotId, current);
  }
  return scores;
}

export async function getLotReviewScore(lotId: string) {
  const scores = await getLotReviewScores([lotId]);
  return scores.get(lotId) ?? null;
}

export async function attachReviewScores(lots: Parking[]): Promise<Parking[]> {
  const scores = await getLotReviewScores(lots.map((lot) => lot.id));
  return lots.map((lot) => {
    const score = scores.get(lot.id);
    if (!score) return lot;
    return { ...lot, ...score };
  });
}
