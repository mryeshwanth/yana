"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { MapView } from "@/components/MapView";
import { BANGALORE_CENTER } from "@/lib/constants";
import type { Coordinates } from "@/lib/types";

export default function SuggestPage() {
  const [pin, setPin] = useState<Coordinates>(BANGALORE_CENTER);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [priceText, setPriceText] = useState("");
  const [hoursText, setHoursText] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setStatus("");
    const response = await fetch("/api/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        lat: pin.lat,
        lng: pin.lng,
        address: address || undefined,
        priceText: priceText || undefined,
        hoursText: hoursText || undefined,
        notes: notes || undefined,
      }),
    });
    setSaving(false);
    if (!response.ok) {
      setStatus("Could not send that suggestion. Check the name and pin.");
      return;
    }
    setStatus("Sent. Yana will review it before it appears in search.");
    setName("");
    setNotes("");
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-3xl px-5 py-8">
      <header className="flex items-center justify-between">
        <BrandMark />
        <Link href="/" className="text-sm text-ink-soft underline-offset-4 hover:underline">
          Search
        </Link>
      </header>
      <h1 className="mt-10 font-serif text-4xl">Suggest parking</h1>
      <p className="mt-3 max-w-xl text-ink-soft">
        Tap the map to drop a pin at the entrance. Suggestions stay hidden until they are approved.
      </p>
      <div className="mt-6 h-72 overflow-hidden rounded-[28px] border border-line">
        <MapView interactivePin={pin} onMapClick={setPin} />
      </div>
      <form onSubmit={submit} className="mt-6 grid gap-4">
        <Field label="Name" value={name} onChange={setName} required />
        <Field label="Address" value={address} onChange={setAddress} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price" value={priceText} onChange={setPriceText} placeholder="₹40/hour" />
          <Field label="Hours" value={hoursText} onChange={setHoursText} placeholder="8:00–22:00" />
        </div>
        <label className="grid gap-2 text-sm">
          Notes
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="min-h-24 rounded-2xl border border-line bg-white px-4 py-3"
          />
        </label>
        <p className="text-xs text-ink-soft">
          Pin: {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
        </p>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper disabled:opacity-60"
        >
          {saving ? "Sending…" : "Submit suggestion"}
        </button>
        {status && <p className="text-sm text-moss">{status}</p>}
      </form>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm">
      {label}
      <input
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-line bg-white px-4 py-3"
      />
    </label>
  );
}
