import { SealCheck } from "@phosphor-icons/react";
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
      {verified && (
        <Tag accent>
          <SealCheck size={12} weight="fill" className="text-accent" />
          Yana verified
        </Tag>
      )}
    </div>
  );
}

function Tag({ children, accent }: { children: ReactNode; accent?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[4px] border bg-paper px-2 py-0.5 text-[11px] font-medium text-ink ${
        accent ? "border-accent" : "border-line"
      }`}
    >
      {children}
    </span>
  );
}
