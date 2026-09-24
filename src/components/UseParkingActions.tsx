"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { writeTrip } from "@/lib/trip-store";
import type { Parking } from "@/lib/types";

export function UseParkingActions({ parking }: { parking: Parking }) {
  const router = useRouter();

  function useParking() {
    writeTrip({ selectedParking: parking });
    router.push("/roads");
  }

  return (
    <div className="mt-8 flex gap-2">
      <Link
        href="/"
        className="flex-1 rounded-[4px] border border-line bg-white px-4 py-3 text-center text-sm font-medium"
      >
        Back to trip
      </Link>
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
