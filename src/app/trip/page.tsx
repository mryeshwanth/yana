"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { writeTrip } from "@/lib/trip-store";

function TripRedirect() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const dlat = Number(params.get("dlat"));
    const dlng = Number(params.get("dlng"));
    const olat = Number(params.get("olat"));
    const olng = Number(params.get("olng"));
    if (Number.isFinite(dlat) && Number.isFinite(dlng)) {
      writeTrip({
        destination: { lat: dlat, lng: dlng },
        destName: params.get("dname") || "Destination",
        origin: Number.isFinite(olat) && Number.isFinite(olng) ? { lat: olat, lng: olng } : undefined,
      });
    }
    router.replace("/");
  }, [params, router]);

  return <div className="min-h-dvh bg-paper" />;
}

export default function TripPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-paper" />}>
      <TripRedirect />
    </Suspense>
  );
}
