"use client";

import Link from "next/link";
import { MapPin, Path, User } from "@phosphor-icons/react";

const TABS = [
  { href: "/", id: "parkings", label: "Parkings", Icon: MapPin },
  { href: "/roads", id: "roads", label: "Roads", Icon: Path },
  { href: "/profile", id: "profile", label: "Profile", Icon: User },
] as const;

export function BottomNav({ current }: { current: "parkings" | "roads" | "profile" }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur">
      <ul className="mx-auto grid max-w-lg grid-cols-3 px-2 pb-[env(safe-area-inset-bottom)] pt-2">
        {TABS.map((tab) => {
          const active = tab.id === current;
          return (
            <li key={tab.id}>
              <Link
                href={tab.href}
                className={`flex flex-col items-center gap-1 rounded-[4px] px-2 py-2 text-xs ${
                  active ? "text-accent" : "text-ink-soft"
                }`}
              >
                <tab.Icon size={24} weight={active ? "fill" : "regular"} />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
