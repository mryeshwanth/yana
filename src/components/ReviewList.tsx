"use client";

import { useState } from "react";
import { AgentNav } from "@/components/AgentNav";
import { SegmentedControl } from "@/components/SegmentedControl";

const REASON_LABEL = {
  close_enough: "Close enough",
  too_far: "Too far / hard to find",
  used_other: "Used another lot",
} as const;

type Review = {
  id: string;
  lotName: string;
  lotLat: number | null;
  lotLng: number | null;
  destName: string;
  destLat: number | null;
  destLng: number | null;
  thumb: "up" | "down";
  reason: keyof typeof REASON_LABEL;
  createdAt: string;
};

type Tab = "all" | "useful" | "not_useful";

export function ReviewList({ reviews }: { reviews: Review[] }) {
  const [tab, setTab] = useState<Tab>("all");
  const usefulCount = reviews.filter((item) => item.thumb === "up").length;
  const notUsefulCount = reviews.filter((item) => item.thumb === "down").length;
  const visible = reviews.filter((item) => {
    if (tab === "useful") return item.thumb === "up";
    if (tab === "not_useful") return item.thumb === "down";
    return true;
  });

  return (
    <main className="mx-auto min-h-dvh w-full max-w-5xl px-5 py-8">
      <AgentNav current="reviews" />
      <h1 className="mt-10 text-3xl font-semibold">Reviews</h1>
      <p className="mt-3 text-ink-soft">
        Thumbs from the post-Maps snackbar. This is trip feedback, not Live availability.
      </p>
      <SegmentedControl
        value={tab}
        onChange={setTab}
        options={[
          { id: "all", label: "All", count: reviews.length },
          { id: "useful", label: "Useful", count: usefulCount },
          { id: "not_useful", label: "Not useful", count: notUsefulCount },
        ]}
      />
      <div className="mt-6 space-y-3 pb-12">
        {visible.length === 0 && (
          <p className="rounded-[4px] border border-line bg-white px-4 py-4 text-sm text-ink-soft">
            No reviews in this list.
          </p>
        )}
        {visible.map((review) => (
          <article key={review.id} className="rounded-[4px] border border-line bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-medium">{review.lotName}</h2>
                <p className="mt-1 text-sm text-ink-soft">for {review.destName}</p>
              </div>
              <span className="shrink-0 text-sm font-medium">
                {review.thumb === "up" ? "Useful" : "Not useful"}
              </span>
            </div>
            <p className="mt-3 text-sm">{REASON_LABEL[review.reason]}</p>
            {review.thumb === "down" && (
              <div className="mt-2 space-y-1 text-sm text-ink-soft">
                {review.reason === "too_far" ? (
                  <p>Driver said the lot was too far or hard to find.</p>
                ) : null}
                {review.reason === "used_other" ? (
                  <p>Driver used another lot nearby instead.</p>
                ) : null}
                {review.lotLat != null && review.lotLng != null ? (
                  <a
                    href={`https://www.google.com/maps?q=${review.lotLat},${review.lotLng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-accent underline-offset-4 hover:underline"
                  >
                    Lot in Maps
                  </a>
                ) : null}
              </div>
            )}
            <p className="mt-2 text-xs text-ink-soft">
              {new Date(review.createdAt).toLocaleString("en-IN")}
            </p>
          </article>
        ))}
      </div>
    </main>
  );
}
