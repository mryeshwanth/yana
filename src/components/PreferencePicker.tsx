"use client";

import { Circle, RadioButton } from "@phosphor-icons/react";
import { PREFERENCE_COPY } from "@/lib/preferences";
import type { RoutePreference } from "@/lib/types";

const OPTIONS: RoutePreference[] = ["fastest", "broader_roads", "family_comfort"];

export function PreferencePicker({
  value,
  onChange,
}: {
  value: RoutePreference;
  onChange: (value: RoutePreference) => void;
}) {
  return (
    <div className="space-y-3" role="radiogroup" aria-label="Route preference">
      {OPTIONS.map((option) => {
        const selected = value === option;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option)}
            className={`flex w-full items-start gap-3 rounded-[4px] border bg-white p-5 text-left ${
              selected ? "border-accent" : "border-line"
            }`}
          >
            {selected ? (
              <RadioButton size={22} weight="fill" className="mt-0.5 shrink-0 text-accent" />
            ) : (
              <Circle size={22} className="mt-0.5 shrink-0 text-ink-soft" />
            )}
            <span>
              <span className="block font-medium">{PREFERENCE_COPY[option].title}</span>
              <span className="mt-0.5 block text-sm leading-5 text-ink-soft">
                {PREFERENCE_COPY[option].body}
              </span>
              <span className="mt-1.5 block text-sm leading-5 text-ink-soft">
                {PREFERENCE_COPY[option].for}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
