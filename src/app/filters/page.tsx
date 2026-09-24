"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Circle, RadioButton } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { UserShell } from "@/components/UserShell";
import {
  DEFAULT_FILTERS,
  PRICE_OPTIONS,
  RADIUS_OPTIONS,
  readFilters,
  writeFilters,
  type ParkingFilters,
} from "@/lib/filters";
import type { PriceTag } from "@/lib/lot-tags";
import { RESUME_TRIP_KEY } from "@/lib/trip-store";

export default function FiltersPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<ParkingFilters>(DEFAULT_FILTERS);

  useEffect(() => {
    setFilters(readFilters());
  }, []);

  function save(next: ParkingFilters) {
    setFilters(next);
    writeFilters(next);
  }

  function togglePrice(tag: PriceTag) {
    const prices = filters.prices.includes(tag)
      ? filters.prices.filter((item) => item !== tag)
      : [...filters.prices, tag];
    save({ ...filters, prices });
  }

  function apply() {
    sessionStorage.setItem(RESUME_TRIP_KEY, "1");
    router.push("/");
  }

  return (
    <UserShell current="parkings">
      <header className="flex items-center justify-between px-5 pt-6">
        <BrandMark compact />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => save(DEFAULT_FILTERS)}
            className="px-2 py-1.5 text-sm text-ink-soft"
          >
            Reset
          </button>
          <Link
            href="/"
            onClick={() => sessionStorage.setItem(RESUME_TRIP_KEY, "1")}
            className="rounded-[4px] border border-line bg-white px-3 py-1.5 text-sm font-medium"
          >
            Back
          </Link>
        </div>
      </header>
      <section className="px-5 pt-8">
        <h1 className="text-3xl font-semibold">Filters</h1>
        <p className="mt-3 text-ink-soft">Narrow lots for this search. Radius is walk from the destination.</p>

        <div className="mt-8">
          <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">Within radius</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {RADIUS_OPTIONS.map((option) => {
              const selected = filters.radiusMeters === option.meters;
              return (
                <button
                  key={option.meters}
                  type="button"
                  onClick={() => save({ ...filters, radiusMeters: option.meters })}
                  className={`rounded-[4px] border px-3 py-2 text-sm font-medium ${
                    selected ? "border-accent bg-accent text-white" : "border-line bg-white"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8">
          <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">Price type</p>
          <div className="mt-3 space-y-2">
            {PRICE_OPTIONS.map((option) => {
              const selected = filters.prices.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => togglePrice(option)}
                  className={`flex w-full items-center gap-3 rounded-[4px] border bg-white px-4 py-3 text-left ${
                    selected ? "border-accent" : "border-line"
                  }`}
                >
                  {selected ? (
                    <RadioButton size={20} weight="fill" className="text-accent" />
                  ) : (
                    <Circle size={20} className="text-ink-soft" />
                  )}
                  <span className="font-medium">{option}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-ink-soft">Leave all off to see every price type.</p>
        </div>

        <div className="mt-8">
          <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">More</p>
          <button
            type="button"
            onClick={() => save({ ...filters, yanaVerified: !filters.yanaVerified })}
            className={`mt-3 flex w-full items-center gap-3 rounded-[4px] border bg-white px-4 py-3 text-left ${
              filters.yanaVerified ? "border-accent" : "border-line"
            }`}
          >
            {filters.yanaVerified ? (
              <RadioButton size={20} weight="fill" className="text-accent" />
            ) : (
              <Circle size={20} className="text-ink-soft" />
            )}
            <span>
              <span className="block font-medium">Yana verified only</span>
              <span className="mt-0.5 block text-sm text-ink-soft">Lots added by an agent</span>
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={apply}
          className="mt-10 w-full rounded-[4px] bg-accent px-5 py-3.5 text-sm font-semibold text-white"
        >
          Show results
        </button>
      </section>
    </UserShell>
  );
}
