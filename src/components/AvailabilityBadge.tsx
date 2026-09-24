import { availabilityLabel } from "@/lib/format";
import type { AvailabilityState } from "@/lib/types";

export function AvailabilityBadge({ state }: { state: AvailabilityState }) {
  const styles = {
    live: "bg-moss-soft text-moss",
    estimated: "bg-[#f3e4bf] text-[#7a5610]",
    unknown: "bg-paper-deep text-ink-soft",
  }[state];

  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide ${styles}`}>
      {availabilityLabel(state)}
    </span>
  );
}
