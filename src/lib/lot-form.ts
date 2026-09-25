import type { LotKind } from "./lot-kinds";

export type PriceKind = "free" | "free_paid" | "paid";
export type PriceUnit = "hour" | "day" | "visit";
export type DayPeriod = "AM" | "PM";
export type ClockTime = { hour: string; minute: string; period: DayPeriod };

export const EMPTY_CLOCK: ClockTime = { hour: "", minute: "", period: "AM" };
export const HOURS_12 = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
export const MINUTES = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, "0"));

export type LotFormState = {
  name: string;
  lotKind: LotKind | "";
  notes: string;
  priceKind: PriceKind;
  priceAmount: string;
  priceUnit: PriceUnit;
  opensAt: ClockTime;
  closesAt: ClockTime;
};

export const EMPTY_LOT_FORM: LotFormState = {
  name: "",
  lotKind: "",
  notes: "",
  priceKind: "free",
  priceAmount: "",
  priceUnit: "hour",
  opensAt: EMPTY_CLOCK,
  closesAt: EMPTY_CLOCK,
};

export function formatClock(value: ClockTime) {
  if (!value.hour || !value.minute) return "";
  return `${value.hour}:${value.minute} ${value.period}`;
}

export function formatOperatingHours(start: ClockTime, end: ClockTime) {
  const from = formatClock(start);
  const to = formatClock(end);
  if (!from && !to) return null;
  if (from && to) return `${from}–${to}`;
  return from ? `From ${from}` : `Until ${to}`;
}

export function formatPrice(kind: PriceKind, amount: string, unit: PriceUnit) {
  if (kind === "free") return "Free";
  const value = amount.trim();
  if (!value) return kind === "paid" ? "Paid" : "Free + paid";
  const suffix = unit === "visit" ? "/visit" : unit === "day" ? "/day" : "/hour";
  const paid = `₹${value}${suffix}`;
  return kind === "paid" ? paid : `Free + ${paid}`;
}
