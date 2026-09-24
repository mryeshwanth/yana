"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { SearchBox } from "@/components/SearchBox";
import { BANGALORE_CENTER } from "@/lib/constants";
import type { Coordinates, PlaceSuggestion } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [originNote, setOriginNote] = useState("Finding your location…");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!navigator.geolocation) {
      setOrigin(BANGALORE_CENTER);
      setOriginNote("Using Bangalore centre. You can still search a destination.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin({ lat: position.coords.latitude, lng: position.coords.longitude });
        setOriginNote("Using your current location as the start.");
      },
      () => {
        setOrigin(BANGALORE_CENTER);
        setOriginNote("Location blocked. Starting from Bangalore centre.");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  async function goToPlace(suggestion: PlaceSuggestion) {
    setError("");
    let place = suggestion.location
      ? { name: suggestion.label, location: suggestion.location }
      : null;
    if (!place) {
      const response = await fetch(`/api/places/details?id=${encodeURIComponent(suggestion.id)}`);
      const data = (await response.json()) as {
        place?: { name: string; location: Coordinates };
        error?: string;
      };
      if (!data.place) {
        setError(data.error ?? "Could not open that place.");
        return;
      }
      place = data.place;
    }
    const start = origin ?? BANGALORE_CENTER;
    const params = new URLSearchParams({
      dlat: String(place.location.lat),
      dlng: String(place.location.lng),
      dname: place.name,
      olat: String(start.lat),
      olng: String(start.lng),
    });
    router.push(`/trip?${params.toString()}`);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-5 pb-10 pt-8">
      <header className="flex items-center justify-between">
        <BrandMark />
        <a href="/preferences" className="text-sm text-ink-soft underline-offset-4 hover:underline">
          Preferences
        </a>
      </header>

      <section className="mt-16">
        <p className="text-sm uppercase tracking-[0.22em] text-clay">Before you start the car</p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-ink sm:text-5xl">
          Park first. Then choose a broader road.
        </h1>
        <p className="mt-4 max-w-md text-base leading-7 text-ink-soft">
          Navigation tells you how to get there. Yana helps you decide how you want to get there.
        </p>
      </section>

      <section className="mt-10 rounded-[28px] border border-line bg-white p-5 shadow-[0_20px_50px_rgba(33,28,22,0.06)]">
        <SearchBox proximity={origin} onSelect={goToPlace} />
        <p className="mt-3 text-xs text-ink-soft">{originNote}</p>
        {error && <p className="mt-2 text-sm text-clay-dark">{error}</p>}
      </section>

      <ul className="mt-8 grid gap-3 text-sm text-ink-soft">
        <li>Nearby parking with honest Live / Estimated / Unknown labels.</li>
        <li>Compare Fastest, Broader Roads, and Family Comfort.</li>
        <li>Open the chosen drive in Google or Apple Maps.</li>
      </ul>

      <div className="mt-auto flex items-center justify-between pt-10 text-sm">
        <a href="/suggest" className="text-moss underline-offset-4 hover:underline">
          Suggest a parking place
        </a>
        <a href="/admin/parking" className="text-ink-soft underline-offset-4 hover:underline">
          Parking Finder
        </a>
      </div>
    </main>
  );
}
