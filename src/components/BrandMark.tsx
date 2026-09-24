import Link from "next/link";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-baseline gap-2 no-underline">
      <span className="text-2xl font-semibold tracking-tight text-ink">Yana</span>
      {!compact && (
        <span className="text-xs uppercase tracking-[0.18em] text-ink-soft">
          decide the road
        </span>
      )}
    </Link>
  );
}
