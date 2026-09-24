import { prisma } from "./prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function readCache<T>(key: string): Promise<T | null> {
  const row = await prisma.parkingCache.findUnique({ where: { key } });
  if (!row) return null;
  if (row.expiresAt.getTime() <= Date.now()) {
    await prisma.parkingCache.delete({ where: { key } }).catch(() => undefined);
    return null;
  }
  return row.payload as T;
}

export async function writeCache(key: string, payload: unknown, ttlMs: number) {
  const expiresAt = new Date(Date.now() + ttlMs);
  await prisma.parkingCache.upsert({
    where: { key },
    create: { key, payload: payload as object, expiresAt },
    update: { payload: payload as object, expiresAt },
  });
}

export async function clearNearbyCache() {
  await prisma.parkingCache.deleteMany({
    where: { key: { startsWith: "nearby:" } },
  });
}

export const CACHE_TTL = {
  autocomplete: 7 * DAY_MS,
  nearby: 7 * DAY_MS,
  reverse: DAY_MS,
  routes: 10 * 60 * 1000,
};
