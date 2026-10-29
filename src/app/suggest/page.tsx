"use client";

import Link from "next/link";
import { CaretLeft, Crosshair } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { LotDetailsFields } from "@/components/LotDetailsFields";
import { MapView } from "@/components/MapView";
import { BANGALORE_CENTER } from "@/lib/constants";
import { EMPTY_LOT_FORM, formatOperatingHours, formatPrice, type LotFormState } from "@/lib/lot-form";
import { requestLocation } from "@/lib/location";
import { readTrip } from "@/lib/trip-store";
import type { Coordinates } from "@/lib/types";

export default function SuggestPage() {
  const [pin, setPin] = useState<Coordinates>(BANGALORE_CENTER);
  const [followPin, setFollowPin] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState("Tap the map or drag the pin to set the lot.");
  const [form, setForm] = useState<LotFormState>(EMPTY_LOT_FORM);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lat = Number(params.get("lat"));
    const lng = Number(params.get("lng"));
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      movePin({ lat, lng });
      return;
    }
    const trip = readTrip();
    if (trip.destination) movePin(trip.destination);
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
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setStatus("");
    const response = await fetch("/api/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        lat: pin.lat,
        lng: pin.lng,
        lotKind: form.lotKind || undefined,
        priceText: formatPrice(form.priceKind, form.priceAmount, form.priceUnit),
        hoursText: formatOperatingHours(form.opensAt, form.closesAt) ?? undefined,
        notes: form.notes || undefined,
      }),
    });
    setSaving(false);
    if (!response.ok) {
      setStatus("Could not send that suggestion. Check the name and pin.");
      return;
    }
    setStatus("Sent. yana will review it before it appears in search.");
    setForm(EMPTY_LOT_FORM);
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg px-5 py-6">
      <header className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1 text-sm text-ink-soft">
          <CaretLeft size={16} />
          Parkings
        </Link>
        <BrandMark compact />
      </header>
      <h1 className="mt-8 text-3xl font-semibold">Suggest parking</h1>
      <p className="mt-3 text-ink-soft">
        Tap the map or drag the pin to the entrance. Suggestions stay hidden until they are approved.
      </p>
      <div className="relative mt-6 h-80 overflow-hidden rounded-[4px] border border-line">
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
      <form onSubmit={submit} className="mt-6 grid gap-3 rounded-[4px] border border-line bg-white p-5">
        <LotDetailsFields value={form} onChange={setForm} />
        <button
          type="submit"
          disabled={saving}
          className="rounded-[4px] bg-accent px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Sending…" : "Submit suggestion"}
        </button>
        {status && <p className="text-sm text-moss">{status}</p>}
      </form>
    </main>
  );
}
