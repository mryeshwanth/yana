"use client";

import { CaretDown } from "@phosphor-icons/react";
import { RouteChips } from "@/components/RouteChips";
import type { RouteChip } from "@/lib/types";

export function RouteScoreAccordion({
  score,
  explanation,
  chips,
}: {
  score: number | null;
  explanation: string;
  chips: RouteChip[];
}) {
  return (
    <details className="group mt-3 rounded-[4px] border border-line bg-paper">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-sm font-medium marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          yana score
          <span className="inline-flex min-w-8 items-center justify-center rounded-[4px] border border-dotted border-ink px-1.5 py-0.5 tabular-nums">
            {score ?? "—"}
          </span>
        </span>
        <CaretDown
          size={16}
          className="shrink-0 text-ink-soft transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="border-t border-line px-3 pb-3 pt-2">
        {explanation ? <p className="text-sm text-ink-soft">{explanation}</p> : null}
        <RouteChips chips={chips} />
      </div>
    </details>
  );
}
