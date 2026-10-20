"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "@/components/BrandMark";

export default function AgentLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setError(data.error || "Could not sign in.");
      return;
    }
    router.push("/agent");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-8">
      <BrandMark compact />
      <h1 className="mt-16 text-3xl font-semibold">Parking Finder</h1>
      <p className="mt-3 text-ink-soft">Operator sign-in. This URL is not shown to drivers.</p>
      <form onSubmit={submit} className="mt-8 grid gap-4">
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Agent password"
          className="rounded-[4px] border border-line bg-white px-4 py-3"
        />
        <button type="submit" className="rounded-[4px] bg-accent px-5 py-3 text-sm font-semibold text-white">
          Continue
        </button>
        {error && <p className="text-sm text-accent-dark">{error}</p>}
      </form>
    </main>
  );
}
