"use client";

import { useEffect, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { PreferencePicker } from "@/components/PreferencePicker";
import { UserShell } from "@/components/UserShell";
import { readPreference, writePreference } from "@/lib/preferences";
import type { RoutePreference } from "@/lib/types";

export default function ProfilePage() {
  const [value, setValue] = useState<RoutePreference>("broader_roads");

  useEffect(() => {
    setValue(readPreference());
  }, []);

  function choose(next: RoutePreference) {
    setValue(next);
    writePreference(next);
  }

  return (
    <UserShell current="profile">
      <header className="flex items-center justify-between px-5 pt-6">
        <BrandMark compact />
        <span className="text-xs uppercase tracking-[0.16em] text-ink-soft">Profile</span>
      </header>
      <section className="px-5 pt-8">
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="mt-3 text-ink-soft">
          Yana pre-selects the matching tagged route. It is not a safety claim.
        </p>
        <div className="mt-6">
          <PreferencePicker value={value} onChange={choose} />
        </div>
        <div className="mt-8 rounded-[4px] bg-white p-4 text-sm text-ink-soft">
          If location is blocked, open the browser site settings, allow Location, then tap the
          location icon on Parkings.
        </div>
      </section>
    </UserShell>
  );
}
