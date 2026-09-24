import { overpassFallbacks } from "../env";

export async function postOverpass<T>(query: string): Promise<T[]> {
  let lastError: Error | null = null;
  for (const url of overpassFallbacks()) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "User-Agent": "Yana/0.1 (mobility web mvp)",
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        lastError = new Error(`Overpass failed (${response.status}) at ${url}`);
        continue;
      }
      const data = (await response.json()) as { elements?: T[] };
      return data.elements ?? [];
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Overpass failed");
    }
  }
  throw lastError ?? new Error("Overpass failed");
}
