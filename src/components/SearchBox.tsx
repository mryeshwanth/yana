"use client";

import { useEffect, useId, useState } from "react";
import type { PlaceSuggestion } from "@/lib/types";

type SearchBoxProps = {
  label?: string;
  placeholder?: string;
  proximity?: { lat: number; lng: number } | null;
  onSelect: (suggestion: PlaceSuggestion) => void;
};

export function SearchBox({
  label = "Where are you going?",
  placeholder = "Mall, hospital, office, locality",
  proximity,
  onSelect,
}: SearchBoxProps) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      const params = new URLSearchParams({ q: query.trim() });
      if (proximity) {
        params.set("lat", String(proximity.lat));
        params.set("lng", String(proximity.lng));
      }
      try {
        const response = await fetch(`/api/places/autocomplete?${params}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as { suggestions?: PlaceSuggestion[] };
        setSuggestions(data.suggestions ?? []);
      } catch {
        if (!controller.signal.aborted) setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, proximity]);

  return (
    <div className="relative">
      <label className="mb-2 block text-sm text-ink-soft" htmlFor={listId}>
        {label}
      </label>
      <input
        id={listId}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-2xl border border-line bg-white px-4 py-3.5 text-base text-ink outline-none ring-clay/30 placeholder:text-ink-soft/70 focus:ring-4"
      />
      {(loading || suggestions.length > 0) && (
        <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-line bg-white shadow-[0_16px_40px_rgba(33,28,22,0.12)]">
          {loading && suggestions.length === 0 && (
            <li className="px-4 py-3 text-sm text-ink-soft">Searching…</li>
          )}
          {suggestions.map((suggestion) => (
            <li key={suggestion.id}>
              <button
                type="button"
                className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left hover:bg-paper"
                onClick={() => {
                  onSelect(suggestion);
                  setQuery(suggestion.label);
                  setSuggestions([]);
                }}
              >
                <span className="text-sm font-medium">{suggestion.label}</span>
                {suggestion.secondary && (
                  <span className="line-clamp-1 text-xs text-ink-soft">{suggestion.secondary}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
