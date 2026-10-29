"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AgentNav } from "@/components/AgentNav";
import { SegmentedControl } from "@/components/SegmentedControl";
import { lotKindLabel } from "@/lib/lot-kinds";

type Suggestion = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string | null;
  priceText: string | null;
  hoursText: string | null;
  notes: string | null;
  lotKind: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

type Tab = "all" | "pending" | "approved";

export function SuggestionList({ suggestions }: { suggestions: Suggestion[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("all");
  const pendingCount = suggestions.filter((item) => item.status === "pending").length;
  const approvedCount = suggestions.filter((item) => item.status === "approved").length;
  const visible = suggestions.filter((item) => {
    if (tab === "pending") return item.status === "pending";
    if (tab === "approved") return item.status === "approved";
    return true;
  });

  async function act(id: string, action: "approve" | "reject") {
    await fetch(`/api/admin/suggestions/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    router.refresh();
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-5xl px-5 py-8">
      <AgentNav current="suggestions" />
      <h1 className="mt-10 text-3xl font-semibold">Suggestions</h1>
      <p className="mt-3 text-ink-soft">
        Lots drivers sent from Suggest parking. Approve to add them to the catalog.
      </p>
      <SegmentedControl
        value={tab}
        onChange={setTab}
        options={[
          { id: "all", label: "All", count: suggestions.length },
          { id: "pending", label: "Pending", count: pendingCount },
          { id: "approved", label: "Approved", count: approvedCount },
        ]}
      />
      <div className="mt-6 space-y-3 pb-12">
        {visible.length === 0 && (
          <p className="rounded-[4px] border border-line bg-white px-4 py-4 text-sm text-ink-soft">
            No suggestions in this list.
          </p>
        )}
        {visible.map((item) => (
          <article key={item.id} className="rounded-[4px] border border-line bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-medium">{item.name}</h2>
                <p className="mt-1 text-sm text-ink-soft">
                  {[lotKindLabel(item.lotKind), item.status].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  {[item.priceText, item.hoursText, item.address, item.notes].filter(Boolean).join(" · ")}
                </p>
                <a
                  href={`https://www.google.com/maps?q=${item.lat},${item.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm text-accent underline-offset-4 hover:underline"
                >
                  Open in Maps
                </a>
                <p className="mt-2 text-xs text-ink-soft">
                  {new Date(item.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
              {item.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void act(item.id, "approve")}
                    className="rounded-[4px] bg-ink px-4 py-2 text-sm text-paper"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => void act(item.id, "reject")}
                    className="rounded-[4px] border border-line px-4 py-2 text-sm"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
