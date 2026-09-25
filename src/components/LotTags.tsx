"use client";

import { SealCheck } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { priceTag } from "@/lib/lot-tags";

export function LotTags({
  priceText,
  verified,
  onsite,
}: {
  priceText?: string | null;
  verified?: boolean;
  onsite?: boolean;
}) {
  const price = priceTag(priceText);
  if (!price && !verified && !onsite) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {onsite && <Tag>Onsite parking</Tag>}
      {price && <Tag>{price}</Tag>}
      {verified && (
        <Tag>
          <SealCheck size={12} weight="fill" />
          Yana verified
        </Tag>
      )}
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-[4px] border border-line bg-paper px-2 py-0.5 text-[11px] font-medium text-ink">
      {children}
    </span>
  );
}
