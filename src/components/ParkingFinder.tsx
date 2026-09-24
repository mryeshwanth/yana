"use client";

import Link from "next/link";
import { Circle, Crosshair, RadioButton } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { MapView } from "@/components/MapView";
import { BANGALORE_CENTER } from "@/lib/constants";
import { LOT_KINDS, type LotKind } from "@/lib/lot-kinds";
import { requestLocation } from "@/lib/location";
import type { Coordinates } from "@/lib/types";

type PriceKind = "free" | "free_paid" | "paid";
type PriceUnit = "hour" | "day" | "visit";
type DayPeriod = "AM" | "PM";
type ClockTime = { hour: string; minute: string; period: DayPeriod };

const emptyClock: ClockTime = { hour: "", minute: "", period: "AM" };
const HOURS_12 = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const MINUTES = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, "0"));

const emptyForm = {
  name: "",
  lotKind: "" as LotKind | "",
  notes: "",
  city: "bangalore",
};

export function ParkingFinder() {
  const router = useRouter();
  const [pin, setPin] = useState<Coordinates>(BANGALORE_CENTER);
  const [followPin, setFollowPin] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState("Tap the map or drag the pin to set the lot.");
  const [form, setForm] = useState(emptyForm);
  const [priceKind, setPriceKind] = useState<PriceKind>("free");
  const [priceAmount, setPriceAmount] = useState("");
  const [priceUnit, setPriceUnit] = useState<PriceUnit>("hour");
  const [opensAt, setOpensAt] = useState<ClockTime>(emptyClock);
  const [closesAt, setClosesAt] = useState<ClockTime>(emptyClock);
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
    const priceText = formatPrice(priceKind, priceAmount, priceUnit);
    const response = await fetch("/api/admin/lots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        lat: pin.lat,
        lng: pin.lng,
        address: null,
        lotKind: form.lotKind || null,
        priceText,
        hoursText: formatOperatingHours(opensAt, closesAt),
        notes: form.notes || null,
        source: "operator",
        availabilityState: "unknown",
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
    setForm(emptyForm);
    setPriceKind("free");
    setPriceAmount("");
    setPriceUnit("hour");
    setOpensAt(emptyClock);
    setClosesAt(emptyClock);
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

  const showAmount = priceKind !== "free";

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
          <input
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Lot name"
            className="rounded-[4px] border border-line px-4 py-3"
          />
          <select
            required
            value={form.lotKind}
            onChange={(event) => setForm({ ...form, lotKind: event.target.value as LotKind | "" })}
            className="rounded-[4px] border border-line px-4 py-3 text-ink"
          >
            <option value="" disabled>
              Lot type
            </option>
            {LOT_KINDS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.16em] text-ink-soft">Price</p>
            <div className="flex gap-2" role="radiogroup" aria-label="Price">
              {(
                [
                  { id: "free", label: "Free" },
                  { id: "free_paid", label: "Free + paid" },
                  { id: "paid", label: "Paid" },
                ] as const
              ).map((option) => {
                const selected = priceKind === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      setPriceKind(option.id);
                      if (option.id === "free") setPriceAmount("");
                    }}
                    className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-[4px] border bg-white px-2 py-3 text-left ${
                      selected ? "border-accent" : "border-line"
                    }`}
                  >
                    {selected ? (
                      <RadioButton size={20} weight="fill" className="shrink-0 text-accent" />
                    ) : (
                      <Circle size={20} className="shrink-0 text-ink-soft" />
                    )}
                    <span className="whitespace-nowrap text-sm font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {showAmount && (
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs text-ink-soft">Amount (₹)</span>
                <input
                  required
                  inputMode="decimal"
                  value={priceAmount}
                  onChange={(event) => setPriceAmount(event.target.value)}
                  placeholder="40"
                  className="w-full rounded-[4px] border border-line px-4 py-3"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-ink-soft">Per</span>
                <select
                  value={priceUnit}
                  onChange={(event) => setPriceUnit(event.target.value as PriceUnit)}
                  className="w-full rounded-[4px] border border-line px-4 py-3"
                >
                  <option value="hour">Hour</option>
                  <option value="day">Day</option>
                  <option value="visit">Visit</option>
                </select>
              </label>
            </div>
          )}
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.16em] text-ink-soft">Operating hours</p>
            <div className="grid grid-cols-2 gap-3">
              <ClockPicker label="Start" value={opensAt} onChange={setOpensAt} />
              <ClockPicker label="End" value={closesAt} onChange={setClosesAt} />
            </div>
          </div>
          <textarea
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            placeholder="Notes"
            className="min-h-20 rounded-[4px] border border-line px-4 py-3"
          />
          <button type="submit" className="rounded-[4px] bg-ink px-5 py-3 text-sm font-medium text-paper">
            Add lot
          </button>
          {message && <p className="text-sm text-accent-dark">{message}</p>}
        </form>
      </section>
    </main>
  );
}

function ClockPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ClockTime;
  onChange: (value: ClockTime) => void;
}) {
  const field = "rounded-[4px] border border-line px-2 py-3 text-sm";
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-ink-soft">{label}</span>
      <span className="grid grid-cols-[1fr_1fr_4.5rem] gap-1">
        <select
          value={value.hour}
          onChange={(event) => onChange({ ...value, hour: event.target.value })}
          className={field}
        >
          <option value="">Hr</option>
          {HOURS_12.map((hour) => (
            <option key={hour} value={hour}>
              {hour}
            </option>
          ))}
        </select>
        <select
          value={value.minute}
          onChange={(event) => onChange({ ...value, minute: event.target.value })}
          className={field}
        >
          <option value="">Min</option>
          {MINUTES.map((minute) => (
            <option key={minute} value={minute}>
              {minute}
            </option>
          ))}
        </select>
        <select
          value={value.period}
          onChange={(event) => onChange({ ...value, period: event.target.value as DayPeriod })}
          className={field}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </span>
    </label>
  );
}

function formatOperatingHours(start: ClockTime, end: ClockTime) {
  const from = formatClock(start);
  const to = formatClock(end);
  if (!from && !to) return null;
  if (from && to) return `${from}–${to}`;
  return from ? `From ${from}` : `Until ${to}`;
}

function formatClock(value: ClockTime) {
  if (!value.hour || !value.minute) return "";
  return `${value.hour}:${value.minute} ${value.period}`;
}

function formatPrice(kind: PriceKind, amount: string, unit: PriceUnit) {
  if (kind === "free") return "Free";
  const value = amount.trim();
  if (!value) return kind === "paid" ? "Paid" : "Free + paid";
  const suffix = unit === "visit" ? "/visit" : unit === "day" ? "/day" : "/hour";
  const paid = `₹${value}${suffix}`;
  return kind === "paid" ? paid : `Free + ${paid}`;
}
