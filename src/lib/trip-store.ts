import type { Coordinates, Parking } from "./types";

const KEY = "yana.trip";
export const RESUME_TRIP_KEY = "yana.resumeTrip";

export type TripState = {
  origin: Coordinates | null;
  destination: Coordinates | null;
  destName: string;
  selectedParking: Parking | null;
};

export function readTrip(): TripState {
  if (typeof window === "undefined") {
    return { origin: null, destination: null, destName: "", selectedParking: null };
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { origin: null, destination: null, destName: "", selectedParking: null };
    return JSON.parse(raw) as TripState;
  } catch {
    return { origin: null, destination: null, destName: "", selectedParking: null };
  }
}

export function writeTrip(next: Partial<TripState>) {
  const current = readTrip();
  const merged = { ...current, ...next };
  window.localStorage.setItem(KEY, JSON.stringify(merged));
  window.dispatchEvent(new Event("yana-trip"));
  return merged;
}

export function subscribeTrip(listener: () => void) {
  window.addEventListener("yana-trip", listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener("yana-trip", listener);
    window.removeEventListener("storage", listener);
  };
}
