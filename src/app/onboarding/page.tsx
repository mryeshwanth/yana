"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PreferencePicker } from "@/components/PreferencePicker";
import { markOnboarded, writePreference } from "@/lib/preferences";
import type { RoutePreference } from "@/lib/types";

export default function OnboardingPage() {
  const router = useRouter();
  const [value, setValue] = useState<RoutePreference>("broader_roads");

  function continueOnboarding() {
    writePreference(value);
    markOnboarded();
    router.replace("/");
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-10">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent">Before you drive</p>
      <h1 className="mt-3 text-3xl font-semibold leading-tight">How do you want to get there?</h1>
      <p className="mt-3 text-ink-soft">
        Yana will not call a route safe. You can change this later in Profile.
      </p>
      <div className="mt-8">
        <PreferencePicker value={value} onChange={setValue} />
      </div>
      <button
        type="button"
        onClick={continueOnboarding}
        className="mt-auto rounded-[4px] bg-accent px-5 py-3.5 text-sm font-semibold text-white"
      >
        Continue
      </button>
    </main>
  );
}
