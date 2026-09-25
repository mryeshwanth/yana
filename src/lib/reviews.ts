import type { Coordinates } from "./types";

export const PENDING_REVIEW_KEY = "yana.pendingReview";
const ASKED_KEY = "yana.askedLots";
const REVIEWS_KEY = "yana.reviews";

export const ASK_AFTER_MS = 30 * 60 * 1000;
const MAX_ASKED = 200;
const MAX_REVIEWS = 50;

export type ReviewThumb = "up" | "down";
export type ReviewReason = "close_enough" | "too_far" | "used_other";

export type PendingReview = {
  lotId: string;
  lotName: string;
  lotLat?: number;
  lotLng?: number;
  destName: string;
  destLat?: number;
  destLng?: number;
  openedAt: number;
};

export type StoredReview = {
  lotId: string;
  lotName: string;
  lotLat?: number;
  lotLng?: number;
  destName: string;
  destLat?: number;
  destLng?: number;
  thumb: ReviewThumb;
  reason: ReviewReason;
  at: number;
};

export function queuePendingReview(input: {
  lotId: string;
  lotName: string;
  destName: string;
  destination?: Coordinates | null;
  parking?: Coordinates | null;
}) {
  if (typeof window === "undefined") return;
  if (wasAsked(input.lotId)) return;
  const pending: PendingReview = {
    lotId: input.lotId,
    lotName: input.lotName,
    destName: input.destName,
    openedAt: Date.now(),
  };
  if (input.parking) {
    pending.lotLat = input.parking.lat;
    pending.lotLng = input.parking.lng;
  }
  if (input.destination) {
    pending.destLat = input.destination.lat;
    pending.destLng = input.destination.lng;
  }
  window.localStorage.setItem(PENDING_REVIEW_KEY, JSON.stringify(pending));
}

export function readPendingReview(): PendingReview | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PENDING_REVIEW_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingReview;
    return isPendingReview(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function readyPendingReview(now = Date.now()): PendingReview | null {
  const pending = readPendingReview();
  if (!pending) return null;
  if (wasAsked(pending.lotId)) {
    clearPendingReview();
    return null;
  }
  if (now - pending.openedAt < ASK_AFTER_MS) return null;
  return pending;
}

export function clearPendingReview() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PENDING_REVIEW_KEY);
}

export function wasAsked(lotId: string) {
  return readAskedLots().includes(lotId);
}

export function dismissPendingReview() {
  const pending = readPendingReview();
  if (pending) markAsked(pending.lotId);
  clearPendingReview();
}

export function saveReview(input: {
  pending: PendingReview;
  thumb: ReviewThumb;
  reason: ReviewReason;
}) {
  const review: StoredReview = {
    lotId: input.pending.lotId,
    lotName: input.pending.lotName,
    lotLat: input.pending.lotLat,
    lotLng: input.pending.lotLng,
    destName: input.pending.destName,
    destLat: input.pending.destLat,
    destLng: input.pending.destLng,
    thumb: input.thumb,
    reason: input.reason,
    at: Date.now(),
  };
  const next = [review, ...readReviews().filter((item) => item.lotId !== review.lotId)].slice(
    0,
    MAX_REVIEWS,
  );
  window.localStorage.setItem(REVIEWS_KEY, JSON.stringify(next));
  markAsked(review.lotId);
  clearPendingReview();
  return review;
}

export function postReview(review: StoredReview) {
  return fetch("/api/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      lotId: review.lotId,
      lotName: review.lotName,
      lotLat: review.lotLat,
      lotLng: review.lotLng,
      destName: review.destName || "Destination",
      destLat: review.destLat,
      destLng: review.destLng,
      thumb: review.thumb,
      reason: review.reason,
    }),
  });
}

export function suggestParkingHref(pending: PendingReview) {
  if (pending.destLat == null || pending.destLng == null) return "/suggest";
  const params = new URLSearchParams({
    lat: String(pending.destLat),
    lng: String(pending.destLng),
  });
  return `/suggest?${params.toString()}`;
}

function readAskedLots(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ASKED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function markAsked(lotId: string) {
  const next = [lotId, ...readAskedLots().filter((id) => id !== lotId)].slice(0, MAX_ASKED);
  window.localStorage.setItem(ASKED_KEY, JSON.stringify(next));
}

function readReviews(): StoredReview[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(REVIEWS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredReview[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isPendingReview(value: unknown): value is PendingReview {
  if (!value || typeof value !== "object") return false;
  const item = value as PendingReview;
  return (
    typeof item.lotId === "string" &&
    typeof item.lotName === "string" &&
    typeof item.destName === "string" &&
    Number.isFinite(item.openedAt)
  );
}
