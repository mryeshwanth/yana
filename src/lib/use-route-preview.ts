import { useEffect, useState } from "react";
import type { Coordinates, WalkLeg } from "./types";

export function useRoutePreview(
  origin?: Coordinates | null,
  parking?: Coordinates | null,
  destination?: Coordinates | null,
) {
  const [drive, setDrive] = useState<{ coordinates: Coordinates[] } | null>(null);
  const [walk, setWalk] = useState<WalkLeg | null>(null);

  useEffect(() => {
    if (!origin || !parking || !destination) {
      setDrive(null);
      setWalk(null);
      return;
    }
    let cancelled = false;
    fetch("/api/routes/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin, parking, destination }),
    })
      .then((response) => response.json())
      .then((data: { drive?: { coordinates: Coordinates[] } | null; walk?: WalkLeg | null }) => {
        if (cancelled) return;
        setDrive(data.drive ?? null);
        setWalk(data.walk ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setDrive(null);
          setWalk(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [
    origin?.lat,
    origin?.lng,
    parking?.lat,
    parking?.lng,
    destination?.lat,
    destination?.lng,
  ]);

  return { drive, walk };
}
