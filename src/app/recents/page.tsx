"use client";

import { useRouter } from "next/navigation";
import { ClockCounterClockwise } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { UserShell } from "@/components/UserShell";
import { clearRecents, OPEN_RECENT_KEY, readRecents, type RecentPlace } from "@/lib/recents";
import { writeTrip } from "@/lib/trip-store";

export default function RecentsPage() {
  const router = useRouter();
  const [recents, setRecents] = useState<RecentPlace[]>([]);

  useEffect(() => {
    setRecents(readRecents());
  }, []);

  function openRecent(place: RecentPlace) {
    writeTrip({
      destination: place.location,
      destName: place.name,
      selectedParking: null,
    });
    sessionStorage.setItem(OPEN_RECENT_KEY, "1");
    router.push("/");
  }

  function clearAll() {
    clearRecents();
    setRecents([]);
  }

  return (
    <UserShell current="recents">
      <header className="flex items-center justify-between px-5 pt-6">
        <BrandMark compact />
        {recents.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="px-2 py-1.5 text-sm text-ink-soft"
          >
            Clear
          </button>
        )}
      </header>
      <section className="px-5 pt-8">
        <h1 className="text-3xl font-semibold">Recents</h1>
        <p className="mt-3 text-ink-soft">Places you have already searched for parking.</p>
        <div className="mt-6 space-y-2">
          {recents.length === 0 && (
            <p className="rounded-[4px] bg-white px-4 py-4 text-sm text-ink-soft">
              No recent searches yet.
            </p>
          )}
          {recents.map((place) => (
            <button
              key={`${place.name}-${place.location.lat}-${place.location.lng}`}
              type="button"
              onClick={() => openRecent(place)}
              className="flex w-full items-center gap-3 rounded-[4px] border border-line bg-white px-4 py-3 text-left"
            >
              <ClockCounterClockwise size={18} className="shrink-0 text-ink-soft" />
              <span className="min-w-0">
                <span className="block truncate font-medium">{place.name}</span>
                <span className="text-xs text-ink-soft">Recent parking search</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </UserShell>
  );
}
