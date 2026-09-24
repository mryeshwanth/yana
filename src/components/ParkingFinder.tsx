"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { MapView } from "@/components/MapView";
import { BANGALORE_CENTER } from "@/lib/constants";
import type { AvailabilitySource, AvailabilityState, Coordinates } from "@/lib/types";

type Lot = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string | null;
  priceText: string | null;
  hoursText: string | null;
  notes: string | null;
  source: AvailabilitySource;
  availabilityState: AvailabilityState;
  hidden: boolean;
  city: string;
};

type Suggestion = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string | null;
  priceText: string | null;
  hoursText: string | null;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string | Date;
};

export function ParkingFinder({ lots, suggestions }: { lots: Lot[]; suggestions: Suggestion[] }) {
  const router = useRouter();
  const pending = suggestions.filter((item) => item.status === "pending");
  const [pin, setPin] = useState<Coordinates>(BANGALORE_CENTER);
  const [form, setForm] = useState({
    name: "",
    address: "",
    priceText: "",
    hoursText: "",
    notes: "",
    source: "operator" as AvailabilitySource,
    availabilityState: "unknown" as AvailabilityState,
    city: "bangalore",
  });
  const [message, setMessage] = useState("");

  async function createLot(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/admin/lots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        lat: pin.lat,
        lng: pin.lng,
        address: form.address || null,
        priceText: form.priceText || null,
        hoursText: form.hoursText || null,
        notes: form.notes || null,
      }),
    });
    setMessage(response.ok ? "Lot added to the catalog." : "Could not add that lot.");
    if (response.ok) {
      setForm({
        name: "",
        address: "",
        priceText: "",
        hoursText: "",
        notes: "",
        source: "operator",
        availabilityState: "unknown",
        city: "bangalore",
      });
      router.refresh();
    }
  }

  async function toggleHidden(lot: Lot) {
    await fetch(`/api/admin/lots/${lot.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden: !lot.hidden }),
    });
    router.refresh();
  }

  async function review(id: string, action: "approve" | "reject") {
    await fetch(`/api/admin/suggestions/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    router.refresh();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-5xl px-5 py-8">
      <header className="flex items-center justify-between gap-4">
        <BrandMark />
        <button type="button" onClick={logout} className="text-sm text-ink-soft underline-offset-4 hover:underline">
          Sign out
        </button>
      </header>
      <h1 className="mt-10 font-serif text-4xl">Parking Finder</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Add lots you have verified. Approve user suggestions. Live availability can only be used with a real feed.
      </p>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="h-80 overflow-hidden rounded-[28px] border border-line">
          <MapView interactivePin={pin} onMapClick={setPin} />
        </div>
        <form onSubmit={createLot} className="grid gap-3 rounded-[28px] border border-line bg-white p-5">
          <input
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Lot name"
            className="rounded-2xl border border-line px-4 py-3"
          />
          <input
            value={form.address}
            onChange={(event) => setForm({ ...form, address: event.target.value })}
            placeholder="Address"
            className="rounded-2xl border border-line px-4 py-3"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.priceText}
              onChange={(event) => setForm({ ...form, priceText: event.target.value })}
              placeholder="Price"
              className="rounded-2xl border border-line px-4 py-3"
            />
            <input
              value={form.hoursText}
              onChange={(event) => setForm({ ...form, hoursText: event.target.value })}
              placeholder="Hours"
              className="rounded-2xl border border-line px-4 py-3"
            />
          </div>
          <textarea
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            placeholder="Notes"
            className="min-h-20 rounded-2xl border border-line px-4 py-3"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.source}
              onChange={(event) =>
                setForm({ ...form, source: event.target.value as AvailabilitySource })
              }
              className="rounded-2xl border border-line px-4 py-3"
            >
              <option value="operator">operator</option>
              <option value="places">places</option>
              <option value="osm">osm</option>
              <option value="live_feed">live_feed</option>
            </select>
            <select
              value={form.availabilityState}
              onChange={(event) =>
                setForm({ ...form, availabilityState: event.target.value as AvailabilityState })
              }
              className="rounded-2xl border border-line px-4 py-3"
            >
              <option value="unknown">Unknown</option>
              <option value="estimated">Estimated</option>
              <option value="live">Live</option>
            </select>
          </div>
          <p className="text-xs text-ink-soft">
            Pin {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}. Live is stored only when source is live_feed.
          </p>
          <button type="submit" className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper">
            Add lot
          </button>
          {message && <p className="text-sm text-moss">{message}</p>}
        </form>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-2xl">Suggestions</h2>
        <div className="mt-4 space-y-3">
          {pending.length === 0 && <p className="text-sm text-ink-soft">No pending suggestions.</p>}
          {pending.map((item) => (
            <article key={item.id} className="rounded-2xl border border-line bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="mt-1 text-sm text-ink-soft">
                    {item.address || `${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}`}
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">
                    {[item.priceText, item.hoursText, item.notes].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => review(item.id, "approve")}
                    className="rounded-full bg-moss px-4 py-2 text-sm text-white"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => review(item.id, "reject")}
                    className="rounded-full bg-paper-deep px-4 py-2 text-sm"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10 pb-12">
        <h2 className="font-serif text-2xl">Catalog</h2>
        <div className="mt-4 space-y-3">
          {lots.map((lot) => (
            <article key={lot.id} className="rounded-2xl border border-line bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium">{lot.name}</h3>
                  <p className="mt-1 text-sm text-ink-soft">
                    {lot.city} · {lot.source} · {lot.availabilityState}
                    {lot.hidden ? " · hidden" : ""}
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">
                    {[lot.priceText, lot.hoursText, lot.address].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleHidden(lot)}
                  className="rounded-full border border-line px-4 py-2 text-sm"
                >
                  {lot.hidden ? "Show" : "Hide"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
