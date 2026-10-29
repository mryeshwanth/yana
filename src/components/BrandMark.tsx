import Link from "next/link";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2 no-underline">
      <img src="/icon.svg" alt="" width={32} height={32} className="h-8 w-8 shrink-0" />
      <span className="inline-flex items-baseline gap-2">
        <span className="text-2xl font-semibold lowercase tracking-tight text-ink [font-variant:small-caps]">
          yana
        </span>
        {!compact && (
          <span className="text-xs uppercase tracking-[0.18em] text-ink-soft">decide the road</span>
        )}
      </span>
    </Link>
  );
}
