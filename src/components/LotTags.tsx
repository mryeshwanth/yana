import type { ReactNode } from "react";
import { priceTag } from "@/lib/lot-tags";

export function LotTags({
  priceText,
  verified,
}: {
  priceText?: string | null;
  verified?: boolean;
}) {
  const price = priceTag(priceText);
  if (!price && !verified) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {price && <Tag>{price}</Tag>}
      {verified && <Tag>Yana verified</Tag>}
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-[4px] border border-line bg-paper px-2 py-0.5 text-[11px] font-medium text-ink">
      {children}
    </span>
  );
}
