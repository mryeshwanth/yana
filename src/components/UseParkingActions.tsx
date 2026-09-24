"use client";

import { useRouter } from "next/navigation";
import { RESUME_TRIP_KEY, writeTrip } from "@/lib/trip-store";
import type { Coordinates, Parking } from "@/lib/types";

export function UseParkingActions({
  parking,
  destination,
  destName,
}: {
  parking: Parking;
  destination?: Coordinates | null;
  destName?: string;
}) {
  const router = useRouter();

  function rememberTrip() {
    writeTrip({
      selectedParking: parking,
      ...(destination ? { destination, destName: destName || "" } : {}),
    });
  }

  function backToTrip() {
    rememberTrip();
    sessionStorage.setItem(RESUME_TRIP_KEY, "1");
    router.push("/");
  }

  function useParking() {
    rememberTrip();
    router.push("/roads");
  }

  return (
    <div className="mt-8 flex gap-2">
      <button
        type="button"
        onClick={backToTrip}
        className="flex-1 rounded-[4px] border border-line bg-white px-4 py-3 text-sm font-medium"
      >
        Back to trip
      </button>
      <button
        type="button"
        onClick={useParking}
        className="flex-1 rounded-[4px] bg-accent px-4 py-3 text-sm font-semibold text-white"
      >
        Use this parking
      </button>
    </div>
  );
}
