import Link from "next/link";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-baseline gap-2 no-underline">
      <span className="font-serif text-2xl tracking-tight text-ink">Yana</span>
      {!compact && (
        <span className="hidden text-xs uppercase tracking-[0.18em] text-ink-soft sm:inline">
          decide the road
        </span>
      )}
    </Link>
  );
}
