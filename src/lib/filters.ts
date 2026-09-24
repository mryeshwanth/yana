import type { PriceTag } from "./lot-tags";

const KEY = "yana.filters";

export const RADIUS_OPTIONS = [
  { meters: 500, label: "500 m" },
  { meters: 1000, label: "1 km" },
  { meters: 2000, label: "2 km" },
] as const;

export const PRICE_OPTIONS: PriceTag[] = ["Free", "Free + paid", "Paid"];

export type ParkingFilters = {
  radiusMeters: 500 | 1000 | 2000;
  prices: PriceTag[];
  yanaVerified: boolean;
};

export const DEFAULT_FILTERS: ParkingFilters = {
  radiusMeters: 1000,
  prices: [],
  yanaVerified: false,
};

export function readFilters(): ParkingFilters {
  if (typeof window === "undefined") return DEFAULT_FILTERS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_FILTERS;
    const parsed = JSON.parse(raw) as Partial<ParkingFilters>;
    const radius = RADIUS_OPTIONS.some((option) => option.meters === parsed.radiusMeters)
      ? (parsed.radiusMeters as ParkingFilters["radiusMeters"])
      : DEFAULT_FILTERS.radiusMeters;
    const prices = Array.isArray(parsed.prices)
      ? parsed.prices.filter((item): item is PriceTag => PRICE_OPTIONS.includes(item))
      : [];
    return {
      radiusMeters: radius,
      prices,
      yanaVerified: Boolean(parsed.yanaVerified),
    };
  } catch {
    return DEFAULT_FILTERS;
  }
}

export function writeFilters(next: ParkingFilters) {
  window.localStorage.setItem(KEY, JSON.stringify(next));
}

export function activeFilterCount(filters: ParkingFilters) {
  let count = 0;
  if (filters.radiusMeters !== DEFAULT_FILTERS.radiusMeters) count += 1;
  if (filters.prices.length > 0) count += 1;
  if (filters.yanaVerified) count += 1;
  return count;
}
