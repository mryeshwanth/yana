"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { PREFERENCE_COPY, readPreference, writePreference } from "@/lib/preferences";
import type { RoutePreference } from "@/lib/types";

const OPTIONS: RoutePreference[] = ["fastest", "broader_roads", "family_comfort"];

export default function PreferencesPage() {
  const [value, setValue] = useState<RoutePreference>("broader_roads");

  useEffect(() => {
    setValue(readPreference());
  }, []);

  function choose(next: RoutePreference) {
    setValue(next);
    writePreference(next);
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-xl px-5 py-8">
      <header className="flex items-center justify-between">
        <BrandMark />
        <Link href="/" className="text-sm text-ink-soft underline-offset-4 hover:underline">
          Search
        </Link>
      </header>
      <h1 className="mt-12 font-serif text-4xl">Route preference</h1>
      <p className="mt-3 text-ink-soft">
        Yana will not call a route safe. It only explains the trade-off between time and road type.
      </p>
      <div className="mt-8 space-y-3">
        {OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => choose(option)}
            className={`w-full rounded-2xl border bg-white p-5 text-left ${
              value === option ? "border-clay shadow-sm" : "border-line"
            }`}
          >
            <p className="font-medium">{PREFERENCE_COPY[option].title}</p>
            <p className="mt-2 text-sm leading-6 text-ink-soft">{PREFERENCE_COPY[option].body}</p>
          </button>
        ))}
      </div>
    </main>
  );
}
