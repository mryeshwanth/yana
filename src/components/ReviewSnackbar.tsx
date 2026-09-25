"use client";

import { ThumbsDown, ThumbsUp, X } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  dismissPendingReview,
  readyPendingReview,
  saveReview,
  suggestParkingHref,
  type PendingReview,
  type ReviewReason,
  type ReviewThumb,
} from "@/lib/reviews";
import { writeTrip } from "@/lib/trip-store";

type Step = "ask" | ReviewThumb;

export function ReviewSnackbar() {
  const router = useRouter();
  const [pending, setPending] = useState<PendingReview | null>(null);
  const [step, setStep] = useState<Step>("ask");

  useEffect(() => {
    function refresh() {
      const next = readyPendingReview();
      setPending(next);
      if (!next) setStep("ask");
    }
    refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  if (!pending) return null;

  function close() {
    dismissPendingReview();
    setPending(null);
    setStep("ask");
  }

  function answer(reason: ReviewReason) {
    if (!pending) return;
    saveReview({ pending, thumb: step === "down" ? "down" : "up", reason });
    if (reason === "used_other") {
      if (pending.destLat != null && pending.destLng != null) {
        writeTrip({
          destination: { lat: pending.destLat, lng: pending.destLng },
          destName: pending.destName,
        });
      }
      router.push(suggestParkingHref(pending));
    }
    setPending(null);
    setStep("ask");
  }

  const dest = pending.destName.trim() || "this destination";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(4.75rem+env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto mx-auto max-w-lg">
        <div className="relative rounded-[4px] border border-line bg-white p-4 shadow-[0_8px_24px_rgba(28,25,23,0.12)]">
          <button
            type="button"
            onClick={close}
            aria-label="Dismiss"
            className="absolute right-2 top-2 rounded-[4px] p-1 text-ink-soft"
          >
            <X size={16} />
          </button>
          {step === "ask" ? (
            <>
              <p className="pr-6 text-sm font-medium text-accent">
                Did {pending.lotName} work for {dest}?
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStep("up")}
                  className="inline-flex items-center justify-center gap-1.5 rounded-[4px] border border-line bg-white px-3 py-2.5 text-sm font-medium"
                >
                  <ThumbsUp size={16} />
                  useful
                </button>
                <button
                  type="button"
                  onClick={() => setStep("down")}
                  className="inline-flex items-center justify-center gap-1.5 rounded-[4px] border border-line bg-white px-3 py-2.5 text-sm font-medium"
                >
                  <ThumbsDown size={16} />
                  not useful
                </button>
              </div>
            </>
          ) : (
            <div className="grid gap-2 pr-4">
              {step === "up" ? (
                <>
                  <ReasonButton onClick={() => answer("close_enough")}>It was close enough</ReasonButton>
                  <ReasonButton onClick={() => answer("used_other")}>
                    I used a different lot nearby
                  </ReasonButton>
                </>
              ) : (
                <>
                  <ReasonButton onClick={() => answer("too_far")}>Too far / hard to find</ReasonButton>
                  <ReasonButton onClick={() => answer("used_other")}>I used another lot nearby</ReasonButton>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReasonButton({
  children,
  onClick,
}: {
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[4px] border border-line bg-white px-3 py-2.5 text-left text-sm font-medium"
    >
      {children}
    </button>
  );
}
