export function LotRating({
  usefulCount,
  reviewCount,
}: {
  usefulCount?: number;
  reviewCount?: number;
}) {
  if (!reviewCount) return null;
  return (
    <p className="mt-1 text-sm text-ink-soft">
      {usefulCount ?? 0} of {reviewCount} useful
    </p>
  );
}
