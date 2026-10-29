"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";

const LINKS = [
  { href: "/agent", id: "finder", label: "Finder" },
  { href: "/agent/suggestions", id: "suggestions", label: "Suggestions" },
  { href: "/agent/catalog", id: "catalog", label: "Catalog" },
  { href: "/agent/reviews", id: "reviews", label: "Reviews" },
] as const;

export type AgentNavId = (typeof LINKS)[number]["id"];

export function AgentNav({ current }: { current: AgentNavId }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/agent/login");
  }

  return (
    <header className="flex items-center justify-between gap-4">
      <BrandMark compact />
      <nav className="flex flex-wrap items-center justify-end gap-4 text-sm">
        {LINKS.map((link) => (
          <Link
            key={link.id}
            href={link.href}
            className={
              current === link.id
                ? "font-medium text-ink underline underline-offset-4"
                : "text-ink-soft underline-offset-4 hover:underline"
            }
          >
            {link.label}
          </Link>
        ))}
        <button type="button" onClick={logout} className="text-ink-soft underline-offset-4 hover:underline">
          Sign out
        </button>
      </nav>
    </header>
  );
}
