"use client";

import Link from "next/link";
import { Crosshair } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { LotDetailsFields } from "@/components/LotDetailsFields";
import { MapView } from "@/components/MapView";
import { BANGALORE_CENTER } from "@/lib/constants";
import { EMPTY_LOT_FORM, formatOperatingHours, formatPrice, type LotFormState } from "@/lib/lot-form";
import { requestLocation } from "@/lib/location";
import type { Coordinates } from "@/lib/types";

export function ParkingFinder() {
  const router = useRouter();
  const [pin, setPin] = useState<Coordinates>(BANGALORE_CENTER);
  const [followPin, setFollowPin] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState("Tap the map or drag the pin to set the lot.");
  const [form, setForm] = useState<LotFormState>(EMPTY_LOT_FORM);
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState<{ id: string; name: string } | null>(null);
  const toastTimerRef = useRef<number>(0);

  useEffect(() => {
    return () => window.clearTimeout(toastTimerRef.current);
  }, []);

  function movePin(point: Coordinates, follow = false) {
    setFollowPin(follow);
    setPin(point);
    setLocationNote("Tap the map or drag the pin to set the lot.");
  }

  async function locate() {
    setLocating(true);
    const result = await requestLocation();
    setLocating(false);
    if (!result.ok) {
      setLocationNote(result.message);
      return;
    }
    movePin({ lat: result.lat, lng: result.lng }, true);
    setLocationNote("Tap the map or drag the pin to set the lot.");
  }

  async function createLot(event: React.FormEvent) {
    event.preventDefault();
    const priceText = formatPrice(form.priceKind, form.priceAmount, form.priceUnit);
    const response = await fetch("/api/admin/lots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        lat: pin.lat,
        lng: pin.lng,
        address: null,
        lotKind: form.lotKind || null,
        priceText,
        hoursText: formatOperatingHours(form.opensAt, form.closesAt),
        notes: form.notes || null,
        source: "operator",
        availabilityState: "unknown",
        city: "bangalore",
      }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      lot?: { id: string; name: string };
    };
    if (!response.ok || !data.lot) {
      setMessage(data.error || "Could not add that lot.");
      return;
    }
    setMessage("");
    setForm(EMPTY_LOT_FORM);
    showToast(data.lot);
    router.refresh();
  }

  function showToast(lot: { id: string; name: string }) {
    window.clearTimeout(toastTimerRef.current);
    setToast(lot);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 10000);
  }

  async function undoLot() {
    if (!toast) return;
    const id = toast.id;
    window.clearTimeout(toastTimerRef.current);
    setToast(null);
    await fetch(`/api/admin/lots/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/agent/login");
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-5xl px-5 py-8">
      {toast && (
        <div className="fixed inset-x-0 top-0 z-50 border-b border-line bg-ink text-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
            <p className="text-sm font-medium">
              {toast.name} added to the catalog.
            </p>
            <button
              type="button"
              onClick={() => void undoLot()}
              className="shrink-0 rounded-[4px] border border-white/30 px-3 py-1.5 text-sm font-medium"
            >
              Undo
            </button>
          </div>
          <div className="h-1 bg-white/20">
            <div key={toast.id} className="toast-progress h-full bg-accent" />
          </div>
        </div>
      )}
      <header className="flex items-center justify-between gap-4">
        <BrandMark />
        <div className="flex items-center gap-4 text-sm">
          <Link href="/agent/catalog" className="text-ink-soft underline-offset-4 hover:underline">
            Catalog
          </Link>
          <Link href="/agent/reviews" className="text-ink-soft underline-offset-4 hover:underline">
            Reviews
          </Link>
          <button type="button" onClick={logout} className="text-ink-soft underline-offset-4 hover:underline">
            Sign out
          </button>
        </div>
      </header>
      <h1 className="mt-10 text-3xl font-semibold">Parking Finder</h1>

      <section className="mt-8 grid items-stretch gap-6 lg:grid-cols-2">
        <div className="flex h-full flex-col">
          <div className="relative min-h-80 flex-1 overflow-hidden rounded-[4px] border border-line">
            <MapView
              interactivePin={pin}
              onMapClick={(point) => movePin(point)}
              pinDraggable
              followPin={followPin}
            />
            <button
              type="button"
              onClick={() => void locate()}
              aria-label="Use current location"
              className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-[4px] border border-line bg-white text-ink shadow-sm"
            >
              <Crosshair size={22} weight={locating ? "bold" : "regular"} />
            </button>
          </div>
          <p className="mt-2 text-xs text-ink-soft">{locationNote}</p>
        </div>
        <form onSubmit={createLot} className="grid gap-3 rounded-[4px] border border-line bg-white p-5">
          <LotDetailsFields value={form} onChange={setForm} />
          <button type="submit" className="rounded-[4px] bg-ink px-5 py-3 text-sm font-medium text-paper">
            Add lot
          </button>
          {message && <p className="text-sm text-accent-dark">{message}</p>}
        </form>
      </section>
    </main>
  );
}

