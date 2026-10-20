"use client";

import { Crosshair } from "@phosphor-icons/react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { Coordinates, PlaceSuggestion } from "@/lib/types";

type SearchCardProps = {
  proximity?: Coordinates | null;
  originLabel?: string;
  locationNote?: string;
  onLocate: () => void;
  locating?: boolean;
  onSelectOrigin: (suggestion?: PlaceSuggestion, query?: string) => void;
  onSelectPlace: (suggestion?: PlaceSuggestion, query?: string) => void;
};

export function SearchCard({
  proximity,
  originLabel,
  locationNote,
  onLocate,
  locating,
  onSelectOrigin,
  onSelectPlace,
}: SearchCardProps) {
  const fromId = useId();
  const toId = useId();
  const [fromQuery, setFromQuery] = useState(originLabel ?? "");
  const [fromSuggest, setFromSuggest] = useState(false);

  useEffect(() => {
    if (originLabel) {
      setFromQuery(originLabel);
      setFromSuggest(false);
    }
  }, [originLabel]);

  return (
    <section className="rounded-[4px] border border-line bg-white p-4 shadow-[0_16px_40px_rgba(28,25,23,0.06)]">
      <PlaceField
        id={fromId}
        label="Where from?"
        value={fromQuery}
        onChange={(next) => {
          setFromSuggest(true);
          setFromQuery(next);
        }}
        enableSuggest={fromSuggest}
        placeholder="Your location, area, landmark"
        proximity={proximity}
        onSelectPlace={onSelectOrigin}
        trailing={
          <button
            type="button"
            onClick={onLocate}
            aria-label="Use current location"
            title="Auto detected based on location"
            className="group relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[4px] border border-line bg-paper text-ink"
          >
            <Crosshair size={22} weight={locating ? "bold" : "regular"} />
            <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-20 w-max max-w-52 -translate-x-1/2 rounded-[4px] bg-ink px-2.5 py-1.5 text-center text-[11px] leading-4 text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              Auto detected based on location
            </span>
          </button>
        }
      />
      {!originLabel && locationNote ? <p className="mt-2 text-xs text-ink-soft">{locationNote}</p> : null}

      <PlaceField
        id={toId}
        label="Where are you going?"
        placeholder="Mall, hospital, office, locality"
        proximity={proximity}
        onSelectPlace={onSelectPlace}
        className="mt-4"
      />
    </section>
  );
}

function PlaceField({
  id,
  label,
  value,
  onChange,
  placeholder,
  proximity,
  onSelectPlace,
  trailing,
  enableSuggest = true,
  className = "",
}: {
  id: string;
  label: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder: string;
  proximity?: Coordinates | null;
  onSelectPlace: (suggestion?: PlaceSuggestion, query?: string) => void;
  trailing?: ReactNode;
  enableSuggest?: boolean;
  className?: string;
}) {
  const [uncontrolled, setUncontrolled] = useState("");
  const query = value ?? uncontrolled;
  const setQuery = onChange ?? setUncontrolled;
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const skipFetch = useRef(false);

  useEffect(() => {
    if (skipFetch.current || !enableSuggest) {
      skipFetch.current = false;
      setSuggestions([]);
      setLoading(false);
      return;
    }
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
    }, 450);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, proximity, enableSuggest]);

  function choose(suggestion: PlaceSuggestion) {
    skipFetch.current = true;
    setQuery(suggestion.label);
    setSuggestions([]);
    setLoading(false);
    onSelectPlace(suggestion);
  }

  return (
    <div className={className}>
      <label className="mb-2 block text-sm text-ink-soft" htmlFor={id}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          value={query}
          onChange={(event) => {
            skipFetch.current = false;
            setQuery(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              if (suggestions[0]) choose(suggestions[0]);
              else onSelectPlace(undefined, query.trim());
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="min-w-0 flex-1 rounded-[4px] border border-line bg-paper px-3 py-3 text-base outline-none ring-accent/30 placeholder:text-ink-soft/70 focus:ring-4"
        />
        {trailing}
      </div>
      {(loading || suggestions.length > 0) && (
        <ul className="mt-3 overflow-hidden rounded-[4px] border border-line">
          {loading && suggestions.length === 0 && (
            <li className="px-4 py-3 text-sm text-ink-soft">Searching…</li>
          )}
          {suggestions.map((suggestion) => (
            <li key={suggestion.id}>
              <button
                type="button"
                className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left hover:bg-paper"
                onClick={() => choose(suggestion)}
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
