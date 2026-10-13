import type { RouteChip } from "@/lib/types";

export function RouteChips({ chips }: { chips: RouteChip[] }) {
  if (chips.length === 0) return null;
  return (
    <span className="mt-2 flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <span
          key={chip.id}
          className="rounded-[4px] border border-line bg-paper px-2 py-0.5 text-[11px] font-medium text-ink"
        >
          {chip.label}: {chip.detail}
        </span>
      ))}
    </span>
  );
}
