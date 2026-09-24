"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "@/components/BrandMark";

export default function AdminLoginPage() {
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
    if (!response.ok) {
      setError("Wrong password.");
      return;
    }
    router.push("/admin/parking");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-8">
      <BrandMark />
      <h1 className="mt-16 font-serif text-4xl">Parking Finder</h1>
      <p className="mt-3 text-ink-soft">Operator sign-in. Drivers do not need an account.</p>
      <form onSubmit={submit} className="mt-8 grid gap-4">
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Admin password"
          className="rounded-2xl border border-line bg-white px-4 py-3"
        />
        <button type="submit" className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper">
          Continue
        </button>
        {error && <p className="text-sm text-clay-dark">{error}</p>}
      </form>
    </main>
  );
}
