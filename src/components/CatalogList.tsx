"use client";

import { useRouter } from "next/navigation";
import { AgentNav } from "@/components/AgentNav";
import { lotKindLabel } from "@/lib/lot-kinds";
import type { AvailabilitySource, AvailabilityState } from "@/lib/types";

type Lot = {
  id: string;
  name: string;
  address: string | null;
  priceText: string | null;
  lotKind: string | null;
  hoursText: string | null;
  source: AvailabilitySource;
  availabilityState: AvailabilityState;
  hidden: boolean;
  city: string;
};

export function CatalogList({ lots }: { lots: Lot[] }) {
  const router = useRouter();

  async function toggleHidden(lot: Lot) {
    await fetch(`/api/admin/lots/${lot.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden: !lot.hidden }),
    });
    router.refresh();
  }

  async function removeLot(lot: Lot) {
    if (!window.confirm(`Delete ${lot.name}? This cannot be undone.`)) return;
    await fetch(`/api/admin/lots/${lot.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-5xl px-5 py-8">
      <AgentNav current="catalog" />
      <h1 className="mt-10 text-3xl font-semibold">Catalog</h1>
      <p className="mt-3 text-ink-soft">Lots already in Yana. Hide one to keep it out of search.</p>
      <div className="mt-8 space-y-3 pb-12">
        {lots.length === 0 && <p className="text-sm text-ink-soft">No lots in the catalog yet.</p>}
        {lots.map((lot) => (
          <article key={lot.id} className="rounded-[4px] border border-line bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-medium">{lot.name}</h3>
                <p className="mt-1 text-sm text-ink-soft">
                  {[lotKindLabel(lot.lotKind), lot.city].filter(Boolean).join(" · ")}
                  {lot.hidden ? " · hidden" : ""}
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  {[lot.priceText, lot.hoursText, lot.address].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => toggleHidden(lot)}
                  className="rounded-[4px] border border-line px-4 py-2 text-sm"
                >
                  {lot.hidden ? "Show" : "Hide"}
                </button>
                <button
                  type="button"
                  onClick={() => void removeLot(lot)}
                  className="rounded-[4px] border border-line px-4 py-2 text-sm text-accent-dark"
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
